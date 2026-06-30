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
