
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendVerificationEmail = async (email, otp) => {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "StrideForge - Email Verification",
        html: `
            <div style="font-family: Arial; padding: 25px; color: #111827;">
                <h2 style="color: #65a30d;">StrideForge</h2>

                <h3>Verify your email address</h3>

                <p>
                    Thank you for registering with StrideForge.
                    Use the OTP below to verify your email.
                </p>

                <div style="
                    background: #f3f4f6;
                    padding: 20px;
                    text-align: center;
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    border-radius: 10px;
                ">
                    ${otp}
                </div>

                <p>This OTP expires in 5 minutes.</p>

                <p>
                    If you did not request this verification,
                    you can ignore this email.
                </p>

                <hr />

                <p style="color: #6b7280;">
                    StrideForge Team
                </p>
            </div>
        `
    });
};

module.exports = { sendVerificationEmail };
