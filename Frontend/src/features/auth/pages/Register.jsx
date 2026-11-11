import React, { useState } from 'react'
import { useNavigate, Link, Navigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

const Register = () => {
    const { user, loading, handleRegister } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // If already authenticated, redirect to dashboard
    if (!loading && user) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSubmitting(true);
        try {
            await handleRegister(username, email, password);
            navigate("/dashboard", { replace: true });
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Registration failed");
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
                <h1>Register</h1>

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
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            placeholder="Enter username"
                            value={username}
                            required
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

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
                        {submitting ? 'Registering...' : 'Register'}
                    </button>

                    <p>Already have account? <Link to={"/login"}>Login</Link></p>
                </form>
            </div>
        </main>
    )
}

export default Register
