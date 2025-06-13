// src/hooks/useAuth.ts
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import { axiosInstance } from '../utils/axiosConfig';

interface UseAuthReturn {
    isAuthenticated: boolean;
    token: string | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
    checkAuth: () => boolean;
}

export function useAuth(): UseAuthReturn {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Проверяем статус авторизации при инициализации
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            setToken(storedToken);
            setIsAuthenticated(true);
            // Устанавливаем токен в axios по умолчанию
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else {
            // Если нет токена и мы не на странице авторизации - редиректим
            const publicPaths = ['/auth', '/onboarding'];
            if (!publicPaths.includes(pathname)) {
                router.push('/auth');
            }
        }
        setLoading(false);
    }, [pathname, router]);

    const login = async (username: string, password: string): Promise<boolean> => {
        setLoading(true);
        try {
            const response = await axiosInstance.post('https://uzavtoanalytics.uz/dashboard/auth', {
                username,
                password
            });

            if (response.data && response.data.token) {
                const authToken = response.data.token;

                // Сохраняем токен
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('isAuthenticated', 'true');

                // Устанавливаем токен в axios по умолчанию
                axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

                setToken(authToken);
                setIsAuthenticated(true);
                setLoading(false);
                return true;
            }

            setLoading(false);
            return false;
        } catch (error) {
            console.error('Ошибка авторизации:', error);
            setLoading(false);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('isAuthenticated');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setIsAuthenticated(false);
        router.push('/auth');
    };

    const checkAuth = () => {
        const storedToken = localStorage.getItem('authToken');
        if (!storedToken) {
            // Если нет токена и мы не на публичной странице - делаем logout
            const publicPaths = ['/auth', '/onboarding'];
            if (!publicPaths.includes(pathname)) {
                logout();
                return false;
            }
        }
        return true;
    };

    return {
        isAuthenticated,
        token,
        login,
        logout,
        loading,
        checkAuth
    };
}