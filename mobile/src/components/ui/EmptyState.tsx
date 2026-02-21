/**
 * EmptyState — Placeholder for empty lists/screens
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Button } from './Button';

interface EmptyStateProps {
    title: string;
    message?: string;
    icon?: React.ReactNode;
    actionTitle?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    message,
    icon,
    actionTitle,
    onAction,
}) => {
    return (
        <View style={styles.container}>
            {icon && <View style={styles.iconWrapper}>{icon}</View>}
            <Text style={styles.title}>{title}</Text>
            {message && <Text style={styles.message}>{message}</Text>}
            {actionTitle && onAction && (
                <Button
                    title={actionTitle}
                    onPress={onAction}
                    variant="outline"
                    size="sm"
                    style={styles.action}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
    },
    iconWrapper: {
        marginBottom: spacing.lg,
        opacity: 0.6,
    },
    title: {
        ...typography.h3,
        color: '#111827',
        textAlign: 'center',
        marginBottom: spacing.sm,
        fontWeight: '700',
    },
    message: {
        ...typography.bodySmall,
        color: '#6B7280',
        textAlign: 'center',
        maxWidth: 280,
    },
    action: {
        marginTop: spacing.xl,
    },
});
