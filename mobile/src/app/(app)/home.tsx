import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, ScrollView, Platform, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/auth';
import { useAuth } from '../_layout';
import { usePrescriptionHistory } from '../../features/prescriptions/hooks';
import { useActiveProfile } from '../../contexts/profile-context';
import { GlassBackground } from '../../components/ui';
import { colors } from '../../theme';

import {
    HomeHeader,
    HeroCard,
    StatusBadge,
    SearchBar,
    RecentScansList,
    MockBottomTabs,
    ProfileSwitcher,
} from '../../components/home';

export default function HomeScreen() {
    const router = useRouter();
    const { signOut } = useAuth();
    const { activeProfile } = useActiveProfile();

    // Fetch logged-in user profile
    const { data: userData } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: () => authService.getCurrentUser(),
    });

    // Fetch recent prescriptions (limit to 3 for the dashboard)
    const { data: historyData } = usePrescriptionHistory(0, 3, activeProfile?.id);
    const recentScans = historyData?.prescriptions || [];

    const handleLogout = async () => {
        await authService.logout();
        signOut();
    };

    return (
        <GlassBackground>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

                <View style={styles.container}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <HomeHeader
                            userName={userData?.full_name?.split(' ')[0] || 'User'}
                            onLogout={handleLogout}
                        />
                        <ProfileSwitcher />

                        <HeroCard
                            onScanPress={() => router.push('/(app)/scan')}
                            onUploadPress={() => router.push('/(app)/upload')}
                        />

                        <StatusBadge />

                        <TouchableOpacity
                            style={styles.assistantCard}
                            onPress={() => router.push('/(app)/chat')}
                            activeOpacity={0.85}
                        >
                            <View style={styles.assistantIcon}>
                                <Ionicons name="chatbubbles" size={22} color={colors.primary[300]} />
                            </View>
                            <View style={styles.assistantTextBlock}>
                                <Text style={styles.assistantTitle}>Dawini</Text>
                                <Text style={styles.assistantSubtitle}>
                                    Ask about symptoms, doctors, prescriptions, and reminders
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>

                        <SearchBar />

                        <RecentScansList
                            scans={recentScans}
                            onScanPress={(documentId) => router.push({ pathname: '/(app)/result', params: { documentId } })}
                            onSeeAllPress={() => router.push('/(app)/history')}
                            onNewScanPress={() => router.push('/(app)/scan')}
                        />
                    </ScrollView>

                    <MockBottomTabs
                        activeTab="home"
                        onHomePress={() => { }}
                        onRecordsPress={() => router.push('/(app)/history')}
                        onRemindersPress={() => router.push('/(app)/reminders')}
                        onChatPress={() => router.push('/(app)/chat')}
                        onInsightsPress={() => router.push('/(app)/insights')}
                        onSettingsPress={() => router.push('/(app)/settings')}
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
    assistantCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 16,
        borderRadius: 20,
        backgroundColor: colors.glass.background,
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
    },
    assistantIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        backgroundColor: 'rgba(62, 219, 240, 0.14)',
    },
    assistantTextBlock: {
        flex: 1,
    },
    assistantTitle: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '800',
    },
    assistantSubtitle: {
        color: colors.textSecondary,
        fontSize: 13,
        lineHeight: 18,
        marginTop: 2,
    },
});
