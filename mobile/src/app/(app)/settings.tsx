import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MockBottomTabs } from '../../components/home';
import { authService } from '../../services/auth';
import { useAuth } from '../_layout';

export default function SettingsScreen() {
    const router = useRouter();
    const { signOut } = useAuth();

    const handleLogout = async () => {
        await authService.logout();
        signOut();
    };

    return (
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
                                <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
                                    <Ionicons name="person-outline" size={20} color="#0EA5E9" />
                                </View>
                                <Text style={styles.rowText}>Account Profile</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* Notifications */}
                        <TouchableOpacity style={styles.cardRow}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                                    <Ionicons name="notifications-outline" size={20} color="#D97706" />
                                </View>
                                <Text style={styles.rowText}>Notifications</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* Logout */}
                        <TouchableOpacity style={styles.cardRow} onPress={handleLogout}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                                </View>
                                <Text style={[styles.rowText, { color: '#EF4444' }]}>Log Out</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <MockBottomTabs
                    activeTab="settings"
                    onHomePress={() => router.push('/(app)/home')}
                    onRecordsPress={() => router.push('/(app)/history')}
                    onRemindersPress={() => router.push('/(app)/reminders')}
                    onInsightsPress={() => router.push('/(app)/insights')}
                    onSettingsPress={() => { }}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F6F8',
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
        color: '#111827',
        marginBottom: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingHorizontal: 8,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6'
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
        color: '#111827',
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 12,
    }
});
