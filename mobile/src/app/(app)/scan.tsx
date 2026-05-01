/**
 * Scan route — Camera capture
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, GlassBackground } from '../../components/ui';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useUploadDocument } from '../../features/documents/hooks';
import type { DocumentPurpose } from '../../features/documents/types';
import { useActiveProfile } from '../../contexts/profile-context';

export default function ScanScreen() {
    const router = useRouter();
    const { purpose, parentDocumentId } = useLocalSearchParams<{
        purpose?: DocumentPurpose;
        parentDocumentId?: string;
    }>();
    const documentPurpose = purpose || 'prescription';
    const isLabResult = documentPurpose === 'lab_result';
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [capturing, setCapturing] = useState(false);
    const uploadMutation = useUploadDocument();
    const { activeProfile } = useActiveProfile();

    const handleCapture = async () => {
        if (!cameraRef.current || capturing) return;
        if (!activeProfile?.id) {
            Alert.alert('Profile Required', 'Please select a family profile before scanning.');
            return;
        }

        setCapturing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
            if (!photo?.uri) {
                Alert.alert('Error', 'Failed to capture photo');
                return;
            }

            const result = await uploadMutation.mutateAsync({
                file: {
                    uri: photo.uri,
                    name: `${isLabResult ? 'lab_results' : 'scan'}_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                },
                profileId: activeProfile?.id,
                purpose: documentPurpose,
                parentDocumentId,
            });

            router.replace({
                pathname: '/(app)/processing',
                params: {
                    jobId: result.job_id,
                    documentId: result.document_id,
                    purpose: documentPurpose,
                    parentDocumentId,
                },
            });
        } catch (err: any) {
            Alert.alert('Upload Failed', err?.message || 'Could not upload the scan.');
        } finally {
            setCapturing(false);
        }
    };

    if (!permission) return null;

    if (!permission.granted) {
        return (
            <GlassBackground>
                <SafeAreaView style={styles.container}>
                    <View style={styles.permissionView}>
                        <Text style={styles.permissionIcon}>📸</Text>
                        <Text style={styles.permissionTitle}>Camera Access Required</Text>
                        <Text style={styles.permissionText}>
                            We need camera access to scan your prescriptions
                        </Text>
                        <Button title="Grant Permission" onPress={requestPermission} style={styles.grantBtn} />
                        <Button title="Go Back" onPress={() => router.back()} variant="ghost" />
                    </View>
                </SafeAreaView>
            </GlassBackground>
        );
    }

    return (
        <View style={styles.cameraContainer}>
            <CameraView ref={cameraRef} style={styles.camera} facing="back">
                <SafeAreaView style={styles.overlay}>
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={styles.backBtn}>← Back</Text>
                        </TouchableOpacity>
                        <Text style={styles.scanTitle}>{isLabResult ? 'Scan Lab Results' : 'Scan Prescription'}</Text>
                        <View style={{ width: 60 }} />
                    </View>

                    <View style={styles.guideContainer}>
                        <View style={styles.guideFrame}>
                            <Text style={styles.guideText}>
                                {isLabResult
                                    ? 'Position the lab result page within the frame'
                                    : 'Position the prescription within the frame'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.bottomBar}>
                        <TouchableOpacity
                            style={[styles.captureBtn, capturing && styles.captureBtnDisabled]}
                            onPress={handleCapture}
                            disabled={capturing}
                            activeOpacity={0.7}
                        >
                            <View style={styles.captureInner} />
                        </TouchableOpacity>
                        {uploadMutation.isPending && (
                            <Text style={styles.uploadingText}>Uploading...</Text>
                        )}
                    </View>
                </SafeAreaView>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    permissionView: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxl },
    permissionIcon: { fontSize: 64, marginBottom: spacing.xl },
    permissionTitle: { ...typography.h2, color: colors.white, marginBottom: spacing.sm, fontWeight: '800' },
    permissionText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
    grantBtn: { marginBottom: spacing.md, minWidth: 200 },
    cameraContainer: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1 },
    overlay: { flex: 1, justifyContent: 'space-between' },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
    backBtn: { ...typography.body, color: colors.white, fontWeight: '600' },
    scanTitle: { ...typography.h3, color: colors.white },
    guideContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    guideFrame: { width: '85%', aspectRatio: 0.7, borderWidth: 2, borderColor: colors.primary[400], borderRadius: borderRadius.lg, borderStyle: 'dashed', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: spacing.lg },
    guideText: { ...typography.caption, color: colors.white, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
    bottomBar: { alignItems: 'center', paddingBottom: spacing.xxl },
    captureBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    captureBtnDisabled: { opacity: 0.5 },
    captureInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.white },
    uploadingText: { ...typography.caption, color: colors.white, marginTop: spacing.sm },
});
