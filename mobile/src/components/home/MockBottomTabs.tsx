import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../contexts/language-context';

interface MockBottomTabsProps {
    activeTab?: 'home' | 'records' | 'reminders' | 'insights' | 'settings';
    onHomePress: () => void;
    onRecordsPress: () => void;
    onRemindersPress?: () => void;
    onInsightsPress: () => void;
    onSettingsPress: () => void;
}

export const MockBottomTabs: React.FC<MockBottomTabsProps> = ({
    activeTab = 'home',
    onHomePress,
    onRecordsPress,
    onRemindersPress,
    onInsightsPress,
    onSettingsPress,
}) => {
    const router = useRouter();
    const { t } = useLanguage();

    const tabs = [
        { key: 'home',     icon: 'home',         lib: 'ion', label: t('home'),     onPress: onHomePress },
        { key: 'records',  icon: 'history',       lib: 'mci', label: t('records'),  onPress: onRecordsPress },
        { key: 'reminders',icon: 'notifications', lib: 'ion', label: t('meds'),     onPress: onRemindersPress || (() => router.push('/(app)/reminders')) },
        { key: 'insights', icon: 'bar-chart',     lib: 'ion', label: t('insights'), onPress: onInsightsPress },
        { key: 'settings', icon: 'settings-sharp',lib: 'ion', label: t('settings'), onPress: onSettingsPress },
    ];

    return (
        <View style={styles.wrapper}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
                colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <View style={styles.row}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    const iconColor = isActive ? colors.primary[400] : 'rgba(255,255,255,0.40)';
                    const iconSize  = isActive ? 26 : 23;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tabItem, isActive && styles.tabItemActive]}
                            onPress={tab.onPress}
                            activeOpacity={0.7}
                        >
                            {isActive && (
                                <View style={styles.activeIndicator} />
                            )}
                            {tab.lib === 'mci' ? (
                                <MaterialCommunityIcons name={tab.icon as any} size={iconSize} color={iconColor} />
                            ) : (
                                <Ionicons name={tab.icon as any} size={iconSize} color={iconColor} />
                            )}
                            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                {tab.label.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 28 : 18,
        left: 18,
        right: 18,
        borderRadius: 36,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 24,
        elevation: 12,
        backgroundColor: 'rgba(6,21,36,0.70)',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 11,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingHorizontal: 4,
        position: 'relative',
    },
    tabItemActive: {
        transform: [{ scale: 1.06 }],
    },
    activeIndicator: {
        position: 'absolute',
        top: -11,
        width: 28,
        height: 3,
        borderRadius: 2,
        backgroundColor: colors.primary[400],
    },
    tabText: {
        fontSize: 8,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.38)',
        marginTop: 2,
        letterSpacing: 0.4,
    },
    tabTextActive: {
        fontWeight: '800',
        color: colors.primary[400],
        textShadowColor: 'rgba(79,179,255,0.60)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
});
