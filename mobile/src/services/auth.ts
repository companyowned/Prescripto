/**
 * Auth service — login, register, token management
 * Uses SecureStore on native, localStorage on web
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import apiClient from './apiClient';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    full_name: string;
    password: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
}

export interface UserResponse {
    id: string;
    email: string;
    full_name: string;
}

const TOKEN_KEY = 'access_token';

// Cross-platform token storage
async function setToken(value: string): Promise<void> {
    if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, value);
    } else {
        await SecureStore.setItemAsync(TOKEN_KEY, value);
    }
}

async function getToken(): Promise<string | null> {
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

async function removeToken(): Promise<void> {
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

export const authService = {
    async login(data: LoginRequest): Promise<TokenResponse> {
        const response = await apiClient.post<TokenResponse>('/auth/login', data);
        await setToken(response.data.access_token);
        return response.data;
    },

    async register(data: RegisterRequest): Promise<UserResponse> {
        const response = await apiClient.post<UserResponse>('/auth/register', data);
        return response.data;
    },

    async logout(): Promise<void> {
        await removeToken();
    },

    async getToken(): Promise<string | null> {
        return getToken();
    },

    async isAuthenticated(): Promise<boolean> {
        const token = await getToken();
        return !!token;
    },
};
