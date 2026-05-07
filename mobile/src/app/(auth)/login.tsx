/**
 * Login route
 */

import React, { useState, useEffect } from 'react';
import {
    Alert,
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
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input } from '../../components/ui';
import { FloatingMedicalBackground } from '../../components/ui/FloatingMedicalBackground';
import { colors, spacing, typography } from '../../theme';
import { authService } from '../../services/auth';
import { biometricAuthService } from '../../services/biometricAuth';
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

export default function LoginScreen() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [biometricLoading, setBiometricLoading] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEmail, setBiometricEmail] = useState<string | null>(null);
    const [error, setError] = useState('');

    // Floating animation for logo
    const floatY = useSharedValue(0);

    useEffect(() => {
        floatY.value = withRepeat(
            withSequence(
                withTiming(-10, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    useEffect(() => {
        const loadBiometricState = async () => {
            const canUseBiometrics = await biometricAuthService.canUseBiometrics();
            setBiometricAvailable(canUseBiometrics);
            if (canUseBiometrics) {
                setBiometricEmail(await biometricAuthService.getLinkedEmail());
            }
        };

        loadBiometricState();
    }, []);

    const floatStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: floatY.value }]
    }));

    const askToEnableBiometricLogin = (): Promise<boolean> => {
        return new Promise((resolve) => {
            Alert.alert(
                'Enable Fingerprint Login?',
                'Use your fingerprint to sign in to this Prescripto account on this device.',
                [
                    { text: 'Not Now', style: 'cancel', onPress: () => resolve(false) },
                    { text: 'Enable', onPress: () => resolve(true) },
                ]
            );
        });
    };

    const refreshBiometricState = async () => {
        setBiometricAvailable(await biometricAuthService.canUseBiometrics());
        setBiometricEmail(await biometricAuthService.getLinkedEmail());
    };

    const maybeEnableBiometricLogin = async (loginEmail: string, loginPassword: string) => {
        if (!(await biometricAuthService.shouldOfferSetup(loginEmail))) return;

        const shouldEnable = await askToEnableBiometricLogin();
        if (!shouldEnable) return;

        try {
            await biometricAuthService.enable(loginEmail, loginPassword);
            await refreshBiometricState();
        } catch (err: any) {
            setError(err?.message || 'Could not enable fingerprint login.');
        }
    };

    const handleLogin = async () => {
        const emailErr = validators.email(email);
        const passErr = validators.password(password);
        if (emailErr || passErr) {
            setError(emailErr || passErr || '');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const normalizedEmail = email.trim().toLowerCase();
            await authService.login({ email: normalizedEmail, password });
            await maybeEnableBiometricLogin(normalizedEmail, password);
            signIn(); // Update AuthGate state → triggers navigation to home
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Login failed. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const handleBiometricLogin = async () => {
        if (!biometricEmail) return;

        setBiometricLoading(true);
        setError('');
        try {
            const credentials = await biometricAuthService.getCredentialsWithPrompt();
            if (!credentials) {
                setError('Fingerprint login was cancelled.');
                return;
            }
            await authService.login(credentials);
            signIn();
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Fingerprint login failed. Please sign in with your password.'));
        } finally {
            setBiometricLoading(false);
        }
    };

    return (
        <FloatingMedicalBackground>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    
                    <Animated.View entering={FadeInDown.duration(800).springify().damping(15)} style={styles.header}>
                        <Animated.View style={[styles.logoWrapper, floatStyle]}>
                            {/* Force light or default tint on Web to prevent huge black squares if backdrop-filter is simulated */}
                            <BlurView intensity={Platform.OS === 'web' ? 20 : 40} tint="default" style={StyleSheet.absoluteFill} />
                            <LinearGradient
                                colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.0)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0.5, y: 0.5 }}
                                style={StyleSheet.absoluteFill}
                            />
                            <Text style={styles.logo}>�</Text>
                        </Animated.View>
                        <Text style={[styles.title, styles.titleGlow]}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to manage your medications intelligently</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.duration(800).delay(200).springify().damping(15)} style={styles.formWrapper}>
                        {/* On Web, Dark tint sets a heavy rgba(0,0,0,0.5) that ruins the Glassmorphism base layer */}
                        <BlurView intensity={24} tint="default" style={[StyleSheet.absoluteFill, styles.glassCard]} />
                        
                        {/* Inner Top-Left Edge Reflection for 3D glassy curve */}
                        <LinearGradient
                            colors={['rgba(255,255,255,0.25)', 'transparent', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[StyleSheet.absoluteFill, styles.glassHighlight]}
                            pointerEvents="none"
                        />

                        <View style={styles.formContent}>
                            <Input
                                label="Email"
                                placeholder="you@example.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="off" // Stop basic autofill formatting
                            />
                            <Input
                                label="Password"
                                placeholder="Enter your password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoComplete="off"
                            />

                            {error ? (
                                <Animated.Text entering={FadeIn.duration(400)} style={styles.error}>
                                    {error}
                                </Animated.Text>
                            ) : null}

                            <Button
                                title="Sign In"
                                onPress={handleLogin}
                                loading={loading}
                                size="lg"
                                style={styles.button}
                            />
                            {biometricAvailable ? (
                                <Button
                                    title="Fingerprint Login"
                                    onPress={handleBiometricLogin}
                                    loading={biometricLoading}
                                    disabled={!biometricEmail || loading}
                                    variant="outline"
                                    size="lg"
                                />
                            ) : null}
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeIn.duration(1000).delay(400)} style={styles.footer}>
                        <Button
                            title="Create Account"
                            onPress={() => router.push('/(auth)/register')}
                            variant="ghost"
                        />
                        <Button
                            title="Forgot Password?"
                            onPress={() => router.push('/(auth)/forgot-password')}
                            variant="ghost"
                        />
                    </Animated.View>

                </ScrollView>
            </KeyboardAvoidingView>
        </FloatingMedicalBackground>
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
        paddingVertical: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoWrapper: {
        width: 86,
        height: 86,
        borderRadius: 43,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: colors.primary[300], // Cyan Glow
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    logo: {
        fontSize: 42,
        lineHeight: 52,
        textShadowColor: 'rgba(62, 219, 240, 0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20, // Glow around the pill emoji itself
    },
    title: {
        ...typography.h1,
        color: '#FFFFFF',
        marginBottom: spacing.xs,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    titleGlow: {
        textShadowColor: 'rgba(62, 219, 240, 0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15, // Premium glowing typography
    },
    subtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 20,
        opacity: 0.9,
    },
    formWrapper: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)', // Light glass border
        backgroundColor: 'rgba(255, 255, 255, 0.08)', // Keep strictly transparent
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 8,
    },
    glassCard: {
        borderRadius: 24,
    },
    glassHighlight: {
        borderRadius: 24,
    },
    formContent: {
        padding: 24,
        zIndex: 2,
    },
    error: {
        ...typography.bodySmall,
        color: colors.error,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    button: {
        marginBottom: spacing.xs,
    },
    footer: {
        marginTop: spacing.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
    },
});
