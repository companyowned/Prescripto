/**
 * API Client — Axios instance with auth interceptor.
 * Automatically refreshes the access token via the refresh token on a 401,
 * so a session survives well past the 30-minute access token lifetime.
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from './tokenStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_BASE_URL) {
    throw new Error(
        'EXPO_PUBLIC_API_URL is not set. Add it to your .env file before building.'
    );
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
        const token = await tokenStorage.getAccessToken();
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

const AUTH_ENDPOINTS_WITHOUT_RETRY = ['/auth/login', '/auth/token/refresh', '/auth/register'];

// Shared in-flight refresh so concurrent 401s don't each rotate the refresh
// token and race each other.
let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
    const storedRefreshToken = await tokenStorage.getRefreshToken();
    if (!storedRefreshToken) return null;

    try {
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh`, {
            refresh_token: storedRefreshToken,
        });
        const { access_token, refresh_token } = response.data;
        await tokenStorage.setTokens(access_token, refresh_token);
        return access_token as string;
    } catch {
        await tokenStorage.clearAll();
        return null;
    }
}

// Response interceptor — silently refresh the access token on a 401 and retry once
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
        const isAuthEndpoint = AUTH_ENDPOINTS_WITHOUT_RETRY.some((path) => originalRequest?.url?.includes(path));

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            if (!refreshPromise) {
                refreshPromise = performRefresh().finally(() => {
                    refreshPromise = null;
                });
            }
            const newAccessToken = await refreshPromise;

            if (newAccessToken) {
                if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
                    originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
                } else {
                    originalRequest.headers = {
                        ...(originalRequest.headers || {}),
                        Authorization: `Bearer ${newAccessToken}`,
                    } as any;
                }
                return apiClient(originalRequest);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
