/**
 * Auth service — login, register, token management.
 * Access tokens are short-lived (30 min); refresh tokens are long-lived and
 * rotated on each use, so a session survives across app restarts without
 * asking for a password again — see tokenStorage.ts / apiClient.ts.
 */

import apiClient from './apiClient';
import { tokenStorage } from './tokenStorage';

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
    refresh_token: string;
    token_type: string;
}

export interface MessageResponse {
    detail: string;
}

export interface UserResponse {
    id: string;
    email: string;
    full_name: string;
}

export const authService = {
    async login(data: LoginRequest): Promise<TokenResponse> {
        const response = await apiClient.post<TokenResponse>('/auth/login', data);
        await tokenStorage.setTokens(response.data.access_token, response.data.refresh_token);
        return response.data;
    },

    async register(data: RegisterRequest): Promise<UserResponse> {
        const response = await apiClient.post<UserResponse>('/auth/register', data);
        return response.data;
    },

    async requestPasswordReset(email: string): Promise<MessageResponse> {
        const response = await apiClient.post<MessageResponse>('/auth/password-reset/request', { email });
        return response.data;
    },

    async confirmPasswordReset(data: {
        email: string;
        otp: string;
        new_password: string;
    }): Promise<MessageResponse> {
        const response = await apiClient.post<MessageResponse>('/auth/password-reset/confirm', data);
        return response.data;
    },

    async verifyPasswordResetCode(data: {
        email: string;
        otp: string;
    }): Promise<MessageResponse> {
        const response = await apiClient.post<MessageResponse>('/auth/password-reset/verify', data);
        return response.data;
    },

    /** Exchange the stored refresh token for a fresh access token (rotates both). */
    async refreshAccessToken(): Promise<string> {
        const storedRefreshToken = await tokenStorage.getRefreshToken();
        if (!storedRefreshToken) {
            throw new Error('No stored session to refresh.');
        }
        try {
            const response = await apiClient.post<TokenResponse>('/auth/token/refresh', {
                refresh_token: storedRefreshToken,
            });
            await tokenStorage.setTokens(response.data.access_token, response.data.refresh_token);
            return response.data.access_token;
        } catch (err) {
            await tokenStorage.clearAll();
            throw err;
        }
    },

    async logout(): Promise<void> {
        const storedRefreshToken = await tokenStorage.getRefreshToken();
        if (storedRefreshToken) {
            try {
                await apiClient.post('/auth/logout', { refresh_token: storedRefreshToken });
            } catch {
                // best-effort — still clear local tokens even if the server call fails
            }
        }
        await tokenStorage.clearAll();
    },

    async getToken(): Promise<string | null> {
        return tokenStorage.getAccessToken();
    },

    async isAuthenticated(): Promise<boolean> {
        const token = await tokenStorage.getAccessToken();
        return !!token;
    },

    async setStoredToken(token: string): Promise<void> {
        await tokenStorage.setAccessToken(token);
    },

    async getCurrentUser(): Promise<UserResponse> {
        const response = await apiClient.get<UserResponse>('/auth/me');
        return response.data;
    },

    async updateProfile(data: { full_name: string }): Promise<UserResponse> {
        const response = await apiClient.put<UserResponse>('/auth/me', data);
        return response.data;
    },

    async updatePushToken(token: string): Promise<void> {
        await apiClient.post('/auth/push-token', { token });
    },
};
