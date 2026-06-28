/**
 * AlarmOverlay — full-screen in-app alarm shown when a medication notification
 * fires while the app is in the foreground.
 */

import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    Platform, Vibration,
} from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withRepeat, withSequence, withTiming, Easing,
    cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

// BlurView can crash on certain Android devices — use a plain dark overlay instead
const BackdropBlur = Platform.OS === 'android'
    ? ({ style }: { style: any }) => (
        <View style={[style, { backgroundColor: 'rgba(2,8,20,0.92)' }]} />
    )
    : ({ style }: { style: any }) => (
        <BlurView intensity={60} tint="dark" style={style} />
    );
import { AlarmNotificationData } from '../../services/reminderAlarmService';

interface Props {
    visible: boolean;
    alarm: AlarmNotificationData | null;
    onTaken: (alarm: AlarmNotificationData) => void;
    onSnooze: (alarm: AlarmNotificationData) => void;
    onDismiss: () => void;
}

export const AlarmOverlay: React.FC<Props> = ({
    visible, alarm, onTaken, onSnooze, onDismiss,
}) => {
    // Pulse animation on the pill icon
    const scale = useSharedValue(1);
    const ringOpacity = useSharedValue(0);
    const vibrateRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!visible || !alarm) return;

        // Pulse the icon
        scale.value = withRepeat(
            withSequence(
                withTiming(1.18, { duration: 500, easing: Easing.out(Easing.ease) }),
                withTiming(1.00, { duration: 500, easing: Easing.in(Easing.ease) }),
            ),
            -1,
            false,
        );

        // Ripple ring
        ringOpacity.value = withRepeat(
            withSequence(
                withTiming(0.6, { duration: 600 }),
                withTiming(0.0, { duration: 600 }),
            ),
            -1,
            false,
        );

        // Vibrate on Android
        if (Platform.OS === 'android') {
            const pattern = [0, 500, 300, 500];
            Vibration.vibrate(pattern, true);
            vibrateRef.current = setInterval(() => {
                Vibration.vibrate(pattern, false);
            }, 4000);
        }

        return () => {
            cancelAnimation(scale);
            cancelAnimation(ringOpacity);
            if (Platform.OS === 'android') {
                Vibration.cancel();
                if (vibrateRef.current) clearInterval(vibrateRef.current);
            }
        };
    }, [visible, alarm]);

    const pillStyle  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    const ringStyle  = useAnimatedStyle(() => ({ opacity: ringOpacity.value }));

    if (!alarm) return null;

    const stopAndCall = (fn: () => void) => {
        Vibration.cancel();
        if (vibrateRef.current) clearInterval(vibrateRef.current);
        cancelAnimation(scale);
        cancelAnimation(ringOpacity);
        fn();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => stopAndCall(onDismiss)}
        >
            {/* Dark overlay */}
            <View style={styles.backdrop}>
                <BackdropBlur style={StyleSheet.absoluteFill} />
                <LinearGradient
                    colors={['rgba(4,13,36,0.92)', 'rgba(10,30,80,0.96)', 'rgba(4,13,36,0.98)']}
                    style={StyleSheet.absoluteFill}
                />

                {/* Card */}
                <View style={styles.card}>
                    <LinearGradient
                        colors={['rgba(79,179,255,0.12)', 'rgba(255,255,255,0.05)']}
                        style={[StyleSheet.absoluteFill, { borderRadius: 32 }]}
                    />

                    {/* Ripple rings */}
                    <Animated.View style={[styles.ring, styles.ring1, ringStyle]} />
                    <Animated.View style={[styles.ring, styles.ring2, ringStyle]} />

                    {/* Pill icon */}
                    <Animated.View style={pillStyle}>
                        <View style={styles.iconOuter}>
                            <LinearGradient
                                colors={['#2196F3', '#0D47A1']}
                                style={[StyleSheet.absoluteFill, { borderRadius: 40 }]}
                            />
                            <Ionicons name="medical" size={44} color="#FFFFFF" />
                        </View>
                    </Animated.View>

                    {/* Time label */}
                    <Text style={styles.timeLabel}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>

                    {/* Medicine name */}
                    <Text style={styles.medicineName}>{alarm.medicationName}</Text>

                    {/* Details chips */}
                    <View style={styles.chipRow}>
                        {alarm.dosage ? (
                            <View style={styles.chip}>
                                <Text style={styles.chipText}>{alarm.dosage}</Text>
                            </View>
                        ) : null}
                        {alarm.form ? (
                            <View style={styles.chip}>
                                <Text style={styles.chipText}>{alarm.form}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Instructions */}
                    {alarm.instructions ? (
                        <Text style={styles.instructions}>{alarm.instructions}</Text>
                    ) : null}

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* ── Action Buttons ── */}

                    {/* Take Now */}
                    <TouchableOpacity
                        style={styles.takeBtn}
                        onPress={() => stopAndCall(() => onTaken(alarm))}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#34D399', '#059669']}
                            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                        <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                        <Text style={styles.takeBtnText}>I Took It</Text>
                    </TouchableOpacity>

                    {/* Snooze + Dismiss row */}
                    <View style={styles.secondaryRow}>
                        <TouchableOpacity
                            style={styles.snoozeBtn}
                            onPress={() => stopAndCall(() => onSnooze(alarm))}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="alarm-outline" size={18} color="#FFD96E" />
                            <Text style={styles.snoozeBtnText}>Snooze 10 min</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.dismissBtn}
                            onPress={() => stopAndCall(onDismiss)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.dismissText}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(79,179,255,0.30)',
        backgroundColor: 'rgba(14,40,90,0.85)',
        alignItems: 'center',
        padding: 32,
        overflow: 'hidden',
        shadowColor: '#4FB3FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 40,
        elevation: 24,
    },

    // Ripple rings
    ring: {
        position: 'absolute',
        borderRadius: 1000,
        borderWidth: 2,
        borderColor: '#4FB3FF',
    },
    ring1: { width: 130, height: 130 },
    ring2: { width: 180, height: 180 },

    // Icon
    iconOuter: {
        width: 80, height: 80, borderRadius: 40,
        justifyContent: 'center', alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 12,
        marginBottom: 20,
    },

    timeLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.50)',
        letterSpacing: 1,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    medicineName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 14,
        letterSpacing: -0.5,
    },

    chipRow: {
        flexDirection: 'row', gap: 8,
        flexWrap: 'wrap', justifyContent: 'center',
        marginBottom: 12,
    },
    chip: {
        backgroundColor: 'rgba(79,179,255,0.18)',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: 'rgba(79,179,255,0.35)',
    },
    chipText: {
        color: '#7BC8FF',
        fontSize: 13,
        fontWeight: '700',
    },

    instructions: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.60)',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 8,
        paddingHorizontal: 8,
    },

    divider: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.10)',
        marginVertical: 24,
    },

    // Take button
    takeBtn: {
        width: '100%',
        height: 60,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        overflow: 'hidden',
        marginBottom: 14,
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    takeBtnText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    // Secondary row
    secondaryRow: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    snoozeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255,217,110,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,217,110,0.30)',
    },
    snoozeBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFD96E',
    },
    dismissBtn: {
        flex: 1,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    dismissText: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.45)',
    },
});
