/**
 * Card — Glassmorphism elevated card container
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing, borderRadius } from '../../theme';

interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'elevated' | 'outlined';
    style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, variant = 'default', style }) => {
    return (
        <View style={[styles.container, variantStyles[variant].container, style]}>
            <BlurView
                intensity={15}
                tint="dark"
                style={[StyleSheet.absoluteFill, styles.blur]}
            />
            <View style={[styles.content, variantStyles[variant].content]}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glass.border,
        backgroundColor: colors.glass.background, // fallback/base
    },
    blur: {
        borderRadius: borderRadius.lg,
    },
    content: {
        padding: spacing.lg,
    },
});

const variantStyles: Record<string, { container: ViewStyle; content: ViewStyle }> = {
    default: {
        container: {},
        content: {},
    },
    elevated: {
        container: {
            borderColor: colors.glass.borderHighlight,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
            elevation: 10,
        },
        content: {},
    },
    outlined: {
        container: {
            backgroundColor: 'transparent',
            borderColor: colors.glass.borderHighlight,
        },
        content: {},
    },
};
