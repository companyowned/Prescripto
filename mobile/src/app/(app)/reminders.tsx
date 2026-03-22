/**
 * Reminders List Screen — Active/inactive medication reminders with quick actions
 */

import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MockBottomTabs } from '../../components/home';
import { ReminderCard } from '../../components/reminders';
import {
    useMedicationReminders,
    usePauseReminder,
    useResumeReminder,
    useDeleteReminder,
} from '../../features/reminders/hooks';

export default function RemindersScreen() {
    const router = useRouter();
    const [showInactive, setShowInactive] = useState(false);
    const { data, isLoading, error } = useMedicationReminders(!showInactive);
    const pauseMutation = usePauseReminder();
    const resumeMutation = useResumeReminder();
    const deleteMutation = useDeleteReminder();

    const handleDelete = (id: string, name: string) => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`Are you sure you want to delete the reminder for "${name}"?`);
            if (confirmed) deleteMutation.mutate(id);
            return;
        }

        Alert.alert(
            'Delete Reminder',
            `Are you sure you want to delete the reminder for "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteMutation.mutate(id),
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>My Reminders</Text>
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => router.push('/(app)/reminder-form')}
                        >
                            <Ionicons name="add" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Filter toggle */}
                    <View style={styles.filterRow}>
                        <TouchableOpacity
                            style={[styles.filterChip, !showInactive && styles.filterChipActive]}
                            onPress={() => setShowInactive(false)}
                        >
                            <Text style={[styles.filterText, !showInactive && styles.filterTextActive]}>
                                Active
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterChip, showInactive && styles.filterChipActive]}
                            onPress={() => setShowInactive(true)}
                        >
                            <Text style={[styles.filterText, showInactive && styles.filterTextActive]}>
                                All
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    {isLoading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color="#0EA5E9" />
                        </View>
                    ) : error ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                            <Text style={styles.emptyTitle}>Error Loading Reminders</Text>
                            <Text style={styles.emptyMessage}>Please try again later.</Text>
                        </View>
                    ) : data && data.reminders.length > 0 ? (
                        data.reminders.map((reminder) => (
                            <ReminderCard
                                key={reminder.id}
                                reminder={reminder}
                                onPress={() => router.push({
                                    pathname: '/(app)/reminder-form',
                                    params: { id: reminder.id },
                                })}
                                onPause={() => pauseMutation.mutate(reminder.id)}
                                onResume={() => resumeMutation.mutate(reminder.id)}
                                onDelete={() => handleDelete(reminder.id, reminder.medication_name)}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyCard}>
                            <View style={styles.emptyIconWrap}>
                                <Ionicons name="notifications-outline" size={48} color="#0EA5E9" />
                            </View>
                            <Text style={styles.emptyTitle}>No Reminders Yet</Text>
                            <Text style={styles.emptyMessage}>
                                Create your first medication reminder to stay on track with your doses.
                            </Text>
                            <TouchableOpacity
                                style={styles.createBtn}
                                onPress={() => router.push('/(app)/reminder-form')}
                            >
                                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                                <Text style={styles.createBtnText}>Create Reminder</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>

                <MockBottomTabs
                    activeTab="records"
                    onHomePress={() => router.push('/(app)/home')}
                    onRecordsPress={() => router.push('/(app)/history')}
                    onInsightsPress={() => router.push('/(app)/insights')}
                    onSettingsPress={() => router.push('/(app)/settings')}
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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
    },
    addBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#0EA5E9',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    filterChipActive: {
        backgroundColor: '#0EA5E9',
        borderColor: '#0EA5E9',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    filterTextActive: {
        color: '#FFFFFF',
    },
    center: {
        paddingTop: 60,
        alignItems: 'center',
    },
    emptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginTop: 20,
    },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E0F2FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#0EA5E9',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    createBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
