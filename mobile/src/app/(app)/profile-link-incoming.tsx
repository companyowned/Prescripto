/**
 * Approve or reject incoming profile link requests (you own the profile).
 */

import React from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassBackground } from '../../components/ui';
import type { ProfileLinkRequestItem } from '../../features/profileLinks/api';
import {
    useAcceptProfileLinkRequest,
    useIncomingProfileLinkRequests,
    useRejectProfileLinkRequest,
} from '../../features/profileLinks/hooks';
import { colors, spacing, typography } from '../../theme';

export default function ProfileLinkIncomingScreen() {
    const router = useRouter();
    const { data, isLoading, refetch } = useIncomingProfileLinkRequests();
    const accept = useAcceptProfileLinkRequest();
    const reject = useRejectProfileLinkRequest();

    const onAccept = (id: string) => {
        Alert.alert('Approve access?', 'They will be able to view data according to the permissions they requested.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Approve',
                onPress: async () => {
                    try {
                        await accept.mutateAsync(id);
                        refetch();
                    } catch (e: any) {
                        Alert.alert('Error', e?.response?.data?.detail || 'Failed');
                    }
                },
            },
        ]);
    };

    const onReject = (id: string) => {
        Alert.alert('Reject request?', undefined, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reject',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await reject.mutateAsync(id);
                        refetch();
                    } catch (e: any) {
                        Alert.alert('Error', e?.response?.data?.detail || 'Failed');
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }: { item: ProfileLinkRequestItem }) => (
        <View style={styles.card}>
            <Text style={styles.meta}>User ID: …{item.requester_user_id.replace(/-/g, '').slice(-8)}</Text>
            <Text style={styles.perms}>
                {[
                    item.can_read_prescriptions && 'Rx',
                    item.can_read_documents && 'Docs',
                    item.can_read_reminders && 'Reminders',
                    item.can_read_family_profile && 'Profile',
                    item.can_read_medical_history && 'History',
                ]
                    .filter(Boolean)
                    .join(' · ')}
            </Text>
            <View style={styles.row}>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => onReject(item.id)}>
                    <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept(item.id)}>
                    <Text style={styles.acceptText}>Approve</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <GlassBackground>
            <SafeAreaView style={styles.safe}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Incoming requests</Text>
                    <View style={{ width: 40 }} />
                </View>

                {isLoading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={colors.primary[400]} />
                    </View>
                ) : (
                    <FlatList
                        data={data ?? []}
                        keyExtractor={(i) => i.id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <Text style={styles.empty}>
                                No pending requests. Share a profile QR from Family Profiles.
                            </Text>
                        }
                        renderItem={renderItem}
                    />
                )}
            </SafeAreaView>
        </GlassBackground>
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
        marginBottom: spacing.md,
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
    list: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
    center: { paddingTop: 40 },
    empty: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 40 },
    card: {
        backgroundColor: colors.glass.background,
        borderRadius: 14,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
    },
    meta: { ...typography.caption, color: colors.textSecondary },
    perms: { ...typography.body, color: '#E2E8F0', marginTop: 8 },
    row: { flexDirection: 'row', gap: 10, marginTop: 14 },
    rejectBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: 'rgba(239,68,68,0.15)',
        alignItems: 'center',
    },
    rejectText: { color: colors.error, fontWeight: '700' },
    acceptBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: colors.primary[500],
        alignItems: 'center',
    },
    acceptText: { color: '#FFFFFF', fontWeight: '700' },
});
