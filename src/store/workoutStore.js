import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from './userStore';
import { getWeightRecommendation } from '../utils/coachAnalyzer'; // новый импорт

// ----------------- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ -----------------
const getTypeColor = (type) => {
  switch (type) {
    case 'Пробежка': return '#0A84FF';
    case 'Силовая': return '#FF453A';
    case 'Кардио': return '#FFD60A';
    case 'Велосипед': return '#30D158';
    case 'Ходьба': return '#BF5AF2';
    default: return '#8E8E93';
  }
};

const getTypeMET = (type) => {
  switch (type) {
    case 'Пробежка': return 8;
    case 'Силовая': return 5;
    case 'Кардио': return 6;
    case 'Велосипед': return 7;
    case 'Ходьба': return 3.5;
    default: return 5;
  }
};

const calcCalories = (type, minutes) => {
  const user = useUserStore.getState().user;
  const weight = user?.weight || 70;
  const met = getTypeMET(type);
  const durationMin = Number(minutes) || 0;
  if (durationMin <= 0) return 0;
  const kcalPerMin = (met * 3.5 * weight) / 200;
  return Math.round(kcalPerMin * durationMin);
};

const formatShortDate = (date) => date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

// ----------------- КАТАЛОГ УПРАЖНЕНИЙ -----------------
export const EXERCISES_CATALOG = [
  // 🏋️ ГРУДЬ (красная)
  { id: 'bench-press', name: 'Жим лёжа', category: 'грудь' },
  { id: 'incline-bench-press', name: 'Жим под углом', category: 'грудь' },
  { id: 'decline-bench-press', name: 'Жим под отрицл. углом', category: 'грудь' },
  { id: 'dumbbell-fly', name: 'Разводка гантелей', category: 'грудь' },
  { id: 'cable-fly', name: 'Кроссовер', category: 'грудь' },
  
  // 🦵 НОГИ (синяя)
  { id: 'squat', name: 'Приседания со штангой', category: 'ноги' },
  { id: 'leg-press', name: 'Жим ногами', category: 'ноги' },
  { id: 'leg-extension', name: 'Разгибание ног', category: 'ноги' },
  { id: 'leg-curl', name: 'Сгибание ног', category: 'ноги' },
  { id: 'calf-raise', name: 'Подъёмы на икры', category: 'ноги' },
  
  // 🦾 СПИНА (зелёная)
  { id: 'deadlift', name: 'Становая тяга', category: 'спина' },
  { id: 'pull-ups', name: 'Подтягивания', category: 'спина' },
  { id: 'bench-pull', name: 'Тяга штанги в наклоне', category: 'спина' },
  { id: 'lat-pulldown', name: 'Вертикальная тяга', category: 'спина' },
  { id: 'seated-row', name: 'Горизонтальная тяга', category: 'спина' },
  
  // 👆 ПЛЕЧИ (оранжевые)
  { id: 'shoulder-press', name: 'Жим гантелей сидя', category: 'плечи' },
  { id: 'military-press', name: 'Жим стоя', category: 'плечи' },
  { id: 'lateral-raise', name: 'Подъёмы гантелей в стороны', category: 'плечи' },
  { id: 'front-raise', name: 'Подъёмы гантелей вперёд', category: 'плечи' },
  { id: 'rear-delt-fly', name: 'Разведение в наклоне', category: 'плечи' },
  
  // 💪 БИЦЕПС (фиолетовый)
  { id: 'bicep-curl', name: 'Сгибания на бицепс', category: 'бицепс' },
  { id: 'hammer-curl', name: 'Молотковый подъём', category: 'бицепс' },
  { id: 'preacher-curl', name: 'Сгибания на Скотте', category: 'бицепс' },
  { id: 'concentration-curl', name: 'Концентрированные сгибания', category: 'бицепс' },
  
  // 💪 ТРИЦЕПС (розово-красный)
  { id: 'triceps-extension', name: 'Разгибания над головой', category: 'трицепс' },
  { id: 'french-press', name: 'Французский жим', category: 'трицепс' },
  { id: 'triceps-pushdown', name: 'Разгибания на блоке', category: 'трицепс' },
  { id: 'close-grip-bench', name: 'Жим узким хватом', category: 'трицепс' },
  
  // 🏋️ ПРЕСС (жёлтый)
  { id: 'crunch', name: 'Скручивания', category: 'пресс' },
  { id: 'leg-raise', name: 'Подъёмы ног', category: 'пресс' },
  { id: 'plank', name: 'Планка', category: 'пресс' },
  { id: 'russian-twist', name: 'Русский твист', category: 'пресс' },
  { id: 'hanging-leg-raise', name: 'Подъёмы ног в висе', category: 'пресс' },
  
  // 🏋️ ДРУГОЕ (серый)
  { id: 'forearms', name: 'Сгибания на предплечья', category: 'другое' },
  { id: 'hyperextension', name: 'Гиперэкстензия', category: 'другое' },
  { id: 'face-pull', name: 'Тяга к лицу', category: 'другое' },
];


// ----------------- ТЕСТОВЫЕ ДАННЫЕ -----------------
const today = new Date();
const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
const INITIAL_WORKOUTS = [
  // твои текущие тестовые данные...
  {
    id: 'test-1', date: formatShortDate(today), type: 'Пробежка', typeColor: getTypeColor('Пробежка'),
    startTime: today.toISOString(), duration: 45, distance: 5.2, calories: 312, steps: 6543,
    metrics: [{ icon: '👣', value: '6543', unit: 'шагов' }, { icon: '📍', value: '5.2', unit: 'км' }, { icon: '🔥', value: '312', unit: 'ккал' }, { icon: '⏱️', value: '45', unit: 'мин' }],
  },
  // ... остальные test-2, test-3
];

// ----------------- STORE -----------------
export const useWorkoutStore = create(
  persist(
    (set, get) => ({
      workouts: INITIAL_WORKOUTS,
      workoutPlans: [], // 🆕 ПЛАНЫ ТРЕНИРОВОК
      activeWorkout: null,
      isLoading: false,

      // --- КАРДИО (твои текущие) ---
      startWorkout: (type, goalTitle = '', goalSubtitle = '') => {
        const session = { id: Date.now().toString(), type, goalTitle, goalSubtitle, startTime: new Date().toISOString(), endTime: null, durationSeconds: 0, distanceKm: 0, calories: 0, steps: 0 };
        set({ activeWorkout: session });
      },

      updateActiveWorkout: (updates) => set((state) => ({ activeWorkout: state.activeWorkout ? { ...state.activeWorkout, ...updates } : null })),

      finishWorkout: (summaryData) => {
        const active = get().activeWorkout;
        if (!active) return;
        const endTime = new Date().toISOString();
        const durationMin = Math.round((summaryData.durationSeconds || 0) / 60);
        const autoCalories = (summaryData.calories && summaryData.calories > 0) ? Math.round(summaryData.calories) : calcCalories(active.type, durationMin);
        const workoutRecord = {
          id: active.id, comment: summaryData.comment || '', date: formatShortDate(new Date(active.startTime)), type: active.type,
          typeColor: getTypeColor(active.type), startTime: active.startTime, endTime, duration: durationMin, distance: Number(summaryData.distanceKm?.toFixed(2)) || 0,
          calories: autoCalories, steps: summaryData.steps || 0,
          metrics: [{ icon: '⏱️', value: String(durationMin), unit: 'мин' }, { icon: '🔥', value: String(autoCalories), unit: 'ккал' }, { icon: '📍', value: String(summaryData.distanceKm?.toFixed(1) || 0), unit: 'км' }, { icon: '👣', value: String(summaryData.steps || 0), unit: 'шагов' }],
        };
        set((state) => ({ workouts: [workoutRecord, ...state.workouts], activeWorkout: null }));
      },

      addManualWorkout: (formData) => {
        const now = new Date();
        const type = formData.type || 'Тренировка';
        const duration = Number(formData.duration) || 0;
        const calories = (Number(formData.calories) > 0) ? Number(formData.calories) : calcCalories(type, duration);
        const newWorkout = {
          id: Date.now().toString(), date: formatShortDate(now), type, typeColor: getTypeColor(type),
          startTime: now.toISOString(), duration, calories, distance: Number(formData.distance) || 0, steps: 0,
          metrics: [{ icon: '⏱️', value: String(duration), unit: 'мин' }, { icon: '🔥', value: String(calories), unit: 'ккал' }, { icon: '📍', value: String(Number(formData.distance) || 0), unit: 'км' }],
        };
        set((state) => ({ workouts: [newWorkout, ...state.workouts] }));
      },

      // --- СИЛОВЫЕ 🆕 ---
      createWorkoutPlan: (planData) => {
        const plan = { id: `plan-${Date.now()}`, name: planData.name || 'Моя тренировка', description: planData.description || '', exercises: planData.exercises || [], createdAt: new Date().toISOString() };
        set((state) => ({ workoutPlans: [...(state.workoutPlans || []), plan] }));
      },

      getPlans: () => get().workoutPlans || [],

      startWorkoutFromPlan: (planId) => {
        const plans = get().workoutPlans || [];
        const plan = plans.find(p => p.id === planId);
        if (!plan) return;
        const user = useUserStore.getState().user;
        const session = {
          id: `strength-${Date.now()}`, type: 'Силовая', planId, planName: plan.name,
          exercises: plan.exercises.map(ex => ({
            ...ex, completedSets: [], currentSetIndex: 0,
            suggestedWeight: getWeightRecommendation(ex.exerciseId, get().workouts, user.weight).weight
          })),
          currentExerciseIndex: 0, currentSetIndex: 0, totalVolume: 0, startTime: new Date().toISOString(), durationSeconds: 0,
        };
        set({ activeWorkout: session });
      },

      logSet: (reps, weight) => {
        const state = get();
        const workout = state.activeWorkout;
        if (!workout || workout.type !== 'Силовая') return;
        const currentEx = workout.exercises[workout.currentExerciseIndex];
        const newSet = { setIndex: currentEx.currentSetIndex, reps: Number(reps), weight: Number(weight) };
        const updatedEx = { ...currentEx, completedSets: [...currentEx.completedSets, newSet], currentSetIndex: currentEx.currentSetIndex + 1 };
        let nextExIndex = workout.currentExerciseIndex;
        let nextSetIndex = updatedEx.currentSetIndex;
        if (nextSetIndex >= (currentEx.targetSets || 4)) { nextExIndex++; nextSetIndex = 0; }
        set({
          activeWorkout: {
            ...workout, exercises: workout.exercises.map((ex, i) => i === workout.currentExerciseIndex ? updatedEx : ex),
            currentExerciseIndex: nextExIndex, currentSetIndex: nextSetIndex,
          }
        });
      },

      finishStrengthWorkout: (comment = '') => {
        const workout = get().activeWorkout;
        if (!workout || workout.type !== 'Силовая') return;
        const totalVolume = workout.exercises.reduce((sum, ex) => sum + (ex.completedSets.reduce((setSum, set) => setSum + (set.reps * set.weight), 0) || 0), 0);
        const calculatedMin = Math.round((workout.durationSeconds || 0) / 60);
const durationMin = calculatedMin > 0 ? calculatedMin : (workout.durationSeconds > 0 ? 1 : 0);
        const calories = calcCalories('Силовая', durationMin);
        const strengthRecord = {
          id: workout.id, type: 'Силовая', typeColor: getTypeColor('Силовая'), planName: workout.planName,
          date: formatShortDate(new Date(workout.startTime)), startTime: workout.startTime, endTime: new Date().toISOString(),
          duration: durationMin, calories, totalVolume: Math.round(totalVolume),
          exercises: workout.exercises.map(ex => ({
            name: EXERCISES_CATALOG.find(e => e.id === ex.exerciseId)?.name || ex.exerciseId,
            sets: ex.completedSets.length, volume: ex.completedSets.reduce((sum, s) => sum + s.reps * s.weight, 0),
          })),
          comment, metrics: [
            { icon: '⚡', value: String(Math.round(totalVolume)), unit: 'кг' },
            { icon: '⏱️', value: String(durationMin), unit: 'мин' },
            { icon: '🔥', value: String(calories), unit: 'ккал' },
            { icon: '📊', value: workout.exercises.length, unit: 'упр' },
          ],
        };
        set((state) => ({ workouts: [strengthRecord, ...state.workouts], activeWorkout: null }));
      },

      // --- ОБЩИЕ ---
      cancelWorkout: () => set({ activeWorkout: null }),
      deleteWorkout: (id) => set((state) => ({ workouts: state.workouts.filter((w) => w.id !== id) })),
      clearAll: () => set({ workouts: [] }),
    }),
    {
      name: 'workout-storage-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ workouts: state.workouts, workoutPlans: state.workoutPlans }),
    }
  )
);
