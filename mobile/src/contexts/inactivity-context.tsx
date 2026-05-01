/**
 * InactivityProvider — auto-logout after user inactivity.
 *
 * Wraps the authenticated app screens. Tracks user touches via a transparent
 * overlay PanResponder. When the user has been idle for TIMEOUT_MS, their
 * session is invalidated and they are redirected to the login screen.
 *
 * A warning modal appears WARNING_MS before the timeout, giving the user
 * a chance to tap "Stay Signed In" and reset the timer.
 */

import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
} from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    PanResponder,
    Animated,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

/* ─── Configuration ────────────────────────────── */
const TIMEOUT_MS = 2 * 60 * 1000;    // 2 minutes of inactivity
const WARNING_MS = 60 * 1000;         // Show warning 1 minute before timeout
const TICK_MS = 1_000;                // Check every second

/* ─── Context ──────────────────────────────────── */
interface InactivityContextType {
    /** Call this to manually reset the inactivity timer */
    resetTimer: () => void;
}

const InactivityContext = createContext<InactivityContextType>({
    resetTimer: () => {},
});

export const useInactivity = () => useContext(InactivityContext);

/* ─── Provider ─────────────────────────────────── */
interface Props {
    children: React.ReactNode;
    onTimeout: () => void; // called when session expires (should call signOut)
}

export function InactivityProvider({ children, onTimeout }: Props) {
    const lastActivityRef = useRef(Date.now());
    const [showWarning, setShowWarning] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(Math.floor(WARNING_MS / 1000));
    const fadeAnim = useRef(new Animated.Value(0)).current;

    /* Reset the idle timer */
    const resetTimer = useCallback(() => {
        lastActivityRef.current = Date.now();
        setShowWarning(false);
    }, []);

    /* PanResponder captures all touches without blocking child interactions */
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponderCapture: () => {
                lastActivityRef.current = Date.now();
                return false; // don't steal the touch — let children handle it
            },
            onMoveShouldSetPanResponderCapture: () => {
                lastActivityRef.current = Date.now();
                return false;
            },
        })
    ).current;

    /* Tick every TICK_MS to check idle duration */
    useEffect(() => {
        const interval = setInterval(() => {
            const elapsed = Date.now() - lastActivityRef.current;
            const remaining = TIMEOUT_MS - elapsed;

            if (remaining <= 0) {
                // Session expired
                clearInterval(interval);
                setShowWarning(false);
                onTimeout();
            } else if (remaining <= WARNING_MS && !showWarning) {
                setShowWarning(true);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            }

            if (remaining > 0 && remaining <= WARNING_MS) {
                setSecondsLeft(Math.ceil(remaining / 1000));
            }
        }, TICK_MS);

        return () => clearInterval(interval);
    }, [showWarning, onTimeout, fadeAnim]);

    /* "Stay Signed In" handler */
    const handleStaySignedIn = useCallback(() => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            resetTimer();
        });
    }, [fadeAnim, resetTimer]);

    return (
        <InactivityContext.Provider value={{ resetTimer }}>
            <View style={styles.root} {...panResponder.panHandlers}>
                {children}

                {/* Warning modal */}
                <Modal
                    visible={showWarning}
                    transparent
                    animationType="none"
                    statusBarTranslucent
                >
                    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                        <View style={styles.card}>
                            {/* Icon */}
                            <View style={styles.iconWrap}>
                                <Ionicons name="time-outline" size={36} color={colors.warning} />
                            </View>

                            <Text style={styles.heading}>Session Expiring</Text>
                            <Text style={styles.body}>
                                You've been inactive. Your session will expire in{' '}
                                <Text style={styles.countdown}>{secondsLeft}s</Text>.
                            </Text>

                            <TouchableOpacity
                                style={styles.button}
                                activeOpacity={0.8}
                                onPress={handleStaySignedIn}
                            >
                                <Text style={styles.buttonText}>Stay Signed In</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </Modal>
            </View>
        </InactivityContext.Provider>
    );
}

/* ─── Styles ───────────────────────────────────── */
const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    card: {
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 28,
        width: '100%',
        maxWidth: 360,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.5,
        shadowRadius: 32,
        elevation: 20,
    },
    iconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    heading: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    body: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.65)',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    countdown: {
        color: colors.warning,
        fontWeight: '700',
    },
    button: {
        backgroundColor: colors.primary[400],
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 14,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
