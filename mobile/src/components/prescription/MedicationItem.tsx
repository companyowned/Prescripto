/**
 * MedicationItem — Single medication row with details
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';

export interface MedicationData {
    id?: string;
    name: string;
    dose?: string | null;
    frequency?: string | null;
    duration?: string | null;
    notes?: string | null;
}

interface MedicationItemProps {
    medication: MedicationData;
    index: number;
}

export const MedicationItem: React.FC<MedicationItemProps> = ({ medication, index }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.numberBadge}>
                    <Text style={styles.number}>{index + 1}</Text>
                </View>
                <Text style={styles.name}>{medication.name}</Text>
            </View>
            <View style={styles.details}>
                {medication.dose && (
                    <View style={styles.detailChip}>
                        <Text style={styles.detailLabel}>💊</Text>
                        <Text style={styles.detailValue}>{medication.dose}</Text>
                    </View>
                )}
                {medication.frequency && (
                    <View style={styles.detailChip}>
                        <Text style={styles.detailLabel}>🔄</Text>
                        <Text style={styles.detailValue}>{medication.frequency}</Text>
                    </View>
                )}
                {medication.duration && (
                    <View style={styles.detailChip}>
                        <Text style={styles.detailLabel}>📅</Text>
                        <Text style={styles.detailValue}>{medication.duration}</Text>
                    </View>
                )}
            </View>
            {medication.notes && (
                <Text style={styles.notes}>Note: {medication.notes}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.dark.border,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    numberBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: colors.primary[500],
        justifyContent: 'center',
        alignItems: 'center',
    },
    number: {
        ...typography.caption,
        color: colors.white,
        fontWeight: '700',
    },
    name: {
        ...typography.body,
        color: colors.dark.textPrimary,
        fontWeight: '600',
        flex: 1,
    },
    details: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginLeft: 34,
    },
    detailChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.dark.surfaceElevated,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        gap: 4,
    },
    detailLabel: {
        fontSize: 12,
    },
    detailValue: {
        ...typography.caption,
        color: colors.dark.textSecondary,
    },
    notes: {
        ...typography.caption,
        color: colors.dark.textMuted,
        marginTop: spacing.xs,
        marginLeft: 34,
        fontStyle: 'italic',
    },
});
