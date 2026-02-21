/**
 * Home route — main dashboard
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { authService } from '../../services/auth';
import { useAuth } from '../_layout';

export default function HomeScreen() {
    const router = useRouter();
    const { signOut } = useAuth();

    const handleLogout = async () => {
        await authService.logout();
        signOut(); // Update AuthGate state → redirects to login
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome to</Text>
                    <Text style={styles.title}>Prescripto</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.tagline}>
                Scan or upload your prescriptions for instant AI-powered analysis
            </Text>

            <View style={styles.actions}>
                <TouchableOpacity
                    onPress={() => router.push('/(app)/scan')}
                    activeOpacity={0.8}
                    style={styles.actionCard}
                >
                    <Card variant="elevated" style={styles.scanCard}>
                        <Text style={styles.actionIcon}>📸</Text>
                        <Text style={styles.actionTitle}>Scan Prescription</Text>
                        <Text style={styles.actionDesc}>
                            Use your camera to capture a prescription photo
                        </Text>
                    </Card>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push('/(app)/upload')}
                    activeOpacity={0.8}
                    style={styles.actionCard}
                >
                    <Card variant="elevated" style={styles.uploadCard}>
                        <Text style={styles.actionIcon}>📄</Text>
                        <Text style={styles.actionTitle}>Upload File</Text>
                        <Text style={styles.actionDesc}>
                            Import a PDF or image from your device
                        </Text>
                    </Card>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                onPress={() => router.push('/(app)/history')}
                activeOpacity={0.8}
            >
                <Card variant="outlined" style={styles.historyCard}>
                    <View style={styles.historyContent}>
                        <Text style={styles.historyIcon}>📋</Text>
                        <View style={styles.historyText}>
                            <Text style={styles.historyTitle}>View History</Text>
                            <Text style={styles.historyDesc}>See all your past prescription analyses</Text>
                        </View>
                        <Text style={styles.chevron}>→</Text>
                    </View>
                </Card>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.dark.bg,
        paddingHorizontal: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.xl,
        marginBottom: spacing.lg,
    },
    greeting: {
        ...typography.bodySmall,
        color: colors.dark.textMuted,
    },
    title: {
        ...typography.h1,
        color: colors.primary[400],
    },
    logoutBtn: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.dark.surface,
    },
    logoutText: {
        ...typography.caption,
        color: colors.dark.textSecondary,
    },
    tagline: {
        ...typography.body,
        color: colors.dark.textSecondary,
        marginBottom: spacing.xxl,
        lineHeight: 24,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.lg,
        marginBottom: spacing.xl,
    },
    actionCard: {
        flex: 1,
    },
    scanCard: {
        backgroundColor: colors.primary[500] + '15',
        borderWidth: 1,
        borderColor: colors.primary[500] + '30',
        alignItems: 'center',
        paddingVertical: spacing.xxl,
    },
    uploadCard: {
        backgroundColor: colors.secondary[500] + '15',
        borderWidth: 1,
        borderColor: colors.secondary[500] + '30',
        alignItems: 'center',
        paddingVertical: spacing.xxl,
    },
    actionIcon: {
        fontSize: 40,
        marginBottom: spacing.md,
    },
    actionTitle: {
        ...typography.h3,
        color: colors.dark.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    actionDesc: {
        ...typography.caption,
        color: colors.dark.textMuted,
        textAlign: 'center',
    },
    historyCard: {
        marginTop: spacing.sm,
    },
    historyContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    historyIcon: {
        fontSize: 28,
    },
    historyText: {
        flex: 1,
    },
    historyTitle: {
        ...typography.body,
        color: colors.dark.textPrimary,
        fontWeight: '600',
    },
    historyDesc: {
        ...typography.caption,
        color: colors.dark.textMuted,
    },
    chevron: {
        ...typography.h2,
        color: colors.dark.textMuted,
    },
});
