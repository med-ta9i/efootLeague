import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access');
    if (token) {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
            // Token expired
            // In a real app we would refresh it here
            // For MVP, if expired, better clean up or let the backend reject
        }
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh');
            if (refreshToken) {
                try {
                    // Manually call axios to avoid loop
                    const response = await axios.post(`${API_URL}/users/token/refresh/`, {
                        refresh: refreshToken,
                    });

                    if (response.status === 200) {
                        localStorage.setItem('access', response.data.access);
                        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
                        return api(originalRequest);
                    }
                } catch (refreshError) {
                    // Logout if refresh fails
                    localStorage.removeItem('access');
                    localStorage.removeItem('refresh');
                    window.location.href = '/login';
                }
            } else {
                localStorage.removeItem('access');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
