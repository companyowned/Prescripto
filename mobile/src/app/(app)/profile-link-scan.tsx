/**
 * Scan a profile link QR (separate from prescription document scanning).
 */

import React, { useCallback, useRef } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { GlassBackground } from '../../components/ui';
import { extractProfileLinkToken } from '../../features/profileLinks/parseQr';
import { colors, spacing, typography } from '../../theme';

export default function ProfileLinkScanScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const lastRef = useRef<string | null>(null);

    const onBarcodeScanned = useCallback(
        (e: { data: string }) => {
            const token = extractProfileLinkToken(e.data);
            if (!token) return;
            if (lastRef.current === token) return;
            lastRef.current = token;
            router.replace({
                pathname: '/(app)/profile-link-confirm',
                params: { token: encodeURIComponent(token) },
            });
        },
        [router]
    );

    if (!permission) return null;

    if (!permission.granted) {
        return (
            <GlassBackground>
                <SafeAreaView style={styles.perm}>
                    <Text style={styles.permTitle}>Camera access</Text>
                    <Text style={styles.permText}>We need the camera to scan a profile link QR code.</Text>
                    <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                        <Text style={styles.permBtnText}>Allow camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.linkBack}>Go back</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </GlassBackground>
        );
    }

    return (
        <View style={styles.cameraWrap}>
            <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={onBarcodeScanned}
            >
                <SafeAreaView style={styles.overlay}>
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={styles.backText}>← Back</Text>
                        </TouchableOpacity>
                        <Text style={styles.scanTitle}>Scan profile QR</Text>
                        <View style={{ width: 60 }} />
                    </View>
                    <View style={styles.frame}>
                        <Text style={styles.frameHint}>Align the QR code within the frame</Text>
                    </View>
                </SafeAreaView>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    cameraWrap: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1 },
    overlay: { flex: 1, justifyContent: 'space-between' },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
    },
    backText: { ...typography.body, color: '#FFFFFF', fontWeight: '600' },
    scanTitle: { ...typography.h3, color: '#FFFFFF' },
    frame: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 120,
    },
    frameHint: {
        ...typography.caption,
        color: '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 8,
    },
    perm: { flex: 1, justifyContent: 'center', padding: spacing.xxl },
    permTitle: { ...typography.h2, color: '#FFFFFF', marginBottom: spacing.sm },
    permText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
    permBtn: {
        backgroundColor: colors.primary[500],
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    permBtnText: { color: '#FFFFFF', fontWeight: '700' },
    linkBack: { ...typography.body, color: colors.primary[300], textAlign: 'center' },
});
