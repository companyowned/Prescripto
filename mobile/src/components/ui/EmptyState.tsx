/**
 * EmptyState — Placeholder for empty lists/screens
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
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
            <BlurView intensity={20} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} />
            
            <View style={styles.content}>
                {icon && <View style={styles.iconWrapper}>{icon}</View>}
                <Text style={styles.title}>{title}</Text>
                {message && <Text style={styles.message}>{message}</Text>}
                {actionTitle && onAction && (
                    <Button
                        title={actionTitle}
                        onPress={onAction}
                        variant="primary" // Changed to primary for better CTA
                        size="md"
                        style={styles.action}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: spacing.lg,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
        backgroundColor: colors.glass.background,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
    },
    content: {
        padding: spacing.xxl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconWrapper: {
        marginBottom: spacing.md,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.glass.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
    },
    title: {
        ...typography.h3,
        color: colors.white,
        textAlign: 'center',
        marginBottom: spacing.xs,
        fontWeight: '800',
    },
    message: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        textAlign: 'center',
        maxWidth: 260,
        lineHeight: 20,
    },
    action: {
        marginTop: spacing.xl,
        width: '100%',
    },
});
