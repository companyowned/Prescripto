import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { colors } from '../../theme';

interface StatusBadgeProps {
    statusText?: string;
    isOnline?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    statusText = 'AI SYSTEM ONLINE',
    isOnline = true,
}) => {
    const opacity = useSharedValue(0.4);

    useEffect(() => {
        if (isOnline) {
            opacity.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) })
                ),
                -1, // infinite
                true // reverse
            );
        } else {
            opacity.value = 1;
        }
    }, [isOnline]);

    const dotStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: opacity.value * 0.4 + 0.6 }], // Scale slightly with opacity
    }));

    return (
        <View style={styles.statusContainer}>
            <View style={styles.statusBadgeWrapper}>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.statusBadge}>
                    <Animated.View
                        style={[
                            styles.statusDot,
                            { backgroundColor: isOnline ? colors.primary[300] : colors.error },
                            dotStyle,
                        ]}
                    />
                    <Text
                        style={[
                            styles.statusText,
                            { color: isOnline ? colors.primary[300] : colors.error },
                        ]}
                    >
                        {statusText}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    statusContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    statusBadgeWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
        backgroundColor: colors.glass.inputBg,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
        shadowColor: colors.primary[300],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
