/**
 * ReminderCard — Displays a single medication reminder with quick actions
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MedicationReminder } from '../../features/reminders/types';
import { colors } from '../../theme';

interface ReminderCardProps {
    reminder: MedicationReminder;
    onPress?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onDelete?: () => void;
}

const FORM_ICONS: Record<string, string> = {
    tablet: 'tablet',
    capsule: 'pill',
    liquid: 'water',
    injection: 'needle',
    inhaler: 'lungs',
    drops: 'eyedrop',
    cream: 'lotion-outline',
};

export const ReminderCard: React.FC<ReminderCardProps> = ({
    reminder,
    onPress,
    onPause,
    onResume,
    onDelete,
}) => {
    const scheduleLabel = () => {
        if (reminder.schedule_type === 'fixed_times' && reminder.times) {
            return reminder.times.join(', ');
        }
        if (reminder.schedule_type === 'interval' && reminder.interval_hours) {
            return `Every ${reminder.interval_hours}h`;
        }
        return 'As needed';
    };

    const formIcon = FORM_ICONS[reminder.form || ''] || 'pill';
    const isActive = reminder.is_active;

    return (
        <TouchableOpacity
            style={[styles.card, !isActive && styles.cardInactive]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.cardContent}>
                <View style={[styles.iconContainer, !isActive && styles.iconInactive]}>
                    <MaterialCommunityIcons
                        name={formIcon as any}
                        size={24}
                        color={isActive ? colors.primary[300] : colors.textSecondary}
                    />
                </View>

                <View style={styles.infoContainer}>
                    <Text style={[styles.medName, !isActive && styles.textInactive]}>
                        {reminder.medication_name}
                    </Text>
                    {reminder.dosage && (
                        <Text style={styles.dosage}>{reminder.dosage}</Text>
                    )}
                    <View style={styles.scheduleRow}>
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.scheduleText}>{scheduleLabel()}</Text>
                    </View>
                </View>

                <View style={styles.actionsContainer}>
                    {isActive ? (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={onPause}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="pause-circle-outline" size={22} color="#F59E0B" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={onResume}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="play-circle-outline" size={22} color="#10B981" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={onDelete}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>

            {!isActive && (
                <View style={styles.pausedBadge}>
                    <Text style={styles.pausedText}>PAUSED</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.glass.inputBg,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
    },
    cardInactive: {
        opacity: 0.4,
        borderColor: colors.glass.border,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    iconInactive: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    infoContainer: {
        flex: 1,
    },
    medName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    textInactive: {
        color: colors.textSecondary,
    },
    dosage: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    scheduleText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtn: {
        padding: 4,
    },
    pausedBadge: {
        alignSelf: 'flex-start',
        marginTop: 8,
        paddingHorizontal: 10,
        paddingVertical: 3,
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderRadius: 6,
    },
    pausedText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FCD34D',
        letterSpacing: 0.5,
    },
});
