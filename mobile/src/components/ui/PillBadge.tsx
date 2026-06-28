import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'active' | 'paused';

const VARIANT_MAP: Record<BadgeVariant, { bg: string; border: string; text: string; icon: string }> = {
    success: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', text: '#34D399', icon: 'checkmark-circle' },
    warning: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', text: '#FCD34D', icon: 'alert-circle' },
    error:   { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.35)',  text: '#F87171', icon: 'close-circle' },
    info:    { bg: 'rgba(79,179,255,0.15)', border: 'rgba(79,179,255,0.35)', text: '#4FB3FF', icon: 'information-circle' },
    neutral: { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.15)', text: 'rgba(255,255,255,0.6)', icon: 'ellipse' },
    active:  { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', text: '#34D399', icon: 'radio-button-on' },
    paused:  { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', text: '#FCD34D', icon: 'pause-circle' },
};

interface PillBadgeProps {
    label: string;
    variant?: BadgeVariant;
    showIcon?: boolean;
    style?: ViewStyle;
}

export const PillBadge: React.FC<PillBadgeProps> = ({
    label,
    variant = 'info',
    showIcon = true,
    style,
}) => {
    const v = VARIANT_MAP[variant];
    return (
        <View style={[styles.badge, { backgroundColor: v.bg, borderColor: v.border }, style]}>
            {showIcon && (
                <Ionicons name={v.icon as any} size={11} color={v.text} />
            )}
            <Text style={[styles.label, { color: v.text }]}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});
