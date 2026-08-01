import * as SecureStore from 'expo-secure-store';
import { biometricAuthService } from '../biometricAuth';

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const getItemMock = SecureStore.getItemAsync as jest.Mock;
const setItemMock = SecureStore.setItemAsync as jest.Mock;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('refreshLinkedToken', () => {
    it('updates the stored token when the device is already linked to this email', async () => {
        // Regression test: without this, the token captured once at `enable()`
        // time never changes, so it silently expires even though the user keeps
        // successfully signing in with a password — forcing an unnecessary
        // "sign in with password to re-enable fingerprint" prompt later.
        getItemMock.mockResolvedValue(JSON.stringify({ email: 'user@example.com', token: 'old-token' }));

        await biometricAuthService.refreshLinkedToken('User@Example.com', 'new-token');

        expect(setItemMock).toHaveBeenCalledWith(
            'biometric_login_credentials',
            JSON.stringify({ email: 'user@example.com', token: 'new-token' })
        );
    });

    it('does nothing when this device is linked to a different email', async () => {
        getItemMock.mockResolvedValue(JSON.stringify({ email: 'someone-else@example.com', token: 'old-token' }));

        await biometricAuthService.refreshLinkedToken('user@example.com', 'new-token');

        expect(setItemMock).not.toHaveBeenCalled();
    });

    it('does nothing when no device is linked at all', async () => {
        getItemMock.mockResolvedValue(null);

        await biometricAuthService.refreshLinkedToken('user@example.com', 'new-token');

        expect(setItemMock).not.toHaveBeenCalled();
    });
});
