import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    withSequence,
} from 'react-native-reanimated';
import { colors } from '../../theme';

const { width, height } = Dimensions.get('window');

// 
// 3D Styled Components
//

const FloatingPill3D = ({ delay, duration, startPos, scale = 1, opacity = 0.5 }: any) => {
    const translateY = useSharedValue(0);
    const rotateZ = useSharedValue(0);

    useEffect(() => {
        setTimeout(() => {
            translateY.value = withRepeat(
                withSequence(
                    withTiming(-80, { duration, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
            rotateZ.value = withRepeat(
                withTiming(30, { duration: duration * 1.5, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        }, delay);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { rotate: `${rotateZ.value}deg` },
            { scale },
        ],
        opacity,
    }));

    return (
        <Animated.View style={[styles.pillWrapper, startPos, animatedStyle]}>
            {/* 3D Glossy Pill structure */}
            <View style={styles.pillHalfTop}>
                <LinearGradient
                    colors={['rgba(62, 219, 240, 0.8)', 'rgba(31, 163, 198, 0.4)']}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.8, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                {/* 3D Highlight */}
                <View style={styles.pillHighlight} />
            </View>
            <View style={styles.pillHalfBottom}>
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.0)']}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.8, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
            </View>
        </Animated.View>
    );
};

const FloatingCross3D = ({ delay, duration, startPos, scale = 1, opacity = 0.4 }: any) => {
    const translateY = useSharedValue(0);
    const rotateZ = useSharedValue(15);

    useEffect(() => {
        setTimeout(() => {
            translateY.value = withRepeat(
                withSequence(
                    withTiming(60, { duration, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
            rotateZ.value = withRepeat(
                withTiming(45, { duration: duration * 2, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        }, delay);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { rotate: `${rotateZ.value}deg` },
            { scale },
        ],
        opacity,
    }));

    return (
        <Animated.View style={[styles.crossWrapper, startPos, animatedStyle]}>
            {/* Glow backing */}
            <View style={styles.crossGlow} />
            {/* Cross Arms */}
            <View style={styles.crossH}>
                <LinearGradient
                    colors={['rgba(62, 219, 240, 0.6)', 'rgba(15, 92, 115, 0.4)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
            </View>
            <View style={styles.crossV}>
                <LinearGradient
                    colors={['rgba(62, 219, 240, 0.8)', 'rgba(15, 92, 115, 0.2)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
            </View>
        </Animated.View>
    );
};

// Main Background Component
interface FloatingMedicalBackgroundProps {
    children: React.ReactNode;
}

export const FloatingMedicalBackground: React.FC<FloatingMedicalBackgroundProps> = ({ children }) => {
    return (
        <View style={styles.container}>
            {/* Core Gradient Layer */}
            <LinearGradient
                colors={['#04151A', '#020C10']} // Deepest Navy
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Glowing Orbs for Primary Light Sources (Midground) */}
            <View style={[styles.glowOrb, styles.glowTopRight]}>
                <LinearGradient
                    colors={['rgba(62, 219, 240, 0.15)', 'transparent']} // Cyan
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 1, y: 1 }}
                />
            </View>

            <View style={[styles.glowOrb, styles.glowBottomLeft]}>
                <LinearGradient
                    colors={['rgba(31, 163, 198, 0.2)', 'transparent']} // Teal
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 0, y: 1 }}
                />
            </View>

            {/* 3D Floating Elements (Background Depth) */}
            <FloatingPill3D
                delay={0}
                duration={14000}
                scale={2}
                opacity={0.65}
                startPos={{ top: height * 0.1, left: width * 0.05 }}
            />
            
            <FloatingCross3D
                delay={1500}
                duration={16000}
                scale={2}
                opacity={0.5}
                startPos={{ top: height * 0.25, right: width * 0.15 }}
            />

            <FloatingPill3D
                delay={500}
                duration={12000}
                scale={1.2}
                opacity={0.8}
                startPos={{ bottom: height * 0.2, left: width * 0.05 }}
            />

            <FloatingCross3D
                delay={2000}
                duration={18000}
                scale={3.5}
                opacity={0.4}
                startPos={{ bottom: height * 0.15, right: width * 0.02 }}
            />
            
            {/* Extremely prominent sharp cross near the form */}
            <FloatingCross3D
                delay={1000}
                duration={10000}
                scale={1}
                opacity={0.9}
                startPos={{ top: height * 0.5, left: -20 }}
            />

            {/* Foreground Content */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#04151A',
    },
    content: {
        flex: 1,
        zIndex: 10,
    },
    glowOrb: {
        position: 'absolute',
        borderRadius: 400,
    },
    glowTopRight: {
        top: -200,
        right: -150,
        width: 600,
        height: 600,
    },
    glowBottomLeft: {
        bottom: -200,
        left: -150,
        width: 600,
        height: 600,
    },
    // Pill 3D Styles
    pillWrapper: {
        position: 'absolute',
        width: 50,
        height: 120,
        borderRadius: 25,
        shadowColor: 'rgba(62, 219, 240, 0.5)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.1)',
        ...(Platform.OS === 'web' && { filter: 'blur(3px)' } as any), // True depth of field on web
    },
    pillHalfTop: {
        flex: 1,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        overflow: 'hidden',
    },
    pillHalfBottom: {
        flex: 1,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        overflow: 'hidden',
    },
    pillHighlight: {
        position: 'absolute',
        top: 5,
        left: 5,
        width: 15,
        height: 35,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.5)',
        transform: [{ rotate: '15deg' }],
    },
    // Cross 3D Styles
    crossWrapper: {
        position: 'absolute',
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web' && { filter: 'blur(4px)' } as any),
    },
    crossGlow: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(62, 219, 240, 0.8)',
        shadowColor: colors.primary[300],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 25,
        elevation: 10,
    },
    crossH: {
        position: 'absolute',
        width: 80,
        height: 24,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    crossV: {
        position: 'absolute',
        width: 24,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
});
