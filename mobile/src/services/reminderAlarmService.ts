/**
 * Reminder Alarm Service
 *
 * Schedules cascading local notifications for each reminder:
 *   - Primary: at the exact scheduled time
 *   - Follow-ups: every 5 minutes after (up to 20 min) if not acknowledged
 *
 * When the user taps "Take Now" or "Snooze" on any notification, all
 * follow-up notifications for that reminder are cancelled.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { MedicationReminder } from '../features/reminders/types';

export const ALARM_CHANNEL = 'medication_alarms';
export const CATEGORY_MEDICATION = 'MEDICATION_ALARM';
export const ACTION_TAKE_NOW = 'TAKE_NOW';
export const ACTION_SNOOZE   = 'SNOOZE_10';

// Cascade: re-fire at these offsets (minutes) after the original time
const FOLLOWUP_OFFSETS = [5, 10, 15, 20];
const MAX_FOLLOWUPS = FOLLOWUP_OFFSETS.length; // 0..4 index range

export type AlarmNotificationData = {
    reminderId:      string;
    medicationName:  string;
    dosage:          string | null;
    form:            string | null;
    instructions:    string | null;
    scheduledAt:     string;  // ISO string of the original dose time
    followUpIndex:   number;  // 0 = primary, 1-4 = follow-ups
};

// ── Android alarm channel setup ──────────────────────────────────────────────

export async function setupAlarmChannel() {
    if (Platform.OS !== 'android') return;

    try {
        await Notifications.setNotificationChannelAsync(ALARM_CHANNEL, {
            name: 'Medication Alarms',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'default',
            vibrationPattern: [0, 500, 300, 500, 300, 800],
            enableVibrate: true,
            enableLights: true,
            lightColor: '#4FB3FF',
            showBadge: true,
        });
    } catch (e) {
        if (__DEV__) console.warn('setupAlarmChannel failed:', e);
    }
}

// ── Notification categories (action buttons) ─────────────────────────────────

export async function registerAlarmCategory() {
    try {
        await Notifications.setNotificationCategoryAsync(CATEGORY_MEDICATION, [
            {
                identifier: ACTION_TAKE_NOW,
                buttonTitle: '✓ Taken',
                options: { opensAppToForeground: true },
            },
            {
                identifier: ACTION_SNOOZE,
                buttonTitle: '⏰ Snooze 10 min',
                options: { opensAppToForeground: false },
            },
        ]);
    } catch (e) {
        if (__DEV__) console.warn('registerAlarmCategory failed:', e);
    }
}

// ── Notification identifier helpers ──────────────────────────────────────────

function notifId(reminderId: string, followUpIndex: number, scheduledAt: string) {
    // stable, unique per (reminder × time-slot × follow-up)
    const slot = new Date(scheduledAt).toISOString().slice(0, 16); // "2024-01-15T08:30"
    return `alarm_${reminderId}_${slot}_${followUpIndex}`;
}

// ── Schedule a single alarm notification ─────────────────────────────────────

async function scheduleOne(
    reminder: MedicationReminder,
    triggerDate: Date,
    followUpIndex: number,
    originalScheduledAt: Date,
) {
    if (triggerDate.getTime() <= Date.now()) return; // skip past times

    const isFollowUp = followUpIndex > 0;
    const title = isFollowUp
        ? `⚠️ Reminder: ${reminder.medication_name}`
        : `💊 Time to take ${reminder.medication_name}`;

    const bodyParts = [reminder.dosage, reminder.form, reminder.instructions].filter(Boolean);
    const body = bodyParts.length > 0
        ? bodyParts.join(' · ')
        : 'Tap "Taken" to confirm you took your medicine';

    const data: AlarmNotificationData = {
        reminderId:     reminder.id,
        medicationName: reminder.medication_name,
        dosage:         reminder.dosage,
        form:           reminder.form,
        instructions:   reminder.instructions,
        scheduledAt:    originalScheduledAt.toISOString(),
        followUpIndex,
    };

    try {
        await Notifications.scheduleNotificationAsync({
            identifier: notifId(reminder.id, followUpIndex, originalScheduledAt.toISOString()),
            content: {
                title,
                body,
                data: data as any,
                sound: true,
                categoryIdentifier: CATEGORY_MEDICATION,
            },
            trigger: Platform.OS === 'android'
                ? { type: 'date', date: triggerDate, channelId: ALARM_CHANNEL } as any
                : { type: 'date', date: triggerDate } as any,
        });
    } catch (e) {
        if (__DEV__) console.warn(`scheduleOne failed for reminder ${reminder.id}:`, e);
    }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Schedule all alarms for a single reminder (today's slots only).
 * Each slot gets a primary notification + up to 4 follow-up notifications.
 */
export async function scheduleReminderAlarms(reminder: MedicationReminder) {
    if (!reminder.is_active) return;

    await cancelReminderAlarms(reminder.id);

    const today = new Date();
    const slots: Date[] = [];

    if (reminder.schedule_type === 'fixed_times' && reminder.times?.length) {
        for (const t of reminder.times) {
            const [h, m] = t.split(':').map(Number);
            const d = new Date(today);
            d.setHours(h, m, 0, 0);
            // If this time is in the past, skip (notifications already missed)
            if (d.getTime() > Date.now()) slots.push(d);
        }
    } else if (reminder.schedule_type === 'interval' && reminder.interval_hours) {
        const next = new Date(Date.now() + reminder.interval_hours * 3600 * 1000);
        slots.push(next);
    }

    for (const slot of slots) {
        await scheduleOne(reminder, slot, 0, slot);
        for (let i = 0; i < FOLLOWUP_OFFSETS.length; i++) {
            const followUpTime = new Date(slot.getTime() + FOLLOWUP_OFFSETS[i] * 60 * 1000);
            await scheduleOne(reminder, followUpTime, i + 1, slot);
        }
    }
}

/**
 * Cancel ALL notifications (primary + follow-ups) for a reminder.
 * Call this when dose is marked taken or reminder is deleted/paused.
 */
export async function cancelReminderAlarms(reminderId: string) {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = all
        .filter((n) => (n.content.data as any)?.reminderId === reminderId)
        .map((n) => n.identifier);
    await Promise.all(toCancel.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

/**
 * Cancel a single alarm slot's follow-up chain.
 * Call this when "Taken" or "Snooze" is tapped for a specific scheduled time.
 */
export async function cancelAlarmSlot(reminderId: string, scheduledAt: string) {
    for (let i = 0; i <= MAX_FOLLOWUPS; i++) {
        const id = notifId(reminderId, i, scheduledAt);
        await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    }
}

/**
 * Reschedule all active reminders (call on app startup and after any change).
 */
export async function scheduleAllReminders(reminders: MedicationReminder[]) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const r of reminders) {
        await scheduleReminderAlarms(r);
    }
}
