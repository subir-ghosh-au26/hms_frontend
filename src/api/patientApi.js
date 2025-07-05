import axios from 'axios';

const patientApi = axios.create({
    baseURL: 'https://hms-backend-uoai.onrender.com/api',
});

// This interceptor ONLY deals with the patient token.
patientApi.interceptors.request.use(config => {
    const token = localStorage.getItem('patientToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

export default patientApi;