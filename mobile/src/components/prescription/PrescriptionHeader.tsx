/**
 * PrescriptionHeader — Shows prescription title with confidence badge
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface PrescriptionHeaderProps {
    documentId: string;
    confidence?: number | null;
    createdAt: string;
}

const getConfidenceColor = (score: number): string => {
    if (score >= 0.8) return colors.confidence.high;
    if (score >= 0.5) return colors.confidence.medium;
    return colors.confidence.low;
};

const getConfidenceLabel = (score: number): string => {
    if (score >= 0.8) return 'High';
    if (score >= 0.5) return 'Medium';
    return 'Low';
};

export const PrescriptionHeader: React.FC<PrescriptionHeaderProps> = ({
    documentId,
    confidence,
    createdAt,
}) => {
    const date = new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <View style={styles.container}>
            <View style={styles.titleRow}>
                <Text style={styles.title}>Prescription Analysis</Text>
                {confidence != null && (
                    <View
                        style={[
                            styles.badge,
                            { backgroundColor: getConfidenceColor(confidence) + '20' },
                        ]}
                    >
                        <View
                            style={[
                                styles.dot,
                                { backgroundColor: getConfidenceColor(confidence) },
                            ]}
                        />
                        <Text
                            style={[
                                styles.badgeText,
                                { color: getConfidenceColor(confidence) },
                            ]}
                        >
                            {getConfidenceLabel(confidence)} ({Math.round(confidence * 100)}%)
                        </Text>
                    </View>
                )}
            </View>
            <Text style={styles.date}>{date}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    title: {
        ...typography.h2,
        color: colors.dark.textPrimary,
    },
    date: {
        ...typography.caption,
        color: colors.dark.textMuted,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    badgeText: {
        ...typography.caption,
        fontWeight: '600',
    },
});
