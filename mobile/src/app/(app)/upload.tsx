/**
 * Upload route — pick PDF or image from device
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card } from '../../components/ui';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useUploadDocument } from '../../features/documents/hooks';
import { getFileType, getFileName } from '../../utils/file';

export default function UploadScreen() {
    const router = useRouter();
    const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; type: string } | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const uploadMutation = useUploadDocument();

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
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
        try {
            const result = await uploadMutation.mutateAsync(selectedFile);
            router.replace({
                pathname: '/(app)/processing',
                params: { jobId: result.job_id, documentId: result.document_id },
            });
        } catch (err: any) {
            Alert.alert('Upload Failed', err?.message || 'Could not upload the file.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Button title="← Back" onPress={() => router.back()} variant="ghost" size="sm" />
                <Text style={styles.title}>Upload Document</Text>
                <View style={{ width: 80 }} />
            </View>

            <View style={styles.content}>
                <Card variant="elevated" style={styles.pickerCard}>
                    <Button title="📄  Pick PDF or Image" onPress={handlePickDocument} variant="outline" size="lg" style={styles.pickerBtn} />
                    <Text style={styles.orText}>or</Text>
                    <Button title="🖼️  Choose from Gallery" onPress={handlePickImage} variant="outline" size="lg" style={styles.pickerBtn} />
                </Card>

                {selectedFile && (
                    <Card variant="elevated" style={styles.previewCard}>
                        {preview ? (
                            <Image source={{ uri: preview }} style={styles.previewImage} resizeMode="contain" />
                        ) : (
                            <View style={styles.pdfPreview}><Text style={styles.pdfIcon}>📄</Text></View>
                        )}
                        <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                        <Button title="Upload & Analyze" onPress={handleUpload} loading={uploadMutation.isPending} size="lg" style={styles.uploadBtn} />
                    </Card>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6F8' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: Platform.OS === 'ios' ? 10 : 30, marginBottom: spacing.lg },
    title: { ...typography.h3, color: '#111827', fontWeight: '700' },
    content: { flex: 1, paddingHorizontal: spacing.xl },
    pickerCard: { alignItems: 'center', paddingVertical: spacing.xxl, marginBottom: spacing.lg, backgroundColor: '#FFFFFF', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
    pickerBtn: { width: '100%' },
    orText: { ...typography.bodySmall, color: '#9BA6B3', marginVertical: spacing.md, fontWeight: '600' },
    previewCard: { alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
    previewImage: { width: '100%', height: 200, borderRadius: borderRadius.md, marginBottom: spacing.md },
    pdfPreview: { width: '100%', height: 120, backgroundColor: '#E0F2FE', borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
    pdfIcon: { fontSize: 48 },
    fileName: { ...typography.bodySmall, color: '#6B7280', marginBottom: spacing.lg },
    uploadBtn: { width: '100%', backgroundColor: '#109AE8' },
});
