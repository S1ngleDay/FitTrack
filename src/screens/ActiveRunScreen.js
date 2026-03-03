import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { X, Pause, Play, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useWorkoutStore } from '../store/workoutStore';
import colors from '../constants/colors';

export default function ActiveRunScreen() {
  const navigation = useNavigation();
  
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const cancelWorkout = useWorkoutStore((s) => s.cancelWorkout);
  // finishWorkout нам тут больше не нужен, мы его вызовем на экране Summary

  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Моковые данные (симуляция)
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [steps, setSteps] = useState(0);
  
  const timerRef = useRef(null);

  // Если нет активной тренировки — вернуться назад
  useEffect(() => {
    if (!activeWorkout) {
      console.log('⚠️ ActiveRunScreen: нет активной тренировки');
    }
  }, [activeWorkout]);

  // ТАЙМЕР
  useEffect(() => {
    if (!isPaused && activeWorkout) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const newSeconds = prev + 1;
          
          // Симуляция метрик
          if (activeWorkout.type === 'Пробежка' && newSeconds % 10 === 0) {
            setDistance((d) => d + 0.1); 
            setCalories((c) => c + 5);
            setSteps((s) => s + 50);
          }
          
          return newSeconds;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, activeWorkout]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleCancel = () => {
    Alert.alert(
      'Отменить тренировку?',
      'Данные не будут сохранены',
      [
        { text: 'Продолжить', style: 'cancel' },
        {
          text: 'Отменить',
          style: 'destructive',
          onPress: () => {
            if (timerRef.current) clearInterval(timerRef.current);
            cancelWorkout();
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Home'); 
          },
        },
      ]
    );
  };

  // ✅ ИСПРАВЛЕННАЯ ФУНКЦИЯ ЗАВЕРШЕНИЯ
  // Теперь она ведет на экран Summary для ввода комментария
  const handleFinish = () => {
    if (elapsedSeconds < 5) { // Уменьшил лимит для тестов
      Alert.alert('Слишком короткая тренировка', 'Минимальная длительность — 5 секунд');
      return;
    }

    // 1. Ставим на паузу
    setIsPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);

    console.log('🏁 Переход к Summary...');

    // 2. Переходим на экран Summary и передаем данные
    navigation.navigate('WorkoutSummary', {
       type: activeWorkout?.type || 'Тренировка',
       durationSeconds: elapsedSeconds,
       distanceKm: distance,
       calories: calories,
       steps: steps,
    });
  };

  if (!activeWorkout) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
            <X size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{activeWorkout.type}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Цель */}
        {(activeWorkout.goalTitle && activeWorkout.goalTitle !== 'Быстрый старт') && (
          <View style={styles.goalCard}>
            <Text style={styles.goalTitle}>{activeWorkout.goalTitle}</Text>
            <Text style={styles.goalSubtitle}>{activeWorkout.goalSubtitle}</Text>
          </View>
        )}

        {/* Таймер */}
        <View style={styles.timerContainer}>
           <Text style={styles.timerValue}>{formatTime(elapsedSeconds)}</Text>
           <Text style={styles.timerLabel}>ВРЕМЯ</Text>
        </View>

        {/* Метрики (Сетка 2x2 или ряд) */}
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
              <Text style={styles.metricValue}>{steps}</Text>
              <Text style={styles.metricLabel}>ШАГИ</Text>
           </View>
        </View>

        {/* Кнопки управления */}
        <View style={styles.controls}>
          {/* Пауза/Плей */}
          <TouchableOpacity 
            style={[styles.controlBtn, isPaused ? styles.resumeBtn : styles.pauseBtn]} 
            onPress={handlePause}
            activeOpacity={0.8}
          >
            {isPaused ? (
              <Play size={36} color="black" fill="black" style={{ marginLeft: 4 }} />
            ) : (
              <Pause size={36} color="black" fill="black" />
            )}
          </TouchableOpacity>

          {/* Завершить (показываем кнопку завершения всегда или только на паузе — на твой вкус) */}
          <TouchableOpacity 
            style={[styles.controlBtn, styles.finishBtn]} 
            onPress={handleFinish}
            activeOpacity={0.8}
          >
            <Check size={36} color="white" strokeWidth={3} />
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'black' },
  container: { flex: 1, paddingHorizontal: 20, justifyContent: 'space-between', paddingBottom: 40 },
  
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10
  },
  closeBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: 'white', fontSize: 18, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase' },

  goalCard: {
    backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 16, alignItems: 'center', marginTop: 20
  },
  goalTitle: { color: colors.primary, fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  goalSubtitle: { color: '#8E8E93', fontSize: 14, fontFamily: 'Inter_500Medium' },

  timerContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  timerValue: { color: 'white', fontSize: 80, fontFamily: 'Inter_700Bold', fontVariant: ['tabular-nums'] },
  timerLabel: { color: '#8E8E93', fontSize: 14, fontFamily: 'Inter_600SemiBold', marginTop: -10, letterSpacing: 2 },

  metricsRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1C1C1E', borderRadius: 24, padding: 25, marginBottom: 40
  },
  metricItem: { alignItems: 'center', flex: 1 },
  metricValue: { color: 'white', fontSize: 24, fontFamily: 'Inter_700Bold' },
  metricLabel: { color: '#8E8E93', fontSize: 12, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
  divider: { width: 1, height: 40, backgroundColor: '#3A3A3C' },

  controls: { flexDirection: 'row', justifyContent: 'center', gap: 30, alignItems: 'center' },
  controlBtn: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5,
  },
  pauseBtn: { backgroundColor: colors.primary }, // Желтый/Зеленый
  resumeBtn: { backgroundColor: '#32d74b' },  // Зеленый для продолжения
  finishBtn: { backgroundColor: '#FF3B30' },   // Красный для финиша
});
