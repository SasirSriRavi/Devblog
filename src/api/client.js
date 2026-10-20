import axios from 'axios';

const api = axios.create({
  baseURL: 'https://devblog-api-l7k0.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('devblog-token');

    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;