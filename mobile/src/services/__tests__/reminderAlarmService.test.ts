import * as Notifications from 'expo-notifications';
import {
    scheduleReminderAlarms,
    cancelAlarmSlot,
    resolveAlarmData,
    AlarmNotificationData,
} from '../reminderAlarmService';
import { MedicationReminder } from '../../features/reminders/types';

jest.mock('expo-notifications', () => ({
    scheduleNotificationAsync: jest.fn().mockResolvedValue('id'),
    cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
    cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
    getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
    setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
    setNotificationCategoryAsync: jest.fn().mockResolvedValue(undefined),
    AndroidImportance: { MAX: 5 },
}));

jest.mock('react-native', () => ({
    Platform: { OS: 'ios' },
}));

function makeReminder(overrides: Partial<MedicationReminder> = {}): MedicationReminder {
    return {
        id: 'rem-1',
        user_id: 'user-1',
        profile_id: null,
        prescription_id: null,
        medication_name: 'Aspirin',
        dosage: '100mg',
        form: 'tablet',
        instructions: null,
        start_date: new Date().toISOString(),
        end_date: null,
        timezone: 'UTC',
        schedule_type: 'fixed_times',
        times_per_day: 1,
        times: ['08:00'],
        interval_hours: null,
        days_of_week: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides,
    };
}

const scheduleMock = Notifications.scheduleNotificationAsync as jest.Mock;
const cancelMock = Notifications.cancelScheduledNotificationAsync as jest.Mock;
const getAllMock = Notifications.getAllScheduledNotificationsAsync as jest.Mock;

beforeEach(() => {
    jest.clearAllMocks();
    getAllMock.mockResolvedValue([]);
});

describe('scheduleReminderAlarms', () => {
    it('schedules the primary fixed-time alarm as an OS-recurring daily trigger', async () => {
        // Regression test: the primary alarm used to be a one-shot `date` trigger
        // scoped to "today", which silently stopped firing forever unless the
        // user reopened the app to reschedule it. It must now be a `daily`
        // trigger, which the OS re-arms after every firing on its own.
        const reminder = makeReminder({ times: ['08:30'] });
        await scheduleReminderAlarms(reminder);

        const primaryCall = scheduleMock.mock.calls.find(
            ([opts]) => opts.identifier === 'alarm_primary_rem-1_0830'
        );
        expect(primaryCall).toBeDefined();
        const [opts] = primaryCall!;

        expect(opts.trigger).toMatchObject({ type: 'daily', hour: 8, minute: 30 });
        expect(opts.trigger.type).not.toBe('date');
        expect(opts.content.data).toMatchObject({
            reminderId: 'rem-1',
            followUpIndex: 0,
            recurring: true,
            hour: 8,
            minute: 30,
        });
    });

    it('schedules one recurring alarm per configured time', async () => {
        const reminder = makeReminder({ times: ['08:00', '20:00'] });
        await scheduleReminderAlarms(reminder);

        const primaryIds = scheduleMock.mock.calls
            .map(([opts]) => opts.identifier)
            .filter((id: string) => id.startsWith('alarm_primary_'));
        expect(primaryIds.sort()).toEqual(['alarm_primary_rem-1_0800', 'alarm_primary_rem-1_2000']);
    });

    it('schedules a repeating timeInterval trigger for interval-based reminders', async () => {
        const reminder = makeReminder({
            schedule_type: 'interval',
            times: null,
            interval_hours: 6,
        });
        await scheduleReminderAlarms(reminder);

        const primaryCall = scheduleMock.mock.calls.find(
            ([opts]) => opts.identifier === 'alarm_primary_rem-1_interval'
        );
        expect(primaryCall).toBeDefined();
        const [opts] = primaryCall!;

        expect(opts.trigger).toMatchObject({ type: 'timeInterval', seconds: 6 * 3600, repeats: true });
        expect(opts.content.data).toMatchObject({ recurring: true, followUpIndex: 0 });
    });

    it('does nothing for a paused (inactive) reminder', async () => {
        const reminder = makeReminder({ is_active: false });
        await scheduleReminderAlarms(reminder);
        expect(scheduleMock).not.toHaveBeenCalled();
    });
});

describe('cancelAlarmSlot', () => {
    it('cancels only the escalation follow-ups, never the recurring primary alarm', async () => {
        // Regression test: tapping "Taken" must not silence tomorrow's dose —
        // only today's not-yet-fired follow-up nags should be cancelled.
        await cancelAlarmSlot('rem-1', '2026-08-02T08:30:00.000Z');

        const cancelledIds = cancelMock.mock.calls.map(([id]) => id);
        expect(cancelledIds).toEqual([
            'alarm_rem-1_2026-08-02T08:30_1',
            'alarm_rem-1_2026-08-02T08:30_2',
            'alarm_rem-1_2026-08-02T08:30_3',
            'alarm_rem-1_2026-08-02T08:30_4',
        ]);
        expect(cancelledIds.some((id: string) => id.startsWith('alarm_primary_'))).toBe(false);
    });
});

describe('resolveAlarmData', () => {
    it('passes through non-recurring (follow-up / snooze) data untouched', () => {
        const data: AlarmNotificationData = {
            reminderId: 'rem-1',
            medicationName: 'Aspirin',
            dosage: null,
            form: null,
            instructions: null,
            hour: 8,
            minute: 35,
            scheduledAt: '2026-08-02T08:30:00.000Z',
            followUpIndex: 1,
        };

        expect(resolveAlarmData(data)).toEqual(data);
    });

    it("recomputes today's date for the recurring primary alarm instead of trusting the stale stored value", () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-08-02T15:00:00.000Z'));

        const data: AlarmNotificationData = {
            reminderId: 'rem-1',
            medicationName: 'Aspirin',
            dosage: null,
            form: null,
            instructions: null,
            hour: 8,
            minute: 30,
            scheduledAt: '2026-07-20T08:30:00.000Z', // stale — set once, weeks ago, when first scheduled
            followUpIndex: 0,
            recurring: true,
        };

        const resolved = resolveAlarmData(data);
        const resolvedDate = new Date(resolved.scheduledAt!);

        expect(resolvedDate.getHours()).toBe(8);
        expect(resolvedDate.getMinutes()).toBe(30);
        expect(resolvedDate.toDateString()).toBe(new Date().toDateString());

        jest.useRealTimers();
    });
});
