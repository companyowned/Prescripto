/**
 * Medication Reminders feature — TanStack Query hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { remindersApi } from './api';
import {
    ReminderCreateRequest,
    ReminderUpdateRequest,
    SnoozeRequest,
    DoseEventWithReminder,
    TodayDosesResponse,
} from './types';

// ── Reminder Queries ──

export const useMedicationReminders = (activeOnly = false) => {
    return useQuery({
        queryKey: ['reminders', 'list', activeOnly],
        queryFn: () => remindersApi.list(activeOnly),
    });
};

export const useReminder = (id: string) => {
    return useQuery({
        queryKey: ['reminders', id],
        queryFn: () => remindersApi.getById(id),
        enabled: !!id,
    });
};

export const useUpcomingDoses = (windowHours = 24) => {
    return useQuery({
        queryKey: ['reminders', 'upcoming', windowHours],
        queryFn: () => remindersApi.getUpcoming(windowHours),
        refetchInterval: 60000, // Refresh every minute
    });
};

// ── Today's Doses ──

export const useTodayDoses = () => {
    return useQuery({
        queryKey: ['doses', 'today'],
        queryFn: () => remindersApi.getTodayDoses(),
        refetchInterval: 30000, // Refresh every 30 seconds
    });
};

// ── Insights ──

export const useMedicationInsights = (range: '7d' | '30d' | '90d' = '7d') => {
    return useQuery({
        queryKey: ['insights', 'summary', range],
        queryFn: () => remindersApi.getSummary(range),
    });
};

export const useMedicationTrends = (range: '7d' | '30d' | '90d' = '30d') => {
    return useQuery({
        queryKey: ['insights', 'trends', range],
        queryFn: () => remindersApi.getTrends(range),
    });
};

export const useRiskFlags = () => {
    return useQuery({
        queryKey: ['insights', 'risk-flags'],
        queryFn: () => remindersApi.getRiskFlags(),
        refetchInterval: 300000, // Refresh every 5 minutes
    });
};

// ── Mutations ──

export const useCreateReminder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ReminderCreateRequest) => remindersApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
            queryClient.invalidateQueries({ queryKey: ['doses'] });
        },
    });
};

export const useUpdateReminder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ReminderUpdateRequest }) =>
            remindersApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
        },
    });
};

export const useDeleteReminder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => remindersApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
            queryClient.invalidateQueries({ queryKey: ['doses'] });
        },
    });
};

export const usePauseReminder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => remindersApi.pause(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
        },
    });
};

export const useResumeReminder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => remindersApi.resume(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
        },
    });
};

export const useMarkDoseTaken = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ eventId, note }: { eventId: string; note?: string }) =>
            remindersApi.markTaken(eventId, note),
        onMutate: async ({ eventId }) => {
            // Optimistic update for today's doses
            await queryClient.cancelQueries({ queryKey: ['doses', 'today'] });
            const previous = queryClient.getQueryData<TodayDosesResponse>(['doses', 'today']);

            if (previous) {
                queryClient.setQueryData<TodayDosesResponse>(['doses', 'today'], {
                    ...previous,
                    doses: previous.doses.map((d: DoseEventWithReminder) =>
                        d.id === eventId
                            ? { ...d, status: 'taken' as const, taken_at: new Date().toISOString() }
                            : d
                    ),
                });
            }

            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['doses', 'today'], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['doses'] });
            queryClient.invalidateQueries({ queryKey: ['insights'] });
        },
    });
};

export const useSkipDose = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ eventId, note }: { eventId: string; note?: string }) =>
            remindersApi.skipDose(eventId, note),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doses'] });
            queryClient.invalidateQueries({ queryKey: ['insights'] });
        },
    });
};

export const useSnoozeDose = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ eventId, data }: { eventId: string; data: SnoozeRequest }) =>
            remindersApi.snoozeDose(eventId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doses'] });
        },
    });
};
