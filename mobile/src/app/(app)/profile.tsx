import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input, Button } from '../../components/ui';
import { authService } from '../../services/auth';

export default function ProfileScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [fullName, setFullName] = useState('');

    // Fetch user profile
    const { data: userData, isLoading } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: () => authService.getCurrentUser(),
    });

    useEffect(() => {
        if (userData?.full_name) {
            setFullName(userData.full_name);
        }
    }, [userData]);

    // Update Profile Mutation
    const updateProfileMutation = useMutation({
        mutationFn: (data: { full_name: string }) => authService.updateProfile(data),
        onSuccess: (updatedData) => {
            queryClient.setQueryData(['user', 'me'], updatedData);
            Alert.alert('Success', 'Profile updated successfully!');
            router.back();
        },
        onError: () => {
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        },
    });

    const handleSave = () => {
        if (!fullName.trim()) {
            Alert.alert('Validation Error', 'Full Name cannot be empty.');
            return;
        }
        updateProfileMutation.mutate({ full_name: fullName });
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#0EA5E9" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Edit Profile</Text>
                    <View style={{ width: 24 }} /> {/* Balance for back button */}
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Avatar Display */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarWrapper}>
                            <Ionicons name="person" size={48} color="#0EA5E9" />
                            <View style={styles.editIconBadge}>
                                <Ionicons name="pencil" size={14} color="#FFFFFF" />
                            </View>
                        </View>
                        <Text style={styles.emailText}>{userData?.email}</Text>
                    </View>

                    {/* Edit Form */}
                    <View style={styles.formContainer}>
                        <Input
                            label="Full Name"
                            placeholder="Enter your full name"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                        />

                        <Input
                            label="Email Address"
                            value={userData?.email || ''}
                            editable={false}
                            placeholder="Email"
                        />
                        <Text style={styles.helperText}>
                            Email addresses cannot be changed directly for security reasons.
                        </Text>
                    </View>
                </ScrollView>

                {/* Fixed Action Button */}
                <View style={styles.footer}>
                    <Button
                        title={updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        onPress={handleSave}
                        disabled={updateProfileMutation.isPending || fullName === userData?.full_name}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F6F8',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 30,
        paddingBottom: 20,
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    avatarContainer: {
        alignItems: 'center',
        marginVertical: 32,
    },
    avatarWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E0F2FE',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: 16,
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#0EA5E9',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    emailText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    formContainer: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        gap: 16,
    },
    helperText: {
        marginTop: -8,
        fontSize: 12,
        color: '#9CA3AF',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
});
