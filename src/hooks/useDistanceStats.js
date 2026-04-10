// src/hooks/useDistanceStats.js
import { useMemo } from 'react';
import generateFullDayData from '../utils/chartUtils';
import { useWorkoutStore } from '../store/workoutStore';
import { useUserStore } from '../store/userStore';
import { getMetricValue, isToday } from '../utils/statsCalculator';

const DEFAULT_GOAL_DISTANCE = 5; // 5 км в день

export function useDistanceStats() {
  const workouts = useWorkoutStore(s => s.workouts) || [];
  const goalDistance = useUserStore(s => s.user?.goalDistance || DEFAULT_GOAL_DISTANCE);

  return useMemo(() => {
    const todayWorkouts = workouts.filter(w => isToday(w.date));
    
    let totalDist = 0;
    const hoursMap = new Array(24).fill(0);
    let maxDist = 0;

    todayWorkouts.forEach(w => {
      const d = getMetricValue(w.metrics, '📍') || 0;
      totalDist += d;
      
      if (d > maxDist) maxDist = d;

      let h = 12;
      if (w.startTime) {
        h = new Date(w.startTime).getHours();
      }
      if (h >= 0 && h <= 23) {
        hoursMap[h] += d;
      }
    });

    const chartRaw = hoursMap.map((val, i) => ({ 
      value: val, 
      label: i 
    }));
    
    const chartData = generateFullDayData(chartRaw);

    const avgPace = totalDist > 0 ? "5'30\"" : "-";
    const progressPercent = Math.min((totalDist / goalDistance) * 100, 100);

    return {
      totalDist,
      maxDist,
      avgPace,
      chartData,
      progressPercent,
      goalDistance: goalDistance,
    };
  }, [workouts, goalDistance]);
}
