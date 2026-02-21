/**
 * Card — Elevated card container with dark theme support
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';

interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'elevated' | 'outlined';
    style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, variant = 'default', style }) => {
    return (
        <View style={[styles.base, variantStyles[variant], style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
    },
});

const variantStyles: Record<string, ViewStyle> = {
    default: {
        backgroundColor: colors.dark.surface,
    },
    elevated: {
        backgroundColor: colors.dark.surfaceElevated,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.dark.border,
    },
};
