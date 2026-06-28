import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MedicationReminder } from '../../features/reminders/types';
import { colors } from '../../theme';

interface ReminderCardProps {
    reminder: MedicationReminder;
    onPress?: () => void;   // tapping card or Edit button → show info modal
    onPause?: () => void;
    onResume?: () => void;
    onDelete?: () => void;
    onEdit?: () => void;    // Edit button → navigate to edit form
    onInfo?: () => void;    // kept for back-compat
}

const FORM_ICONS: Record<string, string> = {
    tablet:    'tablet',
    capsule:   'pill',
    liquid:    'water',
    injection: 'needle',
    inhaler:   'lungs',
    drops:     'eyedrop',
    cream:     'lotion-outline',
};

const FORM_COLORS: Record<string, string> = {
    tablet:    '#4FB3FF',
    capsule:   '#A78BFA',
    liquid:    '#60A5FA',
    injection: '#F87171',
    inhaler:   '#34D399',
    drops:     '#FBBF24',
    cream:     '#FB923C',
};

export const ReminderCard: React.FC<ReminderCardProps> = ({
    reminder, onPress, onPause, onResume, onDelete, onEdit,
}) => {
    const isActive   = reminder.is_active;
    const formIcon   = FORM_ICONS[reminder.form || ''] || 'pill';
    const formColor  = FORM_COLORS[reminder.form || ''] || colors.primary[400];

    const scheduleLabel = () => {
        if (reminder.schedule_type === 'fixed_times' && reminder.times?.length) {
            return reminder.times.join('  ·  ');
        }
        if (reminder.schedule_type === 'interval' && reminder.interval_hours) {
            return `Every ${reminder.interval_hours}h`;
        }
        return 'As needed';
    };

    return (
        <TouchableOpacity
            style={[styles.card, !isActive && styles.cardInactive]}
            onPress={onPress}
            activeOpacity={0.80}
        >
            {/* Left-edge color accent */}
            <LinearGradient
                colors={[formColor + '40', 'transparent']}
                style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.6, y: 1 }}
            />

            {/* ── Main content row ── */}
            <View style={styles.topRow}>
                {/* Form icon */}
                <View style={[styles.iconWrap, { backgroundColor: formColor + '22', borderColor: formColor + '50' }]}>
                    <MaterialCommunityIcons
                        name={formIcon as any}
                        size={24}
                        color={isActive ? formColor : 'rgba(255,255,255,0.40)'}
                    />
                </View>

                {/* Text block */}
                <View style={styles.textBlock}>
                    <View style={styles.nameRow}>
                        <Text style={styles.medName} numberOfLines={1}>
                            {reminder.medication_name}
                        </Text>
                        {!isActive && (
                            <View style={styles.pausedBadge}>
                                <Text style={styles.pausedText}>PAUSED</Text>
                            </View>
                        )}
                    </View>

                    {/* Dosage + form chips */}
                    <View style={styles.chipRow}>
                        {reminder.dosage ? (
                            <View style={[styles.chip, { backgroundColor: formColor + '20' }]}>
                                <Text style={[styles.chipText, { color: formColor }]}>{reminder.dosage}</Text>
                            </View>
                        ) : null}
                        {reminder.form ? (
                            <View style={[styles.chip, { backgroundColor: 'rgba(255,255,255,0.10)' }]}>
                                <Text style={styles.chipTextMuted}>{reminder.form}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Instructions */}
                    {reminder.instructions ? (
                        <Text style={styles.instructions} numberOfLines={2}>
                            {reminder.instructions}
                        </Text>
                    ) : null}

                    {/* Schedule */}
                    <View style={styles.scheduleRow}>
                        <Ionicons name="time-outline" size={13} color={colors.primary[400]} />
                        <Text style={styles.scheduleText}>{scheduleLabel()}</Text>
                    </View>
                </View>
            </View>

            {/* ── Divider ── */}
            <View style={styles.divider} />

            {/* ── Action buttons ── */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={onEdit}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="pencil-outline" size={15} color={formColor} />
                    <Text style={[styles.actionText, { color: formColor }]}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.pauseBtn]}
                    onPress={isActive ? onPause : onResume}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons
                        name={isActive ? 'pause-outline' : 'play-outline'}
                        size={15}
                        color="#FFD96E"
                    />
                    <Text style={[styles.actionText, { color: '#FFD96E' }]}>
                        {isActive ? 'Pause' : 'Resume'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={onDelete}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="trash-outline" size={15} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        backgroundColor: 'rgba(14,58,115,0.80)',
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.30,
        shadowRadius: 14,
        elevation: 5,
    },
    cardInactive: {
        opacity: 0.60,
    },

    // ── Top content row ──
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        gap: 14,
    },
    iconWrap: {
        width: 50,
        height: 50,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        flexShrink: 0,
    },
    textBlock: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    medName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        flex: 1,
    },
    pausedBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        backgroundColor: 'rgba(245,158,11,0.20)',
        borderRadius: 6,
    },
    pausedText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#FCD34D',
        letterSpacing: 0.5,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 6,
    },
    chip: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '700',
    },
    chipTextMuted: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.60)',
        textTransform: 'capitalize',
    },
    instructions: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.58)',
        marginBottom: 6,
        lineHeight: 17,
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    scheduleText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.65)',
        fontWeight: '500',
    },

    // ── Divider ──
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.10)',
        marginHorizontal: 16,
    },

    // ── Actions ──
    actions: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 10,
        flex: 1,
        justifyContent: 'center',
    },
    editBtn:   { backgroundColor: 'rgba(79,179,255,0.12)' },
    pauseBtn:  { backgroundColor: 'rgba(255,217,110,0.12)' },
    deleteBtn: { backgroundColor: 'rgba(255,107,138,0.12)' },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
