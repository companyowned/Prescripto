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
        borderBottomColor: colors.glass.border,
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
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.primary[400],
    },
    number: {
        ...typography.caption,
        color: colors.primary[300],
        fontWeight: '800',
    },
    name: {
        ...typography.body,
        color: colors.white,
        fontWeight: '700',
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
        backgroundColor: colors.glass.inputBg,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        gap: 4,
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
    },
    detailLabel: {
        fontSize: 12,
    },
    detailValue: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    notes: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
        marginLeft: 34,
        fontStyle: 'italic',
    },
});
