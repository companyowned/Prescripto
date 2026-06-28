/**
 * App group layout — authenticated stack
 * Wraps screens with InactivityProvider for auto-logout on idle.
 * Mounts the alarm system: schedules notifications + shows in-app AlarmOverlay.
 */

import { Stack } from 'expo-router';
import { Alert } from 'react-native';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useAlarmNotifications } from '../../hooks/useAlarmNotifications';
import { ProfileProvider } from '../../contexts/profile-context';
import { InactivityProvider } from '../../contexts/inactivity-context';
import { authService } from '../../services/auth';
import { useAuth } from '../_layout';
import { AlarmOverlay } from '../../components/reminders/AlarmOverlay';

export default function AppLayout() {
    usePushNotifications();
    const { signOut } = useAuth();
    const { activeAlarm, handleTaken, handleSnooze, dismissAlarm } = useAlarmNotifications();

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

                {/* In-app alarm overlay — shown when notification fires while app is open */}
                <AlarmOverlay
                    visible={!!activeAlarm}
                    alarm={activeAlarm}
                    onTaken={handleTaken}
                    onSnooze={handleSnooze}
                    onDismiss={dismissAlarm}
                />
            </ProfileProvider>
        </InactivityProvider>
    );
}
