/**
 * Create/Edit Reminder Screen — Form for medication reminder configuration
 */

import React, { useState, useEffect, createElement } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TextInput, TouchableOpacity, Platform, Alert, ActivityIndicator,
    Modal, TouchableWithoutFeedback, FlatList
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
    useReminder,
    useCreateReminder,
    useUpdateReminder,
} from '../../features/reminders/hooks';
import { usePrescriptionHistory, usePrescription } from '../../features/prescriptions/hooks';
import { ScheduleType } from '../../features/reminders/types';

const FORM_OPTIONS = ['tablet', 'capsule', 'liquid', 'injection', 'inhaler', 'drops', 'cream'];
const SCHEDULE_TYPES: { key: ScheduleType; label: string; icon: string }[] = [
    { key: 'fixed_times', label: 'Fixed Times', icon: 'time-outline' },
    { key: 'interval', label: 'Interval', icon: 'repeat-outline' },
    { key: 'as_needed', label: 'As Needed', icon: 'hand-left-outline' },
];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2).toString().padStart(2, '0');
    const m = (i % 2 === 0) ? '00' : '30';
    return `${h}:${m}`;
});
const INTERVAL_OPTIONS = ['Not written', '1', '2', '3', '4', '6', '8', '12', '24', '48', '72'];

const SelectPicker = ({ value, options, placeholder, onSelect }: any) => {
    const [visible, setVisible] = useState(false);
    return (
        <View style={{ flex: 1 }}>
            <TouchableOpacity 
                style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48, paddingVertical: 0 }]} 
                onPress={() => setVisible(true)}
            >
                <Text style={{ color: value ? '#111827' : '#9CA3AF', fontSize: 15 }}>{value || placeholder}</Text>
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <Modal visible={visible} transparent animationType="slide">
                <TouchableWithoutFeedback onPress={() => setVisible(false)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                        <TouchableWithoutFeedback>
                            <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%' }}>
                                <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#f3f4f6', alignItems: 'center' }}>
                                    <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', marginBottom: 10 }} />
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Select Option</Text>
                                </View>
                                <FlatList
                                    data={options}
                                    keyExtractor={(item) => item.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity 
                                            style={{ paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#f3f4f6', alignItems: 'center' }}
                                            onPress={() => { onSelect(item); setVisible(false); }}
                                        >
                                            <Text style={{ fontSize: 16, color: '#374151', textAlign: 'center' }}>
                                                {item} {options === INTERVAL_OPTIONS && item !== 'Not written' ? 'hours' : ''}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const TimePickerField = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
    const [show, setShow] = useState(false);

    const dateVal = new Date();
    const [h, m] = (value || '08:00').split(':').map(Number);
    dateVal.setHours(h || 8, m || 0, 0, 0);

    const handleChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShow(false);
        if (selectedDate) {
            const hStr = selectedDate.getHours().toString().padStart(2, '0');
            const mStr = selectedDate.getMinutes().toString().padStart(2, '0');
            onChange(`${hStr}:${mStr}`);
        }
    };

    if (Platform.OS === 'web') {
        const inputProps = {
            type: 'time',
            value: value,
            onChange: (e: any) => onChange(e.target.value),
            style: {
                padding: 12, borderRadius: 12, border: '1px solid #E5E7EB',
                fontSize: 15, width: '100%', backgroundColor: '#fff', color: '#111827',
                height: 48, outline: 'none', fontFamily: 'system-ui'
            }
        };
        return createElement('input', inputProps);
    }

    return (
        <View style={{ flex: 1 }}>
            <TouchableOpacity 
                style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48, paddingVertical: 0 }]} 
                onPress={() => setShow(true)}
            >
                <Text style={{ color: '#111827', fontSize: 15 }}>{value}</Text>
                <Ionicons name="time-outline" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {show && Platform.OS === 'ios' ? (
                <Modal transparent animationType="slide">
                    <TouchableWithoutFeedback onPress={() => setShow(false)}>
                        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                            <TouchableWithoutFeedback>
                                <View style={{ backgroundColor: 'white', paddingBottom: 20 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 14, borderBottomWidth: 1, borderColor: '#eee' }}>
                                        <TouchableOpacity onPress={() => setShow(false)}>
                                            <Text style={{ color: '#0EA5E9', fontWeight: 'bold', fontSize: 16 }}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <DateTimePicker
                                        value={dateVal}
                                        mode="time"
                                        display="spinner"
                                        onChange={handleChange}
                                    />
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            ) : show && Platform.OS === 'android' ? (
                <DateTimePicker
                    value={dateVal}
                    mode="time"
                    display="clock"
                    is24Hour={true}
                    onChange={handleChange}
                />
            ) : null}
        </View>
    );
};

export default function ReminderFormScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string }>();
    const isEdit = !!params.id;

    const { data: existingReminder, isLoading: isLoadingReminder } = useReminder(params.id || '');
    const createMutation = useCreateReminder();
    const updateMutation = useUpdateReminder();

    // Autofill hooks
    const { data: historyData } = usePrescriptionHistory(0, 1);
    const latestDocId = historyData?.prescriptions?.[0]?.document_id;
    const { data: latestPrescription } = usePrescription(latestDocId || '');

    // Form state
    const [medicationName, setMedicationName] = useState('');
    const [dosage, setDosage] = useState('');
    const [form, setForm] = useState('tablet');
    const [instructions, setInstructions] = useState('');
    const [scheduleType, setScheduleType] = useState<ScheduleType>('fixed_times');
    const [times, setTimes] = useState<string[]>(['08:00']);
    const [intervalHours, setIntervalHours] = useState('8');
    const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

    // Populate form when editing
    useEffect(() => {
        if (existingReminder) {
            setMedicationName(existingReminder.medication_name);
            setDosage(existingReminder.dosage || '');
            setForm(existingReminder.form || 'tablet');
            setInstructions(existingReminder.instructions || '');
            setScheduleType(existingReminder.schedule_type);
            if (existingReminder.times) setTimes(existingReminder.times);
            if (existingReminder.interval_hours) setIntervalHours(String(existingReminder.interval_hours));
            if (existingReminder.days_of_week) setSelectedDays(existingReminder.days_of_week);
        }
    }, [existingReminder]);

    const addTime = () => {
        setTimes([...times, '12:00']);
    };

    const removeTime = (index: number) => {
        setTimes(times.filter((_, i) => i !== index));
    };

    const updateTime = (index: number, value: string) => {
        const updated = [...times];
        updated[index] = value;
        setTimes(updated);
    };

    const toggleDay = (day: number) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
        );
    };

    const handleSave = async () => {
        if (!medicationName.trim()) {
            Alert.alert('Error', 'Please enter a medication name');
            return;
        }

        const data = {
            medication_name: medicationName.trim(),
            dosage: dosage.trim() || undefined,
            form,
            instructions: instructions.trim() || undefined,
            start_date: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            schedule_type: scheduleType,
            times_per_day: scheduleType === 'fixed_times' ? times.length : undefined,
            times: scheduleType === 'fixed_times' ? times.filter(t => t !== 'Not written') : undefined,
            interval_hours: scheduleType === 'interval' && intervalHours !== 'Not written' ? parseFloat(intervalHours) : undefined,
            days_of_week: selectedDays.length < 7 ? selectedDays : undefined,
        };

        try {
            if (isEdit && params.id) {
                await updateMutation.mutateAsync({ id: params.id, data });
            } else {
                await createMutation.mutateAsync(data);
            }
            router.back();
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.detail || 'Failed to save reminder');
        }
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    if (isEdit && isLoadingReminder) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#0EA5E9" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{isEdit ? 'Edit Reminder' : 'New Reminder'}</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Autofill Section */}
                {!isEdit && latestPrescription?.medications && latestPrescription.medications.length > 0 && (
                    <View style={styles.autofillSection}>
                        <View style={styles.autofillHeader}>
                            <Ionicons name="sparkles" size={16} color="#0EA5E9" />
                            <Text style={styles.autofillLabel}>Autofill from last scan</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.autofillScroll}>
                            {latestPrescription.medications.map((med, i) => (
                                <TouchableOpacity 
                                    key={i} 
                                    style={styles.autofillChip}
                                    onPress={() => {
                                        setMedicationName(med.name);
                                        
                                        // Filter out 'Not written' from AI output to leave fields clean
                                        const cleanVal = (v?: string | null) => (!v || v.toLowerCase() === 'not written' || v.toLowerCase() === 'none') ? '' : v;
                                        setDosage(cleanVal(med.dose));
                                        
                                        const freq = cleanVal(med.frequency);
                                        const notes = cleanVal(med.notes);
                                        setInstructions([freq, notes].filter(Boolean).join(' - '));

                                        // Auto-parse frequency to schedule type, times & intervals
                                        if (freq) {
                                            const f = freq.toLowerCase();
                                            if (f.includes('as needed') || f.includes('prn')) {
                                                setScheduleType('as_needed');
                                            } else if (f.includes('8 hour') || f.includes('q8h')) {
                                                setScheduleType('interval'); setIntervalHours('8');
                                            } else if (f.includes('12 hour') || f.includes('q12h')) {
                                                setScheduleType('interval'); setIntervalHours('12');
                                            } else if (f.includes('6 hour') || f.includes('q6h')) {
                                                setScheduleType('interval'); setIntervalHours('6');
                                            } else if (f.includes('4 hour') || f.includes('q4h')) {
                                                setScheduleType('interval'); setIntervalHours('4');
                                            } else if (f.includes('24 hour')) {
                                                setScheduleType('interval'); setIntervalHours('24');
                                            } else if (f.includes('twice') || f.includes('bid')) {
                                                setScheduleType('fixed_times'); setTimes(['08:00', '20:00']);
                                            } else if (f.includes('three times') || f.includes('tid')) {
                                                setScheduleType('fixed_times'); setTimes(['08:00', '14:00', '20:00']);
                                            } else if (f.includes('four times') || f.includes('qid')) {
                                                setScheduleType('fixed_times'); setTimes(['08:00', '12:00', '16:00', '20:00']);
                                            } else if (f.includes('daily') || f.includes('once') || f.includes('day')) {
                                                setScheduleType('fixed_times'); setTimes(['08:00']);
                                            }
                                        }
                                    }}
                                >
                                    <Text style={styles.autofillChipText}>{med.name}</Text>
                                    {med.dose && <Text style={styles.autofillChipSubtext}>{med.dose}</Text>}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Medication Name */}
                <View style={styles.section}>
                    <Text style={styles.label}>Medication Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={medicationName}
                        onChangeText={setMedicationName}
                        placeholder="e.g. Aspirin"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                {/* Dosage */}
                <View style={styles.section}>
                    <Text style={styles.label}>Dosage</Text>
                    <TextInput
                        style={styles.input}
                        value={dosage}
                        onChangeText={setDosage}
                        placeholder="e.g. 100mg"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                {/* Form */}
                <View style={styles.section}>
                    <Text style={styles.label}>Form</Text>
                    <View style={styles.chipsRow}>
                        {FORM_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt}
                                style={[styles.chip, form === opt && styles.chipActive]}
                                onPress={() => setForm(opt)}
                            >
                                <Text style={[styles.chipText, form === opt && styles.chipTextActive]}>
                                    {opt}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Schedule Type */}
                <View style={styles.section}>
                    <Text style={styles.label}>Schedule</Text>
                    <View style={styles.scheduleOptions}>
                        {SCHEDULE_TYPES.map((opt) => (
                            <TouchableOpacity
                                key={opt.key}
                                style={[styles.scheduleOption, scheduleType === opt.key && styles.scheduleOptionActive]}
                                onPress={() => setScheduleType(opt.key)}
                            >
                                <Ionicons
                                    name={opt.icon as any}
                                    size={20}
                                    color={scheduleType === opt.key ? '#0EA5E9' : '#9CA3AF'}
                                />
                                <Text
                                    style={[
                                        styles.scheduleOptionText,
                                        scheduleType === opt.key && styles.scheduleOptionTextActive,
                                    ]}
                                >
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Fixed Times */}
                {scheduleType === 'fixed_times' && (
                    <View style={styles.section}>
                        <Text style={styles.label}>Dose Times</Text>
                        {times.map((t, idx) => (
                            <View key={idx} style={styles.timeRow}>
                                <TimePickerField
                                    value={t}
                                    onChange={(v: string) => updateTime(idx, v)}
                                />
                                {times.length > 1 && (
                                    <TouchableOpacity onPress={() => removeTime(idx)} style={styles.removeTimeBtn}>
                                        <Ionicons name="close-circle" size={22} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                        <TouchableOpacity style={styles.addTimeBtn} onPress={addTime}>
                            <Ionicons name="add-circle-outline" size={18} color="#0EA5E9" />
                            <Text style={styles.addTimeText}>Add Time</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Interval Hours */}
                {scheduleType === 'interval' && (
                    <View style={styles.section}>
                        <Text style={styles.label}>Interval (hours)</Text>
                        <SelectPicker
                            value={intervalHours}
                            options={INTERVAL_OPTIONS}
                            placeholder="Select interval"
                            onSelect={setIntervalHours}
                        />
                    </View>
                )}

                {/* Days of Week */}
                {scheduleType !== 'as_needed' && (
                    <View style={styles.section}>
                        <Text style={styles.label}>Days</Text>
                        <View style={styles.daysRow}>
                            {DAY_LABELS.map((label, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={[styles.dayCircle, selectedDays.includes(idx) && styles.dayCircleActive]}
                                    onPress={() => toggleDay(idx)}
                                >
                                    <Text
                                        style={[
                                            styles.dayText,
                                            selectedDays.includes(idx) && styles.dayTextActive,
                                        ]}
                                    >
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Instructions */}
                <View style={styles.section}>
                    <Text style={styles.label}>Instructions</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={instructions}
                        onChangeText={setInstructions}
                        placeholder="e.g. Take with food"
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                            <Text style={styles.saveBtnText}>
                                {isEdit ? 'Update Reminder' : 'Create Reminder'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F6F8',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 30,
        paddingBottom: 40,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    autofillSection: {
        marginBottom: 24,
        backgroundColor: '#E0F2FE',
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    autofillHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 10,
        gap: 6,
    },
    autofillLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0369A1',
    },
    autofillScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    autofillChip: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#7DD3FC',
        minWidth: 100,
    },
    autofillChipText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0369A1',
        marginBottom: 2,
    },
    autofillChipSubtext: {
        fontSize: 12,
        color: '#0284C7',
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#111827',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    chipActive: {
        backgroundColor: '#0EA5E9',
        borderColor: '#0EA5E9',
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'capitalize',
    },
    chipTextActive: {
        color: '#FFFFFF',
    },
    scheduleOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    scheduleOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        gap: 6,
    },
    scheduleOptionActive: {
        borderColor: '#0EA5E9',
        backgroundColor: '#E0F2FE',
    },
    scheduleOptionText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6B7280',
    },
    scheduleOptionTextActive: {
        color: '#0EA5E9',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    timeInput: {
        flex: 1,
    },
    removeTimeBtn: {
        padding: 4,
    },
    addTimeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    addTimeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0EA5E9',
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    dayCircleActive: {
        backgroundColor: '#0EA5E9',
        borderColor: '#0EA5E9',
    },
    dayText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6B7280',
    },
    dayTextActive: {
        color: '#FFFFFF',
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#0EA5E9',
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 8,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnDisabled: {
        opacity: 0.6,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
