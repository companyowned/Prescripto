/**
 * Medication Reminders feature — TypeScript types
 */

// ── Reminder Types ──

export type ScheduleType = 'fixed_times' | 'interval' | 'as_needed';

export interface MedicationReminder {
    id: string;
    user_id: string;
    profile_id: string | null;
    prescription_id: string | null;
    medication_name: string;
    dosage: string | null;
    form: string | null;
    instructions: string | null;
    start_date: string;
    end_date: string | null;
    timezone: string;
    schedule_type: ScheduleType;
    times_per_day: number | null;
    times: string[] | null;
    interval_hours: number | null;
    days_of_week: number[] | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ReminderCreateRequest {
    medication_name: string;
    dosage?: string;
    form?: string;
    instructions?: string;
    prescription_id?: string;
    profile_id?: string;
    start_date: string;
    end_date?: string;
    timezone: string;
    schedule_type: ScheduleType;
    times_per_day?: number;
    times?: string[];
    interval_hours?: number;
    days_of_week?: number[];
}

export interface ReminderUpdateRequest {
    medication_name?: string;
    dosage?: string;
    form?: string;
    instructions?: string;
    start_date?: string;
    end_date?: string;
    timezone?: string;
    schedule_type?: ScheduleType;
    times_per_day?: number;
    times?: string[];
    interval_hours?: number;
    days_of_week?: number[];
}

export interface ReminderListResponse {
    reminders: MedicationReminder[];
    total: number;
}

// ── Dose Event Types ──

export type DoseStatus = 'pending' | 'taken' | 'missed' | 'skipped' | 'snoozed';

export interface DoseEvent {
    id: string;
    reminder_id: string;
    scheduled_at: string;
    status: DoseStatus;
    taken_at: string | null;
    snoozed_until: string | null;
    note: string | null;
    source: string;
    created_at: string;
}

export interface DoseEventWithReminder {
    id: string;
    reminder_id: string;
    medication_name: string;
    dosage: string | null;
    form: string | null;
    scheduled_at: string;
    status: DoseStatus;
    taken_at: string | null;
    snoozed_until: string | null;
    note: string | null;
    source: string;
}

export interface TodayDosesResponse {
    doses: DoseEventWithReminder[];
    total: number;
}

export interface UpcomingDose {
    dose_event_id: string;
    reminder_id: string;
    medication_name: string;
    dosage: string | null;
    form: string | null;
    scheduled_at: string;
    status: DoseStatus;
}

// ── Insights Types ──

export interface InsightsSummary {
    adherence_rate: number;
    total_doses: number;
    taken_count: number;
    missed_count: number;
    skipped_count: number;
    current_streak: number;
    best_streak: number;
    range_days: number;
}

export interface TrendDataPoint {
    date: string;
    adherence_rate: number;
    taken: number;
    missed: number;
    skipped: number;
    total: number;
}

export interface TrendsResponse {
    data: TrendDataPoint[];
    range_days: number;
    average_adherence: number;
}

export interface RiskFlag {
    type: string;
    severity: 'warning' | 'critical';
    message: string;
    details?: Record<string, any>;
}

export interface RiskFlagsResponse {
    flags: RiskFlag[];
    evaluated_at: string;
}

// ── Snooze Request ──

export interface SnoozeRequest {
    snooze_minutes: number;
    note?: string;
}
