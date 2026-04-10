// src/hooks/useDemoDataInit.js
// Hook for initializing demo data in development mode

import { useEffect } from 'react';
import { DEMO_MODE, demoDemoWorkouts, demoWorkoutPlans, demoUser, demoSettings } from '../utils/demoData';
import { useWorkoutStore } from '../store/workoutStore';
import { useUserStore } from '../store/userStore';

export function useDemoDataInit() {
  useEffect(() => {
    if (!DEMO_MODE) {
      console.log('🎮 Demo mode is OFF');
      return;
    }

    console.log('🎮 Demo mode is ON - Initializing demo data...');

    // Инициализируем демо-пользователя
    const initUser = useUserStore.getState().updateUser;
    initUser(demoUser);

    const toggleSetting = useUserStore.getState().toggleSetting;
    toggleSetting('isDark', demoSettings.isDark);
    toggleSetting('notifications', demoSettings.notifications);
    useUserStore.getState().updateUser({ language: demoSettings.language });

    // Инициализируем демо-тренировки
    const addMultipleWorkouts = useWorkoutStore.getState().addMultipleWorkouts;
    if (addMultipleWorkouts) {
      addMultipleWorkouts(demoDemoWorkouts);
      console.log(`✅ Loaded ${demoDemoWorkouts.length} demo workouts`);
    }

    // Если есть функция для планов
    const setWorkoutPlans = useWorkoutStore.getState().setWorkoutPlans;
    if (setWorkoutPlans) {
      setWorkoutPlans(demoWorkoutPlans);
      console.log(`✅ Loaded ${demoWorkoutPlans.length} demo plans`);
    }

    console.log('🎮 Demo data initialization complete!');
  }, []);
}
