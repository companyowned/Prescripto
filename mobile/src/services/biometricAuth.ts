/**
 * Biometric login gate.
 *
 * Stores only a flag + the linked email — never a token. The actual session
 * is the long-lived refresh token already persisted by auth.ts/tokenStorage.ts;
 * biometrics just gate resuming it, so once enabled it keeps working
 * indefinitely (until the refresh token is revoked/expired or the user turns
 * it off), instead of being tied to the 30-minute access token.
 */

import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { authService } from './auth';
import { tokenStorage } from './tokenStorage';

const BIOMETRIC_ENABLED_KEY = 'biometric_login_enabled';
const BIOMETRIC_EMAIL_KEY = 'biometric_login_email';
const BIOMETRIC_PROMPTED_KEY = 'biometric_setup_prompted';

export type BiometricUnlockResult = 'success' | 'cancelled' | 'session_invalid';

export const biometricAuthService = {
    async canUseBiometrics(): Promise<boolean> {
        if (Platform.OS === 'web') return false;
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) return false;
        return LocalAuthentication.isEnrolledAsync();
    },

    async isEnabled(): Promise<boolean> {
        if (Platform.OS === 'web') return false;
        return (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === 'true';
    },

    async getLinkedEmail(): Promise<string | null> {
        if (Platform.OS === 'web') return null;
        if (!(await this.isEnabled())) return null;
        return SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
    },

    /** Whether the one-time "enable fingerprint?" prompt has already been shown/answered. */
    async hasBeenPrompted(): Promise<boolean> {
        if (Platform.OS === 'web') return true;
        return (await SecureStore.getItemAsync(BIOMETRIC_PROMPTED_KEY)) === 'true';
    },

    /** Marks the one-time prompt as shown so it never appears again, regardless of the answer. */
    async markPrompted(): Promise<void> {
        if (Platform.OS === 'web') return;
        await SecureStore.setItemAsync(BIOMETRIC_PROMPTED_KEY, 'true');
    },

    /** Only offer the auto-prompt once, ever, per device. */
    async shouldOfferSetup(): Promise<boolean> {
        if (!(await this.canUseBiometrics())) return false;
        if (await this.isEnabled()) return false;
        return !(await this.hasBeenPrompted());
    },

    /** Enable biometric unlock. Assumes the caller already has a valid session
     * (i.e. just logged in, or is already authenticated) so a refresh token
     * is already persisted — biometrics just gate resuming it later. */
    async enable(email: string): Promise<void> {
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

        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
        await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email.trim().toLowerCase());
    },

    async disable(): Promise<void> {
        if (Platform.OS === 'web') return;
        try {
            await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
            await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
        } catch {
            // ignore
        }
    },

    /** Prompt fingerprint, then resume the persisted session via the refresh token. */
    async unlockWithBiometrics(): Promise<BiometricUnlockResult> {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Sign in to Dawini',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
        });
        if (!result.success) return 'cancelled';

        const storedRefreshToken = await tokenStorage.getRefreshToken();
        if (!storedRefreshToken) return 'session_invalid';

        try {
            await authService.refreshAccessToken();
            return 'success';
        } catch {
            return 'session_invalid';
        }
    },
};
