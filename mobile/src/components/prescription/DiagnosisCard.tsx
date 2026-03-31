/**
 * DiagnosisCard — Display diagnosis text with edit support
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface DiagnosisCardProps {
    diagnosis?: string | null;
}

export const DiagnosisCard: React.FC<DiagnosisCardProps> = ({ diagnosis }) => {
    return (
        <Card variant="elevated" style={styles.card}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>📋</Text>
                </View>
                <Text style={styles.label}>Diagnosis</Text>
            </View>
            <Text style={[styles.value, !diagnosis && styles.notFound]}>
                {diagnosis || 'Diagnosis not found'}
            </Text>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: borderRadius.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 16,
    },
    label: {
        ...typography.label,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        ...typography.body,
        color: colors.white,
        lineHeight: 24,
        fontWeight: '600',
    },
    notFound: {
        color: colors.textSecondary,
        fontStyle: 'italic',
        fontWeight: 'normal',
    },
});
