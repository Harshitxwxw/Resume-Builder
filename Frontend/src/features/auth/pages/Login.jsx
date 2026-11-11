import React, { useState } from 'react'
import '../auth.form.scss'
import { useNavigate, Link, Navigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

const Login = () => {
    const navigate = useNavigate();
    const { user, loading, handleLogin } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // If already authenticated, always redirect to dashboard
    if (!loading && user) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSubmitting(true);
        try {
            await handleLogin(email, password);
            // Always redirect newly logged-in users to Dashboard
            navigate("/dashboard", { replace: true });
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Invalid email or password");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading && !user) {
        return (
            <main className="auth-page">
                <h1>Loading....</h1>
            </main>
        )
    }

    return (
        <main className="auth-page">
            <div className="form_container">
                <h1>Login</h1>

                {errorMsg && (
                    <div style={{
                        color: '#ef4444',
                        backgroundColor: '#fee2e2',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13.5px',
                        marginBottom: '16px',
                        fontWeight: 500
                    }}>
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input_group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter Email Address"
                            value={email}
                            required
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="input_group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter password"
                            value={password}
                            required
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="button primary_btn"
                        disabled={submitting}
                    >
                        {submitting ? 'Logging in...' : 'Login'}
                    </button>

                    <p>Don't have account? <Link to={"/register"}>Register</Link></p>
                </form>
            </div>
        </main>
    )
}

export default Login
