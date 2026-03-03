import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from './userStore';

// ----------------- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ -----------------

// Цвет по типу тренировки
const getTypeColor = (type) => {
  switch (type) {
    case 'Пробежка': return '#0A84FF'; // синий
    case 'Силовая': return '#FF453A';  // красный
    case 'Кардио': return '#FFD60A';   // жёлтый
    case 'Велосипед': return '#30D158'; // зелёный
    case 'Ходьба': return '#BF5AF2';    // фиолетовый
    default: return '#8E8E93';          // серый
  }
};

// Примерные MET для типов тренировки
const getTypeMET = (type) => {
  switch (type) {
    case 'Пробежка': return 8;   // бег среднего темпа
    case 'Силовая': return 5;   // умеренная силовая
    case 'Кардио': return 6;   // общее кардио
    case 'Велосипед': return 7;   // умеренный вело
    case 'Ходьба': return 3.5; // быстрая ходьба
    default: return 5;
  }
};

// Расчет калорий: kcal = MET * 3.5 * вес(кг) / 200 * минуты
const calcCalories = (type, minutes) => {
  // Безопасно получаем вес из userStore (или 70 кг по умолчанию)
  const user = useUserStore.getState().user;
  const weight = user?.weight || 70; 
  
  const met = getTypeMET(type);
  const durationMin = Number(minutes) || 0;
  
  if (durationMin <= 0) return 0;

  const kcalPerMin = (met * 3.5 * weight) / 200;
  return Math.round(kcalPerMin * durationMin);
};

// Форматируем дату как "DD.MM"
const formatShortDate = (date) =>
  date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

// ----------------- ТЕСТОВЫЕ ДАННЫЕ (ОБНОВЛЯЕМЫЕ ДАТЫ) -----------------
const today = new Date();
const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
const twoDaysAgo = new Date(); twoDaysAgo.setDate(today.getDate() - 2);

const INITIAL_WORKOUTS = [
  {
    id: 'test-1',
    date: formatShortDate(today),
    type: 'Пробежка',
    typeColor: getTypeColor('Пробежка'),
    startTime: today.toISOString(),
    duration: 45,
    distance: 5.2,
    calories: 312,
    steps: 6543,
    metrics: [
      { icon: '👣', value: '6543', unit: 'шагов' },
      { icon: '📍', value: '5.2', unit: 'км' },
      { icon: '🔥', value: '312', unit: 'ккал' },
      { icon: '⏱️', value: '45', unit: 'мин' },
    ],
  },
  {
    id: 'test-2',
    date: formatShortDate(today),
    type: 'Силовая',
    typeColor: getTypeColor('Силовая'),
    startTime: new Date(today.getTime() - 1000 * 60 * 60 * 3).toISOString(),
    duration: 60,
    distance: 1.1,
    calories: 425,
    steps: 1823,
    metrics: [
      { icon: '👣', value: '1823', unit: 'шагов' },
      { icon: '📍', value: '1.1', unit: 'км' },
      { icon: '🔥', value: '425', unit: 'ккал' },
      { icon: '⏱️', value: '60', unit: 'мин' },
    ],
  },
  {
    id: 'test-3',
    date: formatShortDate(yesterday),
    type: 'Кардио',
    typeColor: getTypeColor('Кардио'),
    startTime: yesterday.toISOString(),
    duration: 30,
    distance: 3.0,
    calories: 198,
    steps: 4066,
    metrics: [
      { icon: '👣', value: '4066', unit: 'шагов' },
      { icon: '📍', value: '3.0', unit: 'км' },
      { icon: '🔥', value: '198', unit: 'ккал' },
      { icon: '⏱️', value: '30', unit: 'мин' },
    ],
  }
];

// ----------------- STORE -----------------

export const useWorkoutStore = create(
  persist(
    (set, get) => ({
      workouts: INITIAL_WORKOUTS,
      activeWorkout: null,
      isLoading: false,

      // --- МЕТОДЫ ---

      startWorkout: (type, goalTitle = '', goalSubtitle = '') => {
        const session = {
          id: Date.now().toString(),
          type,
          goalTitle,
          goalSubtitle,
          startTime: new Date().toISOString(),
          endTime: null,
          durationSeconds: 0,
          distanceKm: 0,
          calories: 0,
          steps: 0,
        };
        set({ activeWorkout: session });
      },

      updateActiveWorkout: (updates) => {
        set((state) => ({
          activeWorkout: state.activeWorkout
            ? { ...state.activeWorkout, ...updates }
            : null,
        }));
      },

      // ЗАВЕРШЕНИЕ ТРЕНИРОВКИ (АВТО-РАСЧЕТ)
      finishWorkout: (summaryData) => {
        const active = get().activeWorkout;
        if (!active) return;

        const endTime = new Date().toISOString();
        const durationMin = Math.round((summaryData.durationSeconds || 0) / 60);

        // Если трекер прислал калории > 0, берем их. Иначе считаем по формуле.
        const autoCalories = (summaryData.calories && summaryData.calories > 0)
            ? Math.round(summaryData.calories)
            : calcCalories(active.type, durationMin);

        const distanceKm = typeof summaryData.distanceKm === 'number'
            ? Number(summaryData.distanceKm.toFixed(2))
            : 0;

        const stepsVal = summaryData.steps || 0;

        const workoutRecord = {
          id: active.id,
          comment: summaryData.comment || '',
          date: formatShortDate(new Date(active.startTime)),
          type: active.type,
          typeColor: getTypeColor(active.type), // Правильный цвет
          startTime: active.startTime,
          endTime,

          // Данные в корень для статистики
          duration: durationMin,
          distance: distanceKm,
          calories: autoCalories,
          steps: stepsVal,

          metrics: [
            { icon: '⏱️', value: String(durationMin), unit: 'мин' },
            { icon: '🔥', value: String(autoCalories), unit: 'ккал' },
            { icon: '📍', value: String(distanceKm), unit: 'км' },
            { icon: '👣', value: String(stepsVal), unit: 'шагов' },
          ],
        };

        set((state) => ({
          workouts: [workoutRecord, ...state.workouts],
          activeWorkout: null,
        }));
      },

      cancelWorkout: () => set({ activeWorkout: null }),

      // РУЧНОЕ ДОБАВЛЕНИЕ (АВТО-РАСЧЕТ)
      addManualWorkout: (formData) => {
        const now = new Date();
        const dateStr = formatShortDate(now);

        const type = formData.type || 'Тренировка';
        const duration = Number(formData.duration) || 0;
        const distance = Number(formData.distance) || 0;

        // Если пользователь ввел калории вручную, берем их. 
        // Если нет (0 или пусто), считаем автоматически.
        const manualCalories = Number(formData.calories);
        const calories = (manualCalories > 0) 
            ? manualCalories 
            : calcCalories(type, duration);

        const newWorkout = {
          id: Date.now().toString(),
          date: dateStr,
          type,
          typeColor: getTypeColor(type), // Правильный цвет
          startTime: now.toISOString(),

          duration,
          calories,
          distance,
          steps: 0,

          metrics: [
            { icon: '⏱️', value: String(duration), unit: 'мин' },
            { icon: '🔥', value: String(calories), unit: 'ккал' },
            { icon: '📍', value: String(distance), unit: 'км' },
          ],
        };

        set((state) => ({
          workouts: [newWorkout, ...state.workouts],
        }));
      },

      deleteWorkout: (id) =>
        set((state) => ({
          workouts: state.workouts.filter((w) => w.id !== id),
        })),

      clearAll: () => set({ workouts: [] }),
    }),
    {
      name: 'workout-storage-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ workouts: state.workouts }),
    }
  )
);
