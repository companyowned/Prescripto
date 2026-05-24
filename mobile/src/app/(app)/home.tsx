import React, { useState, useEffect } from 'react';
import {
    View, StyleSheet, StatusBar, ScrollView,
    Platform, Text, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { authService } from '../../services/auth';
import { useAuth } from '../_layout';
import { usePrescriptionHistory } from '../../features/prescriptions/hooks';
import { useMedicationInsights } from '../../features/reminders/hooks';
import { useActiveProfile } from '../../contexts/profile-context';
import { GlassBackground, PharmacyModal } from '../../components/ui';
import {
    HomeHeader, HeroCard, RecentScansList,
    MockBottomTabs, ProfileSwitcher,
} from '../../components/home';
import { useTheme, ThemeColors } from '../../contexts/theme-context';
import { useLanguage } from '../../contexts/language-context';

function greetingKey(): 'goodMorning' | 'goodAfternoon' | 'goodEvening' {
    const h = new Date().getHours();
    if (h < 12) return 'goodMorning';
    if (h < 17) return 'goodAfternoon';
    return 'goodEvening';
}

export default function HomeScreen() {
    const router = useRouter();
    const { signOut } = useAuth();
    const { colors: tc } = useTheme();
    const { isRTL, t } = useLanguage();
    const { activeProfile } = useActiveProfile();
    const [pharmacyVisible, setPharmacyVisible] = useState(false);

    const { data: userData } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: () => authService.getCurrentUser(),
    });

    const { data: historyData } = usePrescriptionHistory(0, 3, activeProfile?.id);
    const recentScans = historyData?.prescriptions || [];

    const { data: insights } = useMedicationInsights('7d');

    const handleLogout = async () => {
        await authService.logout();
        signOut();
    };

    const tap = () => { if (Platform.OS !== 'web') Haptics.selectionAsync(); };

    const pageOpacity = useSharedValue(0);
    const pageTranslate = useSharedValue(18);
    const pageStyle = useAnimatedStyle(() => ({
        opacity: pageOpacity.value,
        transform: [{ translateY: pageTranslate.value }],
    }));
    useEffect(() => {
        pageOpacity.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.ease) });
        pageTranslate.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.ease) });
    }, []);

    const adherence   = insights ? Math.round(insights.adherence_rate * 100) : null;
    const streak      = insights?.current_streak ?? null;
    const takenToday  = insights?.taken_count     ?? null;
    const missedToday = insights?.missed_count    ?? null;

    return (
        <GlassBackground>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

                <Animated.View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }, pageStyle]}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        <HomeHeader
                            userName={userData?.full_name?.split(' ')[0] || 'User'}
                            onLogout={handleLogout}
                        />

                        <ProfileSwitcher />

                        {/* Greeting */}
                        <Text style={[styles.greetingText, { color: tc.textPrimary }]}>{t(greetingKey())}, {userData?.full_name?.split(' ')[0] || 'there'} 👋</Text>

                        {/* Stats Row */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={styles.statsRow}>
                            <StatCard icon="shield-checkmark" label={t('adherence')} value={adherence !== null ? `${adherence}%` : '—'} color="#1AABCF" tc={tc} />
                            <StatCard icon="flame"            label={t('streak')}    value={streak !== null ? `${streak}d` : '—'}        color="#F59E0B" tc={tc} />
                            <StatCard icon="checkmark-done"   label={t('taken')}     value={takenToday !== null ? `${takenToday}` : '—'} color="#10B981" tc={tc} />
                            <StatCard icon="alert-circle"     label={t('missed')}    value={missedToday !== null ? `${missedToday}` : '—'} color="#EF4444" tc={tc} />
                        </ScrollView>

                        <HeroCard
                            onScanPress={() => { tap(); router.push('/(app)/scan'); }}
                            onUploadPress={() => { tap(); router.push('/(app)/upload'); }}
                        />

                        {/* Quick Actions */}
                        <View style={styles.quickGrid}>
                            <QuickAction icon="chatbubbles"         label={t('dawiniAI')}  color="#1AABCF" onPress={() => router.push('/(app)/chat')}           tc={tc} />
                            <QuickAction icon="today-outline"       label={t('schedule')} color="#10B981" onPress={() => router.push('/(app)/today-schedule')} tc={tc} />
                            <QuickAction icon="bar-chart-outline"   label={t('insights')} color="#F59E0B" onPress={() => router.push('/(app)/insights')}       tc={tc} />
                            <QuickAction icon="medical"             label={t('pharmacy')} color="#A78BFA" onPress={() => { tap(); setPharmacyVisible(true); }} tc={tc} />
                        </View>

                        <RecentScansList
                            scans={recentScans}
                            onScanPress={(documentId) => router.push({ pathname: '/(app)/result', params: { documentId } })}
                            onSeeAllPress={() => router.push('/(app)/history')}
                            onNewScanPress={() => router.push('/(app)/scan')}
                        />
                    </ScrollView>

                    <MockBottomTabs
                        activeTab="home"
                        onHomePress={() => {}}
                        onRecordsPress={() => router.push('/(app)/history')}
                        onRemindersPress={() => router.push('/(app)/reminders')}
                        onChatPress={() => router.push('/(app)/chat')}
                        onInsightsPress={() => router.push('/(app)/insights')}
                        onSettingsPress={() => router.push('/(app)/settings')}
                    />
                </Animated.View>

                <PharmacyModal visible={pharmacyVisible} onClose={() => setPharmacyVisible(false)} />
            </SafeAreaView>
        </GlassBackground>
    );
}

const StatCard: React.FC<{ icon: string; label: string; value: string; color: string; tc: ThemeColors }> = ({ icon, label, value, color, tc }) => (
    <View style={[styles.statCard, { borderColor: color + '30' }]}>
        <LinearGradient colors={[color + '18', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: tc.textMuted }]}>{label}</Text>
    </View>
);

const QuickAction: React.FC<{ icon: string; label: string; color: string; onPress: () => void; tc: ThemeColors }> = ({ icon, label, color, onPress, tc }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.75}>
        <View style={[styles.qaIcon, { backgroundColor: color + '18', borderColor: color + '30' }]}>
            <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <Text style={[styles.qaLabel, { color: tc.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    safeArea:   { flex: 1, backgroundColor: 'transparent' },
    container:  { flex: 1 },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 30,
        paddingBottom: 110,
    },
    greetingText: {
        fontSize: 20, fontWeight: '700', color: '#0B1D2E',
        marginBottom: 16, marginTop: 4,
    },
    statsScroll: { flexGrow: 0, marginBottom: 18 },
    statsRow: { gap: 10, paddingRight: 4 },
    statCard: {
        width: 88, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, paddingHorizontal: 10,
        borderRadius: 18, borderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        gap: 4, overflow: 'hidden',
    },
    statValue: { fontSize: 18, fontWeight: '800' },
    statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },

    quickGrid: {
        flexDirection: 'row', justifyContent: 'space-between',
        marginBottom: 20,
    },
    quickAction: { alignItems: 'center', gap: 8, flex: 1 },
    qaIcon: {
        width: 54, height: 54, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1,
    },
    qaLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
});
