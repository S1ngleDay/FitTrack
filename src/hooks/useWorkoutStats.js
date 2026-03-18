// src/hooks/useWorkoutStats.js
import { useMemo } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { getMetricValue, isToday } from '../utils/statsCalculator';
import generateFullDayData from '../utils/chartUtils';

/**
 * Хук useWorkoutStats
 * Возвращает полностью подготовленные данные для TimeDetailsScreen:
 * - totalMin, h, m
 * - streak
 * - chartRaw (24 часа)
 * - chartData (для DetailsChart)
 * - heatmapData (последние 28 дней)
 */
export function useWorkoutStats() {
  const workouts = useWorkoutStore(s => s.workouts);

  // Если данных нет, возвращаем null (защита от белого экрана)
  if (!workouts) return null;

  return useMemo(() => {
    // --- 1. Статистика за сегодня ---
    const todayWorkouts = workouts.filter(w => isToday(w.date));

    let totalMin = 0;
    const hoursMap = new Array(24).fill(0);

    todayWorkouts.forEach(w => {
      const duration = getMetricValue(w.metrics, '⏱️');
      totalMin += duration;

      const hour = w.startTime ? new Date(w.startTime).getHours() : 12;
      if (hour >= 0 && hour <= 23) hoursMap[hour] += duration;
    });

    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;

    const chartRaw = hoursMap.map((val, i) => ({ value: val, label: `${i}:00` }));
    const chartData = generateFullDayData(chartRaw);

    // --- 2. Стрик ---
    let streak = 0;
    let checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      const hasWorkout = workouts.some(w => w.date === dateStr);

      if (hasWorkout) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        const isCheckToday = checkDate.toDateString() === new Date().toDateString();
        if (isCheckToday && streak === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }

    // --- 3. Heatmap (28 дней) ---
    const heatmapData = [];
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 27);

    for (let i = 0; i < 28; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      const dayWorkouts = workouts.filter(w => w.date === dateStr);

      if (dayWorkouts.length === 0) {
        heatmapData.push(0); // ⬛ Нет активности
      } else {
        let dayMins = 0;
        dayWorkouts.forEach(w => dayMins += getMetricValue(w.metrics, '⏱️'));
        heatmapData.push(dayMins > 45 ? 2 : 1);
      }
    }

    return {
      totalMin,
      h,
      m,
      streak,
      chartRaw: chartData,
      heatmapData,
    };
  }, [workouts]);
}