/**
 * API Client — Axios instance with auth interceptor
 * Cross-platform: uses SecureStore on native, localStorage on web
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL || 'https://prescripto-taupe-ten.vercel.app/api/v1';

const TOKEN_KEY = 'access_token';

async function getStoredToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
        return localStorage.getItem(TOKEN_KEY);
    } else {
        try {
            return await SecureStore.getItemAsync(TOKEN_KEY);
        } catch {
            return null;
        }
    }
}

async function removeStoredToken(): Promise<void> {
    if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
    } else {
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
        } catch {
            // ignore
        }
    }
}

const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach JWT token
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await getStoredToken();
        if (token && config.headers) {
            if (typeof config.headers.set === 'function') {
                config.headers.set('Authorization', `Bearer ${token}`);
            } else {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await removeStoredToken();
        }
        return Promise.reject(error);
    }
);

export default apiClient;
