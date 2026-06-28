/**
 * Show a time-limited QR code so another logged-in user can request shared access.
 * - iOS / Android: react-native-qrcode-svg (reliable in Metro).
 * - Web: qrcode.toDataURL + Image (browser canvas; avoids SVG stack issues).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { GlassBackground } from '../../components/ui';
import { useProfileLinkQr } from '../../features/profiles/hooks';
import { colors, spacing, typography } from '../../theme';

function normalizeProfileId(raw: string | string[] | undefined): string | undefined {
    if (raw == null) return undefined;
    return Array.isArray(raw) ? raw[0] : raw;
}

function apiErrorMessage(error: unknown): string {
    if (!axios.isAxiosError(error)) {
        return error instanceof Error ? error.message : 'Request failed';
    }
    const status = error.response?.status;
    const data = error.response?.data as { detail?: unknown } | undefined;
    const detail = data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
        return detail.map((x: { msg?: string }) => x?.msg || JSON.stringify(x)).join('; ');
    }
    if (status === 404) {
        return 'Profile QR is not available from this API (404). Use a backend that includes the latest routes, or set EXPO_PUBLIC_API_URL to your local server, e.g. http://127.0.0.1:8000/api/v1';
    }
    if (!error.response) {
        return 'Network error — check the API is running and EXPO_PUBLIC_API_URL is correct.';
    }
    return `${status ?? '?'}: ${error.message}`;
}

export default function ProfileLinkQrScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ profileId?: string | string[] }>();
    const profileId = useMemo(() => normalizeProfileId(params.profileId), [params.profileId]);

    const { data, isLoading, isFetching, error, refetch } = useProfileLinkQr(profileId);

    const [webPngUri, setWebPngUri] = useState<string | null>(null);
    const [qrGenError, setQrGenError] = useState<string | null>(null);
    const [qrGenerating, setQrGenerating] = useState(false);

    useEffect(() => {
        if (!data?.qr_uri || Platform.OS !== 'web') {
            setWebPngUri(null);
            setQrGenError(null);
            setQrGenerating(false);
            return;
        }

        let alive = true;
        setQrGenerating(true);
        setQrGenError(null);
        setWebPngUri(null);

        import('qrcode')
            .then((m) => m.default.toDataURL(data.qr_uri, {
                width: 240,
                margin: 2,
                color: { dark: '#0f172a', light: '#ffffff' },
            }))
            .then((uri) => {
                if (alive) {
                    setWebPngUri(uri);
                    setQrGenError(null);
                }
            })
            .catch((e: Error) => {
                if (alive) {
                    setWebPngUri(null);
                    setQrGenError(e?.message || 'Could not build QR image in this browser');
                }
            })
            .finally(() => {
                if (alive) setQrGenerating(false);
            });

        return () => {
            alive = false;
        };
    }, [data?.qr_uri]);

    const onCopyUri = useCallback(() => {
        if (!data?.qr_uri) return;
        if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(data.qr_uri);
            Alert.alert('Copied', 'Profile link copied to clipboard.');
        } else {
            Alert.alert('Link', data.qr_uri, [{ text: 'OK' }]);
        }
    }, [data?.qr_uri]);

    const showWebSpinner = Platform.OS === 'web' && qrGenerating && !webPngUri;
    const showWebQr = Platform.OS === 'web' && !!webPngUri;
    const showNativeQr = Platform.OS !== 'web';

    return (
        <GlassBackground>
            <SafeAreaView style={styles.safe}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Share profile</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.body}
                    refreshControl={
                        <RefreshControl
                            refreshing={isFetching && !isLoading}
                            onRefresh={() => refetch()}
                            tintColor={colors.primary[400]}
                        />
                    }
                >
                    <Text style={styles.sub}>
                        Another Prescripto user can scan this code, choose what to share, and send you a
                        request. You approve access from Incoming requests.
                    </Text>

                    {(isLoading || (isFetching && !data)) && (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color={colors.primary[400]} />
                        </View>
                    )}

                    {error && (
                        <View style={styles.errBox}>
                            <Text style={styles.err}>Could not load QR</Text>
                            <Text style={styles.errDetail}>{apiErrorMessage(error)}</Text>
                            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                                <Text style={styles.retryText}>Try again</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {data && !error && (
                        <View style={styles.qrCard}>
                            {showWebSpinner && (
                                <View style={styles.qrGenWrap}>
                                    <ActivityIndicator color={colors.primary[600]} />
                                    <Text style={styles.qrGenLabel}>Generating QR…</Text>
                                </View>
                            )}
                            {Platform.OS === 'web' && qrGenError && !webPngUri && !qrGenerating && (
                                <Text style={styles.errDetail}>{qrGenError}</Text>
                            )}
                            {showWebQr && (
                                <Image
                                    source={{ uri: webPngUri! }}
                                    style={styles.qrImage}
                                    accessibilityLabel="Profile link QR code"
                                />
                            )}
                            {showNativeQr && (
                                <View style={styles.nativeQrWrap}>
                                    <QRCode value={data.qr_uri} size={220} backgroundColor="#FFFFFF" color="#0f172a" />
                                </View>
                            )}
                            <Pressable style={styles.copyBtn} onPress={onCopyUri}>
                                <Ionicons name="copy-outline" size={18} color={colors.primary[600]} />
                                <Text style={styles.copyBtnText}>Copy profile link</Text>
                            </Pressable>
                            <Text style={styles.expires}>Refreshes about every {data.expires_in_hours} hours</Text>
                            <Text style={styles.hint}>Profile ID: {data.profile_id.slice(0, 8)}…</Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </GlassBackground>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: { ...typography.h3, color: '#FFFFFF', fontWeight: '800' },
    body: { padding: spacing.lg, paddingBottom: spacing.xxl },
    sub: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl, lineHeight: 22 },
    center: { paddingVertical: spacing.xxl, alignItems: 'center' },
    errBox: { marginBottom: spacing.md },
    err: { color: colors.error, ...typography.body, fontWeight: '700', marginBottom: spacing.sm },
    errDetail: { color: '#475569', ...typography.body, lineHeight: 22, marginBottom: spacing.md },
    retryBtn: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: 10,
    },
    retryText: { color: '#FFFFFF', fontWeight: '700' },
    qrCard: {
        alignSelf: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: spacing.lg,
        alignItems: 'center',
        maxWidth: '100%',
    },
    qrGenWrap: {
        height: 220,
        width: 220,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    qrGenLabel: { ...typography.caption, color: '#64748b' },
    qrImage: { width: 220, height: 220, resizeMode: 'contain' as const },
    nativeQrWrap: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 8,
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: spacing.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 10,
        backgroundColor: 'rgba(14, 165, 233, 0.12)',
    },
    copyBtnText: { ...typography.body, color: colors.primary[600], fontWeight: '700' },
    expires: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.md },
    hint: { ...typography.caption, color: '#64748b', marginTop: spacing.xs },
});
