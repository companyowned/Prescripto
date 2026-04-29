import React, { useMemo, useState } from 'react';
import { Alert, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, GlassBackground, Input } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useActiveProfile } from '../../contexts/profile-context';
import { useCreateProfile, useUpdateProfile } from '../../features/profiles/hooks';
import { RelationshipToOwner } from '../../features/profiles/types';

const REL_VALUES: RelationshipToOwner[] = ['self', 'child', 'parent', 'spouse', 'sibling', 'other'];

export default function ProfileFormScreen() {
    const router = useRouter();
    const { profileId } = useLocalSearchParams<{ profileId?: string }>();
    const { profiles, refreshProfiles } = useActiveProfile();
    const editingProfile = useMemo(
        () => profiles.find((p) => p.id === profileId) ?? null,
        [profiles, profileId]
    );
    const createProfile = useCreateProfile();
    const updateProfile = useUpdateProfile();

    const [fullName, setFullName] = useState(editingProfile?.full_name ?? '');
    const [relationship, setRelationship] = useState<RelationshipToOwner>(
        editingProfile?.relationship_to_owner ?? 'other'
    );
    const [dobDate, setDobDate] = useState<Date | null>(editingProfile?.date_of_birth ? new Date(editingProfile.date_of_birth) : null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [linkedEmail, setLinkedEmail] = useState('');
    const [gender, setGender] = useState(editingProfile?.gender ?? '');

    const submit = async () => {
        if (!fullName.trim()) {
            Alert.alert('Validation Error', 'Full name is required');
            return;
        }
        const payload = {
            full_name: fullName.trim(),
            relationship_to_owner: relationship,
            date_of_birth: dobDate ? dobDate.toISOString().split('T')[0] : null,
            linked_email: linkedEmail.trim() || undefined,
            gender: gender || null,
        };
        try {
            if (editingProfile) {
                await updateProfile.mutateAsync({ profileId: editingProfile.id, data: payload });
            } else {
                await createProfile.mutateAsync(payload);
            }
            await refreshProfiles();
            router.back();
        } catch (e: any) {
            Alert.alert('Save Failed', e?.response?.data?.detail || 'Please try again');
        }
    };

    return (
        <GlassBackground>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Button title="← Back" onPress={() => router.back()} variant="ghost" size="sm" />
                    <Text style={styles.title}>{editingProfile ? 'Edit Profile' : 'Add Profile'}</Text>
                    <View style={{ width: 80 }} />
                </View>
                <View style={styles.form}>
                    <Input label="Full Name" value={fullName} onChangeText={setFullName} />
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Date of Birth</Text>
                        <Button
                            title={dobDate ? dobDate.toISOString().split('T')[0] : "Select Date"}
                            variant="outline"
                            onPress={() => setShowDatePicker(true)}
                        />
                        {showDatePicker && (
                            <DateTimePicker
                                value={dobDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, date) => {
                                    setShowDatePicker(Platform.OS === 'ios');
                                    if (date) setDobDate(date);
                                }}
                            />
                        )}
                    </View>
                    {!editingProfile && relationship !== 'self' && (
                        <View style={styles.inputContainer}>
                            <Input
                                label="Invite Email (Optional)"
                                value={linkedEmail}
                                onChangeText={setLinkedEmail}
                                placeholder="Create a full account for them"
                            />
                        </View>
                    )}
                    <Input label="Gender (optional)" value={gender} onChangeText={setGender} />
                    <Text style={styles.label}>Relationship</Text>
                    <View style={styles.relRow}>
                        {REL_VALUES.map((rel) => (
                            <Button
                                key={rel}
                                title={rel}
                                size="sm"
                                variant={relationship === rel ? 'primary' : 'outline'}
                                onPress={() => setRelationship(rel)}
                            />
                        ))}
                    </View>
                    <Button
                        title={editingProfile ? 'Save Changes' : 'Create Profile'}
                        onPress={submit}
                        loading={createProfile.isPending || updateProfile.isPending}
                    />
                </View>
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
    form: { padding: spacing.lg, gap: spacing.md },
    inputContainer: { gap: 4 },
    label: { color: colors.textSecondary, fontSize: 13, marginTop: 8 },
    relRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
