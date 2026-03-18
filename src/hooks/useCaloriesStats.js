// src/hooks/useCaloriesStats.js
import { useMemo } from 'react';
import generateFullDayData from '../utils/chartUtils';
import { useWorkoutStore } from '../store/workoutStore';
import { getMetricValue, isToday } from '../utils/statsCalculator';

const CAL_GOAL = 600;

export function useCaloriesStats() {
  const workouts = useWorkoutStore(s => s.workouts) || [];

  return useMemo(() => {
    const todayWorkouts = workouts.filter(w => isToday(w.date));
    
    let totalCal = 0;
    const hoursMap = new Array(24).fill(0);
    
    // Распределение по типам
    let runCal = 0;
    let strengthCal = 0;
    let otherCal = 0;

    todayWorkouts.forEach(w => {
      const c = getMetricValue(w.metrics, '🔥') || 0;
      totalCal += c;
      
      if (w.type === 'Пробежка') runCal += c;
      else if (w.type === 'Силовая') strengthCal += c;
      else otherCal += c;

      if (w.startTime) {
        const h = new Date(w.startTime).getHours();
        hoursMap[h] += c;
      }
    });

    const chartRaw = hoursMap.map((val, i) => ({ 
      value: val, 
      label: `${i}:00` 
    }));
    
    const chartData = generateFullDayData(chartRaw);

    const pieData = [
      { value: runCal || 1, color: '#FF9F0A' }, 
      { value: strengthCal || 1, color: '#FF453A' }, 
      { value: otherCal || 1, color: '#FFD60A' }, 
    ];

    // Дополнительные метрики
    const avgHeartRate = totalCal > 0 ? Math.round(140 * (totalCal / CAL_GOAL)) : 140;
    const intensity = totalCal > 400 ? 'Высокая' : 'Средняя';

    return {
      totalCal,
      runCal,
      strengthCal,
      otherCal,
      chartData,
      pieData,
      avgHeartRate,
      intensity,
      calGoal: CAL_GOAL,
    };
  }, [workouts]);
}
