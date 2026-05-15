/**
 * Confirm relationship + sharing permissions, then POST profile link request.
 */

import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassBackground } from '../../components/ui';
import { useCreateProfileLinkRequest, useProfileLinkPreview } from '../../features/profileLinks/hooks';
import type { ProfileLinkPermissions } from '../../features/profileLinks/api';
import { colors, spacing, typography } from '../../theme';

const REL_OPTIONS: { key: string; label: string }[] = [
    { key: 'child', label: 'Child' },
    { key: 'parent', label: 'Parent' },
    { key: 'spouse', label: 'Spouse' },
    { key: 'sibling', label: 'Sibling' },
    { key: 'other', label: 'Other / caregiver' },
];

export default function ProfileLinkConfirmScreen() {
    const router = useRouter();
    const { token: tokenParam } = useLocalSearchParams<{ token: string }>();
    const token = useMemo(() => {
        try {
            return tokenParam ? decodeURIComponent(tokenParam) : '';
        } catch {
            return tokenParam || '';
        }
    }, [tokenParam]);

    const { data: preview, isLoading, error } = useProfileLinkPreview(token || undefined);
    const createReq = useCreateProfileLinkRequest();

    const [relationship, setRelationship] = useState('other');
    const [perms, setPerms] = useState<ProfileLinkPermissions>({
        can_read_prescriptions: true,
        can_read_documents: true,
        can_read_reminders: true,
        can_read_family_profile: true,
        can_read_medical_history: true,
    });

    const submit = async () => {
        if (!token) {
            Alert.alert('Error', 'Missing link token.');
            return;
        }
        if (preview?.is_own_profile) {
            Alert.alert('Cannot link', 'This profile belongs to your account.');
            return;
        }
        try {
            await createReq.mutateAsync({
                token,
                relationship_to_subject: relationship,
                permissions: perms,
            });
            Alert.alert('Request sent', 'The profile owner can approve your request in their app.', [
                { text: 'OK', onPress: () => router.replace('/(app)/profiles') },
            ]);
        } catch (e: any) {
            Alert.alert('Could not send request', e?.response?.data?.detail || e?.message || 'Try again.');
        }
    };

    return (
        <GlassBackground>
            <SafeAreaView style={styles.safe}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Link request</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.body}>
                    {isLoading && (
                        <View style={styles.center}>
                            <ActivityIndicator color={colors.primary[400]} />
                        </View>
                    )}

                    {error && (
                        <Text style={styles.err}>
                            {(error as any)?.response?.data?.detail || 'Invalid or expired QR code.'}
                        </Text>
                    )}

                    {preview && !preview.is_own_profile && (
                        <>
                            <View style={styles.card}>
                                <Text style={styles.cardLabel}>Profile</Text>
                                <Text style={styles.cardName}>{preview.profile_display_name}</Text>
                                <Text style={styles.cardMeta}>Account holder: {preview.owner_display_name}</Text>
                            </View>

                            <Text style={styles.section}>Your relationship to this person</Text>
                            <View style={styles.relRow}>
                                {REL_OPTIONS.map((r) => (
                                    <TouchableOpacity
                                        key={r.key}
                                        style={[styles.relChip, relationship === r.key && styles.relChipOn]}
                                        onPress={() => setRelationship(r.key)}
                                    >
                                        <Text
                                            style={[
                                                styles.relChipText,
                                                relationship === r.key && styles.relChipTextOn,
                                            ]}
                                        >
                                            {r.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.section}>What you are asking to view</Text>
                            <PermRow
                                label="Prescriptions"
                                value={perms.can_read_prescriptions}
                                onValueChange={(v) => setPerms((p) => ({ ...p, can_read_prescriptions: v }))}
                            />
                            <PermRow
                                label="Uploaded documents"
                                value={perms.can_read_documents}
                                onValueChange={(v) => setPerms((p) => ({ ...p, can_read_documents: v }))}
                            />
                            <PermRow
                                label="Medication reminders & doses"
                                value={perms.can_read_reminders}
                                onValueChange={(v) => setPerms((p) => ({ ...p, can_read_reminders: v }))}
                            />
                            <PermRow
                                label="Family profile details"
                                value={perms.can_read_family_profile}
                                onValueChange={(v) => setPerms((p) => ({ ...p, can_read_family_profile: v }))}
                            />
                            <PermRow
                                label="Medical history & insights"
                                value={perms.can_read_medical_history}
                                onValueChange={(v) => setPerms((p) => ({ ...p, can_read_medical_history: v }))}
                            />

                            <TouchableOpacity
                                style={[styles.submit, createReq.isPending && styles.submitDisabled]}
                                onPress={submit}
                                disabled={createReq.isPending}
                            >
                                {createReq.isPending ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.submitText}>Send request</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}

                    {preview?.is_own_profile && (
                        <Text style={styles.err}>You cannot send a link request to your own profile.</Text>
                    )}
                </ScrollView>
            </SafeAreaView>
        </GlassBackground>
    );
}

function PermRow({
    label,
    value,
    onValueChange,
}: {
    label: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
}) {
    return (
        <View style={styles.permRow}>
            <Text style={styles.permLabel}>{label}</Text>
            <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#334155', true: '#0ea5e9' }} />
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: { ...typography.h3, color: '#FFFFFF', fontWeight: '800' },
    body: { padding: spacing.lg, paddingBottom: spacing.xxl },
    center: { paddingVertical: spacing.xl },
    err: { color: colors.error, ...typography.body },
    card: {
        backgroundColor: colors.glass.background,
        borderRadius: 16,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
        marginBottom: spacing.lg,
    },
    cardLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
    cardName: { ...typography.h3, color: '#FFFFFF', fontWeight: '700' },
    cardMeta: { ...typography.body, color: colors.textSecondary, marginTop: 6 },
    section: { ...typography.body, color: '#FFFFFF', fontWeight: '700', marginBottom: spacing.sm, marginTop: spacing.md },
    relRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
    relChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    relChipOn: { borderColor: colors.primary[400], backgroundColor: 'rgba(14,165,233,0.15)' },
    relChipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
    relChipTextOn: { color: '#FFFFFF' },
    permRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    permLabel: { ...typography.body, color: '#E2E8F0', flex: 1, paddingRight: spacing.md },
    submit: {
        marginTop: spacing.xl,
        backgroundColor: colors.primary[500],
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    submitDisabled: { opacity: 0.6 },
    submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
