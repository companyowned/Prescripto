/**
 * Button — Premium reusable button with glassmorphism + haptic feedback
 */
import React from 'react';
import {
    Pressable, Text, StyleSheet, ActivityIndicator,
    ViewStyle, TextStyle, View, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    haptic?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title, onPress, variant = 'primary', size = 'md',
    loading = false, disabled = false, icon, style, haptic = true,
}) => {
    const isDisabled = disabled || loading;
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const handlePressIn = () => {
        if (!isDisabled) scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    };

    const handlePressOut = () => {
        if (!isDisabled) scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    };

    const handlePress = () => {
        if (haptic && Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
    };

    const containerStyle: ViewStyle = {
        ...styles.base,
        ...variantContainerStyles[variant],
        ...(isDisabled && styles.disabled),
        ...style,
    };

    const textStyle: TextStyle = {
        ...styles.text,
        ...textSizeStyles[size],
        ...variantTextStyles[variant],
    };

    return (
        <Animated.View style={[containerStyle, animatedStyle]}>
            <Pressable
                onPress={handlePress}
                disabled={isDisabled}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[styles.pressableArea, sizeStyles[size]]}
            >
                {variant === 'primary' ? (
                    <LinearGradient
                        colors={[...colors.gradient.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                ) : variant === 'secondary' || variant === 'outline' ? (
                    <BlurView intensity={15} tint="light" style={[StyleSheet.absoluteFill, styles.glassBorder]} />
                ) : null}

                <View style={styles.contentRow}>
                    {loading ? (
                        <ActivityIndicator
                            size="small"
                            color={variant === 'outline' || variant === 'ghost' ? colors.primary[300] : colors.white}
                        />
                    ) : (
                        <>
                            {icon}
                            <Text style={textStyle}>{title}</Text>
                        </>
                    )}
                </View>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    base: { borderRadius: borderRadius.md, overflow: 'hidden' },
    pressableArea: { width: '100%', justifyContent: 'center', alignItems: 'center' },
    contentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, zIndex: 1 },
    glassBorder: { borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.glass.border },
    text: { ...typography.button },
    disabled: { opacity: 0.5 },
});

const sizeStyles: Record<string, ViewStyle> = {
    sm: { paddingHorizontal: spacing.lg,  paddingVertical: spacing.sm,  minHeight: 36 },
    md: { paddingHorizontal: spacing.xl,  paddingVertical: spacing.md,  minHeight: 48 },
    lg: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg,  minHeight: 56 },
};

const textSizeStyles: Record<string, TextStyle> = {
    sm: { fontSize: 13 }, md: { fontSize: 16 }, lg: { fontSize: 18 },
};

const variantContainerStyles: Record<string, ViewStyle> = {
    primary: {
        shadowColor: colors.glass.glow, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8, shadowRadius: 15, elevation: 8,
        borderWidth: 1, borderColor: colors.glass.borderHighlight,
    },
    secondary: { backgroundColor: 'transparent' },
    outline:   { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary[300] },
    ghost:     { backgroundColor: 'transparent' },
};

const variantTextStyles: Record<string, TextStyle> = {
    primary:   { color: colors.white },
    secondary: { color: colors.white },
    outline:   { color: colors.primary[300] },
    ghost:     { color: colors.primary[300] },
};
