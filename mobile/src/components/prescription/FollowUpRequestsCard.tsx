/**
 * FollowUpRequestsCard — Next-step actions for lab and radiology requests
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../ui';
import { colors, spacing, typography, borderRadius } from '../../theme';
import type { FollowUpRequestType } from '../../features/prescriptions/types';

interface FollowUpRequestsCardProps {
    requests: FollowUpRequestType[];
    onUploadLab: () => void;
    onScanLab: () => void;
    onUploadRadiology: () => void;
}

const requestSummary = (requests: FollowUpRequestType[], kind: FollowUpRequestType['kind']) => {
    const names = requests
        .filter((request) => request.kind === kind)
        .map((request) => request.name)
        .filter(Boolean);

    if (names.length === 0) return '';
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
};

export const FollowUpRequestsCard: React.FC<FollowUpRequestsCardProps> = ({
    requests,
    onUploadLab,
    onScanLab,
    onUploadRadiology,
}) => {
    const hasLabRequests = requests.some((request) => request.kind === 'lab');
    const hasRadiologyRequests = requests.some((request) => request.kind === 'radiology');

    if (!hasLabRequests && !hasRadiologyRequests) {
        return null;
    }

    return (
        <Card variant="elevated" style={styles.card}>
            <View style={styles.header}>
                <View style={styles.iconFrame}>
                    <Ionicons name="git-branch-outline" size={20} color={colors.primary[300]} />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.label}>Follow-up requests</Text>
                    <Text style={styles.title}>Complete the ordered results</Text>
                </View>
            </View>

            {hasLabRequests && (
                <View style={styles.section}>
                    <View style={styles.rowHeader}>
                        <Ionicons name="flask-outline" size={18} color={colors.primary[300]} />
                        <View style={styles.rowText}>
                            <Text style={styles.sectionTitle}>Laboratory tests</Text>
                            <Text style={styles.summary} numberOfLines={2}>
                                {requestSummary(requests, 'lab')}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.actions}>
                        <Button
                            title="Upload PDF"
                            onPress={onUploadLab}
                            variant="outline"
                            size="sm"
                            style={styles.actionButton}
                            icon={<Ionicons name="document-attach-outline" size={16} color={colors.primary[300]} />}
                        />
                        <Button
                            title="Scan Results"
                            onPress={onScanLab}
                            variant="secondary"
                            size="sm"
                            style={styles.actionButton}
                            icon={<Ionicons name="camera-outline" size={16} color={colors.white} />}
                        />
                    </View>
                </View>
            )}

            {hasRadiologyRequests && (
                <View style={styles.section}>
                    <View style={styles.rowHeader}>
                        <Ionicons name="scan-outline" size={18} color={colors.primary[300]} />
                        <View style={styles.rowText}>
                            <Text style={styles.sectionTitle}>Radiology report</Text>
                            <Text style={styles.summary} numberOfLines={2}>
                                {requestSummary(requests, 'radiology')}
                            </Text>
                        </View>
                    </View>
                    <Button
                        title="Upload Report"
                        onPress={onUploadRadiology}
                        variant="outline"
                        size="sm"
                        style={styles.fullButton}
                        icon={<Ionicons name="cloud-upload-outline" size={16} color={colors.primary[300]} />}
                    />
                </View>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: { marginBottom: spacing.lg },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
    iconFrame: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(62, 219, 240, 0.14)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
    },
    headerText: { flex: 1 },
    label: { ...typography.caption, color: colors.primary[300], fontWeight: '700', textTransform: 'uppercase' },
    title: { ...typography.h3, color: colors.white, fontWeight: '700' },
    section: {
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.glass.border,
        gap: spacing.md,
    },
    rowHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
    rowText: { flex: 1 },
    sectionTitle: { ...typography.label, color: colors.white, fontWeight: '700' },
    summary: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    actions: { flexDirection: 'row', gap: spacing.sm },
    actionButton: { flex: 1 },
    fullButton: { alignSelf: 'stretch' },
});
