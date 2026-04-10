import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Platform, ScrollView, KeyboardAvoidingView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock, ChevronDown, Trash2 } from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWorkoutStore, EXERCISES_CATALOG } from '../store/workoutStore';
import { useTranslation } from '../hooks/useTranslation';

const TYPES = ['run', 'strength', 'cardio', 'bike', 'walk'];

const typeToKey = {
    'run': 'run',
    'cardio': 'cardio',
    'strength': 'strength',
    'bike': 'bike',
    'walk': 'walk'
};

export default function ManualWorkoutForm({ onCancel, onSave }) {
    const colors = useThemeColors();
    const { t, language } = useTranslation();

    const getPlans = useWorkoutStore(s => s.getPlans);
    const plans = getPlans ? getPlans() : [];
    
    // Новые функции из стора
    const updateWorkoutPlan = useWorkoutStore(s => s.updateWorkoutPlan);
    const deleteWorkoutPlan = useWorkoutStore(s => s.deleteWorkoutPlan);

    const [type, setType] = useState('run');
    const [date, setDate] = useState(new Date());
    const [duration, setDuration] = useState('');
    const [distance, setDistance] = useState('');
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [totalVolume, setTotalVolume] = useState('');
    const [totalSets, setTotalSets] = useState('');

    const [formExercises, setFormExercises] = useState([]);

    // Стейты для редактирования плана
    const [isEditingPlan, setIsEditingPlan] = useState(false);
    const [editPlanName, setEditPlanName] = useState('');
    const [showExPicker, setShowExPicker] = useState(false);

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const isDark = colors.background === '#000000' || colors.background === '#1C1C1E';

    // Функция загрузки данных плана
    const loadPlanData = (planId) => {
        const plan = plans?.find(p => p.id === planId);
        if (plan && plan.exercises) {
            setEditPlanName(plan.name || 'Без названия');
            setFormExercises(plan.exercises.map(ex => {
                const catalogItem = EXERCISES_CATALOG.find(e => e.id === ex.exerciseId);
                const exerciseName = catalogItem ? catalogItem.name : `Exercise ${ex.exerciseId}`;
                return {
                    ...ex,
                    name: exerciseName,
                    exerciseNameFromCatalog: exerciseName,
                    completedSets: [{ weight: '', reps: '' }]
                };
            }));
        } else {
            setFormExercises([]);
        }
    };

    useEffect(() => {
        setIsEditingPlan(false);
        setShowExPicker(false);
        loadPlanData(selectedPlanId);
    }, [selectedPlanId, plans]);

    // Управление подходами в режиме тренировки
    const addSetToExercise = (exIndex) => {
        const newEx = [...formExercises];
        newEx[exIndex].completedSets.push({ weight: '', reps: '' });
        setFormExercises(newEx);
    };

    const removeSetFromExercise = (exIndex, setIndex) => {
        const newEx = [...formExercises];
        newEx[exIndex].completedSets.splice(setIndex, 1);
        setFormExercises(newEx);
    };

    const updateSet = (exIndex, setIndex, field, value) => {
        const newEx = [...formExercises];
        newEx[exIndex].completedSets[setIndex][field] = value;
        setFormExercises(newEx);
    };

    // Управление планом в режиме редактирования
    const removeExerciseFromPlan = (exIndex) => {
        const newEx = [...formExercises];
        newEx.splice(exIndex, 1);
        setFormExercises(newEx);
    };

    const handleSavePlanChanges = () => {
        if (!selectedPlanId) return;
        const updatedExercises = formExercises.map(ex => ({ exerciseId: ex.exerciseId }));
        updateWorkoutPlan(selectedPlanId, { 
            name: editPlanName || 'Без названия', 
            exercises: updatedExercises 
        });
        setIsEditingPlan(false);
        setShowExPicker(false);
    };

    const handleCancelEditing = () => {
        setIsEditingPlan(false);
        setShowExPicker(false);
        loadPlanData(selectedPlanId); // откатываем несохраненные изменения
    };

    const handleDeletePlan = () => {
        if (!selectedPlanId) return;
        deleteWorkoutPlan(selectedPlanId);
        setSelectedPlanId(null);
        setIsEditingPlan(false);
    };

    const onChangeDate = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) {
            const newDate = new Date(date);
            newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            setDate(newDate);
        }
    };

    const onChangeTime = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowTimePicker(false);
        if (selectedDate) {
            const newDate = new Date(date);
            newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
            setDate(newDate);
        }
    };

    const getSystemType = (displayType) => {
        if (!displayType) return 'workout';
        const lower = displayType.toLowerCase();
        if (lower.includes('бег') || lower.includes('run')) return 'run';
        if (lower.includes('сил') || lower.includes('strength')) return 'strength';
        if (lower.includes('кард') || lower.includes('cardio')) return 'cardio';
        if (lower.includes('вел') || lower.includes('cycl') || lower.includes('bike')) return 'bike';
        if (lower.includes('ход') || lower.includes('walk')) return 'walk';
        return displayType;
    };

    const handleSave = () => {
        const selectedPlan = plans?.find(p => p.id === selectedPlanId);
        const systemType = getSystemType(type);
        
        let finalVolume = 0;
        let finalSets = 0;
        let finalExercises = [];

        if (systemType === 'strength') {
            // Для силовых тренировок обрабатываем formExercises с завершенными подходами
            if (formExercises.length > 0) {
                let calcVol = 0;
                let calcSets = 0;
                finalExercises = formExercises.map(ex => {
                    const validSets = ex.completedSets
                        .filter(set => set.weight !== '' && set.reps !== '')
                        .map(set => {
                            const w = Number(String(set.weight).replace(',', '.')) || 0;
                            const r = Number(set.reps) || 0;
                            calcVol += w * r;
                            calcSets += 1;
                            return { weight: w, reps: r };
                        });
                    return { 
                        exerciseId: ex.exerciseId,
                        name: ex.name, 
                        completedSets: validSets 
                    };
                });
                finalVolume = calcVol;
                finalSets = calcSets;
            } else if (!selectedPlanId) {
                // Если нет плана и нет упражнений, используем ручно введенные объемы
                finalVolume = Number(totalVolume.replace(',', '.')) || 0;
                finalSets = Number(totalSets) || 0;
            }
        }

        onSave({
            type: systemType,
            date,
            duration: Number(duration) || 0,
            distance: systemType !== 'strength' ? Number(distance.replace(',', '.')) || 0 : 0,
            totalVolume: finalVolume,
            totalSets: finalSets,
            planName: selectedPlan ? selectedPlan.name : (systemType === 'strength' ? t('ownWorkout') : ''),
            exercises: finalExercises
        });
    };

    const themeGreen = colors.green || '#32D74B';
    const themeRed = colors.error || '#FF3B30';
    const dateLocale = language === 'ru' ? 'ru-RU' : 'en-US';

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 150 : 0}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>{t('activityType')}</Text>
                
                <View style={styles.typeSelector}>
                    {TYPES.map(tKey => (
                        <TouchableOpacity
                            key={tKey}
                            style={[
                                styles.typeButton,
                                { backgroundColor: colors.cardBg, borderColor: colors.border },
                                type === tKey && { backgroundColor: themeGreen + '15', borderColor: themeGreen }
                            ]}
                            onPress={() => setType(tKey)}
                        >
                            <Text style={[
                                styles.typeText,
                                { color: colors.textSecondary },
                                type === tKey && { color: themeGreen, fontFamily: 'Inter700Bold' }
                            ]}>
                                {t(typeToKey[tKey] || tKey)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('startDate')}</Text>
                <TouchableOpacity
                    style={[styles.dateTimeButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                    onPress={() => setShowDatePicker(!showDatePicker)}
                >
                    <View style={styles.dateTimeInner}>
                        <Calendar size={20} color={colors.textSecondary} />
                        <Text style={[styles.dateTimeText, { color: colors.textPrimary }]}>
                            {date.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                    </View>
                    <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>

                {showDatePicker && (
                    <View style={[styles.pickerContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                            onChange={onChangeDate}
                            style={{ width: '100%' }}
                            themeVariant={isDark ? "dark" : "light"}
                            textColor={colors.textPrimary}
                            accentColor={themeGreen}
                            locale={dateLocale}
                        />
                    </View>
                )}

                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('startTime')}</Text>
                <TouchableOpacity
                    style={[styles.dateTimeButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                    onPress={() => setShowTimePicker(!showTimePicker)}
                >
                    <View style={styles.dateTimeInner}>
                        <Clock size={20} color={colors.textSecondary} />
                        <Text style={[styles.dateTimeText, { color: colors.textPrimary }]}>
                            {date.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                    <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>

                {showTimePicker && (
                    <View style={[styles.pickerContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                        <DateTimePicker
                            value={date}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeTime}
                            style={{ width: '100%', height: 180 }}
                            themeVariant={isDark ? "dark" : "light"}
                            textColor={colors.textPrimary}
                        />
                    </View>
                )}

                <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('duration')}</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.textPrimary }]}
                            keyboardType="numeric"
                            placeholder="45"
                            placeholderTextColor={colors.textSecondary}
                            value={duration}
                            onChangeText={setDuration}
                            returnKeyType="done"
                        />
                    </View>
                    
                    <View style={{ width: 15 }} />

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('distance')}</Text>
                        <TextInput
                            style={[
                                styles.input,
                                { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.textPrimary },
                                type === 'strength' && { opacity: 0.5 }
                            ]}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={colors.textSecondary}
                            value={type === 'strength' ? '' : distance}
                            onChangeText={setDistance}
                            editable={type !== 'strength'}
                            returnKeyType="done"
                        />
                    </View>
                </View>

                {type === 'strength' && (
                    <>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('workoutPlan')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    { backgroundColor: colors.cardBg, borderColor: colors.border, marginRight: 8 },
                                    !selectedPlanId && { backgroundColor: themeGreen + '15', borderColor: themeGreen }
                                ]}
                                onPress={() => setSelectedPlanId(null)}
                            >
                                <Text style={[
                                    styles.typeText,
                                    { color: colors.textSecondary },
                                    !selectedPlanId && { color: themeGreen, fontFamily: 'Inter700Bold' }
                                ]}>
                                    {t('ownWorkout')}
                                </Text>
                            </TouchableOpacity>

                            {plans?.map(p => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[
                                        styles.typeButton,
                                        { backgroundColor: colors.cardBg, borderColor: colors.border, marginRight: 8 },
                                        selectedPlanId === p.id && { backgroundColor: themeGreen + '15', borderColor: themeGreen }
                                    ]}
                                    onPress={() => setSelectedPlanId(p.id)}
                                >
                                    <Text style={[
                                        styles.typeText,
                                        { color: colors.textSecondary },
                                        selectedPlanId === p.id && { color: themeGreen, fontFamily: 'Inter700Bold' }
                                    ]}>
                                        {p.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {!selectedPlanId ? (
                            <View style={styles.rowInputs}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('totalVolume')}</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.textPrimary }]}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor={colors.textSecondary}
                                        value={totalVolume}
                                        onChangeText={setTotalVolume}
                                        returnKeyType="done"
                                    />
                                </View>
                                <View style={{ width: 15 }} />
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('totalSets')}</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.textPrimary }]}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor={colors.textSecondary}
                                        value={totalSets}
                                        onChangeText={setTotalSets}
                                        returnKeyType="done"
                                    />
                                </View>
                            </View>
                        ) : (
                            <View style={{ marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>
                                        {isEditingPlan ? t('editingPlan') : t('exercisesAndSets')}
                                    </Text>
                                    {!isEditingPlan && (
                                        <TouchableOpacity onPress={() => setIsEditingPlan(true)} style={{ padding: 4 }}>
                                            <Text style={{ color: themeGreen, fontFamily: 'Inter600SemiBold' }}>{t('editPlan')}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {isEditingPlan ? (
                                    <View style={{ backgroundColor: colors.cardBg, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('planName')}</Text>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border, marginBottom: 15 }]}
                                            value={editPlanName}
                                            onChangeText={setEditPlanName}
                                            placeholder={t('planName')}
                                            placeholderTextColor={colors.textSecondary}
                                        />

                                        <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 10 }]}>{t('exercises')}</Text>
                                        {formExercises.map((ex, exIndex) => (
                                            <View key={exIndex || ex.exerciseId} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                                                <Text style={{ color: colors.textPrimary, fontFamily: 'Inter500Medium', flex: 1 }}>
                                                    {exIndex + 1}. {ex.name || ex.exerciseNameFromCatalog || 'N/A'}
                                                </Text>
                                                <TouchableOpacity onPress={() => removeExerciseFromPlan(exIndex)} style={{ padding: 5 }}>
                                                    <Trash2 size={18} color={themeRed} />
                                                </TouchableOpacity>
                                            </View>
                                        ))}

                                        {!showExPicker ? (
                                            <TouchableOpacity 
                                                onPress={() => setShowExPicker(true)}
                                                style={{ padding: 12, alignItems: 'center', backgroundColor: themeGreen + '20', borderRadius: 8, marginTop: 15 }}
                                            >
                                                <Text style={{ color: themeGreen, fontFamily: 'Inter600SemiBold' }}>{t('addExercise')}</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={{ marginTop: 15, height: 250, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.background, overflow: 'hidden' }}>
                                                <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                                                    {EXERCISES_CATALOG.map(catEx => (
                                                        <TouchableOpacity 
                                                            key={catEx.id}
                                                            style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
                                                            onPress={() => {
                                                                const newEx = { exerciseId: catEx.id, name: catEx.name, completedSets: [{ weight: '', reps: '' }] };
                                                                setFormExercises([...formExercises, newEx]);
                                                                setShowExPicker(false);
                                                            }}
                                                        >
                                                            <Text style={{ color: colors.textPrimary, fontFamily: 'Inter500Medium' }}>{catEx.name}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                                <TouchableOpacity onPress={() => setShowExPicker(false)} style={{ padding: 12, alignItems: 'center', backgroundColor: colors.cardBg, borderTopWidth: 1, borderTopColor: colors.border }}>
                                                    <Text style={{ color: colors.textSecondary, fontFamily: 'Inter500Medium' }}>{t('closeList')}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}

                                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 25 }}>
                                            <TouchableOpacity onPress={handleSavePlanChanges} style={{ flex: 1, padding: 12, backgroundColor: themeGreen, borderRadius: 8, alignItems: 'center' }}>
                                                <Text style={{ color: '#003300', fontFamily: 'Inter600SemiBold' }}>{t('savePlan')}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={handleCancelEditing} style={{ flex: 1, padding: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, alignItems: 'center' }}>
                                                <Text style={{ color: colors.textPrimary, fontFamily: 'Inter600SemiBold' }}>{t('cancel')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                        
                                        <TouchableOpacity onPress={handleDeletePlan} style={{ marginTop: 15, padding: 12, alignItems: 'center' }}>
                                            <Text style={{ color: themeRed, fontFamily: 'Inter600SemiBold' }}>{t('deletePlan')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <>
                                        {formExercises.map((ex, exIndex) => (
                                            <View key={exIndex} style={{ marginBottom: 15, padding: 12, backgroundColor: colors.cardBg, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                                                <Text style={{ color: colors.textPrimary, fontFamily: 'Inter600SemiBold', fontSize: 16, marginBottom: 10 }}>
                                                    {ex.name}
                                                </Text>
                                                
                                                {ex.completedSets.map((set, setIndex) => (
                                                    <View key={setIndex} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                                        <Text style={{ color: colors.textSecondary, width: 20 }}>{setIndex + 1}.</Text>
                                                        <TextInput
                                                            style={[styles.input, { flex: 1, backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary, marginBottom: 0 }]}
                                                            keyboardType="numeric"
                                                            placeholder={t('weightPlaceholderUnit')}
                                                            placeholderTextColor={colors.textSecondary}
                                                            value={String(set.weight)}
                                                            onChangeText={(val) => updateSet(exIndex, setIndex, 'weight', val)}
                                                        />
                                                        <TextInput
                                                            style={[styles.input, { flex: 1, backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary, marginBottom: 0 }]}
                                                            keyboardType="numeric"
                                                            placeholder={t('repsPlaceholder')}
                                                            placeholderTextColor={colors.textSecondary}
                                                            value={String(set.reps)}
                                                            onChangeText={(val) => updateSet(exIndex, setIndex, 'reps', val)}
                                                        />
                                                        <TouchableOpacity 
                                                            onPress={() => removeSetFromExercise(exIndex, setIndex)}
                                                            style={{ padding: 10 }}
                                                        >
                                                            <Text style={{ color: themeRed, fontSize: 18, fontFamily: 'Inter600SemiBold' }}>✕</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                ))}
                                                
                                                <TouchableOpacity 
                                                    onPress={() => addSetToExercise(exIndex)}
                                                    style={{ padding: 10, alignItems: 'center', backgroundColor: themeGreen + '20', borderRadius: 8, marginTop: 5 }}
                                                >
                                                    <Text style={{ color: themeGreen, fontFamily: 'Inter600SemiBold' }}>{t('addSet')}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </>
                                )}
                            </View>
                        )}
                    </>
                )}

                <View style={styles.buttonsRow}>
                    <TouchableOpacity
                        style={[styles.cancelButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                        onPress={onCancel}
                    >
                        <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: themeGreen }]}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveText}>{t('save')}</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={{ height: 200 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 50 },
    sectionLabel: { fontSize: 18, fontFamily: 'Inter600SemiBold', marginBottom: 15 },
    typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 25 },
    typeButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
    typeText: { fontSize: 15, fontFamily: 'Inter500Medium' },
    label: { fontSize: 14, fontFamily: 'Inter500Medium', marginBottom: 8 },
    dateTimeButton: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 15 },
    dateTimeInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dateTimeText: { fontSize: 16, fontFamily: 'Inter600SemiBold' },
    pickerContainer: { marginBottom: 20, borderRadius: 16, overflow: 'hidden', alignItems: 'center', borderWidth: 1 },
    rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
    inputGroup: { marginBottom: 20 },
    input: { padding: 12, borderRadius: 12, borderWidth: 1, fontSize: 16, fontFamily: 'Inter400Regular' },
    buttonsRow: { flexDirection: 'row', gap: 15, marginTop: 10 },
    cancelButton: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
    cancelText: { fontSize: 16, fontFamily: 'Inter600SemiBold' },
    saveButton: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
    saveText: { color: '#003300', fontSize: 16, fontFamily: 'Inter700Bold' }
});
