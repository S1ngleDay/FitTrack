// src/screens/ActiveRunScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Pause, Play, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { useWorkoutStore } from '../store/workoutStore';
import { useUserStore } from '../store/userStore'; 
import { useRouteTracker } from '../hooks/useRouteTracker'; 
// ✅ ИСПОЛЬЗУЕМ НАШ НОВЫЙ ХУК ВМЕСТО СТАРОГО ФАЙЛА
import { usePedometer } from '../hooks/usePedometer'; 
import colors from '../constants/colors';

export default function ActiveRunScreen() {
  const navigation = useNavigation();
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const cancelWorkout = useWorkoutStore((s) => s.cancelWorkout);
  
  const user = useUserStore((s) => s.user);
  const weight = user?.weight || 80;
  const height = user?.height || 180;

  const { route, isTracking, startTracking, stopTracking } = useRouteTracker();
  
  // ✅ ПОЛУЧАЕМ ШАГИ ИЗ НАШЕГО ХУКА
  const { steps: totalStepsToday, isAvailable: isPedometerAvailable } = usePedometer();

  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Видимые на экране метрики
  const [workoutSteps, setWorkoutSteps] = useState(0); 
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  
  const timerRef = useRef(null);
  
  // Рефы для шагомера и троттлинга
  const initialStepsRef = useRef(null); 
  const lastUpdateTimeRef = useRef(0); // Время последнего обновления экрана

  // БИОМЕТРИЧЕСКИЕ КОНСТАНТЫ
  const isRun = activeWorkout?.type?.includes('Пробежка') || activeWorkout?.type?.includes('Бег');
  
  // Длина шага в метрах
  const stepLengthM = (height * 0.414) / 100;
  
  // Коэффициент сжигания (бег чуть более энергозатратен на км, чем ходьба)
  const efficiencyFactor = isRun ? 1.05 : 1.0; 

  // ✅ ЛОГИКА ПОДСЧЕТА ШАГОВ В ТРЕНИРОВКЕ
  useEffect(() => {
      // Инициализируем начальное количество шагов при старте тренировки
      if (isPedometerAvailable && initialStepsRef.current === null && totalStepsToday > 0) {
          initialStepsRef.current = totalStepsToday;
      }
      
      // Обновляем статистику тренировки, если педометр доступен и не на паузе
      if (isPedometerAvailable && initialStepsRef.current !== null && !isPaused) {
          const currentWorkoutSteps = Math.max(0, totalStepsToday - initialStepsRef.current);
          
           // ТРОТТЛИНГ: Обновляем стейт React не чаще 1 раза в 2 секунды (2000 мс)
           const now = Date.now();
           if (now - lastUpdateTimeRef.current >= 2000) {
             const distanceKm = (currentWorkoutSteps * stepLengthM) / 1000;
             const burnedCalories = weight * distanceKm * efficiencyFactor;
             
             setWorkoutSteps(currentWorkoutSteps);
             setDistance(distanceKm);
             setCalories(burnedCalories);
             
             lastUpdateTimeRef.current = now;
           }
      }
  }, [totalStepsToday, isPaused, isPedometerAvailable]);

  // ИНИЦИАЛИЗАЦИЯ: Старт GPS 
  useEffect(() => {
    const initTracking = async () => {
      if (activeWorkout && !isTracking && !isPaused) {
        await startTracking();
      }
    };
    initTracking();
    
    // Cleanup GPS tracking is handled in stopTracking when finishing/canceling
  }, [activeWorkout, isPaused, isTracking]);


  // ТАЙМЕР (Идет каждую секунду, но не вызывает тяжелых пересчетов)
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

    const finalRoute = await stopTracking();

    navigation.navigate('WorkoutSummaryScreen', { 
       type: activeWorkout?.type || 'Тренировка',
       durationSeconds: elapsedSeconds,
       distanceKm: distance, 
       calories: calories,
       steps: workoutSteps, 
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
                <Text style={styles.metricValue}>{workoutSteps}</Text>
                <Text style={styles.metricLabel}>ШАГИ</Text>
             </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={[styles.controlBtn, isPaused ? styles.resumeBtn : styles.pauseBtn]} onPress={handlePause} activeOpacity={0.8}>
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
