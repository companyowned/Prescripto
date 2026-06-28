import React from 'react';
import {
    Modal, View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';
import { PillBadge } from './PillBadge';

interface MedicationInfo {
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    form?: string;
    notes?: string;
    purpose?: string;
}

interface Props {
    visible: boolean;
    medication: MedicationInfo | null;
    onClose: () => void;
}

const FORM_ICONS: Record<string, string> = {
    tablet: 'pill', capsule: 'pill', liquid: 'water',
    injection: 'needle', inhaler: 'lungs', drops: 'eyedrop',
    cream: 'lotion-outline',
};

const COMMON_INFO: Record<string, { uses: string; sideEffects: string; tips: string }> = {
    default: {
        uses: 'Take as prescribed by your doctor. Do not change your dose without consulting them.',
        sideEffects: 'Common side effects may include nausea, dizziness, or headache. Contact your doctor if symptoms are severe.',
        tips: 'Take with water. Store in a cool, dry place away from direct sunlight.',
    },
};

export const MedicationInfoModal: React.FC<Props> = ({ visible, medication, onClose }) => {
    if (!medication) return null;
    const icon = FORM_ICONS[medication.form || ''] || 'pill';
    const info = COMMON_INFO.default;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    {/* Header gradient */}
                    <LinearGradient
                        colors={['rgba(31,163,198,0.25)', 'rgba(4,13,18,0)']}
                        style={styles.headerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />

                    {/* Handle bar */}
                    <View style={styles.handle} />

                    {/* Close */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                        {/* Icon + Name */}
                        <View style={styles.iconRow}>
                            <View style={styles.iconWrap}>
                                <MaterialCommunityIcons name={icon as any} size={32} color={colors.primary[300]} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.medName}>{medication.name}</Text>
                                {medication.form && (
                                    <PillBadge label={medication.form} variant="info" style={{ marginTop: 6 }} />
                                )}
                            </View>
                        </View>

                        {/* Details grid */}
                        <View style={styles.grid}>
                            {medication.dosage && (
                                <InfoCell icon="flask-outline" label="Dosage" value={medication.dosage} />
                            )}
                            {medication.frequency && (
                                <InfoCell icon="repeat-outline" label="Frequency" value={medication.frequency} />
                            )}
                            {medication.duration && (
                                <InfoCell icon="calendar-outline" label="Duration" value={medication.duration} />
                            )}
                            {medication.purpose && (
                                <InfoCell icon="medkit-outline" label="Purpose" value={medication.purpose} />
                            )}
                        </View>

                        {/* Notes */}
                        {medication.notes && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Doctor's Notes</Text>
                                <View style={styles.noteCard}>
                                    <Ionicons name="document-text-outline" size={16} color={colors.primary[300]} />
                                    <Text style={styles.noteText}>{medication.notes}</Text>
                                </View>
                            </View>
                        )}

                        {/* General info */}
                        <InfoSection title="How to Use" icon="information-circle-outline" text={info.uses} color={colors.primary[300]} />
                        <InfoSection title="Side Effects" icon="alert-circle-outline" text={info.sideEffects} color="#F59E0B" />
                        <InfoSection title="Tips" icon="bulb-outline" text={info.tips} color="#10B981" />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const InfoCell: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
    <View style={styles.cell}>
        <Ionicons name={icon as any} size={16} color={colors.primary[300]} />
        <Text style={styles.cellLabel}>{label}</Text>
        <Text style={styles.cellValue}>{value}</Text>
    </View>
);

const InfoSection: React.FC<{ title: string; icon: string; text: string; color: string }> = ({ title, icon, text, color }) => (
    <View style={styles.section}>
        <View style={styles.sectionRow}>
            <Ionicons name={icon as any} size={16} color={color} />
            <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
        </View>
        <Text style={styles.sectionText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#081520',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '85%',
        borderWidth: 1,
        borderColor: 'rgba(62,219,240,0.2)',
        overflow: 'hidden',
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 120,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    closeBtn: {
        position: 'absolute',
        top: 12,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: { padding: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
    iconRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
    iconWrap: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(62,219,240,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(62,219,240,0.25)',
    },
    medName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    cell: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 12,
        minWidth: '47%',
        flex: 1,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 4,
    },
    cellLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    cellValue: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
    section: { marginBottom: 16 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
    sectionText: { fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 20 },
    noteCard: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: 'rgba(62,219,240,0.07)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(62,219,240,0.18)',
    },
    noteText: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 20 },
});
