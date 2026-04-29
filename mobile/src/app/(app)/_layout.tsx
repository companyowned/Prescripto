/**
 * App group layout — authenticated stack
 */

import { Stack } from 'expo-router';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { ProfileProvider } from '../../contexts/profile-context';

export default function AppLayout() {
    usePushNotifications();
    return (
        <ProfileProvider>
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
        </ProfileProvider>
    );
}
