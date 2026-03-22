/**
 * App group layout — authenticated stack
 */

import { Stack } from 'expo-router';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function AppLayout() {
    usePushNotifications();
    return (
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    );
}
