/**
 * Result route — full prescription analysis
 * Auto-prompts lab upload when follow-up lab requests are detected.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    Platform,
    Alert,
    View,
    Text,
    TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Loader, GlassBackground } from '../../components/ui';
import {
    PrescriptionHeader,
    DoctorFacilityCard,
    DiagnosisCard,
    MedicationList,
    LabResultsCard,
    ScanReportCard,
    FollowUpRequestsCard,
} from '../../components/prescription';
import { colors, spacing } from '../../theme';
import { usePrescription, useLinkedDocuments } from '../../features/prescriptions/hooks';
import { useDocument } from '../../features/documents/hooks';
import { useActiveProfile } from '../../contexts/profile-context';
import { authService } from '../../services/auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://prescripto-taupe-ten.vercel.app/api/v1';
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

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
    const { data: sourceDoc } = useDocument(documentId || '');
    const labPromptShown = useRef(false);
    const [showScanModal, setShowScanModal] = useState(false);
    const [authToken, setAuthToken] = useState<string | null>(null);

    useEffect(() => {
        authService.getToken().then(t => setAuthToken(t ?? null));
    }, []);

    const fileUrl = authToken
        ? `${API_BASE_URL}/documents/${documentId}/file`
        : null;
    const imageHeaders = authToken
        ? { Authorization: `Bearer ${authToken}` }
        : undefined;

    const followUpRequests = prescription?.follow_up_requests || [];
    const labRequests = followUpRequests.filter((r) => r.kind === 'lab');

    const openFollowUpUpload = useCallback((purpose: 'lab_result' | 'radiology_report') => {
        if (!prescription?.document_id) return;
        router.push({
            pathname: '/(app)/upload',
            params: { purpose, parentDocumentId: prescription.document_id },
        });
    }, [prescription?.document_id, router]);

    const openLabScan = useCallback(() => {
        if (!prescription?.document_id) return;
        router.push({
            pathname: '/(app)/scan',
            params: { purpose: 'lab_result', parentDocumentId: prescription.document_id },
        });
    }, [prescription?.document_id, router]);

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
    }, [prescription, fromProcessing, labRequests, openFollowUpUpload, openLabScan]);

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

                    {/* ── Original Scan Card ── */}
                    {sourceDoc && fileUrl && (
                        <View style={styles.scanCard}>
                            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                            <LinearGradient
                                colors={['rgba(31,163,198,0.15)', 'rgba(31,163,198,0.04)']}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            />

                            {/* Card Header */}
                            <View style={styles.scanCardHeader}>
                                <View style={styles.scanCardIconBox}>
                                    <Ionicons
                                        name={sourceDoc.file_type === 'image' ? 'camera' : 'document-text'}
                                        size={16}
                                        color={colors.primary[300]}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.scanCardTitle}>Original Document</Text>
                                    <Text style={styles.scanCardMeta}>
                                        {sourceDoc.file_type === 'image' ? 'Photo scan' : 'PDF document'}
                                        {' · '}
                                        {new Date(sourceDoc.created_at).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric',
                                        })}
                                    </Text>
                                </View>
                                <View style={[
                                    styles.scanTypeBadge,
                                    sourceDoc.file_type === 'image'
                                        ? { backgroundColor: 'rgba(31,163,198,0.20)' }
                                        : { backgroundColor: 'rgba(167,139,250,0.20)' },
                                ]}>
                                    <Text style={[
                                        styles.scanTypeBadgeText,
                                        { color: sourceDoc.file_type === 'image' ? colors.primary[300] : '#A78BFA' },
                                    ]}>
                                        {sourceDoc.file_type === 'image' ? 'IMG' : 'PDF'}
                                    </Text>
                                </View>
                            </View>

                            {/* Preview */}
                            {sourceDoc.file_type === 'image' ? (
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={() => setShowScanModal(true)}
                                    style={styles.scanThumbWrapper}
                                >
                                    <Image
                                        source={{ uri: fileUrl, headers: imageHeaders }}
                                        style={styles.scanThumb}
                                        resizeMode="cover"
                                    />
                                    {/* Gradient overlay at bottom */}
                                    <LinearGradient
                                        colors={['transparent', 'rgba(4,13,18,0.80)']}
                                        style={styles.scanThumbOverlay}
                                        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                                    >
                                        <Ionicons name="expand-outline" size={18} color="#FFF" />
                                        <Text style={styles.scanThumbOverlayText}>Tap to view full scan</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.pdfPlaceholder}>
                                    <Ionicons name="document-text-outline" size={44} color={colors.primary[300]} />
                                    <Text style={styles.pdfFilename} numberOfLines={2}>
                                        {sourceDoc.original_filename || 'PDF Document'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* ── Full-screen Scan Modal ── */}
                    <Modal
                        visible={showScanModal}
                        transparent
                        animationType="fade"
                        statusBarTranslucent
                        onRequestClose={() => setShowScanModal(false)}
                    >
                        <View style={styles.modalBg}>
                            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />

                            {/* Top bar */}
                            <SafeAreaView style={styles.modalTopBar}>
                                <View style={styles.modalTitleRow}>
                                    <Ionicons name="camera" size={16} color={colors.primary[300]} />
                                    <Text style={styles.modalTitle} numberOfLines={1}>
                                        {sourceDoc?.original_filename || 'Original Scan'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.modalCloseBtn}
                                    onPress={() => setShowScanModal(false)}
                                    hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                                >
                                    <Ionicons name="close" size={22} color="#FFF" />
                                </TouchableOpacity>
                            </SafeAreaView>

                            {/* Image */}
                            {fileUrl && (
                                <Image
                                    source={{ uri: fileUrl, headers: imageHeaders }}
                                    style={styles.modalImage}
                                    resizeMode="contain"
                                />
                            )}
                        </View>
                    </Modal>

                    <DoctorFacilityCard
                        doctorName={prescription.doctor?.name}
                        doctorLicense={prescription.doctor?.license_no}
                        facilityName={prescription.facility?.name}
                        facilityAddress={prescription.facility?.address}
                    />

                    <DiagnosisCard diagnosis={prescription.diagnosis_text} />

                    {/* ── Document-type-aware section ── */}
                    {(() => {
                        // Derive document type: prefer explicit purpose, then infer from data
                        const purpose = prescription.purpose
                            ?? (prescription.raw_output_json?.document_type as string | undefined);

                        const isLab  = purpose === 'lab_result'
                            || (!purpose && !prescription.medications?.length
                                && (prescription.lab_results?.length
                                    || prescription.raw_output_json?.lab_results?.length));
                        const isScan = purpose === 'radiology_report'
                            || (!purpose && !prescription.medications?.length
                                && (prescription.scan_report
                                    || prescription.raw_output_json?.scan_report));

                        if (isLab) {
                            const results =
                                prescription.lab_results?.length
                                    ? prescription.lab_results
                                    : (prescription.raw_output_json?.lab_results ?? []);
                            return <LabResultsCard labResults={results} />;
                        }

                        if (isScan) {
                            const report =
                                prescription.scan_report
                                ?? prescription.raw_output_json?.scan_report
                                ?? {};
                            return <ScanReportCard report={report} />;
                        }

                        // Default: prescription medications
                        return (
                            <MedicationList
                                medications={(prescription.medications ?? []).map((m) => ({
                                    id: m.id,
                                    name: m.name,
                                    dose: m.dose,
                                    frequency: m.frequency,
                                    duration: m.duration,
                                    notes: m.notes,
                                }))}
                            />
                        );
                    })()}

                    <FollowUpRequestsCard
                        requests={followUpRequests}
                        onUploadLab={() => openFollowUpUpload('lab_result')}
                        onScanLab={openLabScan}
                        onUploadRadiology={() => openFollowUpUpload('radiology_report')}
                    />

                    {linkedDocs && linkedDocs.length > 0 && (
                        <View style={styles.linkedCard}>
                            <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
                            <LinearGradient
                                colors={['rgba(16,185,129,0.10)', 'rgba(16,185,129,0.02)']}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            />

                            {/* Header */}
                            <View style={styles.linkedHeader}>
                                <View style={styles.linkedHeaderIcon}>
                                    <Ionicons name="git-merge-outline" size={18} color="#10B981" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.linkedTitle}>Care Journey</Text>
                                    <Text style={styles.linkedSubtitle}>
                                        {linkedDocs.length} result{linkedDocs.length > 1 ? 's' : ''} linked · labs & radiology both shown
                                    </Text>
                                </View>
                            </View>

                            {/* Timeline */}
                            <View style={styles.timeline}>
                                {/* Prescription root node */}
                                <View style={styles.timelineRow}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[styles.timelineDot, { backgroundColor: '#1FA3C6' }]}>
                                            <Ionicons name="document-text" size={11} color="#FFF" />
                                        </View>
                                        <View style={styles.timelineBar} />
                                    </View>
                                    <View style={[styles.timelineNode, { borderColor: 'rgba(31,163,198,0.25)' }]}>
                                        <LinearGradient
                                            colors={['rgba(31,163,198,0.12)', 'transparent']}
                                            style={StyleSheet.absoluteFill}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        />
                                        <View style={styles.timelineNodeTop}>
                                            <View style={[styles.timelineNodeBadge, { backgroundColor: 'rgba(31,163,198,0.18)' }]}>
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
                                    const icon: any = isLab ? 'flask' : 'radio-outline';
                                    const typeLabel = isLab ? 'Lab' : 'Radiology';
                                    const typeTitle = isLab ? 'Lab Results' : 'Radiology Report';
                                    const isLast = idx === linkedDocs.length - 1;
                                    const date = new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                                    return (
                                        <View key={doc.id} style={styles.timelineRow}>
                                            <View style={styles.timelineLeft}>
                                                <View style={[styles.timelineDot, { backgroundColor: color }]}>
                                                    <Ionicons name={icon} size={11} color="#FFF" />
                                                </View>
                                                {!isLast && <View style={styles.timelineBar} />}
                                            </View>
                                            <TouchableOpacity
                                                style={[styles.timelineNode, { borderColor: color + '35' }]}
                                                onPress={() => router.push({ pathname: '/(app)/result', params: { documentId: doc.id } })}
                                                activeOpacity={0.75}
                                            >
                                                <LinearGradient
                                                    colors={[color + '14', 'transparent']}
                                                    style={StyleSheet.absoluteFill}
                                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                                />
                                                <View style={styles.timelineNodeTop}>
                                                    <View style={[styles.timelineNodeBadge, { backgroundColor: color + '22' }]}>
                                                        <Ionicons name={icon} size={10} color={color} />
                                                        <Text style={[styles.timelineNodeBadgeText, { color }]}>{typeLabel}</Text>
                                                    </View>
                                                    <Text style={styles.timelineNodeDate}>{date}</Text>
                                                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.30)" />
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

                            {/* Add buttons — separate Lab vs Radiology */}
                            <View style={styles.linkedAddRow}>
                                <TouchableOpacity
                                    style={[styles.linkedAddBtn, { borderColor: 'rgba(16,185,129,0.30)', backgroundColor: 'rgba(16,185,129,0.08)' }]}
                                    onPress={() => openFollowUpUpload('lab_result')}
                                >
                                    <Ionicons name="flask-outline" size={14} color="#10B981" />
                                    <Text style={[styles.linkedAddText, { color: '#10B981' }]}>Add Lab</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.linkedAddBtn, { borderColor: 'rgba(167,139,250,0.30)', backgroundColor: 'rgba(167,139,250,0.08)' }]}
                                    onPress={() => openFollowUpUpload('radiology_report')}
                                >
                                    <Ionicons name="radio-outline" size={14} color="#A78BFA" />
                                    <Text style={[styles.linkedAddText, { color: '#A78BFA' }]}>Add Radiology</Text>
                                </TouchableOpacity>
                            </View>
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

    /* ── Original Scan Card ── */
    scanCard: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(31,163,198,0.25)',
        marginBottom: spacing.md,
    },
    scanCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
    },
    scanCardIconBox: {
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: 'rgba(31,163,198,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    scanCardTitle: {
        color: colors.white,
        fontSize: 13,
        fontWeight: '700',
    },
    scanCardMeta: {
        color: 'rgba(255,255,255,0.50)',
        fontSize: 11,
        marginTop: 1,
    },
    scanTypeBadge: {
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 6,
    },
    scanTypeBadgeText: {
        fontSize: 10, fontWeight: '800', letterSpacing: 0.5,
    },
    scanThumbWrapper: {
        marginHorizontal: 12,
        marginBottom: 12,
        borderRadius: 14,
        overflow: 'hidden',
        height: 200,
    },
    scanThumb: {
        width: '100%',
        height: '100%',
    },
    scanThumbOverlay: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 16,
    },
    scanThumbOverlayText: {
        color: 'rgba(255,255,255,0.90)',
        fontSize: 12,
        fontWeight: '600',
    },
    pdfPlaceholder: {
        marginHorizontal: 12, marginBottom: 12,
        height: 120, borderRadius: 14,
        backgroundColor: 'rgba(31,163,198,0.08)',
        borderWidth: 1, borderColor: 'rgba(31,163,198,0.20)',
        borderStyle: 'dashed',
        alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    pdfFilename: {
        color: 'rgba(255,255,255,0.60)',
        fontSize: 12, fontWeight: '500', textAlign: 'center',
        paddingHorizontal: 16,
    },

    /* ── Full-screen Scan Modal ── */
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.94)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTopBar: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 8, paddingBottom: 12,
        zIndex: 10,
    },
    modalTitleRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1,
    },
    modalTitle: {
        color: 'rgba(255,255,255,0.80)',
        fontSize: 13, fontWeight: '600', flex: 1,
    },
    modalCloseBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.10)',
        alignItems: 'center', justifyContent: 'center',
    },
    modalImage: {
        width: SCREEN_W,
        height: SCREEN_H * 0.80,
    },
    linkedCard: {
        marginTop: spacing.md,
        overflow: 'hidden',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.22)',
        backgroundColor: 'rgba(6,21,36,0.65)',
    },
    linkedHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
    linkedHeaderIcon: {
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: 'rgba(16,185,129,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    linkedTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    linkedSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.42)', marginTop: 2 },
    timeline: {},
    timelineRow: { flexDirection: 'row', gap: 10 },
    timelineLeft: { alignItems: 'center', width: 28 },
    timelineDot: {
        width: 28, height: 28, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        zIndex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
        elevation: 4,
    },
    timelineBar: {
        width: 2, flex: 1, minHeight: 10,
        backgroundColor: 'rgba(255,255,255,0.07)',
        marginTop: 2, marginBottom: 2,
    },
    timelineNode: {
        flex: 1, borderRadius: 14, borderWidth: 1,
        padding: 12, marginBottom: 10, overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    timelineNodeTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
    timelineNodeBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    },
    timelineNodeBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
    timelineNodeLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.90)' },
    timelineNodeDate: { fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: '600', flex: 1, textAlign: 'right' },
    timelineNodeSub: { fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 3 },
    linkedAddRow: {
        flexDirection: 'row', gap: 10,
        marginTop: 6, paddingTop: 14,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    },
    linkedAddBtn: {
        flex: 1,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 10, borderRadius: 12, borderWidth: 1,
    },
    linkedAddText: { fontSize: 12, fontWeight: '700' },
});
