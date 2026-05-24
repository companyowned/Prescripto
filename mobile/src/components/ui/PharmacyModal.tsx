import React, { useState, useCallback } from 'react';
import {
    Modal, View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, Linking, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';

interface Props {
    visible: boolean;
    onClose: () => void;
}

type Status = 'idle' | 'requesting' | 'found' | 'denied' | 'error';

export const PharmacyModal: React.FC<Props> = ({ visible, onClose }) => {
    const [status, setStatus] = useState<Status>('idle');
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

    const requestAndFind = useCallback(async () => {
        setStatus('requesting');
        try {
            if (Platform.OS === 'web') {
                if (!('geolocation' in navigator)) { setStatus('error'); return; }
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                        setStatus('found');
                    },
                    () => setStatus('denied'),
                    { timeout: 10000, maximumAge: 60000 }
                );
                return;
            }
            // Native — require avoids the module being initialized on web
            const Location = require('expo-location');
            const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
            if (permStatus !== 'granted') { setStatus('denied'); return; }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
            setStatus('found');
        } catch {
            setStatus('error');
        }
    }, []);

    const openInMaps = useCallback(() => {
        if (!coords) return;
        const { lat, lng } = coords;
        const webUrl = `https://www.google.com/maps/search/pharmacy/@${lat},${lng},15z`;

        if (Platform.OS === 'web') {
            window.open(webUrl, '_blank');
            return;
        }

        const nativeUrl = Platform.OS === 'ios'
            ? `maps://?q=pharmacy&ll=${lat},${lng}&z=15`
            : `geo:${lat},${lng}?q=pharmacy`;

        Linking.canOpenURL(nativeUrl)
            .then((can) => Linking.openURL(can ? nativeUrl : webUrl))
            .catch(() => Linking.openURL(webUrl));
    }, [coords]);

    const reset = () => { setStatus('idle'); setCoords(null); };

    const handleClose = () => { reset(); onClose(); };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <LinearGradient
                        colors={['rgba(16,185,129,0.2)', 'rgba(4,13,18,0)']}
                        style={styles.headerGrad}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    <View style={styles.handle} />
                    <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                        <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>

                    <View style={styles.content}>
                        {/* Icon */}
                        <View style={styles.iconWrap}>
                            <Ionicons name="medical" size={36} color="#10B981" />
                        </View>
                        <Text style={styles.title}>Nearest Pharmacy</Text>
                        <Text style={styles.subtitle}>We'll use your location to find pharmacies near you</Text>

                        {status === 'idle' && (
                            <TouchableOpacity style={styles.primaryBtn} onPress={requestAndFind}>
                                <Ionicons name="location" size={18} color="#FFFFFF" />
                                <Text style={styles.primaryBtnText}>Allow Location & Find</Text>
                            </TouchableOpacity>
                        )}

                        {status === 'requesting' && (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator color="#10B981" />
                                <Text style={styles.loadingText}>Getting your location…</Text>
                            </View>
                        )}

                        {status === 'found' && coords && (
                            <View style={styles.foundBox}>
                                <View style={styles.coordRow}>
                                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                    <Text style={styles.coordText}>Location found</Text>
                                </View>
                                <Text style={styles.coordSub}>
                                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                                </Text>
                                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#10B981' }]} onPress={openInMaps}>
                                    <Ionicons name="map" size={18} color="#FFFFFF" />
                                    <Text style={styles.primaryBtnText}>Open in Maps</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.ghostBtn} onPress={reset}>
                                    <Text style={styles.ghostText}>Search Again</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {status === 'denied' && (
                            <View style={styles.errorBox}>
                                <Ionicons name="lock-closed-outline" size={32} color="#F59E0B" />
                                <Text style={styles.errorTitle}>Permission Denied</Text>
                                <Text style={styles.errorMsg}>
                                    Please enable location access in your device settings to use this feature.
                                </Text>
                                <TouchableOpacity style={styles.ghostBtn} onPress={reset}>
                                    <Text style={styles.ghostText}>Try Again</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {status === 'error' && (
                            <View style={styles.errorBox}>
                                <Ionicons name="warning-outline" size={32} color={colors.error} />
                                <Text style={styles.errorTitle}>Something went wrong</Text>
                                <Text style={styles.errorMsg}>Could not retrieve your location. Please try again.</Text>
                                <TouchableOpacity style={styles.ghostBtn} onPress={reset}>
                                    <Text style={styles.ghostText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#081520',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.2)',
        overflow: 'hidden',
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    headerGrad: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
    handle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignSelf: 'center', marginTop: 12, marginBottom: 8,
    },
    closeBtn: {
        position: 'absolute', top: 12, right: 16,
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center',
    },
    content: { padding: 24, alignItems: 'center' },
    iconWrap: {
        width: 72, height: 72, borderRadius: 24,
        backgroundColor: 'rgba(16,185,129,0.12)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)',
        marginBottom: 16,
    },
    title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
    subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
    primaryBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: colors.primary[500],
        paddingHorizontal: 28, paddingVertical: 14,
        borderRadius: 16, marginBottom: 12,
    },
    primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    ghostBtn: { paddingVertical: 8 },
    ghostText: { fontSize: 14, color: colors.primary[300], fontWeight: '600' },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
    loadingText: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
    foundBox: { width: '100%', alignItems: 'center', marginTop: 8 },
    coordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    coordText: { fontSize: 16, fontWeight: '700', color: '#10B981' },
    coordSub: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 20 },
    errorBox: { alignItems: 'center', gap: 10, marginTop: 8 },
    errorTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    errorMsg: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 20 },
});
