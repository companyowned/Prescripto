/**
 * Reminder Alarm Service
 *
 * Schedules alarms for each reminder:
 *   - Primary: a recurring, OS-level alarm (daily clock-time or fixed interval)
 *     that keeps firing forever once scheduled — the OS re-arms it after every
 *     firing, so it does NOT depend on the app being opened again.
 *   - Follow-ups: one-shot notifications every 5 minutes after the primary
 *     (up to 20 min) if not acknowledged, for today's remaining occurrence
 *     only. These are refreshed opportunistically whenever the app schedules
 *     (app open, reminder created/edited) — a best-effort escalation layer on
 *     top of the always-firing primary alarm.
 *
 * When the user taps "Take Now" or "Snooze" on any notification, the
 * follow-up notifications for that specific slot are cancelled. The
 * recurring primary alarm is never cancelled by this — it must keep firing
 * on future days/intervals.
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
    hour:            number;   // clock hour for fixed-time alarms, -1 for interval-based
    minute:          number;   // clock minute for fixed-time alarms, -1 for interval-based
    scheduledAt?:    string;   // ISO string of the exact dose time (always set for follow-ups)
    followUpIndex:   number;   // 0 = primary, 1-4 = follow-ups
    // True for the persistent, OS-recurring primary alarm. Its `scheduledAt`
    // (set once, at schedule time) goes stale after the first firing, since
    // the same notification content is reused every time the OS re-fires it
    // — callers must use resolveAlarmData() before trusting scheduledAt.
    recurring?:      boolean;
};

/**
 * Normalizes alarm data received from a notification event. For the
 * recurring primary alarm, `scheduledAt` is recomputed as "today at this
 * alarm's clock time" since the stored value is from whenever it was first
 * scheduled, not from this particular firing.
 */
export function resolveAlarmData(data: AlarmNotificationData): AlarmNotificationData {
    if (!data.recurring) return data;

    const d = new Date();
    if (data.hour >= 0 && data.minute >= 0) {
        d.setHours(data.hour, data.minute, 0, 0);
    }
    return { ...data, scheduledAt: d.toISOString() };
}

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

function pad2(n: number) {
    return String(n).padStart(2, '0');
}

function primaryNotifId(reminderId: string, hour: number, minute: number) {
    return `alarm_primary_${reminderId}_${pad2(hour)}${pad2(minute)}`;
}

function intervalNotifId(reminderId: string) {
    return `alarm_primary_${reminderId}_interval`;
}

function followUpNotifId(reminderId: string, followUpIndex: number, scheduledAt: string) {
    // stable, unique per (reminder × time-slot × follow-up)
    const slot = new Date(scheduledAt).toISOString().slice(0, 16); // "2024-01-15T08:30"
    return `alarm_${reminderId}_${slot}_${followUpIndex}`;
}

function bodyFor(reminder: MedicationReminder) {
    const bodyParts = [reminder.dosage, reminder.form, reminder.instructions].filter(Boolean);
    return bodyParts.length > 0
        ? bodyParts.join(' · ')
        : 'Tap "Taken" to confirm you took your medicine';
}

// ── Schedule the recurring primary alarm ─────────────────────────────────────

async function schedulePrimaryDaily(reminder: MedicationReminder, hour: number, minute: number) {
    const data: AlarmNotificationData = {
        reminderId:     reminder.id,
        medicationName: reminder.medication_name,
        dosage:         reminder.dosage,
        form:           reminder.form,
        instructions:   reminder.instructions,
        hour,
        minute,
        followUpIndex:  0,
        recurring:      true,
    };

    try {
        await Notifications.scheduleNotificationAsync({
            identifier: primaryNotifId(reminder.id, hour, minute),
            content: {
                title: `💊 Time to take ${reminder.medication_name}`,
                body: bodyFor(reminder),
                data: data as any,
                sound: true,
                categoryIdentifier: CATEGORY_MEDICATION,
            },
            trigger: Platform.OS === 'android'
                ? { type: 'daily', hour, minute, channelId: ALARM_CHANNEL } as any
                : { type: 'daily', hour, minute } as any,
        });
    } catch (e) {
        if (__DEV__) console.warn(`schedulePrimaryDaily failed for reminder ${reminder.id}:`, e);
    }
}

async function scheduleIntervalRecurring(reminder: MedicationReminder) {
    if (!reminder.interval_hours) return;

    const data: AlarmNotificationData = {
        reminderId:     reminder.id,
        medicationName: reminder.medication_name,
        dosage:         reminder.dosage,
        form:           reminder.form,
        instructions:   reminder.instructions,
        hour:           -1,
        minute:         -1,
        followUpIndex:  0,
        recurring:      true,
    };

    try {
        await Notifications.scheduleNotificationAsync({
            identifier: intervalNotifId(reminder.id),
            content: {
                title: `💊 Time to take ${reminder.medication_name}`,
                body: bodyFor(reminder),
                data: data as any,
                sound: true,
                categoryIdentifier: CATEGORY_MEDICATION,
            },
            trigger: Platform.OS === 'android'
                ? { type: 'timeInterval', seconds: Math.round(reminder.interval_hours * 3600), repeats: true, channelId: ALARM_CHANNEL } as any
                : { type: 'timeInterval', seconds: Math.round(reminder.interval_hours * 3600), repeats: true } as any,
        });
    } catch (e) {
        if (__DEV__) console.warn(`scheduleIntervalRecurring failed for reminder ${reminder.id}:`, e);
    }
}

// ── Schedule a one-shot follow-up alarm ──────────────────────────────────────

async function scheduleFollowUp(
    reminder: MedicationReminder,
    triggerDate: Date,
    followUpIndex: number,
    originalScheduledAt: Date,
) {
    if (triggerDate.getTime() <= Date.now()) return; // skip past times

    const data: AlarmNotificationData = {
        reminderId:     reminder.id,
        medicationName: reminder.medication_name,
        dosage:         reminder.dosage,
        form:           reminder.form,
        instructions:   reminder.instructions,
        hour:           triggerDate.getHours(),
        minute:         triggerDate.getMinutes(),
        scheduledAt:    originalScheduledAt.toISOString(),
        followUpIndex,
    };

    try {
        await Notifications.scheduleNotificationAsync({
            identifier: followUpNotifId(reminder.id, followUpIndex, originalScheduledAt.toISOString()),
            content: {
                title: `⚠️ Reminder: ${reminder.medication_name}`,
                body: bodyFor(reminder),
                data: data as any,
                sound: true,
                categoryIdentifier: CATEGORY_MEDICATION,
            },
            trigger: Platform.OS === 'android'
                ? { type: 'date', date: triggerDate, channelId: ALARM_CHANNEL } as any
                : { type: 'date', date: triggerDate } as any,
        });
    } catch (e) {
        if (__DEV__) console.warn(`scheduleFollowUp failed for reminder ${reminder.id}:`, e);
    }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Schedule all alarms for a single reminder: a persistent, OS-recurring
 * primary alarm (fires every day/interval forever, independent of the app),
 * plus today's remaining follow-up escalation chain.
 */
export async function scheduleReminderAlarms(reminder: MedicationReminder) {
    if (!reminder.is_active) return;

    await cancelReminderAlarms(reminder.id);

    if (reminder.schedule_type === 'fixed_times' && reminder.times?.length) {
        for (const t of reminder.times) {
            const [h, m] = t.split(':').map(Number);
            await schedulePrimaryDaily(reminder, h, m);

            const slot = new Date();
            slot.setHours(h, m, 0, 0);
            if (slot.getTime() > Date.now()) {
                for (let i = 0; i < FOLLOWUP_OFFSETS.length; i++) {
                    const followUpTime = new Date(slot.getTime() + FOLLOWUP_OFFSETS[i] * 60 * 1000);
                    await scheduleFollowUp(reminder, followUpTime, i + 1, slot);
                }
            }
        }
    } else if (reminder.schedule_type === 'interval' && reminder.interval_hours) {
        await scheduleIntervalRecurring(reminder);
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
 * Cancel a single alarm slot's follow-up chain (today's escalation only).
 * The recurring primary alarm is intentionally left alone — it must keep
 * firing on future days/intervals.
 * Call this when "Taken" or "Snooze" is tapped for a specific scheduled time.
 */
export async function cancelAlarmSlot(reminderId: string, scheduledAt: string) {
    for (let i = 1; i <= MAX_FOLLOWUPS; i++) {
        const id = followUpNotifId(reminderId, i, scheduledAt);
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
