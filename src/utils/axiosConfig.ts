import axios from 'axios';

export const setupAxiosInterceptors = (onUnauthorized: () => void) => {
    // Перехватчик для запросов
    axios.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers['X-Auth'] = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Перехватчик для ответов
    axios.interceptors.response.use(
        (response) => {
            return response;
        },
        (error) => {
            if (error.response?.status === 401) {
                // Удаляем все данные авторизации
                localStorage.removeItem('authToken');
                localStorage.removeItem('isAuthenticated');

                // Удаляем заголовок авторизации из дефолтных настроек axios
                delete axios.defaults.headers.common['X-Auth'];

                // Вызываем callback для редиректа
                onUnauthorized();
            }
            return Promise.reject(error);
        }
    );
};