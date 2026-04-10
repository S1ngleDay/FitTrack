// src/screens/ActiveRunScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Pause, Play, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { useWorkoutStore } from '../store/workoutStore';
import { useUserStore } from '../store/userStore';
import { useRouteTracker } from '../hooks/useRouteTracker';
import { usePedometer } from '../hooks/usePedometer';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../hooks/useTranslation';
import { useWorkoutNotification } from '../hooks/useWorkoutNotification';

export default function ActiveRunScreen() {
  const navigation = useNavigation();
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const cancelWorkout = useWorkoutStore((s) => s.cancelWorkout);
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);

  const user = useUserStore((s) => s.user);
  const weight = user?.weight || 80;
  const height = user?.height || 180;

  const { route, isTracking, startTracking, stopTracking } = useRouteTracker();
  const { steps: totalStepsToday, isAvailable: isPedometerAvailable } = usePedometer();

  const colors = useThemeColors();
  const { t } = useTranslation();

  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [workoutSteps, setWorkoutSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [isGoalReached, setIsGoalReached] = useState(false);

  // Background workout notification (for Android)
  useWorkoutNotification(activeWorkout, elapsedSeconds);

  const timerRef = useRef(null);
  const initialStepsRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);

  const isRunOrWalk = activeWorkout?.type === 'run' || activeWorkout?.type === 'walk';
  const stepLengthM = (height * 0.414) / 100;
  const efficiencyFactor = isRunOrWalk ? 1.05 : 1.0;

  // Функция для вычисления дистанции между двумя GPS точками (формула Гаверсинуса)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Радиус Земли в км
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Дистанция в км
  };


  // ✅ ЛОГИКА ШАГОВ С ЛОГАМИ
  // ✅ УНИВЕРСАЛЬНАЯ ЛОГИКА ДИСТАНЦИИ (ШАГИ ДЛЯ ПЕШИХ, GPS ДЛЯ ВЕЛО)
  useEffect(() => {
    // 1. Инициализация начальных шагов для бега/ходьбы
    if (isPedometerAvailable && initialStepsRef.current === null && totalStepsToday > 0) {
      initialStepsRef.current = totalStepsToday;
    }

    // Обновляем метрики не чаще 1 раза в 2 секунды
    const now = Date.now();
    if (!isPaused && now - lastUpdateTimeRef.current >= 2000) {

      let calculatedDistance = 0;
      let currentWorkoutSteps = 0;

      // ЛОГИКА ДЛЯ БЕГА / ХОДЬБЫ (по шагомеру)
      if (isRunOrWalk && isPedometerAvailable && initialStepsRef.current !== null) {
        currentWorkoutSteps = Math.max(0, totalStepsToday - initialStepsRef.current);
        calculatedDistance = (currentWorkoutSteps * stepLengthM) / 1000;
        setWorkoutSteps(currentWorkoutSteps);
      }
      // ЛОГИКА ДЛЯ ВЕЛОСИПЕДА (по GPS координатам)
      else if (activeWorkout?.type === 'bike' && route && route.length > 1) {
        let gpsDist = 0;
        for (let i = 1; i < route.length; i++) {
          gpsDist += calculateDistance(
            route[i - 1].latitude, route[i - 1].longitude,
            route[i].latitude, route[i].longitude
          );
        }
        calculatedDistance = gpsDist;
        setWorkoutSteps(0); // На велосипеде шаги не нужны
      }

      // Если дистанция изменилась, обновляем стейт и калории
      if (calculatedDistance > 0 || currentWorkoutSteps > 0) {
        // ✅ Правильная формула калорий на основе времени (MET формула)
        // MET (6 для бега, 3.5 для ходьбы, 7 для велосипеда)
        const met = activeWorkout?.type === 'run' ? 6 :
                    activeWorkout?.type === 'walk' ? 3.5 :
                    activeWorkout?.type === 'bike' ? 7 : 5;
        
        const timeHours = elapsedSeconds / 3600;
        const burnedCalories = (met * 3.5 * weight / 200) * elapsedSeconds / 60;
        
        setDistance(calculatedDistance);
        setCalories(burnedCalories);
      }

      lastUpdateTimeRef.current = now;
    }
  }, [totalStepsToday, isPaused, isPedometerAvailable, elapsedSeconds, route]);
  // 👆 ВАЖНО: добавили route в зависимости


  // ✅ ИНИЦИАЛИЗАЦИЯ GPS
  useEffect(() => {
    const initTracking = async () => {
      if (activeWorkout && !isTracking && !isPaused) {
        await startTracking();
        console.log('📍 GPS ТРЕКИНГ ЗАПУЩЕН');
      }
    };
    initTracking();
  }, [activeWorkout, isPaused, isTracking]);

  // ✅ ТАЙМЕР
  useEffect(() => {
    if (!isPaused && activeWorkout) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPaused, activeWorkout]);

  // ✅ УМНАЯ ПРОВЕРКА ЦЕЛИ (ИСПРАВЛЕННАЯ)
  useEffect(() => {
    // Если цели нет или это быстрый старт
    if (!activeWorkout?.goalTitle) {
      return;
    }

    // 1. Берем строку цели (например, "1 min", "5 км")
    const subtitle = activeWorkout.goalSubtitle || '';

    // 2. Просто вытаскиваем первую цифру из строки (решит все проблемы)
    const numberMatch = subtitle.match(/(\d+(?:\.\d+)?)/);
    const numericValue = numberMatch ? parseFloat(numberMatch[1]) : 0;

    // 3. Определяем тип цели (время или дистанция)
    let goalType = activeWorkout.goalType;
    if (!goalType) {
      // Если в модалке тип не передали, определяем по тексту:
      goalType = subtitle.toLowerCase().includes('km') || subtitle.toLowerCase().includes('км') ? 'distance' : 'time';
    }

    let reached = false;

    // 4. Проверяем достижение
    if (goalType === 'time' && numericValue > 0) {
      const targetSeconds = numericValue * 60; // переводим минуты в секунды
      reached = elapsedSeconds >= targetSeconds;
    } else if (goalType === 'distance' && numericValue > 0) {
      reached = distance >= numericValue;
    }

    setIsGoalReached(reached);
  }, [elapsedSeconds, distance, activeWorkout]);



  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handlePause = () => setIsPaused(!isPaused);

  const handleCancel = () => {
    Alert.alert(
      t('cancelWorkoutTitle'),
      t('cancelWorkoutMessage'),
      [
        { text: t('continueText'), style: 'cancel' },
        {
          text: t('cancelBtn'),
          style: 'destructive',
          onPress: async () => {
            if (timerRef.current) clearInterval(timerRef.current);
            await stopTracking();
            cancelWorkout();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleFinish = async () => {
  if (elapsedSeconds < 5) {
    Alert.alert(
      t('shortWorkoutTitle'),
      t('shortWorkoutMessage'),
      [{ text: t('ok') }]
    );
    return;
  }

  // Получаем системный тип из модалки или стора
  const workoutType = activeWorkout?.type || 'run'; // fallback на 'run'
  
  // Ждем остановку трекинга (если включен)
  const finalRoute = await stopTracking();

  console.log('Сохраняем тренировку:', {
    type: workoutType,
    elapsedSeconds,
    distance,
    calories,
    workoutSteps
  });

  // Передаем тип тренировки в finishWorkout!
  finishWorkout({
    durationSeconds: elapsedSeconds,
    distanceKm: distance,
    calories: Math.round(calories),
    steps: workoutSteps,
    route: finalRoute,
    comment: ''
  });

  // Навигация на экран итогов
  navigation.navigate('WorkoutSummary', {
    type: workoutType,
    durationSeconds: elapsedSeconds,
    distanceKm: distance,
    calories: Math.round(calories),
    steps: workoutSteps,
    routeCoordinates: finalRoute,
    colors: colors.textPrimary
  });
};


  if (!activeWorkout) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>

        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={[styles.closeBtn, { backgroundColor: colors.cardBg }]}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={[styles.titleBadge, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t(activeWorkout.type) || activeWorkout.type}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <View style={[
          styles.centerSpace,
          isGoalReached && styles.goalReached // 👈 Подсветка цели
        ]}>
          <Text style={[styles.timerValue, { color: colors.textPrimary }]}>{formatTime(elapsedSeconds)}</Text>
          <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>{t('workoutTimeText')}</Text>

          {(activeWorkout.goalTitle && activeWorkout.goalTitle !== 'Быстрый старт' && activeWorkout.goalTitle !== t('freeWorkout')) && (
            <View style={[styles.goalCard, isGoalReached && styles.goalReachedCard]}>
              <Text style={[styles.goalTitle, { color: colors.primary }]}>{activeWorkout.goalTitle}</Text>
              <Text style={[styles.goalSubtitle, { color: colors.textPrimary }]}>{activeWorkout.goalSubtitle}</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPanel}>
          <View style={[styles.metricsRow, { backgroundColor: colors.cardBg }]}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{distance.toFixed(2)}</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t('distanceAbbr') || 'КМ'}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{Math.round(calories)}</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t('caloriesAbbr') || 'ККАЛ'}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{workoutSteps}</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t('stepsAbbr')}</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlBtn, isPaused ? styles.resumeBtn : { backgroundColor: colors.primary }]}
              onPress={handlePause}
              activeOpacity={0.8}
            >
              {isPaused ? <Play size={40} color="black" fill="black" style={{ marginLeft: 6 }} /> : <Pause size={40} color="black" fill="black" />}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.controlBtn, styles.finishBtn]} onPress={handleFinish} activeOpacity={0.8}>
              <Check size={40} color="white" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  titleBadge: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  headerTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1 },
  centerSpace: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: 20,
    borderRadius: 30,
    marginVertical: 10
  },
  // ФОН ПРИ ДОСТИЖЕНИИ ЦЕЛИ
  goalReached: {
    backgroundColor: 'rgba(50, 215, 75, 0.15)', // Мягкий зеленый
    borderWidth: 1,
    borderColor: 'rgba(50, 215, 75, 0.4)',
  },
  timerValue: { fontSize: 86, fontFamily: 'Inter_800ExtraBold', fontVariant: ['tabular-nums'], marginBottom: 5 },
  timerLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', letterSpacing: 2, marginBottom: 20 },
  goalCard: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(50, 215, 75, 0.3)',
    backgroundColor: 'rgba(50, 215, 75, 0.05)'
  },
  goalReachedCard: {
    backgroundColor: 'rgba(50, 215, 75, 0.3)',
    borderColor: '#32d74b',
  },
  goalTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  goalSubtitle: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  bottomPanel: { paddingHorizontal: 20, paddingBottom: 40 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 24, padding: 25, marginBottom: 30 },
  metricItem: { alignItems: 'center', flex: 1 },
  metricValue: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  metricLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginTop: 4, letterSpacing: 1 },
  divider: { width: 1, height: 40 },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 30 },
  controlBtn: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  resumeBtn: { backgroundColor: '#32d74b' },
  finishBtn: { backgroundColor: '#FF3B30' },
});
