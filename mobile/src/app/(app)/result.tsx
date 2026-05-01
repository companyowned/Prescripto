/**
 * Result route — full prescription analysis
 * Auto-prompts lab upload when follow-up lab requests are detected.
 */

import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, SafeAreaView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Loader, GlassBackground } from '../../components/ui';
import {
    PrescriptionHeader,
    DoctorFacilityCard,
    DiagnosisCard,
    MedicationList,
    FollowUpRequestsCard,
} from '../../components/prescription';
import { colors, spacing } from '../../theme';
import { usePrescription } from '../../features/prescriptions/hooks';
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
});
