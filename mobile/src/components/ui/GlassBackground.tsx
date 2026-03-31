import React from 'react';
import { StyleSheet, ViewStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';

interface GlassBackgroundProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export const GlassBackground: React.FC<GlassBackgroundProps> = ({ children, style }) => {
    return (
        <View style={styles.container}>
            {/* Base Gradient Layer */}
            <LinearGradient
                colors={[colors.background.top, colors.background.bottom]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />

            {/* Glowing Orbs for Depth */}
            <View style={[styles.glowOrb, styles.glowTopRight]}>
                <LinearGradient
                    colors={['rgba(62, 219, 240, 0.25)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 1, y: 1 }}
                />
            </View>

            <View style={[styles.glowOrb, styles.glowBottomLeft]}>
                <LinearGradient
                    colors={['rgba(15, 92, 115, 0.4)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 0, y: 1 }}
                />
            </View>

            {/* Optional subtle noise/grid here if needed later (leaving transparent overlay for now) */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.05)' }]} pointerEvents="none" />

            {/* Foreground Content */}
            <View style={[styles.content, style]}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.bottom, // Fallback
    },
    content: {
        flex: 1,
    },
    glowOrb: {
        position: 'absolute',
        borderRadius: 200,
    },
    glowTopRight: {
        top: -100,
        right: -100,
        width: 350,
        height: 350,
    },
    glowBottomLeft: {
        bottom: -150,
        left: -150,
        width: 450,
        height: 450,
    },
});
