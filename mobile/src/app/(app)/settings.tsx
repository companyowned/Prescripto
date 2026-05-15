import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MockBottomTabs } from '../../components/home';
import { GlassBackground } from '../../components/ui';
import { authService } from '../../services/auth';
import { useAuth } from '../_layout';
import { colors } from '../../theme';

export default function SettingsScreen() {
    const router = useRouter();
    const { signOut } = useAuth();

    const handleLogout = async () => {
        await authService.logout();
        signOut();
    };

    return (
        <GlassBackground>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <Text style={styles.title}>Settings</Text>

                        <View style={styles.card}>
                            {/* Profile Settings */}
                            <TouchableOpacity
                                style={styles.cardRow}
                                onPress={() => router.push('/(app)/profile')}
                            >
                                <View style={styles.rowLeft}>
                                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                                        <Ionicons name="person-outline" size={20} color={colors.primary[300]} />
                                    </View>
                                    <Text style={styles.rowText}>Account Profile</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity
                                style={styles.cardRow}
                                onPress={() => router.push('/(app)/profiles')}
                            >
                                <View style={styles.rowLeft}>
                                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                                        <Ionicons name="people-outline" size={20} color="#10B981" />
                                    </View>
                                    <Text style={styles.rowText}>Family Profiles</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity
                                style={styles.cardRow}
                                onPress={() => router.push('/(app)/profile-link-scan')}
                            >
                                <View style={styles.rowLeft}>
                                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                                        <Ionicons name="qr-code-outline" size={20} color="#A5B4FC" />
                                    </View>
                                    <Text style={styles.rowText}>Scan profile link QR</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity
                                style={styles.cardRow}
                                onPress={() => router.push('/(app)/profile-link-incoming')}
                            >
                                <View style={styles.rowLeft}>
                                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                                        <Ionicons name="git-pull-request-outline" size={20} color="#F472B6" />
                                    </View>
                                    <Text style={styles.rowText}>Incoming profile link requests</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity
                                style={styles.cardRow}
                                onPress={() => router.push('/(app)/chat')}
                            >
                                <View style={styles.rowLeft}>
                                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(62, 219, 240, 0.15)' }]}>
                                        <Ionicons name="chatbubbles-outline" size={20} color={colors.primary[300]} />
                                    </View>
                                    <Text style={styles.rowText}>Dawini</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            {/* Notifications */}
                            <TouchableOpacity style={styles.cardRow}>
                                <View style={styles.rowLeft}>
                                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                                        <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
                                    </View>
                                    <Text style={styles.rowText}>Notifications</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            {/* Logout */}
                            <TouchableOpacity style={styles.cardRow} onPress={handleLogout}>
                                <View style={styles.rowLeft}>
                                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                                        <Ionicons name="log-out-outline" size={20} color={colors.error} />
                                    </View>
                                    <Text style={[styles.rowText, { color: colors.error }]}>Log Out</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    <MockBottomTabs
                        activeTab="settings"
                        onHomePress={() => router.push('/(app)/home')}
                        onRecordsPress={() => router.push('/(app)/history')}
                        onRemindersPress={() => router.push('/(app)/reminders')}
                        onChatPress={() => router.push('/(app)/chat')}
                        onInsightsPress={() => router.push('/(app)/insights')}
                        onSettingsPress={() => { }}
                    />
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
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 30,
        paddingBottom: 110,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 24,
    },
    card: {
        backgroundColor: colors.glass.background,
        borderRadius: 24,
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 12,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    rowText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: colors.glass.border,
        marginHorizontal: 12,
    }
});
