// userStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useUserStore = create(
  persist(
    (set) => ({
      user: {
        name: 'Петр Иванов',
        email: 'petr.ivanov@example.com',
        gender: 'male', // 'male' | 'female'
        weight: 75, // кг
        height: 180, // см
        age: 28,
        avatar: null, // URI картинки (пока заглушка)
      },

      updateUser: (updates) => set((state) => ({
        user: { ...state.user, ...updates }
      })),

      // Настройки приложения (можно тоже тут хранить)
      settings: {
        isDark: true,
        notifications: true,
        language: 'Русский',
      },

      toggleSetting: (key) => set((state) => ({
        settings: { ...state.settings, [key]: !state.settings[key] }
      })),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
