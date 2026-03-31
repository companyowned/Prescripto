/**
 * DoctorFacilityCard — Displays doctor and facility info
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface DoctorFacilityCardProps {
    doctorName?: string | null;
    doctorLicense?: string | null;
    facilityName?: string | null;
    facilityAddress?: string | null;
}

export const DoctorFacilityCard: React.FC<DoctorFacilityCardProps> = ({
    doctorName,
    doctorLicense,
    facilityName,
    facilityAddress,
}) => {
    return (
        <Card variant="elevated" style={styles.card}>
            {/* Doctor Section */}
            <View style={styles.section}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>🩺</Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.label}>Doctor</Text>
                    <Text style={styles.value}>{doctorName || 'Not identified'}</Text>
                    {doctorLicense && (
                        <Text style={styles.sublabel}>License: {doctorLicense}</Text>
                    )}
                </View>
            </View>

            <View style={styles.divider} />

            {/* Facility Section */}
            <View style={styles.section}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>🏥</Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.label}>Facility</Text>
                    <Text style={styles.value}>{facilityName || 'Not identified'}</Text>
                    {facilityAddress && (
                        <Text style={styles.sublabel}>{facilityAddress}</Text>
                    )}
                </View>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: spacing.lg,
    },
    section: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 22,
    },
    info: {
        flex: 1,
    },
    label: {
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: '700',
    },
    value: {
        ...typography.body,
        color: colors.white,
        fontWeight: '700',
    },
    sublabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: colors.glass.border,
        marginVertical: spacing.md,
    },
});
