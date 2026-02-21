import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
    statusText?: string;
    isOnline?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    statusText = 'AI SYSTEM ONLINE',
    isOnline = true,
}) => {
    return (
        <View style={styles.statusContainer}>
            <View style={styles.statusBadge}>
                <View
                    style={[
                        styles.statusDot,
                        { backgroundColor: isOnline ? '#0EA5E9' : '#EF4444' },
                    ]}
                />
                <Text
                    style={[
                        styles.statusText,
                        { color: isOnline ? '#0EA5E9' : '#EF4444' },
                    ]}
                >
                    {statusText}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    statusContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
