// activeWorkoutScreen.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated, 
  Alert, ScrollView, KeyboardAvoidingView, Platform, TextInput 
} from 'react-native';
import { ChevronLeft, Play, Pause, CheckCircle2, Dumbbell, Clock, Zap, X } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useWorkoutStore, EXERCISES_CATALOG } from '../store/workoutStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../hooks/useTranslation'; // 👈 Добавили хук перевода

export default function ActiveWorkoutScreen({ navigation }) {
  const colors = useThemeColors();
  const { t } = useTranslation(); // 👈 Вызов хука

  const workout = useWorkoutStore(s => s.activeWorkout);
  const workouts = useWorkoutStore(s => s.workouts);
  const logSet = useWorkoutStore(s => s.logSet);
  const finishStrengthWorkout = useWorkoutStore(s => s.finishStrengthWorkout);
  const cancelWorkout = useWorkoutStore(s => s.cancelWorkout);

  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [repsInput, setRepsInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  const handleLogSet = () => {
    if (!currentExercise || isLogging) return;
    
    const parsedReps = Number(repsInput.replace(',', '.'));
    const parsedWeight = Number(weightInput.replace(',', '.'));
    
    if (!parsedReps || !parsedWeight || parsedReps <= 0 || parsedWeight < 0) {
      Alert.alert('Внимание', 'Введите корректные значения веса и повторений!'); // Можно вынести в перевод
      return;
    }
    
    setIsLogging(true);
    logSet(parsedReps, parsedWeight);
    setRepsInput('');
    
    setTimeout(() => setIsLogging(false), 500);
  };

  const startTimeRef = React.useRef(Date.now());
  const themeOrange = colors.orange || '#FF9F0A';
  const themeGreen = colors.green || '#32D74B';
  const themeRed = colors.error || '#FF3B30';

  const handleCancelWorkout = () => {
    Alert.alert(
      t('activeWorkout_cancelAlertTitle'),
      t('activeWorkout_cancelAlertText'),
      [
        { text: t('activeWorkout_btnStay'), style: 'cancel' },
        { 
          text: t('activeWorkout_btnCancel'), 
          style: 'destructive',
          onPress: () => {
            cancelWorkout();
            navigation.navigate('Home');
          }
        }
      ]
    );
  };

  const accumulatedTimeRef = React.useRef(0);
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      startTimeRef.current = Date.now();
      interval = setInterval(() => {
        const currentRunSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(accumulatedTimeRef.current + currentRunSeconds);
      }, 1000);
    } else {
      const currentRunSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      accumulatedTimeRef.current += currentRunSeconds;
      setElapsedSeconds(accumulatedTimeRef.current);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isTimerRunning]);

  useFocusEffect(
    useCallback(() => {
      if (!workout) {
        navigation.goBack();
      }
    }, [workout, navigation])
  );

  const exercises = workout?.exercises || [];
  const currentExerciseIndex = workout?.currentExerciseIndex || 0;
  const currentExercise = exercises[currentExerciseIndex];
  const currentSetIndex = currentExercise?.currentSetIndex || 0;
  const currentSet = currentSetIndex + 1;
  const totalSets = currentExercise?.targetSets || 4;
  const isLastExercise = workout?.currentExerciseIndex === exercises.length - 1 && currentSet > totalSets;

  // 🟢 Перевод названия упражнения
  const exerciseName = (() => {
    if (!currentExercise?.exerciseId) return '';
    const id = currentExercise.exerciseId;
    const translation = t(`ex_${id}`);
    if (translation !== `ex_${id}`) return translation;
    return EXERCISES_CATALOG.find(e => e.id === id)?.name || id;
  })();

  const previousSetData = useMemo(() => {
    if (!currentExercise?.exerciseId || !Array.isArray(workouts)) return null;
    
    const finishedStrengthWorkouts = [...workouts]
      .filter(item => item?.type === 'strength' && item?.exercises?.length > 0)
      .reverse();

    for (const pastWorkout of finishedStrengthWorkouts) {
      const sameExercise = pastWorkout.exercises.find(
        ex => ex.exerciseId === currentExercise.exerciseId
      );
      if (!sameExercise) continue;

      const pastSets = sameExercise.completedSets || sameExercise.sets;
      const targetPastSet = pastSets[currentSetIndex];
      
      if (targetPastSet && Number(targetPastSet.weight) > 0 && Number(targetPastSet.reps) > 0) {
        return {
          weight: String(targetPastSet.weight),
          reps: String(targetPastSet.reps),
        };
      }
    }
    return null;
  }, [workouts, currentExercise?.exerciseId, currentSetIndex]);

  useEffect(() => {
    setRepsInput('');
    if (previousSetData?.weight) {
      setWeightInput(previousSetData.weight);
    } else {
      setWeightInput('');
    }
  }, [currentExerciseIndex, currentSetIndex, previousSetData]);

  const finishWorkout = () => {
    const vol = Math.round(workout?.totalVolume || 0);
    const time = Math.floor(elapsedSeconds / 60) + ':' + (elapsedSeconds % 60).toString().padStart(2, '0');
    
    let alertText = t('activeWorkout_finishAlertText');
    alertText = alertText.replace('{volume}', vol).replace('{time}', time);

    Alert.alert(
      t('activeWorkout_finishAlertTitle'),
      alertText,
      [
        { text: t('activeWorkout_btnStay'), style: 'cancel' },
        { 
          text: t('activeWorkout_btnFinish'), 
          style: 'default',
          onPress: () => {
            useWorkoutStore.getState().updateActiveWorkout({ durationSeconds: elapsedSeconds });
            finishStrengthWorkout();
            navigation.navigate('WorkoutReport', { workoutId: workout.id });
          }
        }
      ]
    );
  };

  if (!workout || workout.type !== 'strength') return null;

  if (exercises.length > 0 && currentExerciseIndex >= exercises.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <View style={{ alignItems: 'center', paddingHorizontal: 30 }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: `${themeGreen}20`, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
            <CheckCircle2 size={50} color={themeGreen} />
          </View>
          <Text style={{ fontSize: 28, fontFamily: 'Inter_800ExtraBold', color: colors.textPrimary, marginBottom: 12, textAlign: 'center' }}>
            {t('activeWorkout_completed')}
          </Text>
          <Text style={{ fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginBottom: 40, textAlign: 'center', lineHeight: 24 }}>
            {t('activeWorkout_allDone')}
          </Text>

          <TouchableOpacity 
            style={{ width: '100%', borderRadius: 16, overflow: 'hidden' }} 
            onPress={finishWorkout} 
            activeOpacity={0.8}
          >
            <LinearGradient colors={[themeGreen, '#00C805']} style={{ paddingVertical: 18, alignItems: 'center' }}>
              <Text style={{ color: '#003300', fontSize: 18, fontFamily: 'Inter_700Bold' }}>
                {t('activeWorkout_finishWorkoutBtn')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Заменяем плейсхолдеры в кнопке логгирования
  let logSetBtnText = t('activeWorkout_logSetBtn_current');
  logSetBtnText = logSetBtnText.replace('{current}', currentSet).replace('{total}', totalSets);

  // Плейсхолдеры для "Цель: X подходов"
  let targetSetsText = t('activeWorkout_targetSets');
  targetSetsText = targetSetsText.replace('{total}', totalSets);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: colors.cardBg }]}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{workout?.planName || 'Тренировка'}</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              {currentExerciseIndex + 1} / {exercises.length}
            </Text>
          </View>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.cardBg }]} onPress={handleCancelWorkout}>
            <X size={24} color={themeRed} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.progressWrapper}>
            <View style={[styles.progressBar, { backgroundColor: colors.cardBg }]}>
              <Animated.View style={[
                styles.progressFill, 
                { width: exercises.length ? `${(currentExerciseIndex / exercises.length) * 100}%` : '0%', backgroundColor: themeOrange }
              ]} />
            </View>
          </View>

          <View style={[styles.exerciseCard, { backgroundColor: colors.cardBg }]}>
            
            <View style={styles.exerciseHeader}>
              <View style={[styles.exerciseIconWrapper, { backgroundColor: `${themeRed}15` }]}>
                <Dumbbell size={28} color={themeRed} />
              </View>
              <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>{exerciseName}</Text>
            </View>

            {previousSetData ? (
              <View style={[styles.historyHint, { backgroundColor: `${themeOrange}15` }]}>
                <Zap size={16} color={themeOrange} fill={themeOrange} />
                <Text style={[styles.historyHintText, { color: themeOrange }]}>
                  {currentSet}-й подход прошлый раз: {previousSetData.weight} кг × {previousSetData.reps}
                </Text>
              </View>
            ) : null}

            <View style={styles.inputSection}>
              <View style={[styles.inputBlock, { backgroundColor: colors.background }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('activeWorkout_weightPlaceholder')} (кг)</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={5}
                />
              </View>

              <Text style={[styles.inputMultiply, { color: colors.textSecondary }]}>×</Text>

              <View style={[styles.inputBlock, { backgroundColor: colors.background }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('activeWorkout_repsPlaceholder')}</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={repsInput}
                  onChangeText={setRepsInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={3}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.logBtn} 
              onPress={handleLogSet} 
              activeOpacity={0.8}
              disabled={!currentExercise || isLogging}
            >
              <LinearGradient colors={[themeGreen, '#00C805']} style={styles.logGradient}>
                <Text style={styles.logBtnText}>
                  {currentSet <= totalSets ? logSetBtnText : t('activeWorkout_logSetBtn')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={[styles.targetText, { color: colors.textSecondary }]}>{targetSetsText}</Text>
          </View>

          {currentExercise?.completedSets && currentExercise.completedSets.length > 0 ? (
            <View style={[styles.historySection, { backgroundColor: colors.cardBg }]}>
              <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>{t('activeWorkout_historyTitle')}</Text>
              {currentExercise.completedSets.map((set, i) => (
                <View key={String(i)} style={[styles.historyRow, { backgroundColor: colors.background }]}>
                  <View style={[styles.historySetCircle, { backgroundColor: colors.border }]}>
                    <Text style={[styles.historySetNumber, { color: colors.textPrimary }]}>{String(i + 1)}</Text>
                  </View>
                  <Text style={[styles.historyDetails, { color: colors.textPrimary }]}>
                    {set.weight} кг × {set.reps}
                  </Text>
                  <CheckCircle2 size={20} color={themeGreen} />
                </View>
              ))}
            </View>
          ) : null}

          <View style={{ height: 140 }} />
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: colors.cardBg, borderTopColor: colors.border }]}>
          <View style={styles.timerContainer}>
            <Clock size={20} color={colors.textSecondary} />
            <Text style={[styles.timerText, { color: colors.textPrimary }]}>
              {Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.controlBtn, { backgroundColor: colors.background }]} 
              onPress={() => setIsTimerRunning(!isTimerRunning)}
            >
              {isTimerRunning ? <Pause size={24} color={colors.textPrimary} /> : <Play size={24} color={themeGreen} fill={themeGreen} />}
            </TouchableOpacity>

            {isLastExercise ? (
              <TouchableOpacity style={styles.finishBtn} onPress={finishWorkout}>
                <LinearGradient colors={[themeGreen, '#00C805']} style={styles.finishGradient}>
                  <Text style={styles.finishText}>{t('activeWorkout_finishWorkoutBtn')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.finishBtnSecondary, { backgroundColor: colors.background }]} onPress={finishWorkout}>
                <Text style={[styles.finishTextSecondary, { color: themeRed }]}>{t('activeWorkout_finishWorkoutBtn')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTextContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 2 },
  progressWrapper: { paddingHorizontal: 20, paddingBottom: 15 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  scroll: { flex: 1, paddingHorizontal: 20 },
  exerciseCard: { borderRadius: 24, padding: 20, marginBottom: 20 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  exerciseIconWrapper: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  exerciseName: { fontSize: 22, fontFamily: 'Inter_700Bold', flex: 1 },
  historyHint: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 20 },
  historyHintText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginLeft: 8, flex: 1 },
  inputSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  inputBlock: { flex: 1, borderRadius: 16, padding: 15, alignItems: 'center', minHeight: 90, justifyContent: 'center' },
  inputLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  input: { fontSize: 32, fontFamily: 'Inter_700Bold', textAlign: 'center', width: '100%' },
  inputTinyHint: { fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 4 },
  inputMultiply: { fontSize: 24, fontFamily: 'Inter_700Bold', marginHorizontal: 15 },
  logBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 15 },
  logGradient: { paddingVertical: 16, alignItems: 'center' },
  logBtnText: { color: '#003300', fontSize: 18, fontFamily: 'Inter_700Bold' },
  targetText: { fontSize: 14, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  historySection: { borderRadius: 24, padding: 20 },
  historyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 15 },
  historyRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 10 },
  historySetCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  historySetNumber: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  historyDetails: { fontSize: 16, fontFamily: 'Inter_600SemiBold', flex: 1 },
  bottomBar: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingVertical: 20, paddingBottom: Platform.OS === 'ios' ? 35 : 20 
  },
  timerContainer: { flexDirection: 'row', alignItems: 'center' },
  timerText: { fontSize: 24, fontFamily: 'Inter_700Bold', marginLeft: 10 },
  actionButtons: { flexDirection: 'row', gap: 10 },
  controlBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  finishBtn: { borderRadius: 25, overflow: 'hidden' },
  finishGradient: { height: 50, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  finishText: { color: 'white', fontSize: 16, fontFamily: 'Inter_700Bold' },
  finishBtnSecondary: { height: 50, paddingHorizontal: 20, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  finishTextSecondary: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
