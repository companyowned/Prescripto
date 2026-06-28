/**
 * Card — Dark glassmorphism elevated card container
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
                intensity={20}
                tint="dark"
                style={[StyleSheet.absoluteFill, styles.blur]}
            />
            <LinearGradient
                colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: borderRadius.xl }]}
            />
            <View style={[styles.content, variantStyles[variant].content]}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glass.border,
        backgroundColor: colors.glass.background,
    },
    blur: {
        borderRadius: borderRadius.xl,
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
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.5,
            shadowRadius: 24,
            elevation: 12,
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
