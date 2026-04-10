import { useMemo } from 'react';
import generateFullDayData from '../utils/chartUtils';
import { useWorkoutStore } from '../store/workoutStore';
import { useUserStore } from '../store/userStore';
import { getMetricValue, isToday } from '../utils/statsCalculator';
import { usePedometer } from './usePedometer';

const DEFAULT_STEP_GOAL = 10000;

export function useStepsStats() {
  const workouts = useWorkoutStore(s => s.workouts) || [];
  const goalSteps = useUserStore(s => s.user?.goalSteps || DEFAULT_STEP_GOAL);
  const { steps: sensorSteps, isAvailable } = usePedometer();

  return useMemo(() => {
    // Только дистанция/калории из тренировок
    const todayWorkouts = workouts.filter(w => isToday(w.date));
    let distance = 0, calories = 0;
    
    todayWorkouts.forEach(w => {
      distance += getMetricValue(w.metrics, '📍') || 0;
      calories += getMetricValue(w.metrics, '🔥') || 0;
    });

    // ✅ ШАГИ ТОЛЬКО ИЗ PEDOMETER
    const finalSteps = sensorSteps;

    // Простой график (симуляция)
    const hourly = new Array(24).fill(Math.floor(finalSteps / 24));
    const now = new Date().getHours();
    hourly[now] += finalSteps % 24; // остаток в текущий час

    const chartData = generateFullDayData(hourly.map((v, i) => ({ value: v, label: i })));
    
    const remaining = Math.max(0, goalSteps - finalSteps);
    const pieData = [
      { value: finalSteps || 1, color: '#32d74b' },
      { value: remaining, color: '#2C2C2E' },
    ];

    return {
      steps: finalSteps,
      distance,
      calories,
      chartData,
      pieData,
      stepGoal: goalSteps,
      isLoading: !isAvailable,
    };
  }, [workouts, goalSteps, sensorSteps, isAvailable]);
}
