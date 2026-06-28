/**
 * InsightCard — KPI card for the insights dashboard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

interface InsightCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    iconColor: string;
    iconBg: string;
    trend?: 'up' | 'down' | 'neutral';
}

export const InsightCard: React.FC<InsightCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    iconColor,
    iconBg,
    trend,
}) => {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
                    <Ionicons name={icon as any} size={20} color={iconColor} />
                </View>
                {trend && trend !== 'neutral' && (
                    <Ionicons
                        name={trend === 'up' ? 'trending-up' : 'trending-down'}
                        size={18}
                        color={trend === 'up' ? '#10B981' : '#EF4444'}
                    />
                )}
            </View>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.glass.background,
        borderRadius: 16,
        padding: 16,
        width: '48%',
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    value: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    subtitle: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2,
    },
});
