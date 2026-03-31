/**
 * Input — Text input with label and error support, styled for glassmorphism
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
                ['rgba(255, 255, 255, 0.2)', colors.primary[300]]
            ),
            shadowOpacity: glow.value * 0.8,
            elevation: glow.value * 4,
        };
    });

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <Animated.View style={[
                styles.inputContainer,
                animatedStyle,
                error && styles.inputError
            ]}>
                <TextInput
                    style={[styles.input, style, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
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
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        fontWeight: '600',
    },
    inputContainer: {
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'transparent',
        backgroundColor: 'rgba(31, 163, 198, 0.15)', // Matching blue shade replacing BlurView
        shadowColor: colors.primary[300],
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 10,
    },
    input: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        color: colors.textPrimary,
        ...typography.body,
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
