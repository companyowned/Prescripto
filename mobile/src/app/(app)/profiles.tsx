import React from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, GlassBackground } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useActiveProfile } from '../../contexts/profile-context';
import { useDeleteProfile, useSetDefaultProfile } from '../../features/profiles/hooks';

export default function ProfilesScreen() {
    const router = useRouter();
    const { profiles, activeProfile, setActiveProfileId, refreshProfiles } = useActiveProfile();
    const deleteProfile = useDeleteProfile();
    const setDefault = useSetDefaultProfile();

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

    return (
        <GlassBackground>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Button title="← Back" onPress={() => router.back()} variant="ghost" size="sm" />
                    <Text style={styles.title}>Family Profiles</Text>
                    <View style={{ width: 80 }} />
                </View>
                <View style={styles.actions}>
                    <Button title="Add Profile" onPress={() => router.push('/(app)/profile-form')} />
                </View>
                <FlatList
                    data={profiles}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No profiles found.</Text>}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Text style={styles.name}>{item.full_name}</Text>
                            <Text style={styles.meta}>
                                {item.relationship_to_owner}{item.is_default ? ' - Default' : ''}
                            </Text>
                            <View style={styles.row}>
                                <Button
                                    title="Select"
                                    size="sm"
                                    variant={activeProfile?.id === item.id ? 'primary' : 'outline'}
                                    onPress={() => setActiveProfileId(item.id)}
                                />
                                <Button
                                    title="Edit"
                                    size="sm"
                                    variant="outline"
                                    onPress={() =>
                                        router.push({
                                            pathname: '/(app)/profile-form',
                                            params: { profileId: item.id },
                                        })
                                    }
                                />
                                {!item.is_default && (
                                    <Button
                                        title="Set Default"
                                        size="sm"
                                        variant="ghost"
                                        onPress={() => setDefault.mutate(item.id)}
                                    />
                                )}
                                <TouchableOpacity onPress={() => confirmDelete(item.id, item.full_name)}>
                                    <Text style={styles.delete}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
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
        paddingHorizontal: spacing.lg,
    },
    title: { color: '#fff', fontSize: 20, fontWeight: '700' },
    actions: { paddingHorizontal: spacing.lg, marginTop: spacing.sm },
    list: { padding: spacing.lg, gap: spacing.md, paddingBottom: 50 },
    card: {
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
        borderRadius: 14,
        padding: spacing.md,
        backgroundColor: colors.glass.background,
    },
    name: { color: '#fff', fontSize: 16, fontWeight: '700' },
    meta: { color: colors.textSecondary, marginTop: 4, marginBottom: 8 },
    row: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
    delete: { color: colors.error, fontWeight: '700' },
    empty: { color: '#fff', textAlign: 'center', marginTop: 40 },
});
