/**
 * Forgot password route
 */

import React, { useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input } from '../../components/ui';
import { FloatingMedicalBackground } from '../../components/ui/FloatingMedicalBackground';
import { authService } from '../../services/auth';
import { colors, spacing, typography } from '../../theme';
import { validators } from '../../utils/validators';

const OTP_LENGTH = 6;

type ResetStep = 'email' | 'otp' | 'password' | 'done';

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

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const otpInputRef = useRef<TextInput>(null);
    const [step, setStep] = useState<ResetStep>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleRequestCode = async () => {
        const emailErr = validators.email(email);
        if (emailErr) {
            setError(emailErr);
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');
        try {
            const result = await authService.requestPasswordReset(email.trim().toLowerCase());
            setMessage(result.detail);
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
            setStep('otp');
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Could not send reset code. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (value: string) => {
        const digitsOnly = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
        setOtp(digitsOnly);
        setError('');
    };

    const handleContinueFromOtp = async () => {
        if (otp.length !== OTP_LENGTH) {
            setError(`Enter the ${OTP_LENGTH}-digit reset code`);
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');
        try {
            const result = await authService.verifyPasswordResetCode({
                email: email.trim().toLowerCase(),
                otp,
            });
            setMessage(result.detail);
            setStep('password');
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Invalid reset code. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        const passErr = validators.password(newPassword);
        if (otp.length !== OTP_LENGTH) {
            setStep('otp');
            setError(`Enter the ${OTP_LENGTH}-digit reset code`);
            return;
        }
        if (passErr) {
            setError(passErr);
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');
        try {
            const result = await authService.confirmPasswordReset({
                email: email.trim().toLowerCase(),
                otp: otp.trim(),
                new_password: newPassword,
            });
            setMessage(result.detail);
            setStep('done');
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Could not reset password. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <FloatingMedicalBackground>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <Animated.View entering={FadeInDown.duration(700).springify().damping(15)} style={styles.header}>
                        <Text style={[styles.title, styles.titleGlow]}>Forgot Password?</Text>
                        <Text style={styles.subtitle}>
                            {step === 'email'
                                ? 'Enter your account email to receive a reset code.'
                                : step === 'otp'
                                  ? 'Enter the 6-digit code from your email.'
                                  : step === 'password'
                                    ? 'Choose a new password for your account.'
                                    : 'Your password has been updated.'}
                        </Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.duration(700).delay(150).springify().damping(15)} style={styles.formWrapper}>
                        <BlurView intensity={24} tint="default" style={[StyleSheet.absoluteFill, styles.glassCard]} />
                        <LinearGradient
                            colors={['rgba(255,255,255,0.25)', 'transparent', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[StyleSheet.absoluteFill, styles.glassHighlight]}
                            pointerEvents="none"
                        />

                        <View style={styles.formContent}>
                            {step === 'email' ? (
                                <>
                                    <Input
                                        label="Email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                    />
                                    <Button
                                        title="Send Code"
                                        onPress={handleRequestCode}
                                        loading={loading}
                                        size="lg"
                                    />
                                </>
                            ) : null}

                            {step === 'otp' ? (
                                <>
                                    <Text style={styles.codeLabel}>Reset Code</Text>
                                    <Pressable
                                        style={styles.otpWrapper}
                                        onPress={() => otpInputRef.current?.focus()}
                                    >
                                        <TextInput
                                            ref={otpInputRef}
                                            value={otp}
                                            onChangeText={handleOtpChange}
                                            keyboardType="number-pad"
                                            autoComplete="one-time-code"
                                            textContentType="oneTimeCode"
                                            maxLength={OTP_LENGTH}
                                            caretHidden
                                            autoFocus
                                            style={styles.otpHiddenInput}
                                        />
                                        {Array.from({ length: OTP_LENGTH }).map((_, index) => {
                                            const digit = otp[index] || '';
                                            const active = index === otp.length && otp.length < OTP_LENGTH;
                                            return (
                                                <View
                                                    key={index}
                                                    style={[
                                                        styles.otpBox,
                                                        active && styles.otpBoxActive,
                                                        digit && styles.otpBoxFilled,
                                                    ]}
                                                >
                                                    <Text style={styles.otpDigit}>{digit}</Text>
                                                </View>
                                            );
                                        })}
                                    </Pressable>
                                    <Button
                                        title="Continue"
                                        onPress={handleContinueFromOtp}
                                        disabled={otp.length !== OTP_LENGTH || loading}
                                        loading={loading}
                                        size="lg"
                                        style={styles.primaryButton}
                                    />
                                    <Button
                                        title="Resend Code"
                                        onPress={handleRequestCode}
                                        disabled={loading}
                                        loading={loading}
                                        variant="ghost"
                                    />
                                </>
                            ) : null}

                            {step === 'password' ? (
                                <>
                                    <Input
                                        label="New Password"
                                        placeholder="At least 6 characters"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry
                                        autoComplete="new-password"
                                    />
                                    <Input
                                        label="Confirm Password"
                                        placeholder="Re-enter new password"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                        autoComplete="new-password"
                                    />
                                    <Button
                                        title="Update Password"
                                        onPress={handleResetPassword}
                                        loading={loading}
                                        size="lg"
                                        style={styles.primaryButton}
                                    />
                                    <Button
                                        title="Back to Code"
                                        onPress={() => {
                                            setError('');
                                            setMessage('');
                                            setStep('otp');
                                        }}
                                        disabled={loading}
                                        variant="ghost"
                                    />
                                </>
                            ) : null}

                            {step === 'done' ? (
                                <Button
                                    title="Back to Sign In"
                                    onPress={() => router.replace('/(auth)/login')}
                                    size="lg"
                                />
                            ) : null}

                            {message ? (
                                <Animated.Text entering={FadeIn.duration(300)} style={styles.message}>
                                    {message}
                                </Animated.Text>
                            ) : null}
                            {error ? (
                                <Animated.Text entering={FadeIn.duration(300)} style={styles.error}>
                                    {error}
                                </Animated.Text>
                            ) : null}
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeIn.duration(900).delay(350)} style={styles.footer}>
                        <Button
                            title="Back to Sign In"
                            onPress={() => router.back()}
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
        marginBottom: 34,
    },
    title: {
        ...typography.h1,
        color: '#FFFFFF',
        marginBottom: spacing.xs,
        fontWeight: '800',
    },
    titleGlow: {
        textShadowColor: 'rgba(62, 219, 240, 0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    subtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        textAlign: 'center',
        maxWidth: 330,
        opacity: 0.95,
    },
    formWrapper: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    primaryButton: {
        marginBottom: spacing.xs,
    },
    codeLabel: {
        ...typography.label,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        fontWeight: '600',
    },
    otpWrapper: {
        position: 'relative',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    otpHiddenInput: {
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
    },
    otpBox: {
        width: 46,
        height: 54,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.22)',
        backgroundColor: 'rgba(31, 163, 198, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary[300],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    otpBoxActive: {
        borderColor: colors.primary[300],
        shadowOpacity: 0.8,
    },
    otpBoxFilled: {
        borderColor: colors.primary[300],
        backgroundColor: 'rgba(62, 219, 240, 0.18)',
    },
    otpDigit: {
        ...typography.h2,
        color: colors.textPrimary,
        fontWeight: '800',
    },
    message: {
        ...typography.bodySmall,
        color: colors.primary[300],
        textAlign: 'center',
        marginTop: spacing.md,
    },
    error: {
        ...typography.bodySmall,
        color: colors.error,
        textAlign: 'center',
        marginTop: spacing.md,
    },
    footer: {
        marginTop: spacing.lg,
        alignItems: 'center',
    },
});
