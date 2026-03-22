import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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
    return (
        <View style={styles.bottomTabBar}>
            <TouchableOpacity style={styles.tabItem} onPress={onHomePress} activeOpacity={0.7}>
                <Ionicons name="home" size={24} color={activeTab === 'home' ? "#0EA5E9" : "#9BA6B3"} />
                <Text style={[styles.tabText, activeTab === 'home' && { color: '#0EA5E9' }]}>HOME</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={onRecordsPress} activeOpacity={0.7}>
                <MaterialCommunityIcons name="history" size={26} color={activeTab === 'records' ? "#0EA5E9" : "#9BA6B3"} />
                <Text style={[styles.tabText, activeTab === 'records' && { color: '#0EA5E9' }]}>RECORDS</Text>
            </TouchableOpacity>

            {onRemindersPress && (
                <TouchableOpacity style={styles.tabItem} onPress={onRemindersPress} activeOpacity={0.7}>
                    <Ionicons name="notifications" size={24} color={activeTab === 'reminders' ? "#0EA5E9" : "#9BA6B3"} />
                    <Text style={[styles.tabText, activeTab === 'reminders' && { color: '#0EA5E9' }]}>MEDS</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.tabItem} onPress={onInsightsPress} activeOpacity={0.7}>
                <Ionicons name="bar-chart" size={24} color={activeTab === 'insights' ? "#0EA5E9" : "#9BA6B3"} />
                <Text style={[styles.tabText, activeTab === 'insights' && { color: '#0EA5E9' }]}>INSIGHTS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={onSettingsPress} activeOpacity={0.7}>
                <Ionicons name="settings-sharp" size={24} color={activeTab === 'settings' ? "#0EA5E9" : "#9BA6B3"} />
                <Text style={[styles.tabText, activeTab === 'settings' && { color: '#0EA5E9' }]}>SETTINGS</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    bottomTabBar: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: '#F9FAFB',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 30 : 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    tabItem: {
        alignItems: 'center',
        gap: 4,
    },
    tabText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9BA6B3',
        marginTop: 2,
    },
});
