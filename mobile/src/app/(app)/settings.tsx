import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MockBottomTabs } from '../../components/home';
import { GlassBackground } from '../../components/ui';
import { authService } from '../../services/auth';
import { useAuth } from '../_layout';
import { useTheme } from '../../contexts/theme-context';
import { useLanguage } from '../../contexts/language-context';
import { colors } from '../../theme';

export default function SettingsScreen() {
    const router = useRouter();
    const { signOut } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const { language, toggleLanguage, t, isRTL } = useLanguage();

    const handleLogout = async () => {
        await authService.logout();
        signOut();
    };

    return (
        <GlassBackground>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <ScrollView contentContainerStyle={[styles.scrollContent, { direction: isRTL ? 'rtl' : 'ltr' }]} showsVerticalScrollIndicator={false}>
                        <Text style={styles.title}>{t('settingsTitle')}</Text>

                        {/* Appearance section */}
                        <SectionLabel label={t('appearance')} />
                        <View style={styles.card}>
                            <SettingRow
                                icon="moon-outline"
                                iconBg="rgba(99,102,241,0.15)"
                                iconColor="#818CF8"
                                label={t('darkMode')}
                                right={
                                    <Switch
                                        value={isDark}
                                        onValueChange={toggleTheme}
                                        trackColor={{ false: 'rgba(255,255,255,0.15)', true: colors.primary[500] }}
                                        thumbColor="#FFFFFF"
                                        ios_backgroundColor="rgba(255,255,255,0.15)"
                                    />
                                }
                            />

                            <View style={styles.divider} />

                            <SettingRow
                                icon="language-outline"
                                iconBg="rgba(16,185,129,0.15)"
                                iconColor="#10B981"
                                label={t('language')}
                                right={
                                    <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
                                        <LinearGradient
                                            colors={[colors.primary[500] + 'CC', colors.primary[400]]}
                                            style={StyleSheet.absoluteFill}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                        />
                                        <Text style={styles.langText}>
                                            {language === 'en' ? 'EN  →  AR' : 'AR  →  EN'}
                                        </Text>
                                    </TouchableOpacity>
                                }
                            />
                        </View>

                        {/* Account section */}
                        <SectionLabel label={t('account')} />
                        <View style={styles.card}>
                            <SettingRow
                                icon="person-outline"
                                iconBg="rgba(56,189,248,0.15)"
                                iconColor={colors.primary[300]}
                                label={t('accountProfile')}
                                chevron
                                onPress={() => router.push('/(app)/profile')}
                            />
                            <View style={styles.divider} />
                            <SettingRow
                                icon="people-outline"
                                iconBg="rgba(16,185,129,0.15)"
                                iconColor="#10B981"
                                label={t('familyProfiles')}
                                chevron
                                onPress={() => router.push('/(app)/profiles')}
                            />
                        </View>

                        {/* Support section */}
                        <SectionLabel label={t('support')} />
                        <View style={styles.card}>
                            <SettingRow
                                icon="chatbubbles-outline"
                                iconBg="rgba(62,219,240,0.15)"
                                iconColor={colors.primary[300]}
                                label={t('dawiniAI')}
                                chevron
                                onPress={() => router.push('/(app)/chat')}
                            />
                            <View style={styles.divider} />
                            <SettingRow
                                icon="notifications-outline"
                                iconBg="rgba(245,158,11,0.15)"
                                iconColor="#F59E0B"
                                label={t('notifications')}
                                chevron
                            />
                        </View>

                        {/* Danger zone */}
                        <View style={[styles.card, { marginTop: 8 }]}>
                            <SettingRow
                                icon="log-out-outline"
                                iconBg="rgba(239,68,68,0.15)"
                                iconColor={colors.error}
                                label={t('logOut')}
                                labelColor={colors.error}
                                onPress={handleLogout}
                            />
                        </View>

                        <Text style={styles.version}>{t('version')}</Text>
                    </ScrollView>

                    <MockBottomTabs
                        activeTab="settings"
                        onHomePress={() => router.push('/(app)/home')}
                        onRecordsPress={() => router.push('/(app)/history')}
                        onRemindersPress={() => router.push('/(app)/reminders')}
                        onChatPress={() => router.push('/(app)/chat')}
                        onInsightsPress={() => router.push('/(app)/insights')}
                        onSettingsPress={() => {}}
                    />
                </View>
            </SafeAreaView>
        </GlassBackground>
    );
}

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
    <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>
);

interface RowProps {
    icon: string;
    iconBg: string;
    iconColor: string;
    label: string;
    labelColor?: string;
    chevron?: boolean;
    onPress?: () => void;
    right?: React.ReactNode;
}

const SettingRow: React.FC<RowProps> = ({ icon, iconBg, iconColor, label, labelColor, chevron, onPress, right }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress && !right}>
        <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                <Ionicons name={icon as any} size={20} color={iconColor} />
            </View>
            <Text style={[styles.rowText, labelColor ? { color: labelColor } : {}]}>{label}</Text>
        </View>
        {right ? right : chevron ? (
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        ) : null}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'transparent' },
    container: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 30,
        paddingBottom: 110,
    },
    title: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginBottom: 24 },
    sectionLabel: {
        fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.50)',
        letterSpacing: 1.2, marginBottom: 8, marginLeft: 4,
    },
    card: {
        backgroundColor: colors.glass.background,
        borderRadius: 20, paddingHorizontal: 4, paddingVertical: 4,
        borderWidth: 1, borderColor: colors.glass.borderHighlight,
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 12, paddingHorizontal: 12,
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center' },
    iconBox: {
        width: 38, height: 38, borderRadius: 11,
        justifyContent: 'center', alignItems: 'center', marginRight: 14,
    },
    rowText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
    divider: { height: 1, backgroundColor: colors.glass.border, marginHorizontal: 12 },

    langToggle: {
        paddingHorizontal: 16, paddingVertical: 7,
        borderRadius: 10, overflow: 'hidden',
    },
    langText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

    version: {
        textAlign: 'center', fontSize: 12,
        color: 'rgba(255,255,255,0.35)', marginTop: 8, marginBottom: 8,
    },
});
