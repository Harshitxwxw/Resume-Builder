import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from "react-router-dom"
import CareerAILogo from '../../../components/CareerAILogo'

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
                backgroundColor: '#0b0f19',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 600,
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <CareerAILogo size={44} textColor="light" />
                    <span style={{ fontSize: '13.5px', color: '#94a3b8', fontWeight: 500 }}>Loading workspace...</span>
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
