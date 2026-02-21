/**
 * History route — list of past prescriptions
 */

import React from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Button, Loader, EmptyState } from '../../components/ui';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { usePrescriptionHistory } from '../../features/prescriptions/hooks';
import type { PrescriptionListItem } from '../../features/prescriptions/types';

const getConfidenceColor = (score: number | null): string => {
    if (score == null) return colors.dark.textMuted;
    if (score >= 0.8) return colors.confidence.high;
    if (score >= 0.5) return colors.confidence.medium;
    return colors.confidence.low;
};

export default function HistoryScreen() {
    const router = useRouter();
    const { data, isLoading } = usePrescriptionHistory();

    const renderItem = ({ item }: { item: PrescriptionListItem }) => {
        const date = new Date(item.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        });

        return (
            <TouchableOpacity
                onPress={() => router.push({ pathname: '/(app)/result', params: { documentId: item.document_id } })}
                activeOpacity={0.7}
            >
                <Card variant="elevated" style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                        <View style={styles.itemLeft}>
                            <Text style={styles.itemDiagnosis} numberOfLines={1}>
                                {item.diagnosis_text || 'No diagnosis'}
                            </Text>
                            <Text style={styles.itemDate}>{date}</Text>
                        </View>
                        <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(item.confidence_score) + '20' }]}>
                            <Text style={[styles.confidenceText, { color: getConfidenceColor(item.confidence_score) }]}>
                                {item.confidence_score != null ? `${Math.round(item.confidence_score * 100)}%` : '—'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.itemDetails}>
                        {item.doctor_name && <View style={styles.chip}><Text style={styles.chipText}>🩺 {item.doctor_name}</Text></View>}
                        {item.facility_name && <View style={styles.chip}><Text style={styles.chipText}>🏥 {item.facility_name}</Text></View>}
                        <View style={styles.chip}><Text style={styles.chipText}>💊 {item.medication_count} meds</Text></View>
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    if (isLoading) return <Loader fullScreen message="Loading history..." />;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Button title="← Back" onPress={() => router.back()} variant="ghost" size="sm" />
                <Text style={styles.title}>History</Text>
                <View style={{ width: 80 }} />
            </View>

            <FlatList
                data={data?.prescriptions || []}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <EmptyState
                        title="No prescriptions yet"
                        message="Your analyzed prescriptions will appear here"
                        actionTitle="Scan Now"
                        onAction={() => router.back()}
                    />
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.dark.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, marginBottom: spacing.lg },
    title: { ...typography.h2, color: colors.dark.textPrimary },
    list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
    itemCard: { marginBottom: spacing.md },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
    itemLeft: { flex: 1, marginRight: spacing.md },
    itemDiagnosis: { ...typography.body, color: colors.dark.textPrimary, fontWeight: '600' },
    itemDate: { ...typography.caption, color: colors.dark.textMuted, marginTop: 2 },
    confidenceBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
    confidenceText: { ...typography.caption, fontWeight: '700' },
    itemDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: { backgroundColor: colors.dark.surfaceElevated, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
    chipText: { ...typography.caption, color: colors.dark.textSecondary },
});
