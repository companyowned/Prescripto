/**
 * useAlarmNotifications
 *
 * Handles two scenarios:
 *  1. App is OPEN   → foreground notification → show AlarmOverlay
 *  2. App is CLOSED → user taps "Taken" or "Snooze" notification action → handle response
 *
 * Must be mounted once at the root app level (AppLayout).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
    AlarmNotificationData,
    ACTION_TAKE_NOW,
    ACTION_SNOOZE,
    cancelAlarmSlot,
    setupAlarmChannel,
    registerAlarmCategory,
    resolveAlarmData,
} from '../services/reminderAlarmService';
import { remindersApi } from '../features/reminders/api';

export function useAlarmNotifications() {
    const [activeAlarm, setActiveAlarm] = useState<AlarmNotificationData | null>(null);
    const processingRef = useRef(false);

    // ── Bootstrap: channel + category ────────────────────────────────────────
    useEffect(() => {
        if (Platform.OS === 'web') return;
        setupAlarmChannel().catch(console.warn);
        registerAlarmCategory().catch(console.warn);
    }, []);

    // ── Foreground notifications → show in-app overlay ───────────────────────
    useEffect(() => {
        const sub = Notifications.addNotificationReceivedListener((notification) => {
            const raw = notification.request.content.data as AlarmNotificationData | undefined;
            if (raw?.reminderId) {
                setActiveAlarm(resolveAlarmData(raw));
            }
        });
        return () => sub.remove();
    }, []);

    // ── Handle "Taken" ────────────────────────────────────────────────────────
    const handleTaken = useCallback(async (alarm: AlarmNotificationData) => {
        if (processingRef.current) return;
        processingRef.current = true;

        try {
            // Cancel the entire notification cascade for this slot
            await cancelAlarmSlot(alarm.reminderId, alarm.scheduledAt ?? new Date().toISOString());

            // Find the dose event for this reminder and mark it taken
            if (Platform.OS !== 'web') {
                const today = await remindersApi.getTodayDoses();
                const doseEvent = today.doses.find(
                    (d) =>
                        d.reminder_id === alarm.reminderId &&
                        d.status !== 'taken' &&
                        d.status !== 'skipped',
                );
                if (doseEvent) {
                    await remindersApi.markTaken(doseEvent.id);
                }
            }
        } catch (e) {
            if (__DEV__) console.warn('AlarmNotifications: error marking dose taken:', e);
        } finally {
            processingRef.current = false;
            setActiveAlarm(null);
        }
    }, []);

    // ── Handle "Snooze" ───────────────────────────────────────────────────────
    const handleSnooze = useCallback(async (alarm: AlarmNotificationData) => {
        if (processingRef.current) return;
        processingRef.current = true;

        try {
            // Cancel the current slot's cascade (there will be follow-ups already scheduled,
            // but we add an explicit 10-min reschedule as a clean "snooze")
            await cancelAlarmSlot(alarm.reminderId, alarm.scheduledAt ?? new Date().toISOString());

            // Schedule a new alarm 10 minutes from now
            const snoozeTime = new Date(Date.now() + 10 * 60 * 1000);
            await Notifications.scheduleNotificationAsync({
                identifier: `snooze_${alarm.reminderId}_${Date.now()}`,
                content: {
                    title: `⏰ Snoozed: ${alarm.medicationName}`,
                    body: [alarm.dosage, alarm.form].filter(Boolean).join(' · ') || 'Time to take your medicine',
                    data: {
                        ...alarm,
                        hour: snoozeTime.getHours(),
                        minute: snoozeTime.getMinutes(),
                        scheduledAt: snoozeTime.toISOString(),
                        followUpIndex: 0,
                        recurring: false,
                    } as any,
                    sound: true,
                    categoryIdentifier: 'MEDICATION_ALARM',
                    ...(Platform.OS === 'android' && ({
                        channelId: 'medication_alarms',
                        priority: 'max',
                    } as any)),
                },
                trigger: { type: 'date', date: snoozeTime } as any,
            });

            // Also snooze in the backend if dose event exists
            const today = await remindersApi.getTodayDoses();
            const doseEvent = today.doses.find(
                (d) =>
                    d.reminder_id === alarm.reminderId &&
                    d.status !== 'taken' &&
                    d.status !== 'skipped',
            );
            if (doseEvent) {
                await remindersApi.snoozeDose(doseEvent.id, { snooze_minutes: 10 });
            }
        } catch (e) {
            if (__DEV__) console.warn('AlarmNotifications: error snoozing:', e);
        } finally {
            processingRef.current = false;
            setActiveAlarm(null);
        }
    }, []);

    // ── Background / killed app → notification action response ───────────────
    // Defined after handleTaken/handleSnooze to avoid temporal dead zone in dep array
    useEffect(() => {
        const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
            const raw = response.notification.request.content.data as AlarmNotificationData | undefined;
            if (!raw?.reminderId || processingRef.current) return;
            const data = resolveAlarmData(raw);

            const actionId = response.actionIdentifier;

            if (actionId === ACTION_TAKE_NOW) {
                await handleTaken(data);
            } else if (actionId === ACTION_SNOOZE) {
                await handleSnooze(data);
            } else {
                // User opened the app by tapping the notification body — show overlay
                setActiveAlarm(data);
            }
        });
        return () => sub.remove();
    }, [handleTaken, handleSnooze]);

    return {
        activeAlarm,
        handleTaken,
        handleSnooze,
        dismissAlarm: () => setActiveAlarm(null),
    };
}
