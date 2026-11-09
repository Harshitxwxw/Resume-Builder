import { useContext } from "react";
import { AuthContext } from "../auth.context.jsx";
import { loginUser, logoutUser, registerUser } from "../services/auth.api";
import { migrateLegacyUserKeysIfNeeded } from "../../../utils/userScope";

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    const { user, setUser, loading, setLoading } = context;

    const handleRegister = async (username, email, password) => {
        setLoading(true);
        try {
            const data = await registerUser({ username, email, password });
            if (data && data.user) {
                setUser(data.user);
                try {
                    localStorage.setItem("career_user", JSON.stringify(data.user));
                    migrateLegacyUserKeysIfNeeded();
                } catch (e) {}
                window.dispatchEvent(new CustomEvent('career_auth_changed', { detail: data.user }));
                window.dispatchEvent(new CustomEvent('career_credits_updated'));
                window.dispatchEvent(new CustomEvent('career_resume_saved'));
                window.dispatchEvent(new CustomEvent('career_mock_report_saved'));
                window.dispatchEvent(new CustomEvent('career_wishlist_updated'));
                return data;
            }
        } catch (error) {
            console.log("Registration failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (email, password) => {
        setLoading(true);
        try {
            const data = await loginUser({ email, password });
            if (data && data.user) {
                setUser(data.user);
                try {
                    localStorage.setItem("career_user", JSON.stringify(data.user));
                    migrateLegacyUserKeysIfNeeded();
                } catch (e) {}
                window.dispatchEvent(new CustomEvent('career_auth_changed', { detail: data.user }));
                window.dispatchEvent(new CustomEvent('career_credits_updated'));
                window.dispatchEvent(new CustomEvent('career_resume_saved'));
                window.dispatchEvent(new CustomEvent('career_mock_report_saved'));
                window.dispatchEvent(new CustomEvent('career_wishlist_updated'));
                return data;
            }
        } catch (error) {
            console.log("Login failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logoutUser();
        } catch (error) {
            console.log("Logout failed:", error);
        } finally {
            setUser(null);
            try {
                localStorage.removeItem("career_user");
            } catch (e) {}
            window.dispatchEvent(new CustomEvent('career_auth_changed', { detail: null }));
            window.dispatchEvent(new CustomEvent('career_credits_updated'));
            window.dispatchEvent(new CustomEvent('career_resume_saved'));
            window.dispatchEvent(new CustomEvent('career_mock_report_saved'));
            window.dispatchEvent(new CustomEvent('career_wishlist_updated'));
            setLoading(false);
        }
    };

    return {
        user,
        loading,
        handleRegister,
        handleLogin,
        handleLogout,
        setUser
    };
};
