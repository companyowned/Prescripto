/**
 * Records route — categorized patient records with tabbed filtering
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    SectionList,
    FlatList,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Platform,
    Animated,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MockBottomTabs } from '../../components/home';
import { Card, Button, Loader, EmptyState, GlassBackground } from '../../components/ui';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { usePrescriptionHistory } from '../../features/prescriptions/hooks';
import type { PrescriptionListItem, RecordPurpose } from '../../features/prescriptions/types';
import { useActiveProfile } from '../../contexts/profile-context';
import { ProfileSwitcher } from '../../components/home';

/* ────────────── Category Configuration ────────────── */

interface CategoryConfig {
    key: string;
    label: string;
    icon: string;
    purpose?: RecordPurpose;
    color: string;
    emptyTitle: string;
    emptyMessage: string;
    emptyCta: string;
}

const CATEGORIES: CategoryConfig[] = [
    {
        key: 'all',
        label: 'All',
        icon: '📋',
        purpose: undefined,
        color: colors.primary[300],
        emptyTitle: 'No records yet',
        emptyMessage: 'Start by scanning a prescription or uploading a document',
        emptyCta: 'Scan Now',
    },
    {
        key: 'prescription',
        label: 'Prescriptions',
        icon: '💊',
        purpose: 'prescription',
        color: colors.primary[300],
        emptyTitle: 'No prescriptions',
        emptyMessage: 'Scan or upload a prescription to get started',
        emptyCta: 'Scan Prescription',
    },
    {
        key: 'lab_result',
        label: 'Lab Results',
        icon: '🧪',
        purpose: 'lab_result',
        color: '#4CAF50',
        emptyTitle: 'No lab results',
        emptyMessage: 'Upload lab results to keep track of your health data',
        emptyCta: 'Upload Lab Results',
    },
    {
        key: 'radiology_report',
        label: 'Radiology',
        icon: '🩻',
        purpose: 'radiology_report',
        color: '#AB47BC',
        emptyTitle: 'No radiology reports',
        emptyMessage: 'Upload radiology reports to organize your imaging records',
        emptyCta: 'Upload Report',
    },
];

const getCategoryConfig = (purpose: RecordPurpose | string): CategoryConfig => {
    return CATEGORIES.find((c) => c.purpose === purpose) || CATEGORIES[0];
};

const getConfidenceColor = (score: number | null): string => {
    if (score == null) return colors.dark.textMuted;
    if (score >= 0.8) return colors.confidence.high;
    if (score >= 0.5) return colors.confidence.medium;
    return colors.confidence.low;
};

/* ────────────── Month Grouping Utility ────────────── */

interface MonthSection {
    title: string;
    data: PrescriptionListItem[];
}

const groupByMonth = (items: PrescriptionListItem[]): MonthSection[] => {
    const groups: Record<string, PrescriptionListItem[]> = {};
    for (const item of items) {
        const d = new Date(item.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!groups[key]) {
            groups[key] = [];
            Object.defineProperty(groups[key], '__label', { value: label });
        }
        groups[key].push(item);
    }
    return Object.entries(groups)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([, items]) => ({
            title: (items as any).__label as string,
            data: items,
        }));
};

/* ────────────── Component: CategoryTab ────────────── */

interface CategoryTabProps {
    category: CategoryConfig;
    isActive: boolean;
    count?: number;
    onPress: () => void;
}

const CategoryTab: React.FC<CategoryTabProps> = ({ category, isActive, count, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
    };
    const handlePressOut = () => {
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
        >
            <Animated.View
                style={[
                    styles.tab,
                    isActive && styles.tabActive,
                    isActive && { borderColor: category.color, shadowColor: category.color },
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                <Text style={styles.tabIcon}>{category.icon}</Text>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {category.label}
                </Text>
                {count !== undefined && count > 0 && (
                    <View style={[styles.tabBadge, { backgroundColor: isActive ? category.color : colors.glass.inputBg }]}>
                        <Text style={[styles.tabBadgeText, isActive && { color: '#fff' }]}>{count}</Text>
                    </View>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

/* ────────────── Component: RecordCard ────────────── */

interface RecordCardProps {
    item: PrescriptionListItem;
    showCategoryBadge?: boolean;
    onPress: () => void;
}

const RecordCard: React.FC<RecordCardProps> = ({ item, showCategoryBadge = false, onPress }) => {
    const category = getCategoryConfig(item.purpose);
    const dateStr = new Date(item.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const recordTitle = useMemo(() => {
        if (item.diagnosis_text && item.diagnosis_text !== 'null') return item.diagnosis_text;
        
        if (item.purpose === 'lab_result') {
            return item.facility_name ? `Lab Results - ${item.facility_name}` : 'Lab Report';
        }
        
        if (item.purpose === 'prescription') {
            return item.doctor_name ? `Prescription - ${item.doctor_name}` : 'Medical Prescription';
        }

        if (item.purpose === 'radiology_report') {
            return item.facility_name ? `Radiology - ${item.facility_name}` : 'Radiology Report';
        }
        
        return `Medical Record - ${dateStr}`;
    }, [item, dateStr]);

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card variant="elevated" style={styles.recordCard}>
                {/* Badges (Absolute positioned to save space) */}
                <View style={styles.badgeContainer}>
                    {showCategoryBadge && (
                        <View style={[styles.categoryBadge, { backgroundColor: category.color + '20', borderColor: category.color + '40' }]}>
                            <Text style={styles.categoryBadgeIcon}>{category.icon}</Text>
                            <Text style={[styles.categoryBadgeLabel, { color: category.color }]}>
                                {category.label}
                            </Text>
                        </View>
                    )}
                    <View style={{ flex: 1 }} />
                    <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(item.confidence_score) + '20' }]}>
                        <Text style={[styles.confidenceText, { color: getConfidenceColor(item.confidence_score) }]}>
                            {item.confidence_score != null ? `${Math.round(item.confidence_score * 100)}%` : '—'}
                        </Text>
                    </View>
                </View>

                {/* Title + date */}
                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                        {recordTitle}
                    </Text>
                    <Text style={styles.cardDate}>{dateStr}</Text>
                </View>

                {/* Chips */}
                <View style={styles.chipRow}>
                    {item.doctor_name && (
                        <View style={styles.chip}>
                            <Text style={styles.chipText}>🩺 {item.doctor_name}</Text>
                        </View>
                    )}
                    {item.facility_name && (
                        <View style={styles.chip}>
                            <Text style={styles.chipText}>🏥 {item.facility_name}</Text>
                        </View>
                    )}
                    {item.medication_count > 0 && (
                        <View style={styles.chip}>
                            <Text style={styles.chipText}>💊 {item.medication_count} meds</Text>
                        </View>
                    )}
                </View>

                {/* Accent bar */}
                <View style={[styles.accentBar, { backgroundColor: category.color }]} />
            </Card>
        </TouchableOpacity>
    );
};

/* ────────────── Component: SectionHeader ────────────── */

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <View style={styles.sectionHeader}>
        <View style={styles.sectionDivider} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionDivider} />
    </View>
);

/* ────────────── Main Screen ────────────── */

export default function HistoryScreen() {
    const router = useRouter();
    const { activeProfile } = useActiveProfile();
    const [activeCategory, setActiveCategory] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const category = CATEGORIES[activeCategory];
    const purposeFilter = category.purpose;

    const { data, isLoading, refetch, isRefetching } = usePrescriptionHistory(
        0,
        100,
        activeProfile?.id,
        purposeFilter
    );

    const records = data?.prescriptions || [];

    // Count records by purpose for tab badges (fetch all for counts)
    const { data: allData } = usePrescriptionHistory(0, 100, activeProfile?.id, undefined);
    const allRecords = allData?.prescriptions || [];

    const counts = useMemo(() => {
        const map: Record<string, number> = { all: allRecords.length };
        for (const r of allRecords) {
            map[r.purpose] = (map[r.purpose] || 0) + 1;
        }
        return map;
    }, [allRecords]);

    const sections = useMemo(() => groupByMonth(records), [records]);

    const switchCategory = useCallback(
        (index: number) => {
            if (index === activeCategory) return;
            Animated.sequence([
                Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
            setActiveCategory(index);
        },
        [activeCategory, fadeAnim]
    );

    const navigateToResult = (documentId: string) => {
        router.push({ pathname: '/(app)/result', params: { documentId } });
    };

    const navigateToScan = () => router.push('/(app)/scan');
    const navigateToUpload = () => router.push('/(app)/upload');

    if (isLoading) {
        return (
            <GlassBackground>
                <Loader fullScreen message="Loading records..." />
            </GlassBackground>
        );
    }

    const renderRecordCard = ({ item }: { item: PrescriptionListItem }) => (
        <RecordCard
            item={item}
            showCategoryBadge={activeCategory === 0}
            onPress={() => navigateToResult(item.document_id)}
        />
    );

    return (
        <GlassBackground>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Button title="← Back" onPress={() => router.back()} variant="ghost" size="sm" />
                    <Text style={styles.title}>Records</Text>
                    <View style={{ width: 80 }} />
                </View>

                {/* Profile Switcher */}
                <View style={styles.switcherWrap}>
                    <ProfileSwitcher />
                </View>

                {/* Category Tabs */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabBar}
                    style={styles.tabBarScroll}
                >
                    {CATEGORIES.map((cat, index) => (
                        <CategoryTab
                            key={cat.key}
                            category={cat}
                            isActive={activeCategory === index}
                            count={counts[cat.key]}
                            onPress={() => switchCategory(index)}
                        />
                    ))}
                </ScrollView>

                {/* Content */}
                <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
                    {records.length === 0 ? (
                        <EmptyState
                            title={category.emptyTitle}
                            message={category.emptyMessage}
                            actionTitle={category.emptyCta}
                            onAction={category.key === 'prescription' || category.key === 'all' ? navigateToScan : navigateToUpload}
                        />
                    ) : (
                        <SectionList
                            sections={sections}
                            keyExtractor={(item) => item.id}
                            renderItem={renderRecordCard}
                            renderSectionHeader={({ section }) => (
                                <SectionHeader title={section.title} />
                            )}
                            contentContainerStyle={styles.list}
                            showsVerticalScrollIndicator={false}
                            stickySectionHeadersEnabled={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={isRefetching}
                                    onRefresh={refetch}
                                    tintColor={colors.primary[300]}
                                    colors={[colors.primary[300]]}
                                />
                            }
                        />
                    )}
                </Animated.View>

                {/* Bottom Tabs */}
                <MockBottomTabs
                    activeTab="records"
                    onHomePress={() => router.push('/(app)/home')}
                    onRecordsPress={() => {}}
                    onRemindersPress={() => router.push('/(app)/reminders')}
                    onChatPress={() => router.push('/(app)/chat')}
                    onInsightsPress={() => router.push('/(app)/insights')}
                    onSettingsPress={() => router.push('/(app)/settings')}
                />
            </SafeAreaView>
        </GlassBackground>
    );
}

/* ────────────── Styles ────────────── */

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 10 : 30,
        marginBottom: spacing.sm,
    },
    title: { ...typography.h3, color: colors.white, fontWeight: '700' },
    switcherWrap: { paddingHorizontal: spacing.xl, marginBottom: spacing.sm },

    /* Tab bar */
    tabBarScroll: { flexGrow: 0, marginBottom: spacing.md },
    tabBar: {
        paddingHorizontal: spacing.xl,
        gap: spacing.sm,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm + 2,
        borderRadius: borderRadius.full,
        backgroundColor: colors.glass.inputBg,
        borderWidth: 1,
        borderColor: colors.glass.border,
        gap: spacing.xs,
    },
    tabActive: {
        backgroundColor: 'rgba(31, 163, 198, 0.15)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 4,
    },
    tabIcon: { fontSize: 14 },
    tabLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
    tabLabelActive: { color: colors.white },
    tabBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
        marginLeft: 2,
    },
    tabBadgeText: { ...typography.caption, fontSize: 10, fontWeight: '700', color: colors.textSecondary },

    /* Content */
    contentContainer: { flex: 1 },
    list: { paddingHorizontal: spacing.xl, paddingBottom: 110 },

    /* Section headers (month groups) */
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.md,
        gap: spacing.sm,
    },
    sectionTitle: {
        ...typography.caption,
        color: colors.primary[300],
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    sectionDivider: {
        flex: 1,
        height: 1,
        backgroundColor: colors.glass.border,
    },

    /* Record card */
    recordCard: { marginBottom: spacing.md, overflow: 'hidden' },
    badgeContainer: {
        position: 'absolute',
        top: spacing.sm,
        left: spacing.sm,
        right: spacing.sm,
        flexDirection: 'row',
        zIndex: 10,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        gap: 4,
    },
    categoryBadgeIcon: { fontSize: 11 },
    categoryBadgeLabel: { ...typography.caption, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    confidenceBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    confidenceText: { ...typography.caption, fontWeight: '800' },

    /* Card body */
    cardBody: { marginTop: spacing.md + 4, marginBottom: spacing.sm },
    cardTitle: { ...typography.body, color: colors.white, fontWeight: '700', marginBottom: 2 },
    cardDate: { ...typography.caption, color: colors.textSecondary },

    /* Chips */
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
        backgroundColor: colors.glass.inputBg,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
    },
    chipText: { ...typography.caption, color: colors.textSecondary },

    /* Accent bar at bottom of card */
    accentBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        borderBottomLeftRadius: borderRadius.lg,
        borderBottomRightRadius: borderRadius.lg,
        opacity: 0.6,
    },
});
