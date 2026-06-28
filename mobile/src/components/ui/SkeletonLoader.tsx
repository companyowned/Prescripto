import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const SkeletonBox: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 10,
    style,
}) => {
    const opacity = useSharedValue(0.3);
    const translateX = useSharedValue(-200);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            ), -1, true
        );
        translateX.value = withRepeat(
            withTiming(400, { duration: 1400, easing: Easing.linear }),
            -1, false
        );
    }, []);

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                },
                style,
                containerStyle,
            ]}
        >
            <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
                <LinearGradient
                    colors={['transparent', 'rgba(62,219,240,0.15)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: 200, height: '100%' }}
                />
            </Animated.View>
        </Animated.View>
    );
};

export const SkeletonCard: React.FC = () => (
    <View style={styles.card}>
        <View style={styles.row}>
            <SkeletonBox width={48} height={48} borderRadius={14} />
            <View style={styles.col}>
                <SkeletonBox width="60%" height={16} borderRadius={8} />
                <SkeletonBox width="40%" height={12} borderRadius={6} style={{ marginTop: 8 }} />
            </View>
        </View>
        <SkeletonBox width="100%" height={12} borderRadius={6} style={{ marginTop: 16 }} />
        <SkeletonBox width="75%" height={12} borderRadius={6} style={{ marginTop: 8 }} />
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    col: { flex: 1, gap: 8 },
});
