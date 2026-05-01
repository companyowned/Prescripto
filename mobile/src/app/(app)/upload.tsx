/**
 * Upload route — pick PDF or image from device
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, Image, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, GlassBackground } from '../../components/ui';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useUploadDocument } from '../../features/documents/hooks';
import type { DocumentPurpose } from '../../features/documents/types';
import { getFileType, getFileName } from '../../utils/file';
import { useActiveProfile } from '../../contexts/profile-context';

export default function UploadScreen() {
    const router = useRouter();
    const { purpose, parentDocumentId } = useLocalSearchParams<{
        purpose?: DocumentPurpose;
        parentDocumentId?: string;
    }>();
    const documentPurpose = purpose || 'prescription';
    const isLabResult = documentPurpose === 'lab_result';
    const isRadiologyReport = documentPurpose === 'radiology_report';
    const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; type: string } | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const uploadMutation = useUploadDocument();
    const { activeProfile } = useActiveProfile();

    const title = isLabResult
        ? 'Upload Lab Results'
        : isRadiologyReport
            ? 'Upload Radiology Report'
            : 'Upload Document';
    const primaryPickLabel = isLabResult
        ? 'Pick Lab Results PDF'
        : isRadiologyReport
            ? 'Pick Report File'
            : 'Pick PDF or Image';
    const submitLabel = isLabResult
        ? 'Upload Lab Results'
        : isRadiologyReport
            ? 'Upload Report'
            : 'Upload & Analyze';

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: isLabResult ? ['application/pdf'] : ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                const type = asset.mimeType || getFileType(asset.uri);
                let name = asset.name || getFileName(asset.uri);
                if (!name.includes('.')) {
                    name += type.includes('pdf') ? '.pdf' : type.includes('png') ? '.png' : '.jpg';
                }
                const file = {
                    uri: asset.uri,
                    name,
                    type,
                };
                setSelectedFile(file);
                setPreview(file.type.startsWith('image/') ? asset.uri : null);
            }
        } catch { Alert.alert('Error', 'Failed to pick document'); }
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                const type = asset.mimeType || 'image/jpeg';
                let name = asset.fileName || getFileName(asset.uri);
                if (!name.includes('.')) {
                    name += type.includes('png') ? '.png' : type.includes('webp') ? '.webp' : '.jpg';
                }
                const file = { uri: asset.uri, name, type };
                setSelectedFile(file);
                setPreview(asset.uri);
            }
        } catch { Alert.alert('Error', 'Failed to pick image'); }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        if (!activeProfile?.id) {
            Alert.alert('Profile Required', 'Please select a family profile before uploading.');
            return;
        }
        try {
            const result = await uploadMutation.mutateAsync({
                file: selectedFile,
                profileId: activeProfile.id,
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
            Alert.alert('Upload Failed', err?.message || 'Could not upload the file.');
        }
    };

    return (
        <GlassBackground>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Button title="← Back" onPress={() => router.back()} variant="ghost" size="sm" />
                    <Text style={styles.title}>{title}</Text>
                    <View style={{ width: 80 }} />
                </View>

                <View style={styles.content}>
                    <Card variant="elevated" style={styles.pickerCard}>
                        <Button
                            title={primaryPickLabel}
                            onPress={handlePickDocument}
                            variant="outline"
                            size="lg"
                            style={styles.pickerBtn}
                            icon={<Ionicons name="document-attach-outline" size={20} color={colors.primary[300]} />}
                        />
                        {!isLabResult && (
                            <>
                                <Text style={styles.orText}>or</Text>
                                <Button
                                    title="Choose from Gallery"
                                    onPress={handlePickImage}
                                    variant="outline"
                                    size="lg"
                                    style={styles.pickerBtn}
                                    icon={<Ionicons name="images-outline" size={20} color={colors.primary[300]} />}
                                />
                            </>
                        )}
                    </Card>

                    {selectedFile && (
                        <Card variant="elevated" style={styles.previewCard}>
                            {preview ? (
                                <Image source={{ uri: preview }} style={styles.previewImage} resizeMode="contain" />
                            ) : (
                                <View style={styles.pdfPreview}>
                                    <Ionicons name="document-text-outline" size={48} color={colors.primary[300]} />
                                </View>
                            )}
                            <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                            <Button title={submitLabel} onPress={handleUpload} loading={uploadMutation.isPending} size="lg" />
                        </Card>
                    )}
                </View>
            </SafeAreaView>
        </GlassBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: Platform.OS === 'ios' ? 10 : 30, marginBottom: spacing.lg },
    title: { ...typography.h3, color: colors.white, fontWeight: '700' },
    content: { flex: 1, paddingHorizontal: spacing.xl },
    pickerCard: { alignItems: 'center', paddingVertical: spacing.xxl, marginBottom: spacing.lg },
    pickerBtn: { width: '100%' },
    orText: { ...typography.bodySmall, color: colors.textSecondary, marginVertical: spacing.md, fontWeight: '600' },
    previewCard: { alignItems: 'center', padding: 20 },
    previewImage: { width: '100%', height: 200, borderRadius: borderRadius.md, marginBottom: spacing.md },
    pdfPreview: { width: '100%', height: 120, backgroundColor: 'rgba(31, 163, 198, 0.2)', borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.glass.border },
    pdfIcon: { fontSize: 48 },
    fileName: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.lg },
});
