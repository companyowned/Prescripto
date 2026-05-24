/**
 * Root Layout — Providers + auth-aware routing + onboarding
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authService } from '../services/auth';
import { ThemeProvider } from '../contexts/theme-context';
import { LanguageProvider } from '../contexts/language-context';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 2, staleTime: 30 * 1000, refetchOnWindowFocus: false },
    },
});

interface AuthContextType { signIn: () => void; signOut: () => void; completeOnboarding: () => void; }
const AuthContext = createContext<AuthContextType>({ signIn: () => {}, signOut: () => {}, completeOnboarding: () => {} });
export const useAuth = () => useContext(AuthContext);

function AuthGate({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const segments = useSegments();
    const [isReady, setIsReady]               = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [onboardingDone, setOnboardingDone]   = useState(false);

    useEffect(() => {
        authService.isAuthenticated().then((authed) => {
            setIsAuthenticated(authed);
            setIsReady(true);
        });
    }, []);

    const signIn             = useCallback(() => setIsAuthenticated(true),  []);
    const signOut            = useCallback(() => setIsAuthenticated(false), []);
    const completeOnboarding = useCallback(() => setOnboardingDone(true),   []);

    useEffect(() => {
        if (!isReady) return;
        const inAuth       = segments[0] === '(auth)';
        const inOnboarding = segments[0] === '(onboarding)';

        if (!onboardingDone && !inOnboarding) {
            router.replace('/(onboarding)');
        } else if (onboardingDone && !isAuthenticated && !inAuth) {
            router.replace('/(auth)/login');
        } else if (onboardingDone && isAuthenticated && inAuth) {
            router.replace('/(app)/home');
        }
    }, [isAuthenticated, segments, isReady, onboardingDone]);

    if (!isReady) return null;

    return (
        <AuthContext.Provider value={{ signIn, signOut, completeOnboarding }}>
            {children}
        </AuthContext.Provider>
    );
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={StyleSheet.absoluteFill}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <LanguageProvider>
                        <StatusBar barStyle="light-content" backgroundColor="#040D12" />
                        <AuthGate>
                            <Slot />
                        </AuthGate>
                    </LanguageProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
