import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../ui/Card';
import { colors, spacing, borderRadius } from '../../theme';
import { LabResultType } from '../../features/prescriptions/types';

interface Props {
    labResults: LabResultType[];
}

const STATUS_CONFIG = {
    normal:   { color: '#76FFB4', label: 'Normal',   icon: 'checkmark-circle' },
    high:     { color: '#FFD96E', label: 'High',     icon: 'arrow-up-circle'  },
    low:      { color: '#7BC8FF', label: 'Low',      icon: 'arrow-down-circle'},
    critical: { color: '#FF6B8A', label: 'Critical', icon: 'alert-circle'     },
};

// Gemini / n8n can return lab rows under many different key names — resolve them all
const resolveField = (item: any, ...keys: string[]): string | null => {
    for (const k of keys) {
        if (item[k] != null && String(item[k]).trim() !== '') return String(item[k]);
    }
    return null;
};

export const LabResultsCard: React.FC<Props> = ({ labResults }) => {
    return (
        <Card variant="elevated" style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.iconBox}>
                        <Ionicons name="flask-outline" size={18} color="#76FFB4" />
                    </View>
                    <Text style={styles.title}>Lab Results</Text>
                </View>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{labResults.length}</Text>
                </View>
            </View>

            {labResults.length === 0 ? (
                <Text style={styles.empty}>No lab results found</Text>
            ) : (
                <View style={styles.list}>
                    {labResults.map((rawItem: any, idx) => {
                        // Resolve test name — try every alias Gemini might use
                        const testName = resolveField(
                            rawItem,
                            'test_name', 'name', 'parameter', 'analyte',
                            'test', 'lab_test', 'examination', 'item',
                        ) ?? `Test ${idx + 1}`;

                        // Resolve result value
                        const resultValue = resolveField(
                            rawItem,
                            'result_value', 'value', 'result', 'measured_value',
                            'patient_value', 'observed_value', 'reading',
                        );

                        // Resolve unit
                        const unit = resolveField(rawItem, 'unit', 'units', 'uom');

                        // Resolve reference range
                        const refRange = resolveField(
                            rawItem,
                            'reference_range', 'normal_range', 'ref_range',
                            'reference', 'normal_values', 'range',
                        );

                        // Resolve status
                        const rawStatus = resolveField(rawItem, 'status', 'flag', 'interpretation');
                        const status = rawStatus?.toLowerCase().includes('high')     ? 'high'
                            :          rawStatus?.toLowerCase().includes('low')      ? 'low'
                            :          rawStatus?.toLowerCase().includes('critical') ? 'critical'
                            :          rawStatus?.toLowerCase().includes('normal')   ? 'normal'
                            :          null;

                        const statusCfg = status ? STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] : null;
                        const notes = resolveField(rawItem, 'notes', 'comment', 'remarks', 'observation');

                        return (
                            <View key={idx} style={styles.row}>
                                <LinearGradient
                                    colors={[(statusCfg?.color ?? '#76FFB4') + '14', 'transparent']}
                                    style={[StyleSheet.absoluteFill, { borderRadius: borderRadius.lg }]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                />

                                {/* Left: test name + notes */}
                                <View style={styles.rowMain}>
                                    <Text style={styles.testName} numberOfLines={2}>
                                        {testName}
                                    </Text>
                                    {notes ? (
                                        <Text style={styles.notes} numberOfLines={2}>{notes}</Text>
                                    ) : null}
                                </View>

                                {/* Right: value + ref + status chip */}
                                <View style={styles.rowRight}>
                                    {resultValue ? (
                                        <Text style={[
                                            styles.value,
                                            statusCfg ? { color: statusCfg.color } : {},
                                        ]}>
                                            {resultValue}{unit ? ` ${unit}` : ''}
                                        </Text>
                                    ) : null}
                                    {refRange ? (
                                        <Text style={styles.ref}>Ref: {refRange}</Text>
                                    ) : null}
                                    {statusCfg ? (
                                        <View style={[styles.statusChip, { backgroundColor: statusCfg.color + '22' }]}>
                                            <Ionicons name={statusCfg.icon as any} size={11} color={statusCfg.color} />
                                            <Text style={[styles.statusText, { color: statusCfg.color }]}>
                                                {statusCfg.label}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                        );
                    })}
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
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    iconBox: {
        width: 32, height: 32, borderRadius: borderRadius.sm,
        backgroundColor: 'rgba(118,255,180,0.12)',
        justifyContent: 'center', alignItems: 'center',
    },
    title: {
        color: colors.white,
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    countBadge: {
        backgroundColor: '#76FFB430',
        paddingHorizontal: 10, paddingVertical: 2,
        borderRadius: borderRadius.full,
        minWidth: 28, alignItems: 'center',
    },
    countText: { color: '#76FFB4', fontSize: 12, fontWeight: '800' },

    empty: {
        color: colors.textSecondary,
        textAlign: 'center',
        paddingVertical: spacing.lg,
        fontStyle: 'italic',
        fontSize: 14,
    },

    list: { gap: 10 },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        overflow: 'hidden',
    },
    rowMain: { flex: 1, marginRight: 12 },
    testName: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 3,
    },
    notes: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 12,
        lineHeight: 16,
    },
    rowRight: { alignItems: 'flex-end', gap: 4 },
    value: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '800',
    },
    ref: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 10,
        fontWeight: '500',
    },
    statusChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 8,
    },
    statusText: { fontSize: 10, fontWeight: '800' },
});
