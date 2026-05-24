import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors } from '../../theme';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../contexts/language-context';

interface MockBottomTabsProps {
    activeTab?: 'home' | 'records' | 'reminders' | 'chat' | 'insights' | 'settings';
    onHomePress: () => void;
    onRecordsPress: () => void;
    onRemindersPress?: () => void;
    onChatPress?: () => void;
    onInsightsPress: () => void;
    onSettingsPress: () => void;
}

export const MockBottomTabs: React.FC<MockBottomTabsProps> = ({
    activeTab = 'home',
    onHomePress,
    onRecordsPress,
    onRemindersPress,
    onChatPress,
    onInsightsPress,
    onSettingsPress,
}) => {
    const router = useRouter();
    const { t } = useLanguage();

    return (
        <BlurView intensity={50} tint="light" style={styles.bottomTabBar}>
            <TouchableOpacity style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]} onPress={onHomePress} activeOpacity={0.7}>
                <Ionicons name="home" size={activeTab === 'home' ? 26 : 24} color={activeTab === 'home' ? colors.primary[400] : "rgba(11,29,46,0.40)"} style={activeTab === 'home' && styles.iconActive} />
                <Text style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>{t('home').toUpperCase()}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tabItem, activeTab === 'records' && styles.tabItemActive]} onPress={onRecordsPress} activeOpacity={0.7}>
                <MaterialCommunityIcons name="history" size={activeTab === 'records' ? 28 : 26} color={activeTab === 'records' ? colors.primary[400] : "rgba(11,29,46,0.40)"} style={activeTab === 'records' && styles.iconActive} />
                <Text style={[styles.tabText, activeTab === 'records' && styles.tabTextActive]}>{t('records').toUpperCase()}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tabItem, activeTab === 'reminders' && styles.tabItemActive]} onPress={onRemindersPress || (() => router.push('/(app)/reminders'))} activeOpacity={0.7}>
                <Ionicons name="notifications" size={activeTab === 'reminders' ? 26 : 24} color={activeTab === 'reminders' ? colors.primary[400] : "rgba(11,29,46,0.40)"} style={activeTab === 'reminders' && styles.iconActive} />
                <Text style={[styles.tabText, activeTab === 'reminders' && styles.tabTextActive]}>{t('meds').toUpperCase()}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tabItem, activeTab === 'chat' && styles.tabItemActive]} onPress={onChatPress || (() => router.push('/(app)/chat'))} activeOpacity={0.7}>
                <Ionicons name="chatbubbles" size={activeTab === 'chat' ? 26 : 24} color={activeTab === 'chat' ? colors.primary[400] : "rgba(11,29,46,0.40)"} style={activeTab === 'chat' && styles.iconActive} />
                <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>{t('chat').toUpperCase()}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tabItem, activeTab === 'insights' && styles.tabItemActive]} onPress={onInsightsPress} activeOpacity={0.7}>
                <Ionicons name="bar-chart" size={activeTab === 'insights' ? 26 : 24} color={activeTab === 'insights' ? colors.primary[400] : "rgba(11,29,46,0.40)"} style={activeTab === 'insights' && styles.iconActive} />
                <Text style={[styles.tabText, activeTab === 'insights' && styles.tabTextActive]}>{t('insights').toUpperCase()}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]} onPress={onSettingsPress} activeOpacity={0.7}>
                <Ionicons name="settings-sharp" size={activeTab === 'settings' ? 26 : 24} color={activeTab === 'settings' ? colors.primary[400] : "rgba(11,29,46,0.40)"} style={activeTab === 'settings' && styles.iconActive} />
                <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>{t('settings').toUpperCase()}</Text>
            </TouchableOpacity>
        </BlurView>
    );
};

const styles = StyleSheet.create({
    bottomTabBar: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 30 : 20,
        left: 20,
        right: 20,
        borderRadius: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(11,29,46,0.15)',
        backgroundColor: 'rgba(255,255,255,0.60)',
        shadowColor: colors.primary[300],
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
        overflow: 'hidden',
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    tabItemActive: {
        transform: [{ scale: 1.05 }],
    },
    iconActive: {
        shadowColor: colors.primary[300],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    tabText: {
        fontSize: 9,
        fontWeight: '600',
        color: 'rgba(11,29,46,0.45)',
        marginTop: 2,
    },
    tabTextActive: {
        fontWeight: '800',
        color: colors.primary[400],
        textShadowColor: 'rgba(26,171,207,0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
});
