import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MockBottomTabs } from '../../components/home';

export default function InsightsScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.title}>Insights</Text>

                    <View style={styles.emptyCard}>
                        <View style={styles.iconWrapper}>
                            <Ionicons name="bar-chart-outline" size={48} color="#0EA5E9" />
                        </View>
                        <Text style={styles.emptyTitle}>Insights Coming Soon</Text>
                        <Text style={styles.emptyMessage}>
                            Scan more prescriptions to generate beautiful analytics and charts regarding your medication tracking.
                        </Text>
                    </View>
                </ScrollView>

                <MockBottomTabs
                    activeTab="insights"
                    onHomePress={() => router.push('/(app)/home')}
                    onRecordsPress={() => router.push('/(app)/history')}
                    onInsightsPress={() => { }}
                    onSettingsPress={() => router.push('/(app)/settings')}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F6F8',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 30,
        paddingBottom: 110,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 24,
    },
    emptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginTop: 40,
    },
    iconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E0F2FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 10,
    },
    emptyMessage: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 22,
        textAlign: 'center',
    }
});
