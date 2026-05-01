/**
 * App group layout — authenticated stack
 * Wraps screens with InactivityProvider for auto-logout on idle.
 */

import { Stack } from 'expo-router';
import { Alert } from 'react-native';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { ProfileProvider } from '../../contexts/profile-context';
import { InactivityProvider } from '../../contexts/inactivity-context';
import { authService } from '../../services/auth';
import { useAuth } from '../_layout';

export default function AppLayout() {
    usePushNotifications();
    const { signOut } = useAuth();

    const handleSessionTimeout = async () => {
        await authService.logout();
        Alert.alert(
            'Session Expired',
            'You have been signed out due to inactivity. Please log in again.',
            [{ text: 'OK' }]
        );
        signOut();
    };

    return (
        <InactivityProvider onTimeout={handleSessionTimeout}>
            <ProfileProvider>
                <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
            </ProfileProvider>
        </InactivityProvider>
    );
}
