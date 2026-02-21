/**
 * Register route
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

export default function RegisterScreen() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
            setError(err?.response?.data?.detail || 'Registration failed.');
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
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join Prescripto to get started</Text>
                </View>

                <View style={styles.form}>
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

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <Button
                        title="Create Account"
                        onPress={handleRegister}
                        loading={loading}
                        size="lg"
                        style={styles.button}
                    />

                    <Button
                        title="Already have an account? Sign In"
                        onPress={() => router.back()}
                        variant="ghost"
                        style={styles.loginBtn}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.dark.bg,
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
    title: {
        ...typography.h1,
        color: colors.dark.textPrimary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.bodySmall,
        color: colors.dark.textMuted,
    },
    form: {
        width: '100%',
    },
    error: {
        ...typography.bodySmall,
        color: colors.error,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    button: {
        marginTop: spacing.sm,
    },
    loginBtn: {
        marginTop: spacing.md,
    },
});
