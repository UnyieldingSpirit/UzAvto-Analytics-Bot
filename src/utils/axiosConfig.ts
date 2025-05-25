// src/utils/axiosConfig.ts
import axios from 'axios';

export const setupAxiosInterceptors = (onUnauthorized: () => void) => {
    // Перехватчик запросов - добавляем токен если он есть
    axios.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Перехватчик ответов - обрабатываем 401
    axios.interceptors.response.use(
        (response) => {
            return response;
        },
        (error) => {
            if (error.response && error.response.status === 401) {
                // Очищаем токен и перенаправляем на авторизацию
                localStorage.removeItem('authToken');
                localStorage.removeItem('isAuthenticated');
                delete axios.defaults.headers.common['Authorization'];
                onUnauthorized();
            }
            return Promise.reject(error);
        }
    );
};