import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface Props { children: React.ReactNode }

export const FloatingMedicalBackground: React.FC<Props> = ({ children }) => {
    // Blob 1 — large top-left organic shape
    const b1Scale = useSharedValue(1);
    const b1X     = useSharedValue(0);
    const b1Y     = useSharedValue(0);

    // Blob 2 — large bottom-right
    const b2Scale = useSharedValue(1);
    const b2X     = useSharedValue(0);
    const b2Y     = useSharedValue(0);

    // Blob 3 — mid accent
    const b3Scale = useSharedValue(1);
    const b3X     = useSharedValue(0);
    const b3Y     = useSharedValue(0);

    // Blob 4 — small top-right sparkle
    const b4Scale = useSharedValue(1);

    useEffect(() => {
        // Blob 1
        b1Scale.value = withRepeat(withSequence(
            withTiming(1.12, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1,    { duration: 10000, easing: Easing.inOut(Easing.ease) }),
        ), -1, true);
        b1X.value = withRepeat(withSequence(
            withTiming(20, { duration: 14000, easing: Easing.inOut(Easing.ease) }),
            withTiming(-20, { duration: 14000, easing: Easing.inOut(Easing.ease) }),
        ), -1, true);
        b1Y.value = withRepeat(withSequence(
            withTiming(15, { duration: 11000, easing: Easing.inOut(Easing.ease) }),
            withTiming(-15, { duration: 11000, easing: Easing.inOut(Easing.ease) }),
        ), -1, true);

        // Blob 2
        b2Scale.value = withRepeat(withSequence(
            withTiming(1.08, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.95, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
        ), -1, true);
        b2X.value = withRepeat(withSequence(
            withTiming(-18, { duration: 16000, easing: Easing.inOut(Easing.ease) }),
            withTiming(18,  { duration: 16000, easing: Easing.inOut(Easing.ease) }),
        ), -1, true);
        b2Y.value = withRepeat(withSequence(
            withTiming(-12, { duration: 13000, easing: Easing.inOut(Easing.ease) }),
            withTiming(12,  { duration: 13000, easing: Easing.inOut(Easing.ease) }),
        ), -1, true);

        // Blob 3
        b3Scale.value = withRepeat(withSequence(
            withTiming(1.15, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.90, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
        ), -1, true);
        b3X.value = withRepeat(withSequence(
            withTiming(25,  { duration: 15000, easing: Easing.inOut(Easing.ease) }),
            withTiming(-25, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
        ), -1, true);
        b3Y.value = withRepeat(withSequence(
            withTiming(20,  { duration: 12000, easing: Easing.inOut(Easing.ease) }),
            withTiming(-20, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
        ), -1, true);

        // Blob 4
        b4Scale.value = withRepeat(withSequence(
            withTiming(1.20, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.85, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
        ), -1, true);
    }, []);

    const blob1Style = useAnimatedStyle(() => ({
        transform: [{ scale: b1Scale.value }, { translateX: b1X.value }, { translateY: b1Y.value }],
    }));
    const blob2Style = useAnimatedStyle(() => ({
        transform: [{ scale: b2Scale.value }, { translateX: b2X.value }, { translateY: b2Y.value }],
    }));
    const blob3Style = useAnimatedStyle(() => ({
        transform: [{ scale: b3Scale.value }, { translateX: b3X.value }, { translateY: b3Y.value }],
    }));
    const blob4Style = useAnimatedStyle(() => ({
        transform: [{ scale: b4Scale.value }],
    }));

    return (
        <View style={styles.container}>
            {/* Deep blue gradient base */}
            <LinearGradient
                colors={['#061524', '#0A2D50', '#0F4C81', '#0E3D6E']}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Blob 1 — large teal-blue top-left organic shape */}
            <Animated.View style={[styles.blob1, blob1Style]} pointerEvents="none">
                <LinearGradient
                    colors={['rgba(30,111,183,0.70)', 'rgba(15,76,129,0.30)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.2, y: 0.1 }}
                    end={{ x: 0.9, y: 0.9 }}
                />
            </Animated.View>

            {/* Blob 2 — large lower-right deep blue shape */}
            <Animated.View style={[styles.blob2, blob2Style]} pointerEvents="none">
                <LinearGradient
                    colors={['rgba(21,101,192,0.60)', 'rgba(13,71,161,0.25)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.1, y: 0.1 }}
                    end={{ x: 0.8, y: 0.9 }}
                />
            </Animated.View>

            {/* Blob 3 — mid accent bright blue */}
            <Animated.View style={[styles.blob3, blob3Style]} pointerEvents="none">
                <LinearGradient
                    colors={['rgba(79,179,255,0.18)', 'rgba(33,150,243,0.08)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            {/* Blob 4 — small sparkle upper-right */}
            <Animated.View style={[styles.blob4, blob4Style]} pointerEvents="none">
                <LinearGradient
                    colors={['rgba(123,200,255,0.25)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.2, y: 0.2 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            {/* Radial bloom — center depth glow */}
            <View style={styles.centerGlow} pointerEvents="none" />

            {/* Subtle bottom vignette */}
            <LinearGradient
                colors={['transparent', 'rgba(6,21,36,0.40)']}
                style={styles.vignette}
                start={{ x: 0.5, y: 0.3 }}
                end={{ x: 0.5, y: 1 }}
                pointerEvents="none"
            />

            <View style={styles.content}>{children}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#061524' },
    content:   { flex: 1, zIndex: 10 },

    blob1: {
        position: 'absolute',
        top: -height * 0.15,
        left: -width * 0.25,
        width: width * 1.1,
        height: width * 1.1,
        borderRadius: width * 0.55,
        overflow: 'hidden',
        opacity: 0.9,
    },
    blob2: {
        position: 'absolute',
        bottom: -height * 0.10,
        right: -width * 0.30,
        width: width * 1.0,
        height: width * 1.0,
        borderRadius: width * 0.5,
        overflow: 'hidden',
        opacity: 0.85,
    },
    blob3: {
        position: 'absolute',
        top: height * 0.28,
        left: -width * 0.10,
        width: width * 0.80,
        height: width * 0.80,
        borderRadius: width * 0.40,
        overflow: 'hidden',
        opacity: 0.75,
    },
    blob4: {
        position: 'absolute',
        top: height * 0.05,
        right: -width * 0.10,
        width: width * 0.55,
        height: width * 0.55,
        borderRadius: width * 0.275,
        overflow: 'hidden',
        opacity: 0.80,
    },
    centerGlow: {
        position: 'absolute',
        top: height * 0.20,
        left: width * 0.15,
        width: width * 0.70,
        height: width * 0.70,
        borderRadius: width * 0.35,
        backgroundColor: 'rgba(30,111,183,0.12)',
        zIndex: 1,
    },
    vignette: {
        ...StyleSheet.absoluteFill,
        zIndex: 2,
    },
});
