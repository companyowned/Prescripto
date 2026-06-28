import React from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors } from '../../theme';

interface HeroCardProps {
    onScanPress: () => void;
    onUploadPress: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({ onScanPress, onUploadPress }) => {
    const scaleScan   = useSharedValue(1);
    const scaleUpload = useSharedValue(1);

    const scanStyle   = useAnimatedStyle(() => ({ transform: [{ scale: scaleScan.value }] }));
    const uploadStyle = useAnimatedStyle(() => ({ transform: [{ scale: scaleUpload.value }] }));

    return (
        <View style={styles.card}>
            {/* Glass base */}
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
                colors={['rgba(33,150,243,0.22)', 'rgba(13,71,161,0.12)', 'rgba(255,255,255,0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            {/* Top-left sheen */}
            <LinearGradient
                colors={['rgba(255,255,255,0.12)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.6, y: 0.6 }}
                style={[StyleSheet.absoluteFill, styles.sheen]}
                pointerEvents="none"
            />

            <View style={styles.content}>
                <Text style={styles.eyebrow}>AI POWERED</Text>
                <Text style={styles.title}>Scan New{'\n'}Prescription</Text>
                <Text style={styles.subtitle}>
                    Digitize handwritten medical documents instantly with AI intelligence.
                </Text>

                {/* Primary CTA */}
                <Animated.View style={[styles.primaryWrapper, scanStyle]}>
                    <Pressable
                        onPress={onScanPress}
                        onPressIn={() => { scaleScan.value = withSpring(0.96, { damping: 15 }); }}
                        onPressOut={() => { scaleScan.value = withSpring(1,    { damping: 15 }); }}
                        style={styles.primaryBtn}
                    >
                        <LinearGradient
                            colors={['#2196F3', '#1565C0', '#0D47A1']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.btnRow}>
                            <Ionicons name="camera" size={22} color="#FFFFFF" />
                            <Text style={styles.primaryText}>Scan Prescription</Text>
                        </View>
                    </Pressable>
                </Animated.View>

                {/* Secondary CTA */}
                <Animated.View style={uploadStyle}>
                    <Pressable
                        onPress={onUploadPress}
                        onPressIn={() => { scaleUpload.value = withSpring(0.96, { damping: 15 }); }}
                        onPressOut={() => { scaleUpload.value = withSpring(1,    { damping: 15 }); }}
                        style={styles.secondaryBtn}
                    >
                        <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={styles.btnRow}>
                            <Ionicons name="image-outline" size={18} color="rgba(255,255,255,0.75)" />
                            <Text style={styles.secondaryText}>Upload from Gallery</Text>
                        </View>
                    </Pressable>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 28,
        marginBottom: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.50,
        shadowRadius: 28,
        elevation: 12,
        backgroundColor: colors.glass.background,
    },
    sheen: { borderRadius: 28 },
    content: { padding: 24 },
    eyebrow: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2.0,
        color: colors.primary[400],
        marginBottom: 8,
    },
    title: {
        color: colors.white,
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 10,
        letterSpacing: -0.6,
        lineHeight: 34,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 14,
        lineHeight: 21,
        marginBottom: 28,
    },
    primaryWrapper: {
        borderRadius: 16,
        shadowColor: 'rgba(33,150,243,0.7)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 16,
        elevation: 10,
        marginBottom: 14,
        overflow: 'hidden',
    },
    primaryBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: 'rgba(79,179,255,0.35)',
    },
    secondaryBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: colors.glass.border,
    },
    btnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        zIndex: 1,
    },
    primaryText: {
        color: colors.white,
        fontSize: 17,
        fontWeight: '700',
    },
    secondaryText: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 15,
        fontWeight: '500',
    },
});
