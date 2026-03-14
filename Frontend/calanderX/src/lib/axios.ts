import axios, { type AxiosInstance, type AxiosResponse, type AxiosError, type InternalAxiosRequestConfig } from "axios";

// Main API instance for /api routes
const api = axios.create({
    baseURL: "http://localhost:3001/api",
    withCredentials: true,
    timeout: 10000, // 10 seconds timeout
});

// Auth API instance for /user routes
const authAxios = axios.create({
    baseURL: "http://localhost:3001/api",
    withCredentials: true,
    timeout: 10000,
});

// Request interceptor to add auth token
const addAuthInterceptor = (instance: AxiosInstance) => {
    instance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const token = localStorage.getItem('authToken');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error: AxiosError) => {
            return Promise.reject(error);
        }
    );
};

// Response interceptor for error handling
const addResponseInterceptor = (instance: AxiosInstance) => {
    instance.interceptors.response.use(
        (response: AxiosResponse) => {
            return response;
        },
        (error: AxiosError) => {
            // Handle common error scenarios
            if (error.response?.status === 401) {
                // Unauthorized - clear token and redirect to login
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
            
            if (error.response?.status === 429) {
                // Rate limited - show user-friendly message
                console.warn('Rate limit exceeded. Please try again later.');
            }
            
            return Promise.reject(error);
        }
    );
};

// Apply interceptors to both instances
addAuthInterceptor(api);
addAuthInterceptor(authAxios);
addResponseInterceptor(api);
addResponseInterceptor(authAxios);

export default api;
export { authAxios };