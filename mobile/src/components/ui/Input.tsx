/**
 * Input — Text input with label and error support, styled for dark glassmorphism
 */

import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextInputProps, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolateColor } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    containerStyle,
    style,
    onFocus,
    onBlur,
    ...props
}) => {
    const [focused, setFocused] = useState(false);
    const glow = useSharedValue(0);

    const handleFocus = (e: any) => {
        setFocused(true);
        glow.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) });
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e: any) => {
        setFocused(false);
        glow.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.ease) });
        if (onBlur) onBlur(e);
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            borderColor: interpolateColor(
                glow.value,
                [0, 1],
                [colors.glass.border, colors.primary[400]]
            ),
            shadowOpacity: glow.value * 0.7,
            elevation: glow.value * 5,
        };
    });

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <Animated.View style={[
                styles.inputContainer,
                animatedStyle,
                error && styles.inputError,
            ]}>
                <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
                <TextInput
                    style={[styles.input, style, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />
            </Animated.View>
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    label: {
        ...typography.label,
        color: 'rgba(255,255,255,0.80)',
        marginBottom: spacing.xs,
        fontWeight: '600',
    },
    inputContainer: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: colors.glass.border,
        backgroundColor: colors.glass.inputBg,
        shadowColor: colors.primary[400],
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 12,
    },
    input: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        color: colors.white,
        ...typography.body,
        zIndex: 1,
    },
    inputError: {
        borderColor: colors.error,
    },
    error: {
        ...typography.caption,
        color: colors.error,
        marginTop: spacing.xs,
    },
});
