import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors } from '../../theme';
import { useRouter } from 'expo-router';

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

    return (
        <BlurView intensity={40} tint="default" style={styles.bottomTabBar}>
            <TouchableOpacity style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]} onPress={onHomePress} activeOpacity={0.7}>
                <Ionicons name="home" size={activeTab === 'home' ? 26 : 24} color={activeTab === 'home' ? colors.primary[300] : "rgba(255,255,255,0.6)"} style={activeTab === 'home' && styles.iconActive} />
                <Text style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>HOME</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tabItem, activeTab === 'records' && styles.tabItemActive]} onPress={onRecordsPress} activeOpacity={0.7}>
                <MaterialCommunityIcons name="history" size={activeTab === 'records' ? 28 : 26} color={activeTab === 'records' ? colors.primary[300] : "rgba(255,255,255,0.6)"} style={activeTab === 'records' && styles.iconActive} />
                <Text style={[styles.tabText, activeTab === 'records' && styles.tabTextActive]}>RECORDS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tabItem, activeTab === 'reminders' && styles.tabItemActive]} onPress={onRemindersPress || (() => router.push('/(app)/reminders'))} activeOpacity={0.7}>
                <Ionicons name="notifications" size={activeTab === 'reminders' ? 26 : 24} color={activeTab === 'reminders' ? colors.primary[300] : "rgba(255,255,255,0.6)"} style={activeTab === 'reminders' && styles.iconActive} />
                <Text style={[styles.tabText, activeTab === 'reminders' && styles.tabTextActive]}>MEDS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tabItem, activeTab === 'insights' && styles.tabItemActive]} onPress={onInsightsPress} activeOpacity={0.7}>
                <Ionicons name="bar-chart" size={activeTab === 'insights' ? 26 : 24} color={activeTab === 'insights' ? colors.primary[300] : "rgba(255,255,255,0.6)"} style={activeTab === 'insights' && styles.iconActive} />
                <Text style={[styles.tabText, activeTab === 'insights' && styles.tabTextActive]}>INSIGHTS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]} onPress={onSettingsPress} activeOpacity={0.7}>
                <Ionicons name="settings-sharp" size={activeTab === 'settings' ? 26 : 24} color={activeTab === 'settings' ? colors.primary[300] : "rgba(255,255,255,0.6)"} style={activeTab === 'settings' && styles.iconActive} />
                <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>SETTINGS</Text>
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
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)', // Light glass border
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Keep transparent for glass
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
        fontSize: 10,
        fontWeight: '600',
        color: "rgba(255,255,255,0.6)", // base text
        marginTop: 2,
    },
    tabTextActive: {
        fontWeight: '800',
        color: colors.primary[300],
        textShadowColor: 'rgba(62, 219, 240, 0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
});
