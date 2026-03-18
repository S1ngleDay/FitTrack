// src/hooks/useDistanceStats.js
import { useMemo } from 'react';
import generateFullDayData from '../utils/chartUtils';
import { useWorkoutStore } from '../store/workoutStore';
import { getMetricValue, isToday } from '../utils/statsCalculator';

const GOAL_DISTANCE = 12.3;

export function useDistanceStats() {
  const workouts = useWorkoutStore(s => s.workouts) || [];

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
    const progressPercent = Math.min((totalDist / GOAL_DISTANCE) * 100, 100);

    return {
      totalDist,
      maxDist,
      avgPace,
      chartData,
      progressPercent,
      goalDistance: GOAL_DISTANCE,
    };
  }, [workouts]);
}
