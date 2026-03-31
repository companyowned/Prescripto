import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors } from '../../theme';
import { EmptyState } from '../ui';
import type { PrescriptionListItem } from '../../../src/features/prescriptions/types';

interface RecentScansListProps {
    scans: PrescriptionListItem[];
    onScanPress: (documentId: string) => void;
    onSeeAllPress: () => void;
    onNewScanPress?: () => void;
}

export const RecentScansList: React.FC<RecentScansListProps> = ({
    scans,
    onScanPress,
    onSeeAllPress,
    onNewScanPress,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Scans</Text>
                {scans.length > 0 && (
                    <TouchableOpacity onPress={onSeeAllPress}>
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.listContainer}>
                {scans.length === 0 ? (
                    <EmptyState
                        title="No prescriptions scanned yet"
                        message="Start by scanning your first prescription to manage your records intelligently."
                        icon={<Ionicons name="document-text-outline" size={32} color={colors.primary[300]} />}
                        actionTitle="Scan First Prescription"
                        onAction={onNewScanPress}
                    />
                ) : (
                    scans.map((scan) => {
                        const date = new Date(scan.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        });
                        return (
                            <TouchableOpacity
                                key={scan.id}
                                style={styles.listItem}
                                onPress={() => onScanPress(scan.document_id)}
                            >
                                <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
                                <View style={styles.listContent}>
                                    <View style={styles.listIconContainer}>
                                        <Ionicons name="document-text" size={22} color={colors.primary[300]} />
                                    </View>
                                    <View style={styles.listTextContainer}>
                                        <Text style={styles.listTitle} numberOfLines={1}>
                                            {scan.doctor_name || scan.diagnosis_text || 'Unknown Scan'}
                                        </Text>
                                        <Text style={styles.listSubtitle}>
                                            {scan.facility_name || 'Prescription'} • {date}
                                        </Text>
                                    </View>
                                    <View style={styles.listRight}>
                                        <View style={styles.tagProcessed}>
                                            <Text style={styles.tagText}>PROCESSED</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color="rgba(255, 255, 255, 0.4)" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    seeAllText: {
        color: colors.primary[300],
        fontSize: 14,
        fontWeight: '600',
    },
    listContainer: {
        gap: 12,
    },
    listItem: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
        backgroundColor: colors.glass.background,
    },
    listContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    listIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    listTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    listTitle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    listSubtitle: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    listRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tagProcessed: {
        backgroundColor: 'rgba(62, 219, 240, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.primary[400],
    },
    tagText: {
        color: colors.primary[300],
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
