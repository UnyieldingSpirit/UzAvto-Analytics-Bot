'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UseAuthReturn {
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
}

export function useAuth(): UseAuthReturn {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();

    useEffect(() => {
        // Проверяем статус авторизации при инициализации
        const authStatus = localStorage.getItem('isAuthenticated') === 'true';
        setIsAuthenticated(authStatus);
        setLoading(false);
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        setLoading(true);
        try {
            // Здесь будет реальная логика авторизации через API
            // Пока просто имитируем успешную авторизацию, если введены какие-либо данные
            if (username && password) {
                localStorage.setItem('isAuthenticated', 'true');
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
        localStorage.removeItem('isAuthenticated');
        setIsAuthenticated(false);
        router.push('/auth');
    };

    return {
        isAuthenticated,
        login,
        logout,
        loading
    };
}