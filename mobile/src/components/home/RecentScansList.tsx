import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PrescriptionListItem } from '../../../src/features/prescriptions/types';

interface RecentScansListProps {
    scans: PrescriptionListItem[];
    onScanPress: (documentId: string) => void;
    onSeeAllPress: () => void;
}

export const RecentScansList: React.FC<RecentScansListProps> = ({
    scans,
    onScanPress,
    onSeeAllPress,
}) => {
    return (
        <View>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Scans</Text>
                <TouchableOpacity onPress={onSeeAllPress}>
                    <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.listContainer}>
                {scans.length === 0 ? (
                    <Text style={styles.emptyText}>No recent scans found.</Text>
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
                                <View style={styles.listIconContainer}>
                                    <Ionicons name="document-text" size={22} color="#0EA5E9" />
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
                                    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
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
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#111827',
        fontSize: 18,
        fontWeight: '700',
    },
    seeAllText: {
        color: '#0EA5E9',
        fontSize: 14,
        fontWeight: '600',
    },
    listContainer: {
        gap: 12,
    },
    emptyText: {
        color: '#9BA6B3',
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 20,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    listIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#E0F2FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    listTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    listTitle: {
        color: '#111827',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    listSubtitle: {
        color: '#6B7280',
        fontSize: 12,
    },
    listRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tagProcessed: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tagText: {
        color: '#10B981',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
