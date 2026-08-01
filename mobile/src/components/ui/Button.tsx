/**
 * Button — Premium glassmorphism button with deep blue gradient + haptic feedback
 */
import React from 'react';
import {
    Pressable, Text, StyleSheet, ActivityIndicator,
    ViewStyle, TextStyle, View, Platform, Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
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
    testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
    title, onPress, variant = 'primary', size = 'md',
    loading = false, disabled = false, icon, style, haptic = true, testID,
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
        if (haptic && Platform.OS === 'android') {
            Vibration.vibrate(30); // short click-feel vibration
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
                testID={testID}
                onPress={handlePress}
                disabled={isDisabled}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[styles.pressableArea, sizeStyles[size]]}
            >
                {variant === 'primary' ? (
                    <LinearGradient
                        colors={['#2196F3', '#1565C0', '#0D47A1']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                ) : variant === 'secondary' ? (
                    <>
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <LinearGradient
                            colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.06)']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                    </>
                ) : variant === 'outline' ? (
                    <BlurView intensity={15} tint="dark" style={[StyleSheet.absoluteFill, styles.glassBorder]} />
                ) : null}

                <View style={styles.contentRow}>
                    {loading ? (
                        <ActivityIndicator
                            size="small"
                            color={variant === 'outline' || variant === 'ghost' ? colors.primary[400] : colors.white}
                        />
                    ) : (
                        <>
                            {icon}
                            {title ? <Text style={textStyle}>{title}</Text> : null}
                        </>
                    )}
                </View>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    base: { borderRadius: borderRadius.xl, overflow: 'hidden' },
    pressableArea: { width: '100%', justifyContent: 'center', alignItems: 'center' },
    contentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, zIndex: 1 },
    glassBorder: { borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.glass.borderHighlight },
    text: { ...typography.button },
    disabled: { opacity: 0.45 },
});

const sizeStyles: Record<string, ViewStyle> = {
    sm: { paddingHorizontal: spacing.lg,  paddingVertical: spacing.sm,  minHeight: 36 },
    md: { paddingHorizontal: spacing.xl,  paddingVertical: spacing.md,  minHeight: 50 },
    lg: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg,  minHeight: 58 },
};

const textSizeStyles: Record<string, TextStyle> = {
    sm: { fontSize: 13 }, md: { fontSize: 16 }, lg: { fontSize: 18 },
};

const variantContainerStyles: Record<string, ViewStyle> = {
    primary: {
        shadowColor: 'rgba(33,150,243,0.6)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 18,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(79,179,255,0.35)',
    },
    secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.primary[400],
    },
    ghost: { backgroundColor: 'transparent' },
};

const variantTextStyles: Record<string, TextStyle> = {
    primary:   { color: colors.white, fontWeight: '700' },
    secondary: { color: colors.white },
    outline:   { color: colors.primary[400] },
    ghost:     { color: colors.primary[400] },
};
