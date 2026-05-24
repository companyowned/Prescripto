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
    const scaleScan = useSharedValue(1);
    const scaleUpload = useSharedValue(1);

    const scanStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scaleScan.value }],
    }));

    const uploadStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scaleUpload.value }],
    }));

    return (
        <View style={styles.heroCardContainer}>
            <LinearGradient
                colors={['rgba(31, 163, 198, 0.4)', 'rgba(62, 219, 240, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <BlurView intensity={20} tint="light" style={[StyleSheet.absoluteFill, styles.blur]} />

            <View style={styles.heroCardContent}>
                <Text style={styles.heroTitle}>Scan New Prescription</Text>
                <Text style={styles.heroSubtitle}>
                    Digitize your handwritten medical{'\n'}documents instantly with AI.
                </Text>

                <Animated.View style={[styles.primaryActionWrapper, scanStyle]}>
                    <Pressable
                        onPress={onScanPress}
                        onPressIn={() => scaleScan.value = withSpring(0.96, { damping: 15 })}
                        onPressOut={() => scaleScan.value = withSpring(1, { damping: 15 })}
                        style={styles.primaryActionBtn}
                    >
                        <LinearGradient
                            colors={[...colors.gradient.primary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.btnContent}>
                            <Ionicons name="camera" size={24} color="#FFFFFF" />
                            <Text style={styles.primaryActionText}>Scan Prescription</Text>
                        </View>
                    </Pressable>
                </Animated.View>

                <Animated.View style={uploadStyle}>
                    <Pressable
                        onPress={onUploadPress}
                        onPressIn={() => scaleUpload.value = withSpring(0.96, { damping: 15 })}
                        onPressOut={() => scaleUpload.value = withSpring(1, { damping: 15 })}
                        style={styles.secondaryActionBtn}
                    >
                        <View style={styles.btnContent}>
                            <Ionicons name="image" size={18} color={colors.textSecondary} />
                            <Text style={styles.secondaryActionText}>Upload from Gallery</Text>
                        </View>
                    </Pressable>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    heroCardContainer: {
        borderRadius: 28,
        marginBottom: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
        shadowColor: colors.primary[300],
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    blur: {
        borderRadius: 28,
    },
    heroCardContent: {
        padding: 24,
    },
    heroTitle: {
        color: '#0B1D2E',
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        color: colors.textSecondary,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 28,
    },
    primaryActionWrapper: {
        borderRadius: 16,
        shadowColor: colors.glass.glow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 8,
        marginBottom: 16,
    },
    primaryActionBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryActionText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    secondaryActionBtn: {
        backgroundColor: 'transparent',
        borderRadius: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: colors.glass.border,
    },
    secondaryActionText: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: '500',
    },
});
