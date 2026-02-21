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

    const [progress, setProgress] = React.useState(0);

    useEffect(() => {
        if (job?.status === 'done' && documentId) {
            setProgress(100);
            setTimeout(() => {
                router.replace({ pathname: '/(app)/result', params: { documentId } });
            }, 500);
        } else if (job?.status === 'failed') {
            router.back();
        }
    }, [job?.status, documentId]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (job?.status !== 'done' && job?.status !== 'failed') {
            if (job?.progress) {
                setProgress(job.progress);
            } else {
                // Simulate progress if the backend just says "processing" without an integer
                interval = setInterval(() => {
                    setProgress(prev => {
                        if (prev >= 95) return 95;
                        const boost = Math.random() * 8 + 2;
                        return Math.min(prev + boost, 95);
                    });
                }, 800);
            }
        }
        return () => clearInterval(interval);
    }, [job?.status, job?.progress]);

    const getStatusMessage = () => {
        if (job?.status === 'queued') return 'Waiting in queue...';
        if (job?.status === 'processing' || progress > 0) {
            if (progress < 30) return 'Extracting text from image...';
            if (progress < 70) return 'Analyzing prescription with AI...';
            if (progress < 95) return 'Classification & Structuring...';
            return 'Finalizing results...';
        }
        return 'Starting analysis...';
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
                    <Text style={styles.progressText}>{Math.floor(progress)}%</Text>
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
    container: { flex: 1, backgroundColor: '#F5F6F8' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxl },
    icon: { fontSize: 64, marginBottom: spacing.xl },
    title: { ...typography.h2, color: '#111827', marginBottom: spacing.sm, fontWeight: '800' },
    status: { ...typography.bodySmall, color: '#109AE8', marginBottom: spacing.xxl, fontWeight: '600' },
    progressContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xxl },
    progressTrack: { flex: 1, height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#109AE8', borderRadius: 4 },
    progressText: { ...typography.label, color: '#109AE8', width: 40, textAlign: 'right', fontWeight: '700' },
    steps: { width: '100%', gap: spacing.lg },
});

const stepStyles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    dotActive: { borderColor: '#109AE8' },
    dotDone: { backgroundColor: '#109AE8', borderColor: '#109AE8' },
    check: { color: colors.white, fontSize: 14, fontWeight: '700' },
    label: { ...typography.body, color: '#6B7280' },
    labelActive: { color: '#111827', fontWeight: '700' },
});
