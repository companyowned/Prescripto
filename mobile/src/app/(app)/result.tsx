/**
 * Result route — full prescription analysis
 * Auto-prompts lab upload when follow-up lab requests are detected.
 */

import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, SafeAreaView, Platform, Alert, View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Loader, GlassBackground } from '../../components/ui';
import {
    PrescriptionHeader,
    DoctorFacilityCard,
    DiagnosisCard,
    MedicationList,
    FollowUpRequestsCard,
} from '../../components/prescription';
import { colors, spacing } from '../../theme';
import { usePrescription, useLinkedDocuments } from '../../features/prescriptions/hooks';
import { useActiveProfile } from '../../contexts/profile-context';

export default function ResultScreen() {
    const router = useRouter();
    const { documentId, fromProcessing } = useLocalSearchParams<{
        documentId: string;
        fromProcessing?: string;
    }>();
    const { activeProfile } = useActiveProfile();
    const { data: prescription, isLoading, error } = usePrescription(
        documentId || '',
        activeProfile?.id
    );
    const { data: linkedDocs } = useLinkedDocuments(documentId || '');
    const labPromptShown = useRef(false);

    const followUpRequests = prescription?.follow_up_requests || [];
    const labRequests = followUpRequests.filter((r) => r.kind === 'lab');

    const openFollowUpUpload = (purpose: 'lab_result' | 'radiology_report') => {
        if (!prescription?.document_id) return;
        router.push({
            pathname: '/(app)/upload',
            params: { purpose, parentDocumentId: prescription.document_id },
        });
    };

    const openLabScan = () => {
        if (!prescription?.document_id) return;
        router.push({
            pathname: '/(app)/scan',
            params: { purpose: 'lab_result', parentDocumentId: prescription.document_id },
        });
    };

    // Auto-prompt lab upload when arriving from processing and labs are detected
    useEffect(() => {
        if (
            labPromptShown.current ||
            !prescription ||
            !fromProcessing ||
            labRequests.length === 0
        ) {
            return;
        }
        labPromptShown.current = true;

        const labNames = labRequests.map((r) => r.name).filter(Boolean);
        const labList =
            labNames.length <= 3
                ? labNames.join(', ')
                : `${labNames.slice(0, 3).join(', ')} +${labNames.length - 3} more`;

        Alert.alert(
            '🧪 Lab Tests Detected',
            `This prescription includes lab requests:\n\n${labList}\n\nWould you like to upload or scan your lab results now?`,
            [
                {
                    text: 'Upload PDF',
                    onPress: () => openFollowUpUpload('lab_result'),
                },
                {
                    text: 'Scan Results',
                    onPress: openLabScan,
                },
                { text: 'Later', style: 'cancel' },
            ]
        );
    }, [prescription, fromProcessing, labRequests]);

    if (isLoading) {
        return (
            <GlassBackground>
                <Loader fullScreen message="Loading results..." />
            </GlassBackground>
        );
    }

    if (error || !prescription) {
        return (
            <GlassBackground>
                <SafeAreaView style={styles.container}>
                    <Loader fullScreen={false} message="Could not load prescription data" />
                    <Button title="Go Home" onPress={() => router.replace('/(app)/home')} variant="outline" style={styles.homeBtn} />
                </SafeAreaView>
            </GlassBackground>
        );
    }

    return (
        <GlassBackground>
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <Button title="← Back" onPress={() => router.back()} variant="ghost" size="sm" style={styles.backBtn} />

                    <PrescriptionHeader
                        documentId={prescription.document_id}
                        confidence={prescription.confidence_score}
                        createdAt={prescription.created_at}
                    />

                    <DoctorFacilityCard
                        doctorName={prescription.doctor?.name}
                        doctorLicense={prescription.doctor?.license_no}
                        facilityName={prescription.facility?.name}
                        facilityAddress={prescription.facility?.address}
                    />

                    <DiagnosisCard diagnosis={prescription.diagnosis_text} />

                    <MedicationList
                        medications={prescription.medications.map((m) => ({
                            id: m.id,
                            name: m.name,
                            dose: m.dose,
                            frequency: m.frequency,
                            duration: m.duration,
                            notes: m.notes,
                        }))}
                    />

                    <FollowUpRequestsCard
                        requests={followUpRequests}
                        onUploadLab={() => openFollowUpUpload('lab_result')}
                        onScanLab={openLabScan}
                        onUploadRadiology={() => openFollowUpUpload('radiology_report')}
                    />

                    {linkedDocs && linkedDocs.length > 0 && (
                        <View style={styles.linkedCard}>
                            {/* Header */}
                            <View style={styles.linkedHeader}>
                                <View style={styles.linkedHeaderIcon}>
                                    <Ionicons name="git-merge-outline" size={18} color="#10B981" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.linkedTitle}>Care Journey</Text>
                                    <Text style={styles.linkedSubtitle}>
                                        {linkedDocs.length} result{linkedDocs.length > 1 ? 's' : ''} linked to this prescription
                                    </Text>
                                </View>
                            </View>

                            {/* Timeline */}
                            <View style={styles.timeline}>
                                {/* Prescription anchor node */}
                                <View style={styles.timelineRow}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[styles.timelineDot, { backgroundColor: '#4FB3FF' }]}>
                                            <Ionicons name="document-text" size={11} color="#FFF" />
                                        </View>
                                        <View style={styles.timelineBar} />
                                    </View>
                                    <View style={[styles.timelineNode, { borderColor: '#4FB3FF30' }]}>
                                        <View style={styles.timelineNodeTop}>
                                            <View style={[styles.timelineNodeBadge, { backgroundColor: '#4FB3FF20' }]}>
                                                <Ionicons name="document-text" size={10} color="#4FB3FF" />
                                                <Text style={[styles.timelineNodeBadgeText, { color: '#4FB3FF' }]}>Rx</Text>
                                            </View>
                                            <Text style={styles.timelineNodeDate}>
                                                {new Date(prescription.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </Text>
                                        </View>
                                        <Text style={styles.timelineNodeLabel}>This Prescription</Text>
                                    </View>
                                </View>

                                {linkedDocs.map((doc, idx) => {
                                    const isLab = doc.purpose === 'lab_result';
                                    const color = isLab ? '#10B981' : '#A78BFA';
                                    const icon = isLab ? 'flask' : 'radio-outline';
                                    const typeLabel = isLab ? 'Lab' : 'Scan';
                                    const typeTitle = isLab ? 'Lab Results' : 'Radiology Report';
                                    const isLast = idx === linkedDocs.length - 1;
                                    const date = new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                                    return (
                                        <View key={doc.id} style={styles.timelineRow}>
                                            <View style={styles.timelineLeft}>
                                                <View style={[styles.timelineDot, { backgroundColor: color }]}>
                                                    <Ionicons name={icon as any} size={11} color="#FFF" />
                                                </View>
                                                {!isLast && <View style={styles.timelineBar} />}
                                            </View>
                                            <TouchableOpacity
                                                style={[styles.timelineNode, { borderColor: color + '30' }]}
                                                onPress={() => router.push({ pathname: '/(app)/result', params: { documentId: doc.id } })}
                                                activeOpacity={0.75}
                                            >
                                                <LinearGradient colors={[color + '12', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                                                <View style={styles.timelineNodeTop}>
                                                    <View style={[styles.timelineNodeBadge, { backgroundColor: color + '20' }]}>
                                                        <Ionicons name={icon as any} size={10} color={color} />
                                                        <Text style={[styles.timelineNodeBadgeText, { color }]}>{typeLabel}</Text>
                                                    </View>
                                                    <Text style={styles.timelineNodeDate}>{date}</Text>
                                                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.35)" />
                                                </View>
                                                <Text style={styles.timelineNodeLabel}>{typeTitle}</Text>
                                                {doc.original_filename && (
                                                    <Text style={styles.timelineNodeSub} numberOfLines={1}>{doc.original_filename}</Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>

                            <TouchableOpacity style={styles.linkedAddBtn} onPress={() => openFollowUpUpload('lab_result')}>
                                <Ionicons name="add-circle-outline" size={16} color={colors.primary[300]} />
                                <Text style={styles.linkedAddText}>Add Lab / Radiology Result</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <Button title="Done" onPress={() => router.replace('/(app)/home')} size="lg" style={styles.doneBtn} />
                </ScrollView>
            </SafeAreaView>
        </GlassBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    scroll: { paddingHorizontal: spacing.xl, paddingTop: Platform.OS === 'ios' ? 10 : 30, paddingBottom: spacing.xxxl },
    backBtn: { alignSelf: 'flex-start', marginBottom: spacing.md },
    homeBtn: { alignSelf: 'center', marginTop: spacing.lg },
    doneBtn: { marginTop: spacing.xl },
    linkedCard: {
        marginTop: spacing.md,
        backgroundColor: 'rgba(255,255,255,0.55)',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.25)',
    },
    linkedHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 },
    linkedHeaderIcon: {
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: 'rgba(16,185,129,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    linkedTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    linkedSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
    timeline: {},
    timelineRow: { flexDirection: 'row', gap: 12 },
    timelineLeft: { alignItems: 'center', width: 26 },
    timelineDot: {
        width: 26, height: 26, borderRadius: 13,
        alignItems: 'center', justifyContent: 'center',
        zIndex: 1,
    },
    timelineBar: {
        width: 2, flex: 1, minHeight: 12,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginTop: 2,
    },
    timelineNode: {
        flex: 1, borderRadius: 14, borderWidth: 1,
        padding: 12, marginBottom: 8, overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    timelineNodeTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    timelineNodeBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    },
    timelineNodeBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
    timelineNodeLabel: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
    timelineNodeDate: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600', flex: 1, textAlign: 'right' },
    timelineNodeSub: { fontSize: 11, color: 'rgba(255,255,255,0.50)', marginTop: 2 },
    linkedAddBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginTop: 4, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.10)',
        justifyContent: 'center',
    },
    linkedAddText: { fontSize: 13, fontWeight: '700', color: colors.primary[300] },
});
