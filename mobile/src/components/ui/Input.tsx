/**
 * Input — Text input with label and error support
 */

import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
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
    ...props
}) => {
    const [focused, setFocused] = useState(false);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    focused && styles.inputFocused,
                    error && styles.inputError,
                    style,
                ]}
                placeholderTextColor={colors.dark.textMuted}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                {...props}
            />
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
        color: colors.dark.textSecondary,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.dark.surface,
        borderWidth: 1.5,
        borderColor: colors.dark.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        color: colors.dark.textPrimary,
        ...typography.body,
    },
    inputFocused: {
        borderColor: colors.primary[500],
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
