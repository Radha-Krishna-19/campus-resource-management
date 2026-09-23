import axios from "axios";

// Single shared axios instance for the whole app. Base URL comes from an
// env var (VITE_API_URL) so the same build can talk to any deployed
// backend; it falls back to a relative "/api" path for same-origin/dev-proxy
// setups. Every page/component should import THIS instance rather than raw
// axios — previously AuthContext set a hardcoded axios.defaults.baseURL of
// "http://localhost:8000/api", which every page relying on raw axios
// silently inherited, making the app unable to reach a deployed backend.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Optional: Redirect to login on 401
        // if (error.response?.status === 401) { window.location.href = "/login"; }
        return Promise.reject(error);
    }
);

export const getRecommendations = async (data) => {
    return api.post("/bookings/recommend", data);
};

export const getDemandForecast = async () => {
    return api.get("/forecasting/demand");
};

export const parseBookingText = async (text) => {
    return api.post("/bookings/parse", { text });
};

export default api;
