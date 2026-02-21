/**
 * Button — Premium reusable button component
 */

import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
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
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    style,
}) => {
    const isDisabled = disabled || loading;

    const containerStyle: ViewStyle = {
        ...styles.base,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...(isDisabled && styles.disabled),
        ...style,
    };

    const textStyle: TextStyle = {
        ...styles.text,
        ...textSizeStyles[size],
        ...variantTextStyles[variant],
    };

    return (
        <TouchableOpacity
            style={containerStyle}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'outline' || variant === 'ghost' ? colors.primary[500] : colors.white}
                />
            ) : (
                <>
                    {icon}
                    <Text style={textStyle}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    text: {
        ...typography.button,
    },
    disabled: {
        opacity: 0.5,
    },
});

const sizeStyles: Record<string, ViewStyle> = {
    sm: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, minHeight: 36 },
    md: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, minHeight: 48 },
    lg: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, minHeight: 56 },
};

const textSizeStyles: Record<string, TextStyle> = {
    sm: { fontSize: 13 },
    md: { fontSize: 16 },
    lg: { fontSize: 18 },
};

const variantStyles: Record<string, ViewStyle> = {
    primary: { backgroundColor: colors.primary[500] },
    secondary: { backgroundColor: colors.secondary[500] },
    outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary[500] },
    ghost: { backgroundColor: 'transparent' },
};

const variantTextStyles: Record<string, TextStyle> = {
    primary: { color: colors.white },
    secondary: { color: colors.white },
    outline: { color: colors.primary[500] },
    ghost: { color: colors.primary[500] },
};
