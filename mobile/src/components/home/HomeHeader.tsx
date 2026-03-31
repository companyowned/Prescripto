import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme';

interface HomeHeaderProps {
    userName: string;
    onLogout: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
    userName,
    onLogout,
}) => {
    return (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <View style={styles.headerTitles}>
                    <Text style={styles.dashboardText}>DASHBOARD</Text>
                    <Text style={styles.greetingText}>
                        Good Evening, {userName} 👋
                    </Text>
                </View>
            </View>

            <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
                <Feather name="log-out" size={24} color={colors.primary[300]} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitles: {
        justifyContent: 'center',
    },
    dashboardText: {
        color: colors.textSecondary,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 2,
    },
    greetingText: {
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    logoutBtn: {
        position: 'relative',
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
