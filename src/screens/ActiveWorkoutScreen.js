import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated,
    Dimensions, Alert, ScrollView, KeyboardAvoidingView, Platform, TextInput
} from 'react-native';
import {
    ChevronLeft, Play, Pause, StopCircle, CheckCircle2,
    Dumbbell, Clock, TrendingUp, Zap, X
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorkoutStore } from '../store/workoutStore';
import { useUserStore } from '../store/userStore';
import { getWeightRecommendation, analyzeExerciseProgress } from '../utils/coachAnalyzer';
import colors from '../constants/colors';
import { EXERCISES_CATALOG } from '../store/workoutStore';

const { width } = Dimensions.get('window');

export default function ActiveWorkoutScreen({ navigation, route }) {
    const workout = useWorkoutStore(s => s.activeWorkout);
    const logSet = useWorkoutStore(s => s.logSet);
    const finishStrengthWorkout = useWorkoutStore(s => s.finishStrengthWorkout);
    const cancelWorkout = useWorkoutStore(s => s.cancelWorkout);

    const handleCancelWorkout = () => {
        Alert.alert(
            'Отменить тренировку?',
            'Прогресс не будет сохранен.',
            [
                { text: 'Нет', style: 'cancel' },
                {
                    text: 'Да, отменить',
                    style: 'destructive',
                    onPress: () => {
                        cancelWorkout(); // очищаем стор
                        navigation.navigate('Home'); // возвращаем пользователя на главную
                    }
                }
            ]
        );
    };


    const [isTimerRunning, setIsTimerRunning] = useState(true); // 🟢 Автостарт таймера
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [repsInput, setRepsInput] = useState('');
    const [weightInput, setWeightInput] = useState('');

    const startTimeRef = React.useRef(Date.now());

    // Авто-подсказка веса
    useEffect(() => {
        if (workout?.exercises?.length > 0) {
            const currentEx = workout.exercises[workout.currentExerciseIndex];
            if (currentEx && currentEx.suggestedWeight) {
                setWeightInput(currentEx.suggestedWeight.toString());
            }
        }
    }, [workout?.currentExerciseIndex]);

    // Таймер
    useEffect(() => {
        let interval;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    useFocusEffect(
        useCallback(() => {
            const onFocus = () => {
                if (!workout) navigation.goBack();
                else startTimeRef.current = Date.now() - elapsedSeconds * 1000;
            };
            return onFocus;
        }, [])
    );

    // 🟢 БЕЗОПАСНОЕ ЧТЕНИЕ ДАННЫХ
    const exercises = workout?.exercises || []; // Защита массива упражнений
    const currentExercise = exercises[workout?.currentExerciseIndex || 0];

    const currentSet = (currentExercise?.currentSetIndex || 0) + 1;
    const totalSets = currentExercise?.targetSets || 4;

    const isLastSet = currentSet > totalSets;
    // Безопасное чтение length
    const isLastExercise = workout?.currentExerciseIndex === (exercises.length - 1) && (currentSet >= totalSets);


    const handleLogSet = () => {
        if (!repsInput || !weightInput || Number(repsInput) === 0 || Number(weightInput) === 0) {
            Alert.alert('Ошибка', 'Введите количество повторений и вес!');
            return;
        }
        logSet(repsInput, weightInput);
        setRepsInput('');
        // Вес оставляем, обычно он не меняется каждый подход
    };

    const finishWorkout = () => {
        Alert.alert(
            'Завершить тренировку?',
            `Объём: ~${Math.round(workout?.totalVolume || 0)} кг\nВремя: ${Math.floor(elapsedSeconds / 60)}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`,
            [
                { text: 'Продолжить', style: 'cancel' },
                {
                    text: 'Завершить',
                    style: 'destructive',
                    onPress: () => {
                        useWorkoutStore.getState().updateActiveWorkout({ durationSeconds: elapsedSeconds });
                        finishStrengthWorkout('Автозаполнение');
                        navigation.navigate('WorkoutReport', { workoutId: workout.id });
                    }
                }
            ]
        );
    };

    if (!workout || workout.type !== 'Силовая') return null;

    const exerciseName = EXERCISES_CATALOG.find(e => e.id === currentExercise?.exerciseId)?.name || currentExercise?.exerciseId;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <ChevronLeft size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>{workout?.planName || 'Тренировка'}</Text>
                        <Text style={styles.headerSub}>
                            {/* 🟢 Безопасный вывод длины */}
                            {`Упражнение ${(workout?.currentExerciseIndex || 0) + 1} из ${exercises.length}`}
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.iconBtn} onPress={handleCancelWorkout}>
                        <X size={24} color="#FF453A" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.progressWrapper}>
                        <View style={styles.progressBar}>
                            <Animated.View
                                style={[
                                    styles.progressFill,
                                    { width: `${((workout.currentExerciseIndex) / workout.exercises.length) * 100}%` }
                                ]}
                            />
                        </View>
                    </View>

                    <View style={styles.exerciseCard}>
                        <View style={styles.exerciseHeader}>
                            <View style={styles.exerciseIconWrapper}>
                                <Dumbbell size={28} color="#FF3B30" />
                            </View>
                            <Text style={styles.exerciseName}>{exerciseName}</Text>
                        </View>

                        {currentExercise?.suggestedWeight ? (
                            <View style={styles.coachTip}>
                                <Zap size={16} color="#FFD60A" fill="#FFD60A" />
                                <Text style={styles.coachText}>{`Рекомендуемый вес: ${currentExercise.suggestedWeight} кг`}</Text>
                            </View>
                        ) : null}

                        <View style={styles.inputSection}>
                            <View style={styles.inputBlock}>
                                <Text style={styles.inputLabel}>ВЕС (КГ)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={weightInput}
                                    onChangeText={setWeightInput}
                                    keyboardType="decimal-pad"
                                    placeholder="0"
                                    placeholderTextColor="#8E8E93"
                                    maxLength={4}
                                />
                            </View>
                            <Text style={styles.inputMultiply}>×</Text>
                            <View style={styles.inputBlock}>
                                <Text style={styles.inputLabel}>ПОВТОРЫ</Text>
                                <TextInput
                                    style={styles.input}
                                    value={repsInput}
                                    onChangeText={setRepsInput}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#8E8E93"
                                    maxLength={3}
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.logBtn} onPress={handleLogSet} activeOpacity={0.8}>
                            <LinearGradient colors={['#32D74B', '#00C805']} style={styles.logGradient}>
                                <Text style={styles.logBtnText}>
                                    {currentSet <= totalSets ? `Записать ${currentSet} подход` : 'Записать доп. подход'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <Text style={styles.targetText}>{`Цель: ${totalSets} подхода`}</Text>
                    </View>

                    {currentExercise?.completedSets && currentExercise.completedSets.length > 0 ? (
                        <View style={styles.historySection}>
                            <Text style={styles.historyTitle}>Выполнено</Text>
                            {currentExercise.completedSets.map((set, i) => (
                                <View key={String(i)} style={styles.historyRow}>
                                    <View style={styles.historySetCircle}>
                                        <Text style={styles.historySetNumber}>{String(i + 1)}</Text>
                                    </View>
                                    <Text style={styles.historyDetails}>{`${set.weight} кг × ${set.reps} повт`}</Text>
                                    <CheckCircle2 size={20} color="#32D74B" />
                                </View>
                            ))}
                        </View>
                    ) : null}

                    <View style={{ height: 120 }} />
                </ScrollView>

                <View style={styles.bottomBar}>
                    <View style={styles.timerContainer}>
                        <Clock size={20} color="#8E8E93" />
                        <Text style={styles.timerText}>
                            {`${Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`}
                        </Text>
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.controlBtn}
                            onPress={() => setIsTimerRunning(!isTimerRunning)}
                        >
                            {isTimerRunning ? <Pause size={24} color="white" /> : <Play size={24} color="#32D74B" fill="#32D74B" />}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.finishBtn} onPress={finishWorkout}>
                            <LinearGradient
                                colors={isLastExercise ? ['#32D74B', '#00C805'] : ['#FF453A', '#D70015']}
                                style={styles.finishGradient}
                            >
                                <Text style={styles.finishText}>Завершить</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );

}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
    headerTextContainer: { flex: 1, alignItems: 'center' },
    headerTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Inter_700Bold' },
    headerSub: { color: colors.textSecondary, fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 2 },

    // Progress
    progressWrapper: { paddingHorizontal: 20, paddingBottom: 15 },
    progressBar: { height: 6, backgroundColor: '#2C2C2E', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#FF9500', borderRadius: 3 },

    scroll: { flex: 1, paddingHorizontal: 20 },

    // Exercise Card
    exerciseCard: { backgroundColor: '#1C1C1E', borderRadius: 24, padding: 20, marginBottom: 20 },
    exerciseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    exerciseIconWrapper: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255, 59, 48, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    exerciseName: { color: colors.textPrimary, fontSize: 22, fontFamily: 'Inter_700Bold', flex: 1 },

    coachTip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 214, 10, 0.1)', padding: 12, borderRadius: 12, marginBottom: 20 },
    coachText: { color: '#FFD60A', fontSize: 14, fontFamily: 'Inter_600SemiBold', marginLeft: 8 },

    inputSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    inputBlock: { flex: 1, backgroundColor: '#2C2C2E', borderRadius: 16, padding: 15, alignItems: 'center' },
    inputLabel: { color: colors.textSecondary, fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
    input: { color: colors.textPrimary, fontSize: 32, fontFamily: 'Inter_700Bold', textAlign: 'center', width: '100%' },
    inputMultiply: { color: '#8E8E93', fontSize: 24, fontFamily: 'Inter_700Bold', marginHorizontal: 15 },

    logBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 15 },
    logGradient: { paddingVertical: 16, alignItems: 'center' },
    logBtnText: { color: '#003300', fontSize: 18, fontFamily: 'Inter_700Bold' },
    targetText: { color: colors.textSecondary, fontSize: 14, fontFamily: 'Inter_500Medium', textAlign: 'center' },

    // History
    historySection: { backgroundColor: '#1C1C1E', borderRadius: 24, padding: 20 },
    historyTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 15 },
    historyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', padding: 12, borderRadius: 16, marginBottom: 10 },
    historySetCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#3A3A3C', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    historySetNumber: { color: colors.textPrimary, fontSize: 14, fontFamily: 'Inter_700Bold' },
    historyDetails: { color: colors.textPrimary, fontSize: 16, fontFamily: 'Inter_600SemiBold', flex: 1 },

    // Bottom Bar
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#1C1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 20, paddingBottom: Platform.OS === 'ios' ? 35 : 20
    },
    timerContainer: { flexDirection: 'row', alignItems: 'center' },
    timerText: { color: colors.textPrimary, fontSize: 24, fontFamily: 'Inter_700Bold', marginLeft: 10 },

    actionButtons: { flexDirection: 'row', gap: 10 },
    controlBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
    finishBtn: { borderRadius: 25, overflow: 'hidden' },
    finishGradient: { height: 50, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
    finishText: { color: 'white', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
