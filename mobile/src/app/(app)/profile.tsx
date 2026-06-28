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
    Alert,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input, Button, GlassBackground } from '../../components/ui';
import { authService } from '../../services/auth';
import { colors } from '../../theme';
import { useActiveProfile } from '../../contexts/profile-context';

const AVATAR_KEY = 'user_avatar_uri';

export default function ProfileScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [fullName, setFullName] = useState('');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const { activeProfile } = useActiveProfile();

    useEffect(() => {
        AsyncStorage.getItem(AVATAR_KEY).then((uri) => {
            if (uri) setAvatarUri(uri);
        });
    }, []);

    const pickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled && result.assets[0]?.uri) {
            const uri = result.assets[0].uri;
            setAvatarUri(uri);
            await AsyncStorage.setItem(AVATAR_KEY, uri);
        }
    };

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
            <GlassBackground>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={colors.primary[300]} />
                    </View>
                </SafeAreaView>
            </GlassBackground>
        );
    }

    return (
        <GlassBackground>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Edit Profile</Text>
                        <View style={{ width: 24 }} /> {/* Balance for back button */}
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {/* Avatar Display */}
                        <View style={styles.avatarContainer}>
                            <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8}>
                                <View style={styles.avatarWrapper}>
                                    {avatarUri ? (
                                        <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                                    ) : (
                                        <Ionicons name="person" size={48} color={colors.primary[300]} />
                                    )}
                                    <View style={styles.editIconBadge}>
                                        <Ionicons name="camera" size={14} color="#FFFFFF" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                            <Text style={styles.avatarHint}>Tap to change photo</Text>
                            <Text style={styles.emailText}>{userData?.email}</Text>
                        </View>

                        {/* Edit Form */}
                        <View style={styles.formContainer}>
                            <Input
                                label="Active Medical Profile"
                                value={
                                    activeProfile
                                        ? `${activeProfile.full_name} (${activeProfile.relationship_to_owner})`
                                        : 'No profile selected'
                                }
                                editable={false}
                            />
                            <Button
                                title="Manage Family Profiles"
                                variant="outline"
                                onPress={() => router.push('/(app)/profiles')}
                            />
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
        </GlassBackground>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
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
        color: '#FFFFFF',
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
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: colors.primary[500],
        marginBottom: 6,
        overflow: 'hidden',
    },
    avatarImage: { width: 100, height: 100, borderRadius: 50 },
    avatarHint: { fontSize: 12, color: 'rgba(255,255,255,0.50)', marginBottom: 10 },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary[500],
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.primary[700],
    },
    emailText: {
        fontSize: 16,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    formContainer: {
        backgroundColor: colors.glass.background,
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
        gap: 16,
    },
    helperText: {
        marginTop: -8,
        fontSize: 12,
        color: colors.textSecondary,
        fontStyle: 'italic',
        marginBottom: 8,
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        backgroundColor: 'transparent',
        borderTopWidth: 1,
        borderTopColor: colors.glass.borderHighlight,
    },
});
