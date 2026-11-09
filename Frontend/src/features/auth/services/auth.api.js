import { createApiClient } from "../../../services/apiClient";

const api = createApiClient("/auth");

export const registerUser = async (userData) => {
    const { username, email, password } = userData;
    try {
        const response = await api.post("/register", {
            username,
            email,
            password
        });
        if (response.data?.token) {
            try {
                localStorage.setItem('career_ai_auth_token', response.data.token);
            } catch (e) {}
        }
        return response.data;
    } catch (error) {
        console.log("Error registering user:", error);
        throw error;
    }
};

export const loginUser = async (userData) => {
    const { email, password } = userData;
    try {
        const response = await api.post("/login", {
            email,
            password
        });
        if (response.data?.token) {
            try {
                localStorage.setItem('career_ai_auth_token', response.data.token);
            } catch (e) {}
        }
        return response.data;
    } catch (error) {
        console.log("Error logging in user:", error);
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        try {
            localStorage.removeItem('career_ai_auth_token');
        } catch (e) {}
        const response = await api.get("/logout");
        return response.data;
    } catch (error) {
        console.log("Error logging out user:", error);
        return null;
    }
};

export const getMe = async () => {
    try {
        const response = await api.get("/get-me");
        return response.data;
    } catch (error) {
        // Return null when unauthenticated or token expired
        return null;
    }
};
