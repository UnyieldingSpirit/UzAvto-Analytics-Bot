// src/config/axiosInstance.ts
import axios from 'axios';

// Создаем экземпляр axios
export const axiosInstance = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Флаг для предотвращения множественных редиректов
let isRedirecting = false;

// Перехватчик запросов - добавляем токен
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');

        if (token) {
            // Для прокси используем X-Auth
            config.headers['X-Auth'] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Перехватчик ответов - обрабатываем 401
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !isRedirecting) {
            isRedirecting = true;

            // Очищаем данные
            localStorage.removeItem('authToken');
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('userLogin');

            // Редирект
            window.location.href = '/auth';

            setTimeout(() => {
                isRedirecting = false;
            }, 1000);
        }

        return Promise.reject(error);
    }
);