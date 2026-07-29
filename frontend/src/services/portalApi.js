import axios from 'axios';

const portalApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

portalApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('portalToken');
    if (token) {
      config.headers.Authorization = `Portal ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

portalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('portalToken');
      window.location.hash = '#/portal/login';
    }
    return Promise.reject(error);
  }
);

export default portalApi;
