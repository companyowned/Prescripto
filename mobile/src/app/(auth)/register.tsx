/**
 * Register route
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Button, Input, GlassBackground } from '../../components/ui';
import { colors, spacing, typography } from '../../theme';
import { authService } from '../../services/auth';
import { validators } from '../../utils/validators';
import { useAuth } from '../_layout';

function getApiErrorMessage(err: any, fallback: string): string {
    const detail = err?.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim().length > 0) {
        return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0];
        if (typeof first === 'string') return first;
        if (first?.msg) return String(first.msg);
    }
    if (err?.message) {
        return String(err.message);
    }
    return fallback;
}

export default function RegisterScreen() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Floating animation for logo
    const floatY = useSharedValue(0);

    useEffect(() => {
        floatY.value = withRepeat(
            withSequence(
                withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const floatStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: floatY.value }]
    }));

    const handleRegister = async () => {
        const nameErr = validators.fullName(fullName);
        const emailErr = validators.email(email);
        const passErr = validators.password(password);
        if (nameErr || emailErr || passErr) {
            setError(nameErr || emailErr || passErr || '');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await authService.register({ email, full_name: fullName, password });
            await authService.login({ email, password });
            signIn(); // Update AuthGate state → triggers navigation to home
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Registration failed.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <GlassBackground>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    
                    <Animated.View entering={FadeInDown.duration(800).springify().damping(15)} style={styles.header}>
                        <Animated.View style={[styles.logoWrapper, floatStyle]}>
                            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                            <Text style={styles.logo}>💊</Text>
                        </Animated.View>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join Prescripto to digitize your records</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.duration(800).delay(200).springify().damping(15)} style={styles.formWrapper}>
                        <BlurView intensity={24} tint="dark" style={[StyleSheet.absoluteFill, styles.glassCard]} />
                        <View style={styles.formContent}>
                            <Input
                                label="Full Name"
                                placeholder="Dr. John Doe"
                                value={fullName}
                                onChangeText={setFullName}
                                autoCapitalize="words"
                            />
                            <Input
                                label="Email"
                                placeholder="you@example.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Input
                                label="Password"
                                placeholder="At least 6 characters"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />

                            {error ? (
                                <Animated.Text entering={FadeIn.duration(400)} style={styles.error}>
                                    {error}
                                </Animated.Text>
                            ) : null}

                            <Button
                                title="Create Account"
                                onPress={handleRegister}
                                loading={loading}
                                size="lg"
                                style={styles.button}
                            />
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeIn.duration(1000).delay(400)} style={styles.footer}>
                        <Button
                            title="Already have an account? Sign In"
                            onPress={() => router.back()}
                            variant="ghost"
                        />
                    </Animated.View>

                </ScrollView>
            </KeyboardAvoidingView>
        </GlassBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: 50,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
        shadowColor: colors.primary[300],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 5,
    },
    logo: {
        fontSize: 34,
        lineHeight: 40,
    },
    title: {
        ...typography.h1,
        color: '#FFFFFF',
        marginBottom: spacing.xs,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    formWrapper: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glass.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
    },
    glassCard: {
        borderRadius: 24,
    },
    formContent: {
        padding: 24,
    },
    error: {
        ...typography.bodySmall,
        color: colors.error,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    button: {
        marginTop: spacing.xs,
    },
    footer: {
        marginTop: spacing.lg,
        alignItems: 'center',
    },
});
