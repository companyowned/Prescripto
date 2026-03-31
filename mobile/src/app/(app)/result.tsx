/**
 * Result route — full prescription analysis
 */

import React from 'react';
import { ScrollView, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Loader, GlassBackground } from '../../components/ui';
import {
    PrescriptionHeader,
    DoctorFacilityCard,
    DiagnosisCard,
    MedicationList,
} from '../../components/prescription';
import { colors, spacing } from '../../theme';
import { usePrescription } from '../../features/prescriptions/hooks';

export default function ResultScreen() {
    const router = useRouter();
    const { documentId } = useLocalSearchParams<{ documentId: string }>();
    const { data: prescription, isLoading, error } = usePrescription(documentId || '');

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
