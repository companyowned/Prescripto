/**
 * Shared access/refresh token storage — used by both apiClient (attaching
 * headers, silent refresh) and auth.ts (login/logout), so token handling
 * lives in one place instead of being duplicated.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

async function getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
        return localStorage.getItem(key);
    }
    try {
        return await SecureStore.getItemAsync(key);
    } catch {
        return null;
    }
}

async function setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
    }
    await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
    }
    try {
        await SecureStore.deleteItemAsync(key);
    } catch {
        // ignore
    }
}

export const tokenStorage = {
    getAccessToken: (): Promise<string | null> => getItem(ACCESS_TOKEN_KEY),
    setAccessToken: (value: string): Promise<void> => setItem(ACCESS_TOKEN_KEY, value),
    removeAccessToken: (): Promise<void> => removeItem(ACCESS_TOKEN_KEY),

    getRefreshToken: (): Promise<string | null> => getItem(REFRESH_TOKEN_KEY),
    setRefreshToken: (value: string): Promise<void> => setItem(REFRESH_TOKEN_KEY, value),
    removeRefreshToken: (): Promise<void> => removeItem(REFRESH_TOKEN_KEY),

    async setTokens(accessToken: string, refreshToken: string): Promise<void> {
        await setItem(ACCESS_TOKEN_KEY, accessToken);
        await setItem(REFRESH_TOKEN_KEY, refreshToken);
    },

    async clearAll(): Promise<void> {
        await Promise.all([removeItem(ACCESS_TOKEN_KEY), removeItem(REFRESH_TOKEN_KEY)]);
    },
};
