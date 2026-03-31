import React from 'react';
import { StyleSheet, ViewStyle, View } from 'react-native';
import { FloatingMedicalBackground } from './FloatingMedicalBackground';

interface GlassBackgroundProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export const GlassBackground: React.FC<GlassBackgroundProps> = ({ children, style }) => {
    return (
        <FloatingMedicalBackground>
            <View style={[styles.content, style]}>
                {children}
            </View>
        </FloatingMedicalBackground>
    );
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
});
