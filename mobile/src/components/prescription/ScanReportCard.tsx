import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../ui/Card';
import { colors, spacing, borderRadius } from '../../theme';
import { ScanReportType } from '../../features/prescriptions/types';

interface Props {
    report: ScanReportType;
}

export const ScanReportCard: React.FC<Props> = ({ report }) => {
    const hasContent = report.findings || report.impression;

    return (
        <Card variant="elevated" style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.iconBox}>
                        <Ionicons name="scan-outline" size={18} color="#C4B5FD" />
                    </View>
                    <View>
                        <Text style={styles.title}>Radiology Report</Text>
                        {report.type ? (
                            <Text style={styles.scanType}>{report.type}</Text>
                        ) : null}
                    </View>
                </View>
                {report.date ? (
                    <Text style={styles.date}>{report.date}</Text>
                ) : null}
            </View>

            {!hasContent ? (
                <Text style={styles.empty}>No report details available</Text>
            ) : (
                <View style={styles.body}>
                    {report.findings ? (
                        <View style={styles.section}>
                            <LinearGradient
                                colors={['rgba(196,181,253,0.10)', 'transparent']}
                                style={[StyleSheet.absoluteFill, { borderRadius: borderRadius.lg }]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                            <View style={styles.sectionHeader}>
                                <View style={[styles.dot, { backgroundColor: '#C4B5FD' }]} />
                                <Text style={styles.sectionLabel}>FINDINGS</Text>
                            </View>
                            <Text style={styles.sectionBody}>{report.findings}</Text>
                        </View>
                    ) : null}

                    {report.impression ? (
                        <View style={[styles.section, { marginTop: 10 }]}>
                            <LinearGradient
                                colors={['rgba(79,179,255,0.10)', 'transparent']}
                                style={[StyleSheet.absoluteFill, { borderRadius: borderRadius.lg }]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                            <View style={styles.sectionHeader}>
                                <View style={[styles.dot, { backgroundColor: '#4FB3FF' }]} />
                                <Text style={[styles.sectionLabel, { color: '#4FB3FF' }]}>IMPRESSION</Text>
                            </View>
                            <Text style={styles.sectionBody}>{report.impression}</Text>
                        </View>
                    ) : null}
                </View>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: { marginBottom: spacing.lg },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    iconBox: {
        width: 32, height: 32, borderRadius: borderRadius.sm,
        backgroundColor: 'rgba(196,181,253,0.12)',
        justifyContent: 'center', alignItems: 'center',
    },
    title: {
        color: colors.white,
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    scanType: {
        color: '#C4B5FD',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    date: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 11,
        fontWeight: '500',
    },

    empty: {
        color: colors.textSecondary,
        textAlign: 'center',
        paddingVertical: spacing.lg,
        fontStyle: 'italic',
        fontSize: 14,
    },

    body: {},
    section: {
        padding: 14,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginBottom: 8,
    },
    dot: { width: 6, height: 6, borderRadius: 3 },
    sectionLabel: {
        color: '#C4B5FD',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    sectionBody: {
        color: 'rgba(255,255,255,0.80)',
        fontSize: 13,
        lineHeight: 20,
    },
});
