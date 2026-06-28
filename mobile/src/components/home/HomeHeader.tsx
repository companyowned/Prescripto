import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

interface HomeHeaderProps {
    userName: string;
    onLogout: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ userName, onLogout }) => {
    return (
        <View style={styles.header}>
            <View style={styles.left}>
                <Text style={styles.eyebrow}>DASHBOARD</Text>
                <Text style={styles.greeting}>
                    Good {getTimeOfDay()}, {userName} 👋
                </Text>
            </View>

            <TouchableOpacity onPress={onLogout} style={styles.logoutBtn} activeOpacity={0.75}>
                <View style={styles.logoutBg}>
                    <Ionicons name="log-out-outline" size={20} color={colors.primary[400]} />
                </View>
            </TouchableOpacity>
        </View>
    );
};

function getTimeOfDay() {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    left: {
        flex: 1,
    },
    eyebrow: {
        color: 'rgba(255,255,255,0.50)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.8,
        marginBottom: 4,
    },
    greeting: {
        color: colors.white,
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.4,
    },
    logoutBtn: {
        padding: 4,
    },
    logoutBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.glass.background,
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
