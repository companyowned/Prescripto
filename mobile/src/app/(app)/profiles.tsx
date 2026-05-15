/**
 * Family Profiles Screen — Manage family member profiles with profile IDs and account promotion
 */

import React, { useState } from 'react';
import {
    Alert, FlatList, SafeAreaView, StyleSheet, Text,
    TouchableOpacity, View, TextInput, Modal,
    TouchableWithoutFeedback, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassBackground } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useActiveProfile } from '../../contexts/profile-context';
import {
    useDeleteProfile,
    useSetDefaultProfile,
    usePromoteToIndependent,
} from '../../features/profiles/hooks';
import { PatientProfile } from '../../features/profiles/types';

const RELATIONSHIP_LABELS: Record<string, string> = {
    self: 'Myself',
    child: 'Child',
    parent: 'Parent',
    spouse: 'Spouse',
    sibling: 'Sibling',
    other: 'Other',
};

const RELATIONSHIP_ICONS: Record<string, string> = {
    self: 'person',
    child: 'happy',
    parent: 'people',
    spouse: 'heart',
    sibling: 'git-compare',
    other: 'person-add',
};

export default function ProfilesScreen() {
    const router = useRouter();
    const { profiles, activeProfile, setActiveProfileId, refreshProfiles } = useActiveProfile();
    const deleteProfile = useDeleteProfile();
    const setDefault = useSetDefaultProfile();
    const promoteMutation = usePromoteToIndependent();

    // Promote modal state
    const [promoteModalVisible, setPromoteModalVisible] = useState(false);
    const [promoteTarget, setPromoteTarget] = useState<PatientProfile | null>(null);
    const [promoteEmail, setPromoteEmail] = useState('');
    const [promotePassword, setPromotePassword] = useState('');

    const confirmDelete = (profileId: string, fullName: string) => {
        Alert.alert('Delete Profile', `Delete ${fullName}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteProfile.mutateAsync(profileId);
                        await refreshProfiles();
                    } catch (e: any) {
                        Alert.alert('Cannot Delete', e?.response?.data?.detail || 'Deletion failed');
                    }
                },
            },
        ]);
    };

    const openPromoteModal = (profile: PatientProfile) => {
        setPromoteTarget(profile);
        setPromoteEmail('');
        setPromotePassword('');
        setPromoteModalVisible(true);
    };

    const handlePromote = async () => {
        if (!promoteTarget) return;
        if (!promoteEmail.trim() || !promotePassword.trim()) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }
        if (promotePassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters.');
            return;
        }
        try {
            await promoteMutation.mutateAsync({
                profileId: promoteTarget.id,
                email: promoteEmail.trim(),
                password: promotePassword,
            });
            setPromoteModalVisible(false);
            await refreshProfiles();
            Alert.alert(
                'Account Created! ✅',
                `An independent account has been created for ${promoteTarget.full_name}.\n\nEmail: ${promoteEmail.trim()}\n\nThey can now log in with their own credentials and all their medical data will be accessible.`,
            );
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.detail || 'Failed to create independent account.');
        }
    };

    const isActive = (id: string) => activeProfile?.id === id;

    const renderProfileCard = ({ item }: { item: PatientProfile }) => {
        const active = isActive(item.id);
        const icon = RELATIONSHIP_ICONS[item.relationship_to_owner] || 'person';
        const label = RELATIONSHIP_LABELS[item.relationship_to_owner] || item.relationship_to_owner;
        const hasLinkedAccount = !!item.linked_user_id;
        const canPromote = item.relationship_to_owner !== 'self' && !hasLinkedAccount;
        const isViewer = item.is_owned === false;

        return (
            <TouchableOpacity
                style={[styles.card, active && styles.cardActive]}
                onPress={() => setActiveProfileId(item.id)}
                activeOpacity={0.7}
            >
                {/* Top row: Avatar + Name + Badge */}
                <View style={styles.cardHeader}>
                    <View style={[styles.avatar, active && styles.avatarActive]}>
                        <Ionicons
                            name={icon as any}
                            size={22}
                            color={active ? '#FFFFFF' : colors.primary[300]}
                        />
                    </View>
                    <View style={styles.cardInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name}>{item.full_name}</Text>
                            {active && (
                                <View style={styles.activeBadge}>
                                    <Text style={styles.activeBadgeText}>Active</Text>
                                </View>
                            )}
                            {item.is_default && (
                                <View style={styles.defaultBadge}>
                                    <Text style={styles.defaultBadgeText}>Default</Text>
                                </View>
                            )}
                            {isViewer && (
                                <View style={styles.sharedBadge}>
                                    <Text style={styles.sharedBadgeText}>Shared</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.relationship}>{label}</Text>
                    </View>
                </View>

                {/* Profile ID row */}
                <View style={styles.idRow}>
                    <Ionicons name="finger-print-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.idLabel}>Profile ID:</Text>
                    <Text style={styles.idValue} selectable>
                        #{item.id.replace(/-/g, '').slice(-8).toUpperCase()}
                    </Text>
                </View>

                {/* Linked account status */}
                {hasLinkedAccount && (
                    <View style={styles.linkedRow}>
                        <Ionicons name="link-outline" size={14} color="#10B981" />
                        <Text style={styles.linkedText}>Linked to independent account</Text>
                    </View>
                )}

                {/* Action buttons */}
                <View style={styles.actionRow}>
                    {!isViewer && (
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push({
                            pathname: '/(app)/profile-form',
                            params: { profileId: item.id },
                        })}
                    >
                        <Ionicons name="create-outline" size={16} color={colors.primary[300]} />
                        <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    )}

                    {!isViewer && !item.is_default && (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => setDefault.mutate(item.id)}
                        >
                            <Ionicons name="star-outline" size={16} color="#F59E0B" />
                            <Text style={styles.actionText}>Set Default</Text>
                        </TouchableOpacity>
                    )}

                    {!isViewer && canPromote && (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.promoteBtn]}
                            onPress={() => openPromoteModal(item)}
                        >
                            <Ionicons name="rocket-outline" size={16} color="#8B5CF6" />
                            <Text style={[styles.actionText, { color: '#8B5CF6' }]}>
                                Make Independent
                            </Text>
                        </TouchableOpacity>
                    )}

                    {!isViewer && !item.is_default && item.relationship_to_owner !== 'self' && (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => confirmDelete(item.id, item.full_name)}
                        >
                            <Ionicons name="trash-outline" size={16} color={colors.error} />
                            <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                        </TouchableOpacity>
                    )}

                    {!isViewer && (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() =>
                                router.push({
                                    pathname: '/(app)/profile-link-qr',
                                    params: { profileId: item.id },
                                })
                            }
                        >
                            <Ionicons name="qr-code-outline" size={16} color={colors.primary[300]} />
                            <Text style={styles.actionText}>Share QR</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <GlassBackground>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Family Profiles</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => router.push('/(app)/profile-link-incoming')}
                        >
                            <Ionicons name="mail-unread-outline" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => router.push('/(app)/profile-form')}
                        >
                            <Ionicons name="add" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.subtitle}>
                    {profiles.length} member{profiles.length !== 1 ? 's' : ''} · Tap a profile to switch
                </Text>

                {/* Profile List */}
                <FlatList
                    data={profiles}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyCard}>
                            <View style={styles.emptyIconWrap}>
                                <Ionicons name="people-outline" size={48} color={colors.primary[300]} />
                            </View>
                            <Text style={styles.emptyTitle}>No Profiles Yet</Text>
                            <Text style={styles.emptyMessage}>
                                Create your first family profile to get started.
                            </Text>
                        </View>
                    }
                    renderItem={renderProfileCard}
                />

                {/* Promote Modal */}
                <Modal visible={promoteModalVisible} transparent animationType="slide">
                    <TouchableWithoutFeedback onPress={() => setPromoteModalVisible(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHandle} />
                                    <View style={styles.modalHeader}>
                                        <View style={styles.modalIconWrap}>
                                            <Ionicons name="rocket" size={28} color="#8B5CF6" />
                                        </View>
                                        <Text style={styles.modalTitle}>Create Independent Account</Text>
                                        <Text style={styles.modalSubtitle}>
                                            Create a separate login for{' '}
                                            <Text style={{ fontWeight: '700', color: '#FFFFFF' }}>
                                                {promoteTarget?.full_name}
                                            </Text>
                                            . All their medical data will remain linked.
                                        </Text>
                                    </View>

                                    <View style={styles.modalForm}>
                                        <Text style={styles.inputLabel}>Email Address</Text>
                                        <TextInput
                                            style={styles.modalInput}
                                            value={promoteEmail}
                                            onChangeText={setPromoteEmail}
                                            placeholder="member@example.com"
                                            placeholderTextColor="rgba(255,255,255,0.3)"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />

                                        <Text style={styles.inputLabel}>Temporary Password</Text>
                                        <TextInput
                                            style={styles.modalInput}
                                            value={promotePassword}
                                            onChangeText={setPromotePassword}
                                            placeholder="Min. 6 characters"
                                            placeholderTextColor="rgba(255,255,255,0.3)"
                                            secureTextEntry
                                        />
                                    </View>

                                    <View style={styles.modalActions}>
                                        <TouchableOpacity
                                            style={styles.cancelBtn}
                                            onPress={() => setPromoteModalVisible(false)}
                                        >
                                            <Text style={styles.cancelBtnText}>Cancel</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.confirmBtn,
                                                promoteMutation.isPending && styles.confirmBtnDisabled,
                                            ]}
                                            onPress={handlePromote}
                                            disabled={promoteMutation.isPending}
                                        >
                                            {promoteMutation.isPending ? (
                                                <ActivityIndicator size="small" color="#FFFFFF" />
                                            ) : (
                                                <>
                                                    <Ionicons name="rocket" size={18} color="#FFFFFF" />
                                                    <Text style={styles.confirmBtnText}>Create Account</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </SafeAreaView>
        </GlassBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 30,
        marginBottom: 4,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.primary[500],
        justifyContent: 'center',
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        paddingHorizontal: 20,
        marginBottom: 16,
        marginTop: 4,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 50,
        gap: 12,
    },

    // Card
    card: {
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
        borderRadius: 16,
        padding: 16,
        backgroundColor: colors.glass.background,
    },
    cardActive: {
        borderColor: colors.primary[500],
        backgroundColor: 'rgba(56, 189, 248, 0.08)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarActive: {
        backgroundColor: colors.primary[500],
    },
    cardInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    activeBadge: {
        backgroundColor: colors.primary[500],
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    activeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    defaultBadge: {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    defaultBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#F59E0B',
    },
    sharedBadge: {
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    sharedBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#A5B4FC',
    },
    relationship: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },

    // ID Row
    idRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    idLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    idValue: {
        fontSize: 11,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        color: colors.primary[300],
        flex: 1,
    },

    // Linked row
    linkedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    linkedText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
    },

    // Actions
    actionRow: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.06)',
        paddingTop: 10,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    promoteBtn: {
        backgroundColor: 'rgba(139, 92, 246, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.25)',
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
    },

    // Empty state
    emptyCard: {
        backgroundColor: colors.glass.background,
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
        marginTop: 20,
    },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1A1F2E',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingBottom: 34,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 20,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    modalIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    modalForm: {
        gap: 4,
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: 6,
        marginTop: 8,
    },
    modalInput: {
        backgroundColor: colors.glass.inputBg,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#FFFFFF',
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    confirmBtn: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#8B5CF6',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    confirmBtnDisabled: {
        opacity: 0.6,
    },
    confirmBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
