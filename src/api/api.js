import axios from 'axios';

const api = axios.create({
    baseURL: 'https://13.61.190.197/api',
});

// This interceptor ONLY deals with the staff token.
api.interceptors.request.use(config => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

export default api;