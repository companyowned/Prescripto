import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions, Image } from 'react-native';
import { useTheme } from '../../contexts/theme-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface Props { children: React.ReactNode }

export const FloatingMedicalBackground: React.FC<Props> = ({ children }) => {
    const { isDark } = useTheme();
    const scale      = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    useEffect(() => {
        scale.value = withRepeat(
            withSequence(
                withTiming(1.07, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1,    { duration: 9000, easing: Easing.inOut(Easing.ease) }),
            ), -1, true
        );
        translateX.value = withRepeat(
            withSequence(
                withTiming(14,  { duration: 13000, easing: Easing.inOut(Easing.ease) }),
                withTiming(-14, { duration: 13000, easing: Easing.inOut(Easing.ease) }),
            ), -1, true
        );
        translateY.value = withRepeat(
            withSequence(
                withTiming(8,  { duration: 10000, easing: Easing.inOut(Easing.ease) }),
                withTiming(-8, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
            ), -1, true
        );
    }, []);

    const bgStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateX: translateX.value },
            { translateY: translateY.value },
        ],
    }));

    return (
        <View style={styles.container}>
            <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
                <Image
                    source={require('../../../assets/glass.jpg')}
                    style={styles.bgImage}
                    resizeMode="cover"
                />
            </Animated.View>

            {isDark && (
                <View style={[StyleSheet.absoluteFill, styles.darkOverlay]} pointerEvents="none" />
            )}

            <View style={styles.content}>{children}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    bgImage: {
        width: width + 40,
        height: height + 40,
        position: 'absolute',
        top: -20,
        left: -20,
    },
    content: { flex: 1, zIndex: 10 },
    darkOverlay: { backgroundColor: 'rgba(4,13,18,0.80)', zIndex: 5 },
});
