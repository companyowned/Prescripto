import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { useAlarmNotifications } from '../useAlarmNotifications';
import { AlarmNotificationData } from '../../services/reminderAlarmService';

type Listener = (event: any) => void;

let receivedListener: Listener | undefined;
let responseListener: Listener | undefined;

jest.mock('expo-notifications', () => ({
    addNotificationReceivedListener: jest.fn((cb: Listener) => {
        receivedListener = cb;
        return { remove: jest.fn() };
    }),
    addNotificationResponseReceivedListener: jest.fn((cb: Listener) => {
        responseListener = cb;
        return { remove: jest.fn() };
    }),
    scheduleNotificationAsync: jest.fn().mockResolvedValue('id'),
}));

jest.mock('../../features/reminders/api', () => ({
    remindersApi: {
        getTodayDoses: jest.fn().mockResolvedValue({ doses: [] }),
        markTaken: jest.fn(),
        snoozeDose: jest.fn(),
    },
}));

// setupAlarmChannel/registerAlarmCategory/cancelAlarmSlot are irrelevant to
// this hook's listener wiring — mock those, but keep the real
// resolveAlarmData so the test exercises the actual staleness fix.
jest.mock('../../services/reminderAlarmService', () => {
    const actual = jest.requireActual('../../services/reminderAlarmService');
    return {
        ...actual,
        setupAlarmChannel: jest.fn().mockResolvedValue(undefined),
        registerAlarmCategory: jest.fn().mockResolvedValue(undefined),
        cancelAlarmSlot: jest.fn().mockResolvedValue(undefined),
    };
});

async function fireReceived(data: AlarmNotificationData | undefined) {
    await act(async () => {
        receivedListener!({ request: { content: { data } } });
    });
}

beforeEach(() => {
    receivedListener = undefined;
    responseListener = undefined;
    jest.clearAllMocks();
});

describe('useAlarmNotifications — foreground notification received', () => {
    it('registers a received listener and ignores notifications with no reminderId', async () => {
        const { result } = await renderHook(() => useAlarmNotifications());
        expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledTimes(1);

        await fireReceived({ title: 'promo' } as any);

        expect(result.current.activeAlarm).toBeNull();
    });

    it('shows the overlay for a plain (non-recurring) alarm using its data as-is', async () => {
        const { result } = await renderHook(() => useAlarmNotifications());

        const data: AlarmNotificationData = {
            reminderId: 'rem-1',
            medicationName: 'Aspirin',
            dosage: '100mg',
            form: 'tablet',
            instructions: null,
            hour: 8,
            minute: 30,
            scheduledAt: '2026-08-02T08:30:00.000Z',
            followUpIndex: 1,
        };

        await fireReceived(data);

        expect(result.current.activeAlarm).toEqual(data);
    });

    it("recomputes today's scheduledAt for the recurring primary alarm instead of surfacing the stale stored date", async () => {
        // Regression test for the underlying scheduling bug: the primary alarm
        // is now a persistent OS-level daily trigger, so its notification
        // payload is set once at schedule time and reused on every firing.
        // The hook must not show the AlarmOverlay with a scheduledAt from
        // whenever it was first scheduled — it must reflect *this* firing.
        jest.useFakeTimers().setSystemTime(new Date('2026-08-02T15:00:00.000Z'));

        const { result } = await renderHook(() => useAlarmNotifications());

        const staleData: AlarmNotificationData = {
            reminderId: 'rem-1',
            medicationName: 'Aspirin',
            dosage: '100mg',
            form: 'tablet',
            instructions: null,
            hour: 8,
            minute: 30,
            scheduledAt: '2026-07-20T08:30:00.000Z', // stale, from first scheduling weeks ago
            followUpIndex: 0,
            recurring: true,
        };

        await fireReceived(staleData);

        expect(result.current.activeAlarm?.scheduledAt).not.toBe(staleData.scheduledAt);
        const resolved = new Date(result.current.activeAlarm!.scheduledAt!);
        expect(resolved.toDateString()).toBe(new Date().toDateString());
        expect(resolved.getHours()).toBe(8);
        expect(resolved.getMinutes()).toBe(30);

        jest.useRealTimers();
    });
});

describe('useAlarmNotifications — notification action response', () => {
    it('marks the dose taken and clears the overlay when "Taken" is tapped, without touching the recurring primary alarm', async () => {
        const { cancelAlarmSlot } = jest.requireMock('../../services/reminderAlarmService');
        const { result } = await renderHook(() => useAlarmNotifications());

        const data: AlarmNotificationData = {
            reminderId: 'rem-1',
            medicationName: 'Aspirin',
            dosage: null,
            form: null,
            instructions: null,
            hour: 8,
            minute: 30,
            scheduledAt: '2026-08-02T08:30:00.000Z',
            followUpIndex: 0,
            recurring: true,
        };

        await act(async () => {
            await responseListener!({
                notification: { request: { content: { data } } },
                actionIdentifier: 'TAKE_NOW',
            });
        });

        expect(cancelAlarmSlot).toHaveBeenCalledWith('rem-1', expect.any(String));
        await waitFor(() => expect(result.current.activeAlarm).toBeNull());
    });
});
