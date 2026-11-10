
const User = require("../models/User");
const EmailVerification = require("../models/EmailVerification");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { sendVerificationEmail } = require("../services/emailService");

const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

const hashOTP = (otp) => {
    return crypto.createHash("sha256").update(otp).digest("hex");
};

// Register and send OTP
exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: "Password must contain at least 6 characters"
        });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const otp = generateOTP();
        const hashedPassword = await bcrypt.hash(password, 10);

        await EmailVerification.findOneAndUpdate(
            { email: normalizedEmail },
            {
                name: name.trim(),
                email: normalizedEmail,
                password_hash: hashedPassword,
                otp_hash: hashOTP(otp),
                expires_at: new Date(Date.now() + 5 * 60 * 1000),
                attempts: 0,
                last_sent_at: new Date()
            },
            {
                upsert: true,
                returnDocument: "after",
                runValidators: true
            }
        );

        try {
            await sendVerificationEmail(normalizedEmail, otp);
        } catch (emailError) {
            await EmailVerification.deleteOne({
                email: normalizedEmail
            });

            console.error("OTP email error:", emailError);

            return res.status(500).json({
                message: "Unable to send verification email. Please try again."
            });
        }

        return res.status(200).json({
            message: "OTP sent successfully. Please verify your email."
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Registration failed"
        });
    }
};

// Verify OTP and create account
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            message: "Email and OTP are required"
        });
    }

    if (!/^\d{6}$/.test(String(otp))) {
        return res.status(400).json({
            message: "Enter a valid 6-digit OTP"
        });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();

        const verification = await EmailVerification.findOne({
            email: normalizedEmail
        });

        if (!verification) {
            return res.status(400).json({
                message: "Verification request not found. Please register again."
            });
        }

        if (verification.expires_at <= new Date()) {
            await EmailVerification.deleteOne({
                _id: verification._id
            });

            return res.status(400).json({
                message: "OTP expired. Please register again."
            });
        }

        if (verification.attempts >= 5) {
            await EmailVerification.deleteOne({
                _id: verification._id
            });

            return res.status(429).json({
                message: "Too many incorrect attempts. Please register again."
            });
        }

        if (hashOTP(String(otp)) !== verification.otp_hash) {
            verification.attempts += 1;
            await verification.save();

            return res.status(400).json({
                message: "Incorrect OTP",
                attemptsRemaining: 5 - verification.attempts
            });
        }

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            await EmailVerification.deleteOne({
                _id: verification._id
            });

            return res.status(409).json({
                message: "Email already registered"
            });
        }

        await User.create({
            name: verification.name,
            email: normalizedEmail,
            password_hash: verification.password_hash,
            email_verified: true
        });

        await EmailVerification.deleteOne({
            _id: verification._id
        });

        return res.status(201).json({
            message: "Email verified and account created successfully"
        });

    } catch (error) {
        console.error("OTP verification error:", error);

        return res.status(500).json({
            message: "Email verification failed"
        });
    }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();

        const verification = await EmailVerification.findOne({
            email: normalizedEmail
        });

        if (!verification) {
            return res.status(404).json({
                message: "Registration request not found. Please register again."
            });
        }

        const elapsed = Date.now() - verification.last_sent_at.getTime();

        if (elapsed < 60000) {
            return res.status(429).json({
                message: "Please wait before requesting another OTP."
            });
        }

        const otp = generateOTP();

        verification.otp_hash = hashOTP(otp);
        verification.expires_at = new Date(Date.now() + 5 * 60 * 1000);
        verification.attempts = 0;
        verification.last_sent_at = new Date();

        await verification.save();

        try {
            await sendVerificationEmail(normalizedEmail, otp);
        } catch (emailError) {
            console.error("Resend OTP email error:", emailError);

            return res.status(500).json({
                message: "Unable to resend OTP. Please try again."
            });
        }

        return res.json({
            message: "A new OTP has been sent to your email."
        });

    } catch (error) {
        console.error("Resend OTP error:", error);

        return res.status(500).json({
            message: "Unable to resend OTP"
        });
    }
};

// Login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    try {
        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        if (user.email_verified === false) {
            return res.status(403).json({
                message: "Please verify your email before logging in."
            });
        }

        const validPassword = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({
                message: "Incorrect password"
            });
        }

        const token = jwt.sign(
            { id: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Login failed"
        });
    }
};
