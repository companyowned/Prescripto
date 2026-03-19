/**
 * Login route
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input } from '../../components/ui';
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

export default function LoginScreen() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
            await authService.login({ email, password });
            signIn(); // Update AuthGate state → triggers navigation to home
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Login failed. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.logo}>💊</Text>
                    <Text style={styles.title}>Prescripto</Text>
                    <Text style={styles.subtitle}>Scan & analyze prescriptions with AI</Text>
                </View>

                <View style={styles.form}>
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
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <Button
                        title="Sign In"
                        onPress={handleLogin}
                        loading={loading}
                        size="lg"
                        style={styles.button}
                    />

                    <Button
                        title="Create Account"
                        onPress={() => router.push('/(auth)/register')}
                        variant="ghost"
                        style={styles.registerBtn}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6F8',
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xxxl,
    },
    logo: {
        fontSize: 56,
        marginBottom: spacing.md,
    },
    title: {
        ...typography.h1,
        color: '#111827',
        marginBottom: spacing.xs,
        fontWeight: '800',
    },
    subtitle: {
        ...typography.bodySmall,
        color: '#6B7280',
    },
    form: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
    },
    error: {
        ...typography.bodySmall,
        color: colors.error,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    button: {
        marginTop: spacing.sm,
        backgroundColor: '#109AE8',
    },
    registerBtn: {
        marginTop: spacing.md,
    },
});
