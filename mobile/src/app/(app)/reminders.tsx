import { useState, useMemo, useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MockBottomTabs } from '../../components/home';
import { ReminderCard } from '../../components/reminders';
import { GlassBackground, MedicationInfoModal } from '../../components/ui';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';
import { colors } from '../../theme';

import { MedicationReminder } from '../../features/reminders/types';

import {
    useMedicationReminders,
    usePauseReminder,
    useResumeReminder,
    useDeleteReminder,
} from '../../features/reminders/hooks';
import { useLanguage } from '../../contexts/language-context';
import { scheduleAllReminders } from '../../services/reminderAlarmService';

/* ── Time-of-day grouping ── */

interface TimeGroup {
    key: string;
    label: string;
    emoji: string;
    color: string;
    timeRange: string;
    reminders: MedicationReminder[];
}

const getTimeSlot = (reminder: MedicationReminder): string => {
    if (reminder.schedule_type === 'interval' || !reminder.times?.length) return 'as_needed';
    const [h] = reminder.times[0].split(':').map(Number);
    if (h >= 5 && h < 12) return 'morning';
    if (h >= 12 && h < 17) return 'afternoon';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
};

const TIME_GROUP_META: Record<string, { label: string; emoji: string; color: string; timeRange: string }> = {
    morning:   { label: 'Morning',   emoji: '🌅', color: '#F59E0B', timeRange: '5 AM – 12 PM' },
    afternoon: { label: 'Afternoon', emoji: '☀️',  color: '#3B82F6', timeRange: '12 PM – 5 PM' },
    evening:   { label: 'Evening',   emoji: '🌆', color: '#A78BFA', timeRange: '5 PM – 9 PM'  },
    night:     { label: 'Night',     emoji: '🌙', color: '#6366F1', timeRange: '9 PM – 5 AM'  },
    as_needed: { label: 'As Needed', emoji: '⏰', color: '#10B981', timeRange: 'When required' },
};

const groupByTimeOfDay = (reminders: MedicationReminder[]): TimeGroup[] => {
    const ORDER = ['morning', 'afternoon', 'evening', 'night', 'as_needed'];
    const map: Record<string, MedicationReminder[]> = {};
    for (const r of reminders) {
        const slot = getTimeSlot(r);
        if (!map[slot]) map[slot] = [];
        map[slot].push(r);
    }
    return ORDER
        .filter((k) => map[k]?.length)
        .map((k) => ({ key: k, ...TIME_GROUP_META[k], reminders: map[k] }));
};

export default function RemindersScreen() {
    const router = useRouter();
    const { t, isRTL } = useLanguage();
    const [showInactive, setShowInactive] = useState(false);
    const pageOpacity = useSharedValue(0);
    const pageTranslate = useSharedValue(20);
    const pageStyle = useAnimatedStyle(() => ({
        opacity: pageOpacity.value,
        transform: [{ translateY: pageTranslate.value }],
    }));
    useEffect(() => {
        pageOpacity.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.ease) });
        pageTranslate.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.ease) });
    }, []);
    const [selectedReminder, setSelectedReminder] = useState<MedicationReminder | null>(null);

    const { data, isLoading, error } = useMedicationReminders(!showInactive);

    // Reschedule all alarm notifications whenever the reminder list changes
    useEffect(() => {
        if (data?.reminders?.length) {
            scheduleAllReminders(data.reminders).catch(console.warn);
        }
    }, [data?.reminders]);

    const pauseMutation = usePauseReminder();
    const resumeMutation = useResumeReminder();
    const deleteMutation = useDeleteReminder();

    const groupedReminders = useMemo(
        () => groupByTimeOfDay(data?.reminders || []),
        [data]
    );

    const handleDelete = (id: string, name: string) => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`Delete the reminder for "${name}"?`);
            if (confirmed) deleteMutation.mutate(id);
            return;
        }
        Alert.alert(
            'Delete Reminder',
            `Delete the reminder for "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
            ]
        );
    };

    const medInfoFromReminder = selectedReminder ? {
        name: selectedReminder.medication_name,
        dosage: selectedReminder.dosage || undefined,
        form: selectedReminder.form || undefined,
        notes: selectedReminder.instructions || undefined,
        frequency: selectedReminder.times
            ? selectedReminder.times.join(', ')
            : selectedReminder.interval_hours
                ? `Every ${selectedReminder.interval_hours}h`
                : 'As needed',
        duration: selectedReminder.end_date
            ? `Until ${new Date(selectedReminder.end_date).toLocaleDateString()}`
            : undefined,
    } : null;

    return (
        <GlassBackground>
            <SafeAreaView style={styles.safeArea}>
                <Animated.View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }, pageStyle]}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View style={styles.headerRow}>
                            <Text style={styles.title}>{t('myReminders')}</Text>
                            <TouchableOpacity
                                style={styles.addBtn}
                                onPress={() => router.push('/(app)/reminder-form')}
                            >
                                <Ionicons name="add" size={22} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Filter toggle */}
                        <View style={styles.filterRow}>
                            <TouchableOpacity
                                style={[styles.filterChip, !showInactive && styles.filterChipActive]}
                                onPress={() => setShowInactive(false)}
                            >
                                <Text style={[styles.filterText, !showInactive && styles.filterTextActive]}>{t('active')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterChip, showInactive && styles.filterChipActive]}
                                onPress={() => setShowInactive(true)}
                            >
                                <Text style={[styles.filterText, showInactive && styles.filterTextActive]}>{t('all')}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        {isLoading ? (
                            <View>
                                <SkeletonCard />
                                <SkeletonCard />
                                <SkeletonCard />
                            </View>
                        ) : error ? (
                            <View style={styles.emptyCard}>
                                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                                <Text style={styles.emptyTitle}>{t('errorLoadingReminders')}</Text>
                                <Text style={styles.emptyMessage}>{t('tryAgainLater')}</Text>
                            </View>
                        ) : groupedReminders.length > 0 ? (
                            groupedReminders.map((group) => (
                                <View key={group.key} style={styles.timeGroup}>
                                    {/* Group header */}
                                    <View style={[styles.groupHeader, { borderColor: group.color + '35', backgroundColor: group.color + '12' }]}>
                                        <LinearGradient
                                            colors={[group.color + '22', 'transparent']}
                                            style={StyleSheet.absoluteFill}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        />
                                        <Text style={styles.groupEmoji}>{group.emoji}</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.groupLabel, { color: group.color }]}>{group.label}</Text>
                                            <Text style={[styles.groupTimeRange, { color: group.color + 'BB' }]}>{group.timeRange}</Text>
                                        </View>
                                        <View style={[styles.groupCount, { backgroundColor: group.color + '25' }]}>
                                            <Text style={[styles.groupCountText, { color: group.color }]}>
                                                {group.reminders.length} {group.reminders.length === 1 ? 'med' : 'meds'}
                                            </Text>
                                        </View>
                                    </View>
                                    {group.reminders.map((reminder) => (
                                        <ReminderCard
                                            key={reminder.id}
                                            reminder={reminder}
                                            onPress={() => setSelectedReminder(reminder)}
                                            onEdit={() => router.push({ pathname: '/(app)/reminder-form', params: { id: reminder.id } })}
                                            onPause={() => pauseMutation.mutate(reminder.id)}
                                            onResume={() => resumeMutation.mutate(reminder.id)}
                                            onDelete={() => handleDelete(reminder.id, reminder.medication_name)}
                                        />
                                    ))}
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyCard}>
                                <View style={styles.emptyIconWrap}>
                                    <Ionicons name="notifications-outline" size={48} color={colors.primary[300]} />
                                </View>
                                <Text style={styles.emptyTitle}>{t('noRemindersYet')}</Text>
                                <Text style={styles.emptyMessage}>{t('noRemindersMsg')}</Text>
                                <TouchableOpacity
                                    style={styles.createBtn}
                                    onPress={() => router.push('/(app)/reminder-form')}
                                >
                                    <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                                    <Text style={styles.createBtnText}>{t('createReminder')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>

                    <MockBottomTabs
                        activeTab="reminders"
                        onHomePress={() => router.push('/(app)/home')}
                        onRecordsPress={() => router.push('/(app)/history')}
                        onChatPress={() => router.push('/(app)/chat')}
                        onInsightsPress={() => router.push('/(app)/insights')}
                        onSettingsPress={() => router.push('/(app)/settings')}
                    />
                </Animated.View>

                <MedicationInfoModal
                    visible={!!selectedReminder}
                    medication={medInfoFromReminder}
                    onClose={() => setSelectedReminder(null)}
                />
            </SafeAreaView>
        </GlassBackground>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'transparent' },
    container: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 30,
        paddingBottom: 110,
    },
    headerRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 4,
    },
    title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
    addBtn: {
        width: 42, height: 42, borderRadius: 14,
        backgroundColor: colors.primary[500],
        justifyContent: 'center', alignItems: 'center',
        shadowColor: colors.primary[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    hintRow: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        marginBottom: 12,
    },
    hintText: { fontSize: 11, color: colors.textSecondary },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    filterChip: {
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: colors.glass.inputBg,
        borderWidth: 1, borderColor: colors.glass.borderHighlight,
    },
    filterChipActive: { backgroundColor: colors.primary[500], borderColor: colors.primary[500] },
    filterText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    filterTextActive: { color: '#FFFFFF' },
    center: { paddingTop: 60, alignItems: 'center' },
    emptyCard: {
        backgroundColor: colors.glass.background,
        borderRadius: 20, padding: 32, alignItems: 'center',
        borderWidth: 1, borderColor: colors.glass.borderHighlight, marginTop: 20,
    },
    emptyIconWrap: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
    emptyMessage: {
        fontSize: 14, color: colors.textSecondary,
        textAlign: 'center', lineHeight: 22, marginBottom: 20,
    },
    createBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: colors.primary[500],
        paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
    },
    createBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    timeGroup: { marginBottom: 16 },
    groupHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 14, paddingVertical: 12,
        borderRadius: 16, borderWidth: 1,
        marginBottom: 10, marginTop: 4,
        overflow: 'hidden',
    },
    groupEmoji: { fontSize: 24 },
    groupLabel: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
    groupTimeRange: { fontSize: 11, fontWeight: '600', marginTop: 1 },
    groupCount: {
        paddingHorizontal: 10, height: 26, borderRadius: 13,
        alignItems: 'center', justifyContent: 'center',
    },
    groupCountText: { fontSize: 11, fontWeight: '800' },
});
