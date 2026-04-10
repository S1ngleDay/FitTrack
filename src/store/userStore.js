import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Выносим дефолтное состояние отдельно
const initialState = {
  user: {
    name: '', // Было 'Петр Иванов'
    email: '',
    gender: 'male',
    weight: '',
    height: '',
    age: '',
    avatar: null,
    // Goals for daily targets
    goalCalories: 2000, // Default daily calorie target
    goalSteps: 10000,   // Default daily steps target
    goalDistance: 0,    // Default daily distance target (km)
  },
  settings: {
    isDark: true,
    notifications: true,
    language: 'Русский', // или 'ru', смотря что ты используешь
  }
};

export const useUserStore = create(
  persist(
    (set) => ({
      ...initialState, // 2. Разворачиваем начальное состояние

      updateUser: (updates) => set((state) => ({
        user: { ...state.user, ...updates }
      })),

      toggleSetting: (key, value) => set((state) => ({
        settings: {
          ...state.settings,
          [key]: value !== undefined ? value : !state.settings[key]
        }
      })),

      // 3. ДОБАВЛЯЕМ МЕТОД ОЧИСТКИ
      clearUser: () => set(initialState),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
