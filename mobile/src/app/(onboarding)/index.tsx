/**
 * Onboarding — 3-slide animated walkthrough shown once on first launch
 */
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Dimensions, TouchableOpacity,
    Platform, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../_layout';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        icon: 'scan-outline' as const,
        iconColor: '#4FB3FF',
        iconBg: 'rgba(79,179,255,0.12)',
        title: 'Scan Prescriptions',
        subtitle: 'Instantly digitize handwritten prescriptions using AI — no more lost paper records.',
        accent: '#4FB3FF',
        gradient: ['rgba(79,179,255,0.15)', 'rgba(4,13,18,0)'] as const,
    },
    {
        icon: 'notifications-outline' as const,
        iconColor: '#10B981',
        iconBg: 'rgba(16,185,129,0.12)',
        title: 'Never Miss a Dose',
        subtitle: 'Set smart reminders for every medication and track your adherence with beautiful insights.',
        accent: '#10B981',
        gradient: ['rgba(16,185,129,0.15)', 'rgba(4,13,18,0)'] as const,
    },
    {
        icon: 'people-outline' as const,
        iconColor: '#2196F3',
        iconBg: 'rgba(33,150,243,0.12)',
        title: 'Care for Your Family',
        subtitle: 'Manage multiple health profiles for your whole family — all in one place.',
        accent: '#2196F3',
        gradient: ['rgba(33,150,243,0.15)', 'rgba(4,13,18,0)'] as const,
    },
];

const Slide: React.FC<{ slide: typeof SLIDES[0]; active: boolean }> = ({ slide, active }) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(40);
    const iconScale = useSharedValue(0.5);

    useEffect(() => {
        if (active) {
            opacity.value    = withDelay(100, withTiming(1, { duration: 500 }));
            translateY.value = withDelay(100, withSpring(0, { damping: 14 }));
            iconScale.value  = withDelay(200, withSpring(1, { damping: 10 }));
        } else {
            opacity.value    = withTiming(0, { duration: 200 });
            translateY.value = withTiming(40, { duration: 200 });
            iconScale.value  = withTiming(0.5, { duration: 200 });
        }
    }, [active]);

    const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
    const iconStyle      = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));

    return (
        <Animated.View style={[styles.slide, containerStyle]}>
            <LinearGradient colors={slide.gradient} style={styles.slideGrad} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />

            <Animated.View style={[styles.iconOuter, { backgroundColor: slide.iconBg, borderColor: slide.accent + '40' }, iconStyle]}>
                <Ionicons name={slide.icon} size={52} color={slide.iconColor} />
            </Animated.View>

            <Text style={[styles.slideTitle, { color: slide.iconColor }]}>{slide.title}</Text>
            <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
        </Animated.View>
    );
};

export default function OnboardingScreen() {
    const router = useRouter();
    const { completeOnboarding } = useAuth();
    const [current, setCurrent] = useState(0);
    const slide = SLIDES[current];

    const finish = async () => {
        await completeOnboarding();
        router.replace('/(auth)/login');
    };

    const next = () => {
        if (current < SLIDES.length - 1) setCurrent(current + 1);
        else finish();
    };

    const skip = finish;

    return (
        <View style={styles.container}>
            {/* BG */}
            <Image
                source={require('../../../assets/glass.jpg')}
                style={StyleSheet.absoluteFill as any}
                resizeMode="cover"
            />
            <LinearGradient
                colors={['rgba(4,13,18,0.88)', 'rgba(2,8,14,0.94)']}
                style={StyleSheet.absoluteFill}
            />

            {/* Skip */}
            {current < SLIDES.length - 1 && (
                <TouchableOpacity style={styles.skipBtn} onPress={skip}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            )}

            {/* Slide content */}
            <View style={styles.slideArea}>
                {SLIDES.map((s, i) => (
                    <View key={i} style={StyleSheet.absoluteFill} pointerEvents={i === current ? 'auto' : 'none'}>
                        <Slide slide={s} active={i === current} />
                    </View>
                ))}
            </View>

            {/* Dots */}
            <View style={styles.dots}>
                {SLIDES.map((_, i) => (
                    <TouchableOpacity key={i} onPress={() => setCurrent(i)}>
                        <View style={[
                            styles.dot,
                            i === current && { width: 24, backgroundColor: slide.accent },
                            i !== current && { backgroundColor: 'rgba(255,255,255,0.25)' },
                        ]} />
                    </TouchableOpacity>
                ))}
            </View>

            {/* CTA */}
            <TouchableOpacity style={[styles.cta, { shadowColor: slide.accent }]} onPress={next}>
                <LinearGradient
                    colors={current === SLIDES.length - 1
                        ? [colors.primary[400], colors.primary[300]]
                        : [slide.accent + 'CC', slide.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <Text style={styles.ctaText}>
                    {current === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                </Text>
                <Ionicons name={current === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'} size={20} color="#FFF" />
            </TouchableOpacity>

            <Text style={styles.loginHint}>
                Already have an account?{' '}
                <Text style={{ color: slide.accent, fontWeight: '700' }} onPress={finish}>Sign In</Text>
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#040D12', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: Platform.OS === 'ios' ? 48 : 32 },
    skipBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 56 : 40, right: 24, zIndex: 10 },
    skipText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
    slideArea: { flex: 1, width, alignItems: 'center', justifyContent: 'center' },
    slide: { flex: 1, width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 60 },
    slideGrad: { ...StyleSheet.absoluteFill },
    iconOuter: {
        width: 120, height: 120, borderRadius: 40,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 40, borderWidth: 1.5,
    },
    slideTitle: { fontSize: 30, fontWeight: '900', textAlign: 'center', marginBottom: 16 },
    slideSubtitle: {
        fontSize: 16, color: 'rgba(255,255,255,0.6)', textAlign: 'center',
        lineHeight: 26, maxWidth: 300,
    },
    dots: { flexDirection: 'row', gap: 8, marginBottom: 32 },
    dot: { height: 6, width: 6, borderRadius: 3 },
    cta: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 48, paddingVertical: 18,
        borderRadius: 20, marginBottom: 20, overflow: 'hidden',
        shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
    },
    ctaText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
    loginHint: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
});
