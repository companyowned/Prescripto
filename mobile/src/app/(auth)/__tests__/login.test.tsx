import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import LoginScreen from '../login';
import { authService } from '../../../services/auth';
import { biometricAuthService } from '../../../services/biometricAuth';

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('../../_layout', () => ({
    useAuth: () => ({ signIn: mockSignIn, signOut: jest.fn(), completeOnboarding: jest.fn() }),
}));

// react-native-reanimated v4's own `/mock` pulls in the native worklets
// runtime, which crashes under plain jest — swap in a minimal JS-only stand-in
// covering just the APIs these screens/components actually use.
jest.mock('react-native-reanimated', () => {
    const { View, Text } = require('react-native');

    const identity = (v: unknown) => v;
    const chainable = (): any => {
        const obj: any = {};
        ['duration', 'delay', 'springify', 'damping', 'easing'].forEach((method) => {
            obj[method] = () => obj;
        });
        return obj;
    };

    return {
        __esModule: true,
        default: { View, Text },
        useSharedValue: (initial: unknown) => ({ value: initial }),
        useAnimatedStyle: (fn: () => unknown) => {
            try {
                return fn();
            } catch {
                return {};
            }
        },
        withTiming: identity,
        withSpring: identity,
        withRepeat: identity,
        withSequence: (...args: unknown[]) => args[0],
        interpolateColor: () => '#000000',
        Easing: { inOut: identity, out: identity, in: identity, ease: identity, linear: identity },
        FadeIn: chainable(),
        FadeInDown: chainable(),
    };
});

jest.mock('expo-blur', () => ({ BlurView: () => null }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: () => null }));

jest.mock('../../../services/auth', () => ({
    authService: {
        login: jest.fn(),
        logout: jest.fn().mockResolvedValue(undefined),
        setStoredToken: jest.fn().mockResolvedValue(undefined),
        getCurrentUser: jest.fn(),
    },
}));

jest.mock('../../../services/biometricAuth', () => ({
    biometricAuthService: {
        canUseBiometrics: jest.fn().mockResolvedValue(true),
        getLinkedEmail: jest.fn().mockResolvedValue('user@example.com'),
        shouldOfferSetup: jest.fn().mockResolvedValue(false),
        refreshLinkedToken: jest.fn().mockResolvedValue(undefined),
        enable: jest.fn().mockResolvedValue(undefined),
        disable: jest.fn().mockResolvedValue(undefined),
        getTokenWithPrompt: jest.fn(),
    },
}));

const mockSignIn = jest.fn();

function apiError(status: number) {
    return { response: { status, data: { detail: 'error' } } };
}

beforeEach(() => {
    jest.clearAllMocks();
    (biometricAuthService.canUseBiometrics as jest.Mock).mockResolvedValue(true);
    (biometricAuthService.getLinkedEmail as jest.Mock).mockResolvedValue('user@example.com');
    (biometricAuthService.shouldOfferSetup as jest.Mock).mockResolvedValue(false);
});

describe('LoginScreen — fingerprint icon', () => {
    it('shows a fingerprint icon (not the old unicode glyph placeholder) when biometrics are available', async () => {
        await render(<LoginScreen />);

        expect(await screen.findByTestId('icon-finger-print')).toBeTruthy();
        expect(screen.queryByText('⌾')).toBeNull();
    });

    it('hides the fingerprint button entirely when biometrics are unavailable on this device', async () => {
        (biometricAuthService.canUseBiometrics as jest.Mock).mockResolvedValue(false);

        await render(<LoginScreen />);

        await waitFor(() => {
            expect(screen.queryByTestId('icon-finger-print')).toBeNull();
        });
    });
});

describe('LoginScreen — fingerprint login verification', () => {
    it('keeps the fingerprint link intact on a transient (non-401) verification failure', async () => {
        (biometricAuthService.getTokenWithPrompt as jest.Mock).mockResolvedValue({
            email: 'user@example.com',
            token: 'stale-but-not-yet-expired-token',
        });
        // No `.response` and no `.message` — a bare network/timeout-style
        // failure, as opposed to an API error response.
        (authService.getCurrentUser as jest.Mock).mockRejectedValue({});

        await render(<LoginScreen />);

        const fingerprintButton = await screen.findByTestId('fingerprint-login-button');
        await fireEvent.press(fingerprintButton);

        await waitFor(() => {
            expect(authService.logout).toHaveBeenCalled();
        });

        // Regression test: a transient failure (e.g. network hiccup, server cold
        // start) must not wipe the biometric link — only a genuine 401 should.
        expect(biometricAuthService.disable).not.toHaveBeenCalled();
        expect(screen.getByText(/Could not verify your session/i)).toBeTruthy();
    });

    it('clears the biometric link only when the token is genuinely invalid (401)', async () => {
        (biometricAuthService.getTokenWithPrompt as jest.Mock).mockResolvedValue({
            email: 'user@example.com',
            token: 'expired-token',
        });
        (authService.getCurrentUser as jest.Mock).mockRejectedValue(apiError(401));

        await render(<LoginScreen />);

        const fingerprintButton = await screen.findByTestId('fingerprint-login-button');
        await fireEvent.press(fingerprintButton);

        await waitFor(() => {
            expect(biometricAuthService.disable).toHaveBeenCalled();
        });
        expect(authService.logout).toHaveBeenCalled();
        expect(screen.getByText(/session has expired/i)).toBeTruthy();
    });

    it('signs in and does not touch the biometric link when the stored token is still valid', async () => {
        (biometricAuthService.getTokenWithPrompt as jest.Mock).mockResolvedValue({
            email: 'user@example.com',
            token: 'valid-token',
        });
        (authService.getCurrentUser as jest.Mock).mockResolvedValue({
            id: '1',
            email: 'user@example.com',
            full_name: 'User',
        });

        await render(<LoginScreen />);

        const fingerprintButton = await screen.findByTestId('fingerprint-login-button');
        await fireEvent.press(fingerprintButton);

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalled();
        });
        expect(biometricAuthService.disable).not.toHaveBeenCalled();
    });
});

describe('LoginScreen — password login refreshes the biometric link', () => {
    it("refreshes this device's stored biometric token after a successful password login", async () => {
        // Regression test: previously the biometric token was captured once at
        // setup time and never refreshed, so it silently went stale even though
        // the user kept signing in with a password.
        (authService.login as jest.Mock).mockResolvedValue({
            access_token: 'fresh-token',
            token_type: 'bearer',
        });

        await render(<LoginScreen />);

        await fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'user@example.com');
        await fireEvent.changeText(screen.getByPlaceholderText('Enter your password'), 'correct-password');

        await fireEvent.press(screen.getByTestId('sign-in-button'));

        await waitFor(() => {
            expect(biometricAuthService.refreshLinkedToken).toHaveBeenCalledWith(
                'user@example.com',
                'fresh-token'
            );
        });
        expect(mockSignIn).toHaveBeenCalled();
    });
});
