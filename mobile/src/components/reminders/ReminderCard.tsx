import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MedicationReminder } from '../../features/reminders/types';
import { colors } from '../../theme';

interface ReminderCardProps {
    reminder: MedicationReminder;
    onPress?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onDelete?: () => void;
    onInfo?: () => void;
}

const FORM_ICONS: Record<string, string> = {
    tablet: 'tablet', capsule: 'pill', liquid: 'water',
    injection: 'needle', inhaler: 'lungs', drops: 'eyedrop',
    cream: 'lotion-outline',
};

const FORM_COLORS: Record<string, string> = {
    tablet: '#3EDBF0', capsule: '#A78BFA', liquid: '#60A5FA',
    injection: '#F87171', inhaler: '#34D399', drops: '#FBBF24',
    cream: '#FB923C',
};

export const ReminderCard: React.FC<ReminderCardProps> = ({
    reminder, onPress, onPause, onResume, onDelete, onInfo,
}) => {
    const translateX = useSharedValue(0);
    const isActive = reminder.is_active;
    const formIcon = FORM_ICONS[reminder.form || ''] || 'pill';
    const formColor = FORM_COLORS[reminder.form || ''] || colors.primary[300];

    const callDelete = () => onDelete?.();
    const callPauseResume = () => isActive ? onPause?.() : onResume?.();

    const pan = Platform.OS !== 'web'
        ? Gesture.Pan()
            .activeOffsetX([-8, 8])
            .onUpdate((e) => {
                if (e.translationX < 0) {
                    translateX.value = Math.max(e.translationX, -110);
                } else {
                    translateX.value = Math.min(e.translationX, 10);
                }
            })
            .onEnd(() => {
                if (translateX.value < -55) {
                    translateX.value = withSpring(-100, { damping: 18, stiffness: 200 });
                } else {
                    translateX.value = withSpring(0, { damping: 18, stiffness: 200 });
                }
            })
        : Gesture.Pan();

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const scheduleLabel = () => {
        if (reminder.schedule_type === 'fixed_times' && reminder.times) {
            return reminder.times.join(', ');
        }
        if (reminder.schedule_type === 'interval' && reminder.interval_hours) {
            return `Every ${reminder.interval_hours}h`;
        }
        return 'As needed';
    };

    return (
        <View style={styles.container}>
            {/* Swipe-revealed actions behind card */}
            <View style={styles.backActions}>
                <TouchableOpacity
                    style={[styles.backBtn, styles.pauseBtn]}
                    onPress={callPauseResume}
                >
                    <Ionicons
                        name={isActive ? 'pause' : 'play'}
                        size={20}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.backBtn, styles.deleteBtn]}
                    onPress={callDelete}
                >
                    <Ionicons name="trash" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <GestureDetector gesture={pan}>
                <Animated.View style={[styles.card, !isActive && styles.cardInactive, cardStyle]}>
                    <LinearGradient
                        colors={[formColor + '10', 'transparent']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />

                    <TouchableOpacity
                        style={styles.cardContent}
                        onPress={onPress}
                        activeOpacity={0.8}
                    >
                        {/* Icon */}
                        <View style={[styles.iconWrap, { backgroundColor: formColor + '18', borderColor: formColor + '35' }]}>
                            <MaterialCommunityIcons
                                name={formIcon as any}
                                size={22}
                                color={isActive ? formColor : colors.textSecondary}
                            />
                        </View>

                        {/* Info */}
                        <View style={styles.info}>
                            <View style={styles.nameRow}>
                                <Text style={[styles.medName, !isActive && styles.dimText]} numberOfLines={1}>
                                    {reminder.medication_name}
                                </Text>
                                {!isActive && (
                                    <View style={styles.pausedBadge}>
                                        <Text style={styles.pausedText}>PAUSED</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.metaRow}>
                                {reminder.dosage && (
                                    <View style={[styles.metaChip, { backgroundColor: formColor + '15' }]}>
                                        <Text style={[styles.metaChipText, { color: formColor }]}>{reminder.dosage}</Text>
                                    </View>
                                )}
                                {reminder.form && (
                                    <View style={[styles.metaChip, { backgroundColor: 'rgba(11,29,46,0.06)' }]}>
                                        <Text style={styles.metaChipTextGray}>{reminder.form}</Text>
                                    </View>
                                )}
                            </View>

                            {reminder.instructions ? (
                                <Text style={styles.instructions} numberOfLines={2}>{reminder.instructions}</Text>
                            ) : null}

                            <View style={styles.scheduleRow}>
                                <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                                <Text style={styles.scheduleText}>{scheduleLabel()}</Text>
                            </View>
                        </View>

                        {/* Info button */}
                        <TouchableOpacity
                            style={styles.infoBtn}
                            onPress={onInfo}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="information-circle-outline" size={22} color={formColor} />
                        </TouchableOpacity>
                    </TouchableOpacity>

                    {/* Web-only action buttons (swipe not available on web) */}
                    {Platform.OS === 'web' && (
                        <View style={styles.webActions}>
                            <TouchableOpacity style={[styles.webBtn, { backgroundColor: formColor + '18' }]} onPress={onPress}>
                                <Ionicons name="pencil-outline" size={15} color={formColor} />
                                <Text style={[styles.webBtnText, { color: formColor }]}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.webBtn, { backgroundColor: 'rgba(245,158,11,0.12)' }]} onPress={callPauseResume}>
                                <Ionicons name={isActive ? 'pause-outline' : 'play-outline'} size={15} color="#F59E0B" />
                                <Text style={[styles.webBtnText, { color: '#F59E0B' }]}>{isActive ? 'Pause' : 'Resume'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.webBtn, { backgroundColor: 'rgba(239,68,68,0.12)' }]} onPress={callDelete}>
                                <Ionicons name="trash-outline" size={15} color="#EF4444" />
                                <Text style={[styles.webBtnText, { color: '#EF4444' }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 12, position: 'relative' },
    backActions: {
        position: 'absolute',
        right: 0, top: 0, bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingRight: 4,
    },
    backBtn: {
        width: 46, height: 46, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
    },
    pauseBtn: { backgroundColor: '#F59E0B' },
    deleteBtn: { backgroundColor: '#EF4444' },

    card: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        zIndex: 1,
        elevation: 2,
    },
    cardInactive: { opacity: 0.55 },

    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    iconWrap: {
        width: 46, height: 46, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1,
    },
    info: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    medName: { fontSize: 15, fontWeight: '700', color: '#0B1D2E', flex: 1 },
    dimText: { color: colors.textSecondary },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
    metaChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    metaChipText: { fontSize: 11, fontWeight: '700' },
    metaChipTextGray: { fontSize: 11, fontWeight: '600', color: 'rgba(11,29,46,0.50)', textTransform: 'capitalize' },
    instructions: { fontSize: 12, color: 'rgba(11,29,46,0.55)', marginBottom: 4, lineHeight: 16 },
    scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    scheduleText: { fontSize: 12, color: colors.textSecondary },
    pausedBadge: {
        paddingHorizontal: 8, paddingVertical: 2,
        backgroundColor: 'rgba(245,158,11,0.2)',
        borderRadius: 6,
    },
    pausedText: { fontSize: 9, fontWeight: '800', color: '#FCD34D', letterSpacing: 0.5 },
    infoBtn: { padding: 4 },
    webActions: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 14,
        paddingBottom: 12,
        paddingTop: 4,
    },
    webBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    webBtnText: { fontSize: 12, fontWeight: '600' },
});
