/**
 * DoseTimelineItem — Timeline entry for a scheduled dose with action buttons
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DoseEventWithReminder, DoseStatus } from '../../features/reminders/types';

interface DoseTimelineItemProps {
    dose: DoseEventWithReminder;
    onMarkTaken?: () => void;
    onSkip?: () => void;
    onSnooze?: (minutes: number) => void;
}

const STATUS_CONFIG: Record<DoseStatus, { color: string; icon: string; label: string }> = {
    pending: { color: '#F59E0B', icon: 'time-outline', label: 'Pending' },
    taken: { color: '#10B981', icon: 'checkmark-circle', label: 'Taken' },
    missed: { color: '#EF4444', icon: 'close-circle', label: 'Missed' },
    skipped: { color: '#6B7280', icon: 'remove-circle', label: 'Skipped' },
    snoozed: { color: '#8B5CF6', icon: 'alarm-outline', label: 'Snoozed' },
};

export const DoseTimelineItem: React.FC<DoseTimelineItemProps> = ({
    dose,
    onMarkTaken,
    onSkip,
    onSnooze,
}) => {
    const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
    const config = STATUS_CONFIG[dose.status];
    const time = new Date(dose.scheduled_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
    const isActionable = dose.status === 'pending' || dose.status === 'snoozed';

    return (
        <View style={styles.container}>
            {/* Timeline dot and line */}
            <View style={styles.timeline}>
                <View style={[styles.dot, { backgroundColor: config.color }]} />
                <View style={styles.line} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.time}>{time}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: config.color + '18' }]}>
                            <Ionicons name={config.icon as any} size={12} color={config.color} />
                            <Text style={[styles.statusText, { color: config.color }]}>
                                {config.label}
                            </Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.medName}>{dose.medication_name}</Text>
                {dose.dosage && <Text style={styles.dosage}>{dose.dosage}</Text>}

                {isActionable && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.takenBtn]}
                            onPress={onMarkTaken}
                        >
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                            <Text style={styles.actionBtnText}>Taken</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, styles.skipBtn]}
                            onPress={onSkip}
                        >
                            <Text style={styles.skipBtnText}>Skip</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, styles.snoozeBtn]}
                            onPress={() => setShowSnoozeOptions(!showSnoozeOptions)}
                        >
                            <Ionicons name="alarm-outline" size={14} color="#8B5CF6" />
                            <Text style={styles.snoozeBtnText}>Snooze</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {showSnoozeOptions && isActionable && (
                    <View style={styles.snoozeOptions}>
                        {[10, 30, 60].map((mins) => (
                            <TouchableOpacity
                                key={mins}
                                style={styles.snoozeOption}
                                onPress={() => {
                                    onSnooze?.(mins);
                                    setShowSnoozeOptions(false);
                                }}
                            >
                                <Text style={styles.snoozeOptionText}>{mins}m</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {dose.status === 'taken' && dose.taken_at && (
                    <Text style={styles.takenTime}>
                        Taken at {new Date(dose.taken_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    timeline: {
        width: 32,
        alignItems: 'center',
    },
    dot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginTop: 4,
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginTop: 4,
    },
    content: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        marginLeft: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    time: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    medName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    dosage: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 8,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    takenBtn: {
        backgroundColor: '#10B981',
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    skipBtn: {
        backgroundColor: '#F3F4F6',
    },
    skipBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    snoozeBtn: {
        backgroundColor: '#F5F3FF',
    },
    snoozeBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8B5CF6',
    },
    snoozeOptions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    snoozeOption: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: '#F5F3FF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    snoozeOptionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#7C3AED',
    },
    takenTime: {
        fontSize: 12,
        color: '#10B981',
        fontStyle: 'italic',
        marginTop: 4,
    },
});
