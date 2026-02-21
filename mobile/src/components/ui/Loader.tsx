/**
 * Loader — Full-screen and inline loading indicators
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface LoaderProps {
    message?: string;
    fullScreen?: boolean;
    size?: 'small' | 'large';
}

export const Loader: React.FC<LoaderProps> = ({
    message = 'Loading...',
    fullScreen = false,
    size = 'large',
}) => {
    if (fullScreen) {
        return (
            <View style={styles.fullScreen}>
                <ActivityIndicator size={size} color={colors.primary[400]} />
                {message && <Text style={styles.message}>{message}</Text>}
            </View>
        );
    }

    return (
        <View style={styles.inline}>
            <ActivityIndicator size={size} color={colors.primary[400]} />
            {message && <Text style={styles.message}>{message}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.dark.bg,
    },
    inline: {
        padding: spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        ...typography.bodySmall,
        color: colors.dark.textSecondary,
        marginTop: spacing.md,
    },
});
