import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface HeroCardProps {
    onScanPress: () => void;
    onUploadPress: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({ onScanPress, onUploadPress }) => {
    return (
        <LinearGradient
            colors={['#18C9ED', '#109AE8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
        >
            <Text style={styles.heroTitle}>Scan New Prescription</Text>
            <Text style={styles.heroSubtitle}>
                Digitize your handwritten medical{'\n'}documents instantly with AI.
            </Text>

            <TouchableOpacity
                style={styles.primaryActionBtn}
                activeOpacity={0.9}
                onPress={onScanPress}
            >
                <Ionicons name="camera" size={20} color="#109AE8" />
                <Text style={styles.primaryActionText}>Scan Prescription</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.secondaryActionBtn}
                activeOpacity={0.8}
                onPress={onUploadPress}
            >
                <Ionicons name="image" size={18} color="#FFFFFF" />
                <Text style={styles.secondaryActionText}>Upload from Gallery</Text>
            </TouchableOpacity>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    heroCard: {
        borderRadius: 28,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 24,
    },
    primaryActionBtn: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    primaryActionText: {
        color: '#0EA5E9',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    secondaryActionBtn: {
        backgroundColor: 'transparent',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    secondaryActionText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 8,
    },
});
