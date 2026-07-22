import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { MockBottomTabs } from '../../components/home';
import { InsightCard, AdherenceChart } from '../../components/reminders';
import { GlassBackground } from '../../components/ui';
import { colors } from '../../theme';
import { useActiveProfile } from '../../contexts/profile-context';
import {
    useMedicationInsights,
    useMedicationTrends,
    useRiskFlags,
} from '../../features/reminders/hooks';
import { InsightsSummary } from '../../features/reminders/types';
import { useLanguage } from '../../contexts/language-context';

type RangeOption = '7d' | '30d' | '90d';

const RANGE_LABELS: Record<RangeOption, string> = {
    '7d': '7 Days', '30d': '30 Days', '90d': '90 Days',
};

// ── Circular adherence ring using two-half-circle CSS trick ──
const AdherenceRing: React.FC<{ pct: number; color: string; size?: number }> = ({ pct, color, size = 140 }) => {
    const sw = 11;
    const half = size / 2;
    const deg = (pct / 100) * 360;
    const rightRot = Math.min(deg, 180) - 180;   // -180 → 0
    const leftRot  = Math.max(deg - 180, 0) - 180; // -180 → 0 (only after 50%)

    return (
        <View style={{ width: size, height: size }}>
            {/* Track */}
            <View style={[
                StyleSheet.absoluteFill,
                { borderRadius: half, borderWidth: sw, borderColor: 'rgba(255,255,255,0.12)' },
            ]} />

            {/* Right-half progress */}
            <View style={{ position: 'absolute', right: 0, top: 0, width: half, height: size, overflow: 'hidden' }}>
                <View style={{
                    position: 'absolute', left: -half, top: 0,
                    width: size, height: size,
                    borderRadius: half, borderWidth: sw, borderColor: color,
                    transform: [{ rotate: `${rightRot}deg` }],
                }} />
            </View>

            {/* Left-half progress (only once past 50%) */}
            {deg > 180 && (
                <View style={{ position: 'absolute', left: 0, top: 0, width: half, height: size, overflow: 'hidden' }}>
                    <View style={{
                        position: 'absolute', left: 0, top: 0,
                        width: size, height: size,
                        borderRadius: half, borderWidth: sw, borderColor: color,
                        transform: [{ rotate: `${leftRot}deg` }],
                    }} />
                </View>
            )}

            {/* Center text */}
            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 30, fontWeight: '900', color }}>{pct}%</Text>
                <Text style={{ fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.50)', letterSpacing: 1.2 }}>
                    ADHERENCE
                </Text>
            </View>
        </View>
    );
};

// ── PDF export helper ──
const buildReportHtml = (summary: InsightsSummary, range: RangeOption) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: Arial, sans-serif; background: #F9FAFB; color: #111; margin: 0; padding: 32px; }
  h1 { color: #1FA3C6; margin-bottom: 4px; }
  .sub { color: #6B7280; font-size: 13px; margin-bottom: 32px; }
  .grid { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 32px; }
  .card { background: #fff; border-radius: 12px; padding: 20px; flex: 1; min-width: 140px;
           box-shadow: 0 1px 4px rgba(0,0,0,0.08); border: 1px solid #E5E7EB; }
  .card-label { font-size: 11px; color: #9CA3AF; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; }
  .card-value { font-size: 28px; font-weight: 900; margin: 6px 0 0; }
  .green { color: #10B981; }  .amber { color: #F59E0B; }  .red { color: #EF4444; }  .blue { color: #1FA3C6; }
  footer { font-size: 11px; color: #9CA3AF; margin-top: 40px; border-top: 1px solid #E5E7EB; padding-top: 16px; }
</style>
</head>
<body>
  <h1>Prescripto — Adherence Report</h1>
  <p class="sub">Period: Last ${RANGE_LABELS[range]} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString()}</p>
  <div class="grid">
    <div class="card">
      <div class="card-label">Adherence Rate</div>
      <div class="card-value ${summary.adherence_rate >= 0.8 ? 'green' : summary.adherence_rate >= 0.5 ? 'amber' : 'red'}">
        ${Math.round(summary.adherence_rate * 100)}%
      </div>
    </div>
    <div class="card">
      <div class="card-label">Current Streak</div>
      <div class="card-value amber">${summary.current_streak} days</div>
    </div>
    <div class="card">
      <div class="card-label">Best Streak</div>
      <div class="card-value blue">${summary.best_streak} days</div>
    </div>
    <div class="card">
      <div class="card-label">Doses Taken</div>
      <div class="card-value green">${summary.taken_count}</div>
    </div>
    <div class="card">
      <div class="card-label">Missed</div>
      <div class="card-value red">${summary.missed_count}</div>
    </div>
    <div class="card">
      <div class="card-label">Skipped</div>
      <div class="card-value amber">${summary.skipped_count}</div>
    </div>
  </div>
  <footer>Generated by Prescripto &nbsp;·&nbsp; Keep track of your medications</footer>
</body>
</html>
`;

const exportPDF = async (summary: InsightsSummary, range: RangeOption) => {
    try {
        const html = buildReportHtml(summary, range);
        const { uri } = await Print.printToFileAsync({ html });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
            await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Save Adherence Report' });
        } else {
            Alert.alert('Saved', `PDF saved to:\n${uri}`);
        }
    } catch {
        Alert.alert('Error', 'Could not generate the PDF. Please try again.');
    }
};

const getMotivation = (pct: number): { message: string; emoji: string; color: string } => {
    if (pct >= 90) return { message: 'Outstanding! You\'re crushing your goals.', emoji: '🏆', color: '#10B981' };
    if (pct >= 75) return { message: 'Great job! Stay consistent.', emoji: '🌟', color: '#10B981' };
    if (pct >= 50) return { message: 'Good effort — a little more consistency helps.', emoji: '💪', color: '#F59E0B' };
    return { message: 'Let\'s get back on track. Every dose counts.', emoji: '💊', color: '#EF4444' };
};

export default function InsightsScreen() {
    const router = useRouter();
    const { activeProfile } = useActiveProfile();
    const { isRTL } = useLanguage();

    const [range, setRange] = useState<RangeOption>('7d');
    const [exporting, setExporting] = useState(false);

    const { data: summary, isLoading: summaryLoading, error: summaryError } = useMedicationInsights(range, activeProfile?.id);
    const { data: trends, isLoading: trendsLoading, error: trendsError } = useMedicationTrends(range, activeProfile?.id);
    const { data: riskData, error: riskError } = useRiskFlags(activeProfile?.id);

    const isLoading = summaryLoading || trendsLoading;
    const isError   = summaryError || trendsError || riskError;

    const adherencePct = summary ? Math.round(summary.adherence_rate * 100) : 0;
    const adherenceColor =
        adherencePct >= 80 ? '#10B981' :
        adherencePct >= 50 ? '#F59E0B' : '#EF4444';

    const handleExport = async () => {
        if (!summary) return;
        setExporting(true);
        await exportPDF(summary, range);
        setExporting(false);
    };

    const motivation = summary ? getMotivation(adherencePct) : null;

    return (
        <GlassBackground>
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* Header row */}
                        <View style={styles.headerRow}>
                            <Text style={styles.title}>Insights</Text>
                            {summary && (
                                <TouchableOpacity
                                    style={[styles.exportBtn, exporting && { opacity: 0.6 }]}
                                    onPress={handleExport}
                                    disabled={exporting}
                                >
                                    <LinearGradient
                                        colors={[colors.primary[500] + 'CC', colors.primary[400]]}
                                        style={StyleSheet.absoluteFill}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    />
                                    <Ionicons name="document-outline" size={16} color="#FFF" />
                                    <Text style={styles.exportText}>{exporting ? 'Exporting…' : 'PDF'}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Range selector */}
                        <View style={styles.rangeRow}>
                            {(Object.keys(RANGE_LABELS) as RangeOption[]).map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    style={[styles.rangeChip, range === opt && styles.rangeChipActive]}
                                    onPress={() => setRange(opt)}
                                >
                                    <Text style={[styles.rangeText, range === opt && styles.rangeTextActive]}>
                                        {RANGE_LABELS[opt]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {isLoading ? (
                            <View style={styles.center}>
                                <ActivityIndicator size="large" color={colors.primary[300]} />
                            </View>
                        ) : isError ? (
                            <View style={styles.emptyCard}>
                                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                                <Text style={styles.emptyTitle}>Error Loading Insights</Text>
                                <Text style={styles.emptyMessage}>
                                    {String((summaryError || trendsError || riskError)?.message || 'Failed to fetch data')}
                                </Text>
                            </View>
                        ) : summary ? (
                            <>
                                {/* Adherence ring hero */}
                                <View style={styles.heroCard}>
                                    <LinearGradient
                                        colors={[adherenceColor + '18', 'transparent']}
                                        style={StyleSheet.absoluteFill}
                                        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                                    />
                                    <AdherenceRing pct={adherencePct} color={adherenceColor} size={148} />
                                    <View style={styles.heroStats}>
                                        <HeroStat label="Streak" value={`${summary.current_streak}d`} color="#F59E0B" icon="flame" />
                                        <HeroStat label="Best" value={`${summary.best_streak}d`} color={colors.primary[300]} icon="trophy" />
                                        <HeroStat label="Taken" value={`${summary.taken_count}`} color="#10B981" icon="checkmark-circle" />
                                        <HeroStat label="Missed" value={`${summary.missed_count}`} color="#EF4444" icon="close-circle" />
                                    </View>
                                </View>

                                {/* Motivational banner */}
                                {motivation && (
                                    <View style={[styles.motivationCard, { borderColor: motivation.color + '30' }]}>
                                        <LinearGradient colors={[motivation.color + '18', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                                        <Text style={styles.motivationEmoji}>{motivation.emoji}</Text>
                                        <Text style={[styles.motivationText, { color: motivation.color }]}>{motivation.message}</Text>
                                    </View>
                                )}

                                {/* KPI Cards */}
                                <View style={styles.cardsGrid}>
                                    <InsightCard
                                        title="Adherence"
                                        value={`${adherencePct}%`}
                                        icon="shield-checkmark"
                                        iconColor={adherenceColor}
                                        iconBg={adherenceColor + '25'}
                                    />
                                    <InsightCard
                                        title="Current Streak"
                                        value={`${summary.current_streak}d`}
                                        subtitle={`Best: ${summary.best_streak}d`}
                                        icon="flame"
                                        iconColor="#F59E0B"
                                        iconBg="rgba(245,158,11,0.15)"
                                    />
                                    <InsightCard
                                        title="Doses Taken"
                                        value={summary.taken_count}
                                        subtitle={`of ${summary.total_doses} total`}
                                        icon="checkmark-done"
                                        iconColor="#10B981"
                                        iconBg="rgba(16,185,129,0.15)"
                                    />
                                    <InsightCard
                                        title="Missed"
                                        value={summary.missed_count}
                                        subtitle={`${summary.skipped_count} skipped`}
                                        icon="alert-circle"
                                        iconColor={colors.error}
                                        iconBg="rgba(239,68,68,0.15)"
                                    />
                                </View>

                                {/* Adherence Trend Chart */}
                                {trends && trends.data.length > 0 && (
                                    <View style={styles.chartSection}>
                                        <View style={styles.sectionHeader}>
                                            <Text style={styles.sectionTitle}>Adherence Trend</Text>
                                            <Text style={styles.sectionSubtitle}>
                                                Avg {Math.round(trends.average_adherence * 100)}%
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
                                                style={[styles.riskCard, flag.severity === 'critical' ? styles.riskCritical : styles.riskWarning]}
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
                                    <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(app)/today-schedule')}>
                                        <Ionicons name="today-outline" size={20} color={colors.primary[300]} />
                                        <Text style={styles.quickActionText}>Today's Schedule</Text>
                                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(app)/reminders')}>
                                        <Ionicons name="notifications-outline" size={20} color={colors.primary[300]} />
                                        <Text style={styles.quickActionText}>Manage Reminders</Text>
                                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <View style={styles.emptyCard}>
                                <View style={styles.emptyIconWrap}>
                                    <Ionicons name="bar-chart-outline" size={48} color={colors.primary[300]} />
                                </View>
                                <Text style={styles.emptyTitle}>No Data Yet</Text>
                                <Text style={styles.emptyMessage}>
                                    Create reminders and track your doses to see insights and analytics.
                                </Text>
                                <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(app)/reminder-form')}>
                                    <Text style={styles.createBtnText}>Create Your First Reminder</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>

                    <MockBottomTabs
                        activeTab="insights"
                        onHomePress={() => router.push('/(app)/home')}
                        onRecordsPress={() => router.push('/(app)/history')}
                        onInsightsPress={() => {}}
                        onSettingsPress={() => router.push('/(app)/settings')}
                    />
                </View>
            </SafeAreaView>
        </GlassBackground>
    );
}

const HeroStat: React.FC<{ label: string; value: string; color: string; icon: string }> = ({ label, value, color, icon }) => (
    <View style={styles.heroStat}>
        <Ionicons name={icon as any} size={16} color={color} />
        <Text style={[styles.heroStatValue, { color }]}>{value}</Text>
        <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'transparent' },
    container: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 30,
        paddingBottom: 110,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
    exportBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 12, overflow: 'hidden',
    },
    exportText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

    rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    rangeChip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
        backgroundColor: colors.glass.inputBg,
        borderWidth: 1, borderColor: colors.glass.borderHighlight,
    },
    rangeChipActive: { backgroundColor: colors.primary[500], borderColor: colors.primary[500] },
    rangeText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    rangeTextActive: { color: '#FFFFFF' },

    center: { paddingTop: 60, alignItems: 'center' },

    heroCard: {
        flexDirection: 'row', alignItems: 'center',
        gap: 20, padding: 20, borderRadius: 24,
        backgroundColor: colors.glass.background,
        borderWidth: 1, borderColor: colors.glass.borderHighlight,
        marginBottom: 20, overflow: 'hidden',
    },
    heroStats: { flex: 1, gap: 12 },
    heroStat: { alignItems: 'center', flexDirection: 'row', gap: 8 },
    heroStatValue: { fontSize: 16, fontWeight: '800' },
    heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },

    motivationCard: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 14, borderRadius: 14, marginBottom: 16,
        borderWidth: 1, overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    motivationEmoji: { fontSize: 22 },
    motivationText: { flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 18 },
    cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
    chartSection: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
    sectionSubtitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    chartCard: {
        backgroundColor: colors.glass.background,
        borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: colors.glass.borderHighlight,
    },

    riskSection: { marginBottom: 24 },
    riskCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, marginTop: 8 },
    riskWarning: { backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
    riskCritical: { backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
    riskText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#FFFFFF' },

    quickActions: { marginBottom: 16 },
    quickAction: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.glass.inputBg,
        padding: 16, borderRadius: 14, marginBottom: 8,
        borderWidth: 1, borderColor: colors.glass.borderHighlight, gap: 12,
    },
    quickActionText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#FFFFFF' },

    emptyCard: {
        backgroundColor: colors.glass.background,
        borderRadius: 20, padding: 32, alignItems: 'center',
        borderWidth: 1, borderColor: colors.glass.borderHighlight, marginTop: 20,
    },
    emptyIconWrap: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.55)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
    emptyMessage: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    createBtn: { backgroundColor: colors.primary[500], paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    createBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
