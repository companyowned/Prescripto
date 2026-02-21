import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { authService } from '../../services/auth';
import { useAuth } from '../_layout';
import { usePrescriptionHistory } from '../../features/prescriptions/hooks';

import {
    HomeHeader,
    HeroCard,
    StatusBadge,
    SearchBar,
    RecentScansList,
    MockBottomTabs,
} from '../../components/home';

export default function HomeScreen() {
    const router = useRouter();
    const { signOut } = useAuth();

    // Fetch logged-in user profile
    const { data: userData } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: () => authService.getCurrentUser(),
    });

    // Fetch recent prescriptions (limit to 3 for the dashboard)
    const { data: historyData } = usePrescriptionHistory(0, 3);
    const recentScans = historyData?.prescriptions || [];

    const handleLogout = async () => {
        await authService.logout();
        signOut();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F6F8" />

            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <HomeHeader
                        userName={userData?.full_name?.split(' ')[0] || 'User'}
                        onLogout={handleLogout}
                    />

                    <HeroCard
                        onScanPress={() => router.push('/(app)/scan')}
                        onUploadPress={() => router.push('/(app)/upload')}
                    />

                    <StatusBadge />

                    <SearchBar />

                    <RecentScansList
                        scans={recentScans}
                        onScanPress={(documentId) => router.push({ pathname: '/(app)/result', params: { documentId } })}
                        onSeeAllPress={() => router.push('/(app)/history')}
                    />
                </ScrollView>

                <MockBottomTabs
                    activeTab="home"
                    onHomePress={() => { }}
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
});
