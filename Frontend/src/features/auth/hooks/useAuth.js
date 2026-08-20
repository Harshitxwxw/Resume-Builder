import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context.jsx";
import { loginUser , logoutUser , registerUser , getMe } from "../services/auth.api";

export const useAuth = () => {
    const context = useContext(AuthContext);

    const { user, setUser, loading, setLoading } = context;

    const handleRegister = async (username ,email, password) => {
        setLoading(true);

        try {
            const data = await registerUser({username , email, password});
            setUser(data.user);
        } catch (error) {
            console.log("Registration failed:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleLogin = async (email, password) => {
        setLoading(true);

        try {
            const data = await loginUser({email, password});
            setUser(data.user);
        } catch (error) {
            console.log("Login failed:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleLogout = async () => {
        setLoading(true);
        try {
            const data = await logoutUser();
            setUser(null);
        } catch (error) {
            console.log("Logout failed:", error);
        } finally {
            setLoading(false);
        }   
    }

    useEffect(() => {
        const getAndSetUser = async () => {
            const data = await getMe();
            setUser(data.user);
            setLoading(false);
        }
        getAndSetUser();
    }, []);

    return {
        user,loading,handleRegister,handleLogin,handleLogout
    }
    
}