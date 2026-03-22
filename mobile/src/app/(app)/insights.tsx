/**
 * Insights Screen — Medication adherence analytics and risk detection
 */

import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MockBottomTabs } from '../../components/home';
import { InsightCard, AdherenceChart } from '../../components/reminders';
import {
    useMedicationInsights,
    useMedicationTrends,
    useRiskFlags,
} from '../../features/reminders/hooks';

type RangeOption = '7d' | '30d' | '90d';

export default function InsightsScreen() {
    const router = useRouter();
    const [range, setRange] = useState<RangeOption>('7d');

    const { data: summary, isLoading: summaryLoading, error: summaryError } = useMedicationInsights(range);
    const { data: trends, isLoading: trendsLoading, error: trendsError } = useMedicationTrends(range);
    const { data: riskData, error: riskError } = useRiskFlags();

    const isLoading = summaryLoading || trendsLoading;
    const isError = summaryError || trendsError || riskError;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.title}>Insights</Text>

                    {/* Range selector */}
                    <View style={styles.rangeRow}>
                        {(['7d', '30d', '90d'] as RangeOption[]).map((opt) => (
                            <TouchableOpacity
                                key={opt}
                                style={[styles.rangeChip, range === opt && styles.rangeChipActive]}
                                onPress={() => setRange(opt)}
                            >
                                <Text style={[styles.rangeText, range === opt && styles.rangeTextActive]}>
                                    {opt === '7d' ? '7 Days' : opt === '30d' ? '30 Days' : '90 Days'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {isLoading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color="#0EA5E9" />
                        </View>
                    ) : isError ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                            <Text style={styles.emptyTitle}>Error Loading Insights</Text>
                            <Text style={styles.emptyMessage}>{String((summaryError || trendsError || riskError)?.message || 'Failed to fetch insights')}</Text>
                        </View>
                    ) : summary ? (
                        <>
                            {/* KPI Cards */}
                            <View style={styles.cardsGrid}>
                                <InsightCard
                                    title="Adherence"
                                    value={`${Math.round(summary.adherence_rate * 100)}%`}
                                    icon="shield-checkmark"
                                    iconColor={summary.adherence_rate >= 0.8 ? '#10B981' : summary.adherence_rate >= 0.5 ? '#F59E0B' : '#EF4444'}
                                    iconBg={summary.adherence_rate >= 0.8 ? '#ECFDF5' : summary.adherence_rate >= 0.5 ? '#FEF3C7' : '#FEF2F2'}
                                />
                                <InsightCard
                                    title="Current Streak"
                                    value={`${summary.current_streak}d`}
                                    subtitle={`Best: ${summary.best_streak}d`}
                                    icon="flame"
                                    iconColor="#F59E0B"
                                    iconBg="#FEF3C7"
                                />
                                <InsightCard
                                    title="Doses Taken"
                                    value={summary.taken_count}
                                    subtitle={`of ${summary.total_doses} total`}
                                    icon="checkmark-done"
                                    iconColor="#10B981"
                                    iconBg="#ECFDF5"
                                />
                                <InsightCard
                                    title="Missed"
                                    value={summary.missed_count}
                                    subtitle={`${summary.skipped_count} skipped`}
                                    icon="alert-circle"
                                    iconColor="#EF4444"
                                    iconBg="#FEF2F2"
                                />
                            </View>

                            {/* Adherence Trend Chart */}
                            {trends && trends.data.length > 0 && (
                                <View style={styles.chartSection}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Adherence Trend</Text>
                                        <Text style={styles.sectionSubtitle}>
                                            Avg: {Math.round(trends.average_adherence * 100)}%
                                        </Text>
                                    </View>
                                    <View style={styles.chartCard}>
                                        <AdherenceChart data={trends.data} height={150} />
                                    </View>
                                </View>
                            )}

                            {/* Risk Flags */}
                            {riskData && riskData.flags.length > 0 && (
                                <View style={styles.riskSection}>
                                    <Text style={styles.sectionTitle}>Alerts</Text>
                                    {riskData.flags.map((flag, idx) => (
                                        <View
                                            key={idx}
                                            style={[
                                                styles.riskCard,
                                                flag.severity === 'critical' ? styles.riskCritical : styles.riskWarning,
                                            ]}
                                        >
                                            <Ionicons
                                                name={flag.severity === 'critical' ? 'warning' : 'information-circle'}
                                                size={20}
                                                color={flag.severity === 'critical' ? '#EF4444' : '#F59E0B'}
                                            />
                                            <Text style={styles.riskText}>{flag.message}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Quick Actions */}
                            <View style={styles.quickActions}>
                                <TouchableOpacity
                                    style={styles.quickAction}
                                    onPress={() => router.push('/(app)/today-schedule')}
                                >
                                    <Ionicons name="today-outline" size={20} color="#0EA5E9" />
                                    <Text style={styles.quickActionText}>Today&apos;s Schedule</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.quickAction}
                                    onPress={() => router.push('/(app)/reminders')}
                                >
                                    <Ionicons name="notifications-outline" size={20} color="#0EA5E9" />
                                    <Text style={styles.quickActionText}>Manage Reminders</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <View style={styles.emptyCard}>
                            <View style={styles.emptyIconWrap}>
                                <Ionicons name="bar-chart-outline" size={48} color="#0EA5E9" />
                            </View>
                            <Text style={styles.emptyTitle}>No Data Yet</Text>
                            <Text style={styles.emptyMessage}>
                                Create reminders and track your doses to see insights and analytics.
                            </Text>
                            <TouchableOpacity
                                style={styles.createBtn}
                                onPress={() => router.push('/(app)/reminder-form')}
                            >
                                <Text style={styles.createBtnText}>Create Your First Reminder</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>

                <MockBottomTabs
                    activeTab="insights"
                    onHomePress={() => router.push('/(app)/home')}
                    onRecordsPress={() => router.push('/(app)/history')}
                    onInsightsPress={() => { }}
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
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
    },
    rangeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    rangeChip: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    rangeChipActive: {
        backgroundColor: '#0EA5E9',
        borderColor: '#0EA5E9',
    },
    rangeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    rangeTextActive: {
        color: '#FFFFFF',
    },
    center: {
        paddingTop: 60,
        alignItems: 'center',
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    chartSection: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    sectionSubtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    chartCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    riskSection: {
        marginBottom: 24,
    },
    riskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 12,
        marginTop: 8,
    },
    riskWarning: {
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    riskCritical: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    riskText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    quickActions: {
        marginBottom: 16,
    },
    quickAction: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        gap: 12,
    },
    quickActionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
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
