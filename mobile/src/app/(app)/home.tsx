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
import { colors } from '../../theme';

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

    const pageOpacity   = useSharedValue(0);
    const pageTranslate = useSharedValue(18);
    const pageStyle = useAnimatedStyle(() => ({
        opacity: pageOpacity.value,
        transform: [{ translateY: pageTranslate.value }],
    }));
    useEffect(() => {
        pageOpacity.value   = withTiming(1, { duration: 280, easing: Easing.out(Easing.ease) });
        pageTranslate.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.ease) });
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

                        {/* Stats Row */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={styles.statsRow}>
                            <StatCard icon="shield-checkmark" label={t('adherence')} value={adherence !== null ? `${adherence}%` : '—'} color="#4FB3FF" />
                            <StatCard icon="flame"            label={t('streak')}    value={streak    !== null ? `${streak}d`    : '—'} color="#FFD96E" />
                            <StatCard icon="checkmark-done"   label={t('taken')}     value={takenToday !== null ? `${takenToday}` : '—'} color="#76FFB4" />
                            <StatCard icon="alert-circle"     label={t('missed')}    value={missedToday !== null ? `${missedToday}` : '—'} color="#FF6B8A" />
                        </ScrollView>

                        <HeroCard
                            onScanPress={() => { tap(); router.push('/(app)/scan'); }}
                            onUploadPress={() => { tap(); router.push('/(app)/upload'); }}
                        />

                        {/* Quick Actions */}
                        <View style={styles.quickGrid}>
                            <QuickAction icon="chatbubbles"       label={t('dawiniAI')}  color="#4FB3FF" onPress={() => router.push('/(app)/chat')} />
                            <QuickAction icon="today-outline"     label={t('schedule')} color="#76FFB4" onPress={() => router.push('/(app)/today-schedule')} />
                            <QuickAction icon="bar-chart-outline" label={t('insights')} color="#FFD96E" onPress={() => router.push('/(app)/insights')} />
                            <QuickAction icon="medical"           label={t('pharmacy')} color="#C4B5FD" onPress={() => { tap(); setPharmacyVisible(true); }} />
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

const StatCard: React.FC<{ icon: string; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
    <View style={[styles.statCard, { borderColor: color + '35' }]}>
        <LinearGradient
            colors={[color + '20', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        />
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const QuickAction: React.FC<{ icon: string; label: string; color: string; onPress: () => void }> = ({ icon, label, color, onPress }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.75}>
        <View style={[styles.qaIcon, { backgroundColor: color + '18', borderColor: color + '35' }]}>
            <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <Text style={styles.qaLabel}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'transparent' },
    container: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 30,
        paddingBottom: 120,
    },
    statsScroll: { flexGrow: 0, marginBottom: 20 },
    statsRow:    { gap: 10, paddingRight: 4 },
    statCard: {
        width: 90,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 10,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: colors.glass.background,
        gap: 5,
        overflow: 'hidden',
    },
    statValue: { fontSize: 19, fontWeight: '800' },
    statLabel: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: 'rgba(255,255,255,0.55)',
    },
    quickGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    quickAction: { alignItems: 'center', gap: 8, flex: 1 },
    qaIcon: {
        width: 56,
        height: 56,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    qaLabel: {
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.65)',
    },
});
