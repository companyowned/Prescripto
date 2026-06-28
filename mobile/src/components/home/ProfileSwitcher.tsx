import React from 'react';
import { Alert, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActiveProfile } from '../../contexts/profile-context';
import { colors } from '../../theme';

const RELATIONSHIP_LABELS: Record<string, string> = {
    self:    'Self',
    child:   'Child',
    parent:  'Parent',
    spouse:  'Spouse',
    sibling: 'Sibling',
    other:   'Other',
};

export function ProfileSwitcher() {
    const { profiles, activeProfile, setActiveProfileId } = useActiveProfile();

    const openSelector = () => {
        Alert.alert(
            'Switch Profile',
            'Choose which family profile to view',
            [
                ...profiles.map((profile) => ({
                    text: `${profile.full_name} (${RELATIONSHIP_LABELS[profile.relationship_to_owner] ?? profile.relationship_to_owner})`,
                    onPress: () => setActiveProfileId(profile.id),
                })),
                { text: 'Cancel', style: 'cancel' as const },
            ]
        );
    };

    if (!activeProfile) return null;
    return (
        <TouchableOpacity style={styles.container} onPress={openSelector} activeOpacity={0.8}>
            <View style={styles.badge}>
                <View style={styles.left}>
                    <Text style={styles.label}>Viewing</Text>
                    <Text style={styles.value}>
                        {activeProfile.full_name.split(' ')[0]} · {RELATIONSHIP_LABELS[activeProfile.relationship_to_owner]}
                    </Text>
                </View>
                <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.50)" />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 14 },
    badge: {
        backgroundColor: colors.glass.background,
        borderColor:     colors.glass.borderHighlight,
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    left: {},
    label: {
        color: 'rgba(255,255,255,0.50)',
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    value: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
});
