// src/hooks/useCaloriesStats.js
import { useMemo } from 'react';
import generateFullDayData from '../utils/chartUtils';
import { useWorkoutStore } from '../store/workoutStore';
import { useUserStore } from '../store/userStore';
import { getMetricValue, isToday } from '../utils/statsCalculator';

const DEFAULT_CAL_GOAL = 2000;

export function useCaloriesStats() {
  const workouts = useWorkoutStore(s => s.workouts) || [];
  const goalCalories = useUserStore(s => s.user?.goalCalories || DEFAULT_CAL_GOAL);

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
      
      if (w.type === 'run') runCal += c;
      else if (w.type === 'strength') strengthCal += c;
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

    // Интенсивность на основе процента от цели
    const intensityPercent = (totalCal / goalCalories) * 100;
    let intensity = 'Низкая';
    if (intensityPercent >= 100) intensity = 'Высокая';
    else if (intensityPercent >= 60) intensity = 'Средняя';

    return {
      totalCal,
      runCal,
      strengthCal,
      otherCal,
      chartData,
      pieData,
      intensity,
      calGoal: goalCalories,
      progressPercent: Math.min((totalCal / goalCalories) * 100, 100),
    };
  }, [workouts, goalCalories]);
}
