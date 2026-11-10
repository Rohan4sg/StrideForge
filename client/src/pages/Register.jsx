
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Register.css";

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");

    const [verificationStep, setVerificationStep] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const response = await api.post("/auth/register", {
                name: name.trim(),
                email: email.trim(),
                password
            });

            setVerificationStep(true);
            setMessage(response.data.message);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const response = await api.post("/auth/verify-otp", {
                email: email.trim(),
                otp
            });

            navigate("/login", {
                state: {
                    message: response.data.message
                }
            });
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Verification failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const response = await api.post("/auth/resend-otp", {
                email: email.trim()
            });

            setMessage(response.data.message);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to resend OTP."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="register-page">
            <div className="register-decoration register-decoration-one" />
            <div className="register-decoration register-decoration-two" />

            <section className="register-card">
                <div className="register-brand">
                    <span className="register-brand-mark">SF</span>
                    <span>
                        StrideForge<span className="register-brand-dot">.</span>
                    </span>
                </div>

                {!verificationStep ? (
                    <>
                        <div className="register-heading">
                            <p className="register-eyebrow">
                                BUILD YOUR MOMENTUM
                            </p>
                            <h1>Start your journey.</h1>
                            <p>
                                Create your account and make every kilometre count.
                            </p>
                        </div>

                        <form
                            className="register-form"
                            onSubmit={handleRegister}
                        >
                            <div className="register-field">
                                <label htmlFor="register-name">Full name</label>
                                <input
                                    id="register-name"
                                    type="text"
                                    placeholder="Your full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoComplete="name"
                                    required
                                />
                            </div>

                            <div className="register-field">
                                <label htmlFor="register-email">
                                    Email address
                                </label>
                                <input
                                    id="register-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div className="register-field">
                                <label htmlFor="register-password">
                                    Password
                                </label>
                                <div className="register-password-wrap">
                                    <input
                                        id="register-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="At least 6 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        minLength={6}
                                        autoComplete="new-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="register-show-password"
                                        onClick={() =>
                                            setShowPassword(value => !value)
                                        }
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <p className="register-error" role="alert">
                                    {error}
                                </p>
                            )}

                            <button
                                className="register-submit"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? "Sending OTP..." : "Create account"}
                                <span>→</span>
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <div className="register-heading">
                            <p className="register-eyebrow">
                                ONE LAST STEP
                            </p>
                            <h1>Verify your email.</h1>
                            <p>
                                We've sent a 6-digit OTP to{" "}
                                <strong>{email}</strong>.
                            </p>
                        </div>

                        <form
                            className="register-form"
                            onSubmit={handleVerifyOTP}
                        >
                            <div className="register-field">
                                <label htmlFor="register-otp">
                                    Verification code
                                </label>
                                <input
                                    id="register-otp"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    onChange={(e) =>
                                        setOtp(
                                            e.target.value
                                                .replace(/\D/g, "")
                                                .slice(0, 6)
                                        )
                                    }
                                    maxLength={6}
                                    required
                                />
                            </div>

                            {error && (
                                <p className="register-error" role="alert">
                                    {error}
                                </p>
                            )}

                            {message && (
                                <p className="register-success">
                                    {message}
                                </p>
                            )}

                            <button
                                className="register-submit"
                                type="submit"
                                disabled={loading || otp.length !== 6}
                            >
                                {loading ? "Verifying..." : "Verify email"}
                                <span>→</span>
                            </button>
                        </form>

                        <div className="register-footer">
                            Didn't receive the code?{" "}
                            <button
                                type="button"
                                className="register-show-password"
                                onClick={handleResendOTP}
                                disabled={loading}
                            >
                                Resend OTP
                            </button>
                        </div>
                    </>
                )}

                {message && !verificationStep && (
                    <p className="register-success">{message}</p>
                )}

                {!verificationStep && (
                    <div className="register-footer">
                        Already have an account?{" "}
                        <Link to="/login">Sign in</Link>
                    </div>
                )}

                <p className="register-legal">
                    Train consistently. Track your progress. Keep moving forward.
                </p>
            </section>
        </main>
    );
}

export default Register;
