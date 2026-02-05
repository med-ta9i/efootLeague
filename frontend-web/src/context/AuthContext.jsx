import { createContext, useState, useEffect, useContext } from 'react';
import propTypes from 'prop-types';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkUser = async () => {
        const token = localStorage.getItem('access');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 < Date.now()) {
                    await refreshToken();
                } else {
                    // Ideally fetch full user profile
                    await fetchProfile();
                }
            } catch (error) {
                console.error("Auth check failed", error);
                logout();
            }
        }
        setLoading(false);
    };

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/profile/');
            setUser(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const refreshToken = async () => {
        const refresh = localStorage.getItem('refresh');
        if (refresh) {
            try {
                const res = await api.post('/users/token/refresh/', { refresh });
                localStorage.setItem('access', res.data.access);
                await fetchProfile();
            } catch (error) {
                logout();
            }
        } else {
            logout();
        }
    };

    useEffect(() => {
        checkUser();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/users/token/', { email, password });
        localStorage.setItem('access', res.data.access);
        localStorage.setItem('refresh', res.data.refresh);
        await fetchProfile();
    };

    const register = async (userData) => {
        await api.post('/users/register/', userData);
        await login(userData.email, userData.password);
    };

    const logout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: propTypes.node.isRequired,
};
