/**
 * MedicationList — List of medications with count header
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { MedicationItem, MedicationData } from './MedicationItem';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface MedicationListProps {
    medications: MedicationData[];
}

export const MedicationList: React.FC<MedicationListProps> = ({ medications }) => {
    return (
        <Card variant="elevated" style={styles.card}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>💊</Text>
                    </View>
                    <Text style={styles.label}>Medications</Text>
                </View>
                <View style={styles.countBadge}>
                    <Text style={styles.count}>{medications.length}</Text>
                </View>
            </View>

            {medications.length === 0 ? (
                <Text style={styles.empty}>No medications found</Text>
            ) : (
                medications.map((med, index) => (
                    <MedicationItem
                        key={med.id || `med-${index}`}
                        medication={med}
                        index={index}
                    />
                ))
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: borderRadius.sm,
        backgroundColor: '#DCFCE7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 16,
    },
    label: {
        ...typography.label,
        color: '#9BA6B3',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: '700',
    },
    countBadge: {
        backgroundColor: '#109AE8',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
        minWidth: 28,
        alignItems: 'center',
    },
    count: {
        ...typography.caption,
        color: colors.white,
        fontWeight: '700',
    },
    empty: {
        ...typography.bodySmall,
        color: '#9BA6B3',
        textAlign: 'center',
        paddingVertical: spacing.lg,
        fontStyle: 'italic',
    },
});
