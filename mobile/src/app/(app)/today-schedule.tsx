/**
 * Today Schedule Screen — Timeline view of today's medication doses
 */

import React from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    Platform, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MockBottomTabs } from '../../components/home';
import { DoseTimelineItem } from '../../components/reminders';
import {
    useTodayDoses,
    useMarkDoseTaken,
    useSkipDose,
    useSnoozeDose,
} from '../../features/reminders/hooks';

export default function TodayScheduleScreen() {
    const router = useRouter();
    const { data, isLoading, error } = useTodayDoses();
    const markTaken = useMarkDoseTaken();
    const skipDose = useSkipDose();
    const snoozeDose = useSnoozeDose();

    const today = new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    const pendingCount = data?.doses.filter(d => d.status === 'pending' || d.status === 'snoozed').length || 0;
    const takenCount = data?.doses.filter(d => d.status === 'taken').length || 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <Text style={styles.title}>Today&apos;s Schedule</Text>
                    <Text style={styles.date}>{today}</Text>

                    {/* Stats summary */}
                    {data && data.doses.length > 0 && (
                        <View style={styles.statsRow}>
                            <View style={[styles.statBadge, { backgroundColor: '#ECFDF5' }]}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={[styles.statText, { color: '#10B981' }]}>
                                    {takenCount} taken
                                </Text>
                            </View>
                            <View style={[styles.statBadge, { backgroundColor: '#FEF3C7' }]}>
                                <Ionicons name="time-outline" size={16} color="#F59E0B" />
                                <Text style={[styles.statText, { color: '#F59E0B' }]}>
                                    {pendingCount} remaining
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Content */}
                    {isLoading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color="#0EA5E9" />
                        </View>
                    ) : error ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                            <Text style={styles.emptyTitle}>Error Loading Schedule</Text>
                        </View>
                    ) : data && data.doses.length > 0 ? (
                        <View style={styles.timeline}>
                            {data.doses.map((dose) => (
                                <DoseTimelineItem
                                    key={dose.id}
                                    dose={dose}
                                    onMarkTaken={() => markTaken.mutate({ eventId: dose.id })}
                                    onSkip={() => skipDose.mutate({ eventId: dose.id })}
                                    onSnooze={(mins) =>
                                        snoozeDose.mutate({
                                            eventId: dose.id,
                                            data: { snooze_minutes: mins },
                                        })
                                    }
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyCard}>
                            <View style={styles.emptyIconWrap}>
                                <Ionicons name="calendar-outline" size={48} color="#0EA5E9" />
                            </View>
                            <Text style={styles.emptyTitle}>No Doses Today</Text>
                            <Text style={styles.emptyMessage}>
                                You don&apos;t have any scheduled doses for today. Create a reminder to get started.
                            </Text>
                            <TouchableOpacity
                                style={styles.createBtn}
                                onPress={() => router.push('/(app)/reminder-form')}
                            >
                                <Text style={styles.createBtnText}>Create Reminder</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>

                <MockBottomTabs
                    activeTab="home"
                    onHomePress={() => router.push('/(app)/home')}
                    onRecordsPress={() => router.push('/(app)/history')}
                    onInsightsPress={() => router.push('/(app)/insights')}
                    onSettingsPress={() => router.push('/(app)/settings')}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F6F8',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 30,
        paddingBottom: 110,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
    },
    date: {
        fontSize: 15,
        color: '#6B7280',
        marginTop: 4,
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    statText: {
        fontSize: 13,
        fontWeight: '700',
    },
    center: {
        paddingTop: 60,
        alignItems: 'center',
    },
    timeline: {
        marginTop: 4,
    },
    emptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginTop: 20,
    },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E0F2FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    createBtn: {
        backgroundColor: '#0EA5E9',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    createBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
