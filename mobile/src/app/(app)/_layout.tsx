/**
 * App group layout — authenticated stack
 * Wraps screens with InactivityProvider for auto-logout on idle.
 * Mounts the alarm system: schedules notifications + shows in-app AlarmOverlay.
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Alert, Platform } from 'react-native';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useAlarmNotifications } from '../../hooks/useAlarmNotifications';
import { ProfileProvider } from '../../contexts/profile-context';
import { InactivityProvider } from '../../contexts/inactivity-context';
import { authService } from '../../services/auth';
import { useAuth } from '../_layout';
import { AlarmOverlay } from '../../components/reminders/AlarmOverlay';
import { remindersApi } from '../../features/reminders/api';
import { scheduleAllReminders } from '../../services/reminderAlarmService';

export default function AppLayout() {
    usePushNotifications();
    const { signOut } = useAuth();
    const { activeAlarm, handleTaken, handleSnooze, dismissAlarm } = useAlarmNotifications();

    // Arm alarms as soon as the app opens, independent of which screen the
    // user navigates to — the reminders screen also reschedules on its own,
    // but medication alarms must not depend on the user visiting it.
    useEffect(() => {
        if (Platform.OS === 'web') return;
        remindersApi.list(true)
            .then((res) => scheduleAllReminders(res.reminders))
            .catch((e) => { if (__DEV__) console.warn('Startup alarm scheduling failed:', e); });
    }, []);

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
