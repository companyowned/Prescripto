/**
 * Root Layout — Providers + auth-aware routing
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authService } from '../services/auth';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
        },
    },
});

// Auth context so login/logout can trigger navigation refresh
interface AuthContextType {
    signIn: () => void;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
    signIn: () => { },
    signOut: () => { },
});

export const useAuth = () => useContext(AuthContext);

function AuthGate({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const segments = useSegments();
    const [isReady, setIsReady] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const checkAuth = useCallback(async () => {
        const authed = await authService.isAuthenticated();
        setIsAuthenticated(authed);
        setIsReady(true);
    }, []);

    useEffect(() => {
        checkAuth();
    }, []);

    // Called from login/register screens after successful auth
    const signIn = useCallback(() => {
        setIsAuthenticated(true);
    }, []);

    // Called from logout
    const signOut = useCallback(() => {
        setIsAuthenticated(false);
    }, []);

    useEffect(() => {
        if (!isReady) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!isAuthenticated && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (isAuthenticated && inAuthGroup) {
            router.replace('/(app)/home');
        }
    }, [isAuthenticated, segments, isReady]);

    if (!isReady) return null;

    return (
        <AuthContext.Provider value={{ signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export default function RootLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
            <AuthGate>
                <Slot />
            </AuthGate>
        </QueryClientProvider>
    );
}
