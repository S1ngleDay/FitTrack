import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Pause, Play, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { useWorkoutStore } from '../store/workoutStore';
import { useUserStore } from '../store/userStore'; 
import { useRouteTracker } from '../hooks/useRouteTracker'; 

// 🔥 Импортируем твой шагомер
import { watchStepCount, requestStepPermissions, getStepsForToday } from '../utils/stepCounter'; // Убедись, что путь к файлу верный

import colors from '../constants/colors';

export default function ActiveRunScreen() {
  const navigation = useNavigation();
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const cancelWorkout = useWorkoutStore((s) => s.cancelWorkout);
  
  const user = useUserStore((s) => s.user);
  const weight = user?.weight || 80;
  const height = user?.height || 180;
  const age = user?.age || 25;
  const gender = user?.gender || 'male';

  const { route, isTracking, startTracking, stopTracking } = useRouteTracker();

  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Метрики тренировки
  const [workoutSteps, setWorkoutSteps] = useState(0); 
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  
  const timerRef = useRef(null);
  
  // Рефы для шагомера
  const initialStepsRef = useRef(null); // Сколько шагов было на старте
  const stepSubscriptionRef = useRef(null); // Подписка на сенсор

  // ✅ БИОМЕТРИЧЕСКИЕ РАСЧЕТЫ
  const isRun = activeWorkout?.type?.includes('Пробежка') || activeWorkout?.type?.includes('Бег');

  // Длина шага (в метрах)
  const stepLengthMeters = gender === 'male' ? (height * 0.415) / 100 : (height * 0.413) / 100;
  
  // Расчет BMR по Миффлину-Сан Жеору
  let bmr = 0;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  // Базовые калории в секунду (для пассивного сжигания, когда стоим)
  const baseCaloriesPerSecond = bmr / 24 / 3600;

  // ИНИЦИАЛИЗАЦИЯ: Старт GPS и Шагомера
  useEffect(() => {
    const initTracking = async () => {
      if (activeWorkout && !isTracking && !isPaused) {
        // 1. Запускаем GPS
        await startTracking();
        
        // 2. Запрашиваем права на шагомер
        const isPedometerReady = await requestStepPermissions();
        
        if (isPedometerReady) {
          // Запоминаем шаги, которые уже были пройдены за день
          const currentTotal = await getStepsForToday();
          initialStepsRef.current = currentTotal;

          // Подписываемся на обновления
          stepSubscriptionRef.current = watchStepCount((totalStepsToday) => {
            if (!isPaused) {
              // Шаги за эту тренировку = Всего за сегодня - Шаги на старте
              const currentWorkoutSteps = totalStepsToday - (initialStepsRef.current || totalStepsToday);
              setWorkoutSteps(currentWorkoutSteps);

              // 📊 Пересчитываем дистанцию (в километрах)
              const newDistanceKm = (currentWorkoutSteps * stepLengthMeters) / 1000;
              setDistance(newDistanceKm);
            }
          });
        } else {
          Alert.alert("Шагомер недоступен", "Ваше устройство не поддерживает подсчет шагов или вы не дали разрешение.");
        }
      }
    };

    initTracking();

    return () => {
      // Отписываемся от шагомера при уходе с экрана
      if (stepSubscriptionRef.current) {
        stepSubscriptionRef.current.remove();
      }
    };
  }, [activeWorkout]); // Внимание: убрал isTracking/isPaused из зависимостей, чтобы не пересоздавать подписку

  // ТАЙМЕР И КАЛОРИИ
  useEffect(() => {
    if (!isPaused && activeWorkout) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        
        // Калории считаем гибридно:
        // Базовые калории (горят всегда) + Калории за движение (на основе шагов/мин)
        // Если шагов нет, горит только база. Если идем/бежим - добавляется MET
        setCalories((prevCal) => {
           // Примитивный расчет интенсивности: если бег, сжигаем больше
           const metValue = isRun ? 9.8 : 3.8; 
           // Мы добавляем "активные" калории каждую секунду тренировки
           return prevCal + (baseCaloriesPerSecond * metValue);
        });

      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isPaused, activeWorkout]);

  // Форматирование времени
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
      'Отменить тренировку?',
      'Данные не будут сохранены',
      [
        { text: 'Продолжить', style: 'cancel' },
        {
          text: 'Отменить',
          style: 'destructive',
          onPress: async () => {
            if (timerRef.current) clearInterval(timerRef.current);
            await stopTracking(); 
            if (stepSubscriptionRef.current) stepSubscriptionRef.current.remove();
            cancelWorkout();
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Home'); 
          },
        },
      ]
    );
  };

  const handleFinish = async () => {
    if (elapsedSeconds < 5) {
      Alert.alert('Слишком короткая тренировка', 'Минимальная длительность — 5 секунд');
      return;
    }

    setIsPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (stepSubscriptionRef.current) stepSubscriptionRef.current.remove();

    const finalRoute = await stopTracking();

    navigation.navigate('WorkoutSummary', { 
       type: activeWorkout?.type || 'Тренировка',
       durationSeconds: elapsedSeconds,
       distanceKm: distance, 
       calories: calories,
       steps: workoutSteps, // Передаем РЕАЛЬНЫЕ шаги
       routeCoordinates: finalRoute 
    });
  };

  if (!activeWorkout) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
            <X size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.titleBadge}>
            <Text style={styles.headerTitle}>{activeWorkout.type}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.centerSpace}>
           <Text style={styles.timerValue}>{formatTime(elapsedSeconds)}</Text>
           <Text style={styles.timerLabel}>ВРЕМЯ ТРЕНИРОВКИ</Text>
           
           {(activeWorkout.goalTitle && activeWorkout.goalTitle !== 'Быстрый старт') && (
             <View style={styles.goalCard}>
               <Text style={styles.goalTitle}>{activeWorkout.goalTitle}</Text>
               <Text style={styles.goalSubtitle}>{activeWorkout.goalSubtitle}</Text>
             </View>
           )}
        </View>

        <View style={styles.bottomPanel}>
          <View style={styles.metricsRow}>
             <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{distance.toFixed(2)}</Text>
                <Text style={styles.metricLabel}>КМ</Text>
             </View>
             <View style={styles.divider} />
             <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{Math.round(calories)}</Text>
                <Text style={styles.metricLabel}>ККАЛ</Text>
             </View>
             <View style={styles.divider} />
             <View style={styles.metricItem}>
                {/* Показываем реальные шаги датчика */}
                <Text style={styles.metricValue}>{workoutSteps}</Text>
                <Text style={styles.metricLabel}>ШАГИ</Text>
             </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity 
              style={[styles.controlBtn, isPaused ? styles.resumeBtn : styles.pauseBtn]} 
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

// ... стили остаются такие же, как в прошлом сообщении
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background || '#000' },
  container: { flex: 1, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' },
  titleBadge: { backgroundColor: '#1C1C1E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  headerTitle: { color: 'white', fontSize: 14, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1 },
  centerSpace: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  timerValue: { color: 'white', fontSize: 86, fontFamily: 'Inter_800ExtraBold', fontVariant: ['tabular-nums'], marginBottom: 5 },
  timerLabel: { color: '#8E8E93', fontSize: 14, fontFamily: 'Inter_600SemiBold', letterSpacing: 2, marginBottom: 20 },
  goalCard: { backgroundColor: 'rgba(50, 215, 75, 0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(50, 215, 75, 0.3)' },
  goalTitle: { color: '#32d74b', fontSize: 14, fontFamily: 'Inter_700Bold' },
  goalSubtitle: { color: 'white', fontSize: 12, fontFamily: 'Inter_500Medium' },
  bottomPanel: { paddingHorizontal: 20, paddingBottom: 40 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 24, padding: 25, marginBottom: 30 },
  metricItem: { alignItems: 'center', flex: 1 },
  metricValue: { color: 'white', fontSize: 28, fontFamily: 'Inter_700Bold' },
  metricLabel: { color: '#8E8E93', fontSize: 12, fontFamily: 'Inter_600SemiBold', marginTop: 4, letterSpacing: 1 },
  divider: { width: 1, height: 40, backgroundColor: '#2C2C2E' },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 30 },
  controlBtn: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  pauseBtn: { backgroundColor: colors.primary || '#CCFF00' }, 
  resumeBtn: { backgroundColor: '#32d74b' },  
  finishBtn: { backgroundColor: '#FF3B30' },   
});
