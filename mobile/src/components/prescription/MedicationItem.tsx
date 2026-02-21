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
        borderBottomColor: '#F3F4F6',
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
        backgroundColor: '#E0F2FE',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    number: {
        ...typography.caption,
        color: '#0EA5E9',
        fontWeight: '800',
    },
    name: {
        ...typography.body,
        color: '#111827',
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
        backgroundColor: '#F9FAFB',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        gap: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    detailLabel: {
        fontSize: 12,
    },
    detailValue: {
        ...typography.caption,
        color: '#4B5563',
        fontWeight: '600',
    },
    notes: {
        ...typography.caption,
        color: '#6B7280',
        marginTop: spacing.xs,
        marginLeft: 34,
        fontStyle: 'italic',
    },
});
