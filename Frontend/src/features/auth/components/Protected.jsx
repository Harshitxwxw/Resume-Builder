import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from "react-router-dom"

const Protected = ({ children }) => {
    const { user, loading } = useAuth();

    // If still verifying auth state from backend, show loading placeholder
    if (loading) {
        return (
            <div style={{
                height: '100vh',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1e3a8a',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 600,
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>✦</span>
                    <span>Loading CareerAI...</span>
                </div>
            </div>
        );
    }

    // Only redirect if loading is complete AND user is null
    if (!user) {
        return <Navigate to="/login" replace />
    }

    return children;
}

export default Protected;
