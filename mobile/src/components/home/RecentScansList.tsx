import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';
import { EmptyState } from '../ui';
import type { PrescriptionListItem } from '../../../src/features/prescriptions/types';

const PURPOSE_CONFIG = {
    prescription:     { icon: 'pill',          color: '#4FB3FF', label: 'Rx'   },
    lab_result:       { icon: 'flask-outline', color: '#76FFB4', label: 'Lab'  },
    radiology_report: { icon: 'radio-outline', color: '#C4B5FD', label: 'Scan' },
} as const;

const getScanTitle = (scan: PrescriptionListItem): string => {
    const diag = scan.diagnosis_text != null && scan.diagnosis_text !== '' && scan.diagnosis_text !== 'null'
        ? scan.diagnosis_text : null;
    if (diag) return diag;
    if (scan.purpose === 'lab_result') return scan.facility_name ? `Lab Results — ${scan.facility_name}` : 'Lab Test Results';
    if (scan.purpose === 'radiology_report') return scan.facility_name ? `Radiology — ${scan.facility_name}` : 'Radiology Report';
    if (scan.medication_count > 0) return `${scan.medication_count} ${scan.medication_count === 1 ? 'Medication' : 'Medications'} Prescribed`;
    if (scan.doctor_name) return `Prescription — Dr. ${scan.doctor_name}`;
    return 'Medical Prescription';
};

const getScanSubtitle = (scan: PrescriptionListItem, date: string): string => {
    const parts: string[] = [];
    if (scan.purpose === 'prescription' && scan.doctor_name) parts.push(`Dr. ${scan.doctor_name}`);
    if (scan.facility_name && scan.purpose !== 'prescription') parts.push(scan.facility_name);
    parts.push(date);
    return parts.join(' • ');
};

interface RecentScansListProps {
    scans: PrescriptionListItem[];
    onScanPress: (documentId: string) => void;
    onSeeAllPress: () => void;
    onNewScanPress?: () => void;
}

export const RecentScansList: React.FC<RecentScansListProps> = ({
    scans,
    onScanPress,
    onSeeAllPress,
    onNewScanPress,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Scans</Text>
                {scans.length > 0 && (
                    <TouchableOpacity onPress={onSeeAllPress}>
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.list}>
                {scans.length === 0 ? (
                    <EmptyState
                        title="No prescriptions scanned yet"
                        message="Start by scanning your first prescription to manage your records intelligently."
                        icon={<Ionicons name="document-text-outline" size={32} color={colors.primary[400]} />}
                        actionTitle="Scan First Prescription"
                        onAction={onNewScanPress}
                    />
                ) : (
                    scans.map((scan) => {
                        const date = new Date(scan.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                        });
                        const cfg = PURPOSE_CONFIG[scan.purpose as keyof typeof PURPOSE_CONFIG] || PURPOSE_CONFIG.prescription;
                        const title    = getScanTitle(scan);
                        const subtitle = getScanSubtitle(scan, date);
                        const confidence = scan.confidence_score != null
                            ? Math.round(scan.confidence_score * 100) : null;

                        return (
                            <TouchableOpacity
                                key={scan.id}
                                style={styles.item}
                                onPress={() => onScanPress(scan.document_id)}
                                activeOpacity={0.75}
                            >
                                <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.04)']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />

                                {/* Left accent bar */}
                                <View style={[styles.accentBar, { backgroundColor: cfg.color }]} />

                                <View style={styles.rowContent}>
                                    {/* Icon badge */}
                                    <View style={[styles.iconBadge, { backgroundColor: cfg.color + '20', borderColor: cfg.color + '45' }]}>
                                        <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
                                    </View>

                                    {/* Text */}
                                    <View style={styles.textCol}>
                                        <View style={styles.titleRow}>
                                            <View style={[styles.typeBadge, { backgroundColor: cfg.color + '22' }]}>
                                                <Text style={[styles.typeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                                            </View>
                                            {confidence !== null && (
                                                <Text style={[styles.confidenceText, {
                                                    color: confidence >= 80 ? colors.success : confidence >= 50 ? colors.warning : colors.error,
                                                }]}>{confidence}%</Text>
                                            )}
                                        </View>
                                        <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
                                        <Text style={styles.itemSubtitle} numberOfLines={1}>{subtitle}</Text>
                                    </View>

                                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.30)" />
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 24 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: colors.white,
        fontSize: 18,
        fontWeight: '700',
    },
    seeAllText: {
        color: colors.primary[400],
        fontSize: 14,
        fontWeight: '600',
    },
    list: { gap: 12 },
    item: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
        backgroundColor: colors.glass.background,
    },
    rowContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingLeft: 20,
    },
    accentBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        zIndex: 2,
    },
    iconBadge: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        borderWidth: 1,
    },
    textCol: { flex: 1, justifyContent: 'center' },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    confidenceText: {
        fontSize: 11,
        fontWeight: '700',
    },
    itemTitle: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    itemSubtitle: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 12,
    },
});
