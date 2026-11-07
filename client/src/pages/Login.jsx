
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Login.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await api.post("/auth/login", {
                email,
                password
            });

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            navigate("/dashboard");
        } catch (error) {
            setError(
                error.response?.data?.message || "Login failed. Try again."
            );
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">

                <div className="login-brand">
                    StrideForge<span>.</span>
                </div>

                <div className="login-heading">
                    <p className="login-tagline">YOUR RUNNING JOURNEY</p>
                    <h2>Welcome Back</h2>
                    <p>Sign in to continue your progress.</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">

                    <div className="login-field">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="login-field">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="login-error">{error}</p>}

                    <button type="submit" className="login-submit">
                        Sign In
                    </button>

                </form>

                <div className="login-footer">
                    New to StrideForge?
                    <Link to="/register"> Create Account</Link>
                </div>

            </div>
        </div>
    );
}

export default Login;
