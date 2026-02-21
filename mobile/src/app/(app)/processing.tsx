/**
 * Processing route — job progress screen
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useJobStatus } from '../../features/documents/hooks';

export default function ProcessingScreen() {
    const router = useRouter();
    const { jobId, documentId } = useLocalSearchParams<{ jobId: string; documentId: string }>();
    const { data: job } = useJobStatus(jobId || '');

    useEffect(() => {
        if (job?.status === 'done' && documentId) {
            router.replace({ pathname: '/(app)/result', params: { documentId } });
        } else if (job?.status === 'failed') {
            router.back();
        }
    }, [job?.status]);

    const progress = job?.progress || 0;

    const getStatusMessage = () => {
        switch (job?.status) {
            case 'queued': return 'Waiting in queue...';
            case 'processing':
                if (progress < 30) return 'Extracting text from image...';
                if (progress < 70) return 'Analyzing prescription with AI...';
                return 'Finalizing results...';
            default: return 'Starting analysis...';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.icon}>🔬</Text>
                <Text style={styles.title}>Analyzing Prescription</Text>
                <Text style={styles.status}>{getStatusMessage()}</Text>

                <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{progress}%</Text>
                </View>

                <View style={styles.steps}>
                    <StepItem label="OCR Extraction" active={progress >= 10} done={progress >= 30} />
                    <StepItem label="Medical Text Analysis" active={progress >= 30} done={progress >= 70} />
                    <StepItem label="Classification & Structuring" active={progress >= 70} done={progress >= 100} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const StepItem: React.FC<{ label: string; active: boolean; done: boolean }> = ({ label, active, done }) => (
    <View style={stepStyles.container}>
        <View style={[stepStyles.dot, active && stepStyles.dotActive, done && stepStyles.dotDone]}>
            {done && <Text style={stepStyles.check}>✓</Text>}
        </View>
        <Text style={[stepStyles.label, active && stepStyles.labelActive]}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.dark.bg },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxl },
    icon: { fontSize: 64, marginBottom: spacing.xl },
    title: { ...typography.h2, color: colors.dark.textPrimary, marginBottom: spacing.sm },
    status: { ...typography.bodySmall, color: colors.primary[400], marginBottom: spacing.xxl },
    progressContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xxl },
    progressTrack: { flex: 1, height: 8, backgroundColor: colors.dark.surface, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: colors.primary[500], borderRadius: 4 },
    progressText: { ...typography.label, color: colors.primary[400], width: 40, textAlign: 'right' },
    steps: { width: '100%', gap: spacing.lg },
});

const stepStyles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.dark.surface, borderWidth: 2, borderColor: colors.dark.border, justifyContent: 'center', alignItems: 'center' },
    dotActive: { borderColor: colors.primary[500] },
    dotDone: { backgroundColor: colors.primary[500], borderColor: colors.primary[500] },
    check: { color: colors.white, fontSize: 14, fontWeight: '700' },
    label: { ...typography.body, color: colors.dark.textMuted },
    labelActive: { color: colors.dark.textPrimary },
});
