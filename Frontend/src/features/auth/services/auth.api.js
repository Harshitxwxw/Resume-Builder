import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000/api/auth",
    withCredentials: true
});

export const registerUser = async (userData) => {
    const {username, email, password} = userData;
    try {
        const response = await api.post("/register", {
            username,
            email,
            password
        });
        return response.data;
    } catch (error) {
        console.log("Error registering user:", error);
    }
}

export const loginUser = async (userData) => {
    const {email, password} = userData;
    try {
        const response = await api.post("/login", {
            email,
            password
        });
        return response.data;
    } catch (error) {
        console.log("Error logging in user:", error);
    }
}

export const logoutUser = async () => {
    try {
        const response = await api.get("/logout");
        return response.data;
    } catch (error) {
        console.log("Error logging out user:", error);
    }
}

export const getMe = async () => {
    try {
        const response = await api.get("/get-me");
        return response.data;
    } catch (error) {
        console.log("Error fetching current user:", error);
    }
}
