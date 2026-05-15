/**
 * Medication Reminders feature — API functions
 */

import apiClient from '../../services/apiClient';
import {
    MedicationReminder,
    ReminderCreateRequest,
    ReminderUpdateRequest,
    ReminderListResponse,
    DoseEvent,
    DoseEventWithReminder,
    TodayDosesResponse,
    UpcomingDose,
    InsightsSummary,
    TrendsResponse,
    RiskFlagsResponse,
    SnoozeRequest,
} from './types';

export const remindersApi = {
    // ── Reminder CRUD ──

    async create(data: ReminderCreateRequest): Promise<MedicationReminder> {
        const response = await apiClient.post<MedicationReminder>(
            '/medication-reminders',
            data
        );
        return response.data;
    },

    async list(activeOnly = false, skip = 0, limit = 50, profileId?: string): Promise<ReminderListResponse> {
        const response = await apiClient.get<ReminderListResponse>(
            '/medication-reminders',
            { params: { active_only: activeOnly, skip, limit, ...(profileId ? { profile_id: profileId } : {}) } }
        );
        return response.data;
    },

    async getById(id: string): Promise<MedicationReminder> {
        const response = await apiClient.get<MedicationReminder>(
            `/medication-reminders/${id}`
        );
        return response.data;
    },

    async update(id: string, data: ReminderUpdateRequest): Promise<MedicationReminder> {
        const response = await apiClient.patch<MedicationReminder>(
            `/medication-reminders/${id}`,
            data
        );
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/medication-reminders/${id}`);
    },

    async pause(id: string): Promise<MedicationReminder> {
        const response = await apiClient.post<MedicationReminder>(
            `/medication-reminders/${id}/pause`
        );
        return response.data;
    },

    async resume(id: string): Promise<MedicationReminder> {
        const response = await apiClient.post<MedicationReminder>(
            `/medication-reminders/${id}/resume`
        );
        return response.data;
    },

    async getUpcoming(windowHours = 24, profileId?: string): Promise<UpcomingDose[]> {
        const response = await apiClient.get<UpcomingDose[]>(
            '/medication-reminders/upcoming',
            { params: { window_hours: windowHours, ...(profileId ? { profile_id: profileId } : {}) } }
        );
        return response.data;
    },

    // ── Dose Event Actions ──

    async getTodayDoses(profileId?: string): Promise<TodayDosesResponse> {
        const response = await apiClient.get<TodayDosesResponse>(
            '/medication-dose-events/today',
            { params: profileId ? { profile_id: profileId } : {} }
        );
        return response.data;
    },

    async markTaken(eventId: string, note?: string): Promise<DoseEvent> {
        const response = await apiClient.post<DoseEvent>(
            `/medication-dose-events/${eventId}/mark-taken`,
            note ? { note } : {}
        );
        return response.data;
    },

    async skipDose(eventId: string, note?: string): Promise<DoseEvent> {
        const response = await apiClient.post<DoseEvent>(
            `/medication-dose-events/${eventId}/skip`,
            note ? { note } : {}
        );
        return response.data;
    },

    async snoozeDose(eventId: string, data: SnoozeRequest): Promise<DoseEvent> {
        const response = await apiClient.post<DoseEvent>(
            `/medication-dose-events/${eventId}/snooze`,
            data
        );
        return response.data;
    },

    // ── Insights ──

    async getSummary(range: '7d' | '30d' | '90d' = '7d', profileId?: string): Promise<InsightsSummary> {
        const response = await apiClient.get<InsightsSummary>(
            '/medication-insights/summary',
            { params: { range, ...(profileId ? { profile_id: profileId } : {}) } }
        );
        return response.data;
    },

    async getTrends(range: '7d' | '30d' | '90d' = '30d', profileId?: string): Promise<TrendsResponse> {
        const response = await apiClient.get<TrendsResponse>(
            '/medication-insights/trends',
            { params: { range, ...(profileId ? { profile_id: profileId } : {}) } }
        );
        return response.data;
    },

    async getRiskFlags(profileId?: string): Promise<RiskFlagsResponse> {
        const response = await apiClient.get<RiskFlagsResponse>(
            '/medication-insights/risk-flags',
            { params: profileId ? { profile_id: profileId } : {} }
        );
        return response.data;
    },
};
