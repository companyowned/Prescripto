/**
 * Biometric login setup and token storage.
 * Stores the access token (not the password) so credentials are never persisted.
 */

import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

interface StoredBiometricData {
    email: string;
    token: string;
}

const BIOMETRIC_CREDENTIALS_KEY = 'biometric_login_credentials';

export const biometricAuthService = {
    async canUseBiometrics(): Promise<boolean> {
        if (Platform.OS === 'web') return false;
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) return false;
        return LocalAuthentication.isEnrolledAsync();
    },

    async getLinkedEmail(): Promise<string | null> {
        if (Platform.OS === 'web') return null;
        const raw = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
        if (!raw) return null;
        try {
            const data = JSON.parse(raw) as StoredBiometricData;
            return data.email || null;
        } catch {
            await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
            return null;
        }
    },

    async isLinked(): Promise<boolean> {
        return !!(await this.getLinkedEmail());
    },

    async shouldOfferSetup(email: string): Promise<boolean> {
        if (!(await this.canUseBiometrics())) return false;
        const linkedEmail = await this.getLinkedEmail();
        return linkedEmail !== email.trim().toLowerCase();
    },

    /**
     * Silently refreshes the stored token for an already-linked email, without
     * re-prompting for fingerprint auth. Call this after every successful
     * password login so the biometric login stays valid — otherwise the token
     * captured at `enable()` time never changes and eventually expires even
     * though the user keeps signing in with a password in the meantime.
     * No-op if this device isn't linked to `email`.
     */
    async refreshLinkedToken(email: string, token: string): Promise<void> {
        const linkedEmail = await this.getLinkedEmail();
        if (linkedEmail !== email.trim().toLowerCase()) return;

        await SecureStore.setItemAsync(
            BIOMETRIC_CREDENTIALS_KEY,
            JSON.stringify({
                email: linkedEmail,
                token,
            } satisfies StoredBiometricData)
        );
    },

    async enable(email: string, token: string): Promise<void> {
        const canUseBiometrics = await this.canUseBiometrics();
        if (!canUseBiometrics) {
            throw new Error('Fingerprint is not available or not set up on this device.');
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Link fingerprint to Dawini',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
        });

        if (!result.success) {
            throw new Error('Fingerprint setup was cancelled.');
        }

        await SecureStore.setItemAsync(
            BIOMETRIC_CREDENTIALS_KEY,
            JSON.stringify({
                email: email.trim().toLowerCase(),
                token,
            } satisfies StoredBiometricData)
        );
    },

    async disable(): Promise<void> {
        if (Platform.OS !== 'web') {
            try {
                await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
            } catch {
                // ignore
            }
        }
    },

    async getTokenWithPrompt(): Promise<StoredBiometricData | null> {
        const linkedEmail = await this.getLinkedEmail();
        if (!linkedEmail) return null;

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Sign in to Dawini',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
        });

        if (!result.success) return null;

        const raw = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
        if (!raw) return null;

        try {
            return JSON.parse(raw) as StoredBiometricData;
        } catch {
            await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
            return null;
        }
    },
};
