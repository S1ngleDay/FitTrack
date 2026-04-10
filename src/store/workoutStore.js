// workoutStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from './userStore';
import { getWeightRecommendation } from '../utils/coachAnalyzer'; // новый импорт
import { parseWorkoutDate } from '../utils/statsCalculator'; // для сортировки

// ----------------- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ -----------------

// 1. Функция нормализации (приводит любое слово к системному ключу)
export const getSystemType = (type) => {
  if (!type) return 'cardio';
  const normalized = type.toLowerCase().trim();

  if (normalized === 'силовая' || normalized === 'strength') return 'strength';
  if (normalized === 'бег' || normalized === 'run') return 'run';
  if (normalized === 'ходьба' || normalized === 'walk') return 'walk';
  if (normalized === 'велосипед' || normalized === 'bicycle' || normalized === 'bike') return 'bike';

  return 'cardio'; // Запасной вариант
};

// 2. Функция цвета (теперь опирается только на системный ключ)
export const getTypeColor = (type) => {
  const systemType = getSystemType(type);

  switch (systemType) {
    case 'strength': return '#FF3B30'; // Красный для силовых
    case 'run': return '#34C759';      // Зеленый для бега
    case 'walk': return '#007AFF';     // Синий для ходьбы
    case 'bike': return '#FF2D55';     // Красный для велосипеда
    case 'cardio': return '#FF9F0A';   // Оранжевый для кардио
    default: return '#8E8E93';         // Серый (для неизвестных типов)
  }
};

const getTypeMET = (type) => {
  if (!type) return 5;
  const t = type.toLowerCase();

  if (t === 'run') return 8;
  if (t === 'strength') return 5;
  if (t === 'cardio') return 6;
  if (t === 'bike') return 7;
  if (t === 'walk') return 3.5;

  return 5;
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

const normalizeWorkout = (workout) => {
  const type = workout.type || 'run';
  const duration = Number(workout.duration) || 0;
  const distance = Number(workout.distance) || 0;
  const calories = Number(workout.calories) || 0;
  const steps = Number(workout.steps) || 0;
  const totalVolume = Number(workout.totalVolume) || 0;

  // Восстанавливаем metrics для старых импортированных бэкапов
  let metrics = workout.metrics;
  if (!metrics || metrics.length === 0) {
    if (type === 'strength') {
      metrics = [
        { icon: '⏱️', value: String(duration), unit: 'мин' },
        { icon: '🔥', value: String(calories), unit: 'ккал' },
        { icon: '💪', value: String(totalVolume), unit: 'кг' },
      ];
    } else {
      metrics = [
        { icon: '⏱️', value: String(duration), unit: 'мин' },
        { icon: '🔥', value: String(calories), unit: 'ккал' },
        { icon: '📍', value: String(distance), unit: 'км' }
      ];
      if (steps > 0) metrics.push({ icon: '👣', value: String(steps), unit: 'шагов' });
    }
  }

  return {
    ...workout,
    id: workout.id || `workout-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    type,
    // Всегда вычисляем актуальный цвет (полезно, если вы поменяли палитру в приложении)
    typeColor: getTypeColor(type),
    // Гарантируем, что дата в формате "ДД.ММ.ГГГГ" для группировки/вывода
    date: workout.date || formatShortDate(new Date(workout.startTime || Date.now())),
    startTime: workout.startTime || new Date().toISOString(),
    duration,
    distance,
    calories,
    steps,
    totalVolume,
    metrics
  };
};

const generateMetrics = (workout) => {
  const isStrength = workout.type === 'strength';
  const duration = String(workout.duration || Math.round(workout.durationSeconds / 60) || 0);
  const calories = String(workout.calories || 0);

  // Базовые метрики для ЛЮБОЙ тренировки (Время и Калории)
  const baseMetrics = [
    { icon: '⏱️', value: duration, unit: 'мин' },
    { icon: '🔥', value: calories, unit: 'ккал' }
  ];

  if (isStrength) {
    // Метрики для силовых
    const totalVolume = workout.totalVolume || 0;
    return [
      ...baseMetrics,
      { icon: '💪', value: String(totalVolume), unit: 'кг' }
    ];
  } else {
    // Метрики для кардио (Бег, Вело, Ходьба и т.д.)
    const distance = (workout.distance || workout.distanceKm || 0).toFixed(2);
    const steps = workout.steps || 0;
    const cardioMetrics = [
      ...baseMetrics,
      { icon: '📍', value: String(distance), unit: 'км' }
    ];
    if (steps > 0) {
      cardioMetrics.push({ icon: '👣', value: String(steps), unit: 'шагов' });
    }
    return cardioMetrics;
  }
};


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
        const isStrength = type === 'strength';

        const session = {
          id: Date.now().toString(),
          type,
          goalTitle,
          goalSubtitle,
          startTime: new Date().toISOString(),
          endTime: null,
          durationSeconds: 0,
          calories: 0,
          // Если силовая — закладываем силовые поля, иначе — кардио
          ...(isStrength ? {
            exercises: [],
            currentExerciseIndex: 0,
            currentSetIndex: 0,
            totalVolume: 0
          } : {
            distanceKm: 0,
            steps: 0
          })
        };

        set({ activeWorkout: session });
      },


      updateActiveWorkout: (updates) => set((state) => ({ activeWorkout: state.activeWorkout ? { ...state.activeWorkout, ...updates } : null })),

      finishWorkout: (summaryData) => {
        const active = get().activeWorkout;
        if (!active) return;
        const endTime = new Date().toISOString();
        const durationMin = Math.round((summaryData.durationSeconds || 0) / 60);
        const autoCalories = (summaryData.calories && summaryData.calories > 0) ? Math.round(summaryData.calories) : calcCalories(active.type, durationMin);
        
        // Обработка упражнений для силовых тренировок
        let processedExercises = [];
        let totalVolume = 0;
        if (active.type === 'strength' && active.exercises) {
          processedExercises = active.exercises.map(ex => {
            const volume = ex.completedSets ? ex.completedSets.reduce((sum, s) => sum + ((Number(s.weight) || 0) * (Number(s.reps) || 0)), 0) : 0;
            totalVolume += volume;
            return {
              exerciseId: ex.exerciseId,
              name: ex.name || EXERCISES_CATALOG.find(e => e.id === ex.exerciseId)?.name || 'Неизвестное упражнение',
              sets: ex.completedSets ? ex.completedSets.length : 0,
              volume: volume,
              completedSets: ex.completedSets || []
            };
          });
        }
        
        const workoutRecord = normalizeWorkout({
          id: active.id, 
          comment: summaryData.comment || '', 
          date: formatShortDate(new Date(active.startTime)), 
          type: active.type,
          typeColor: getTypeColor(active.type), 
          startTime: active.startTime, 
          endTime, 
          duration: durationMin, 
          distance: Number(summaryData.distanceKm?.toFixed(2)) || 0,
          calories: autoCalories, 
          steps: summaryData.steps || 0,
          totalVolume: totalVolume,
          exercises: processedExercises
        });
        workoutRecord.metrics = generateMetrics(workoutRecord);
        set((state) => ({ workouts: [workoutRecord, ...state.workouts], activeWorkout: null }));
      },

      addManualWorkout: (formData) => {
  const normalizedType = (formData.type ?? 'run').toLowerCase();
  const durationMin = Number(formData.duration ?? 0);
  
  // Рассчитываем калории
  const autoCalories = calcCalories(normalizedType, durationMin);
  
  // Обработка упражнений для силовых тренировок
  let processedExercises = [];
  if (normalizedType === 'strength' && formData.exercises && formData.exercises.length > 0) {
    processedExercises = formData.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      name: ex.name || EXERCISES_CATALOG.find(e => e.id === ex.exerciseId)?.name || 'Неизвестное упражнение',
      sets: ex.completedSets ? ex.completedSets.length : 0,
      volume: ex.completedSets ? ex.completedSets.reduce((sum, s) => {
        const w = Number(s.weight) || 0;
        const r = Number(s.reps) || 0;
        return sum + (w * r);
      }, 0) : 0,
      completedSets: ex.completedSets || []
    }));
  }

  const newWorkout = normalizeWorkout({
    id: 'manual-' + Date.now(),
    type: normalizedType,
    startTime: formData.date
      ? new Date(formData.date).toISOString()
      : new Date().toISOString(),
    duration: durationMin,
    distance: Number(formData.distance ?? 0),
    calories: Number(formData.calories ?? 0) || autoCalories,
    steps: Number(formData.steps ?? 0),
    totalVolume: Number(formData.totalVolume ?? 0),
    exercises: processedExercises,
    planName: formData.planName || '',
  });

  newWorkout.metrics = generateMetrics(newWorkout);

  set((state) => ({
    workouts: [newWorkout, ...state.workouts],
  }));
},




      updateWorkout: (id, updates) =>
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        })),

      // --- СИЛОВЫЕ 🆕 ---
      createWorkoutPlan: (planData) => {
        const plan = { id: `plan-${Date.now()}`, name: planData.name || 'Моя тренировка', description: planData.description || '', exercises: planData.exercises || [], createdAt: new Date().toISOString() };
        set((state) => ({ workoutPlans: [...(state.workoutPlans || []), plan] }));
      },

      updateWorkoutPlan: (id, updates) => set((state) => ({
        workoutPlans: state.workoutPlans.map(p =>
          p.id === id ? { ...p, ...updates } : p
        )
      })),

      deleteWorkoutPlan: (id) => set((state) => ({
        workoutPlans: state.workoutPlans.filter(p => p.id !== id)
      })),

      getPlans: () => get().workoutPlans || [],

      startWorkoutFromPlan: (planId) => {
        const plans = get().workoutPlans || [];
        const plan = plans.find(p => p.id === planId);
        if (!plan) return;
        const user = useUserStore.getState().user;
        const session = {
          id: `strength-${Date.now()}`, type: 'strength', planId, planName: plan.name,
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
        if (!workout || workout.type !== 'strength') return;
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
        if (!workout || workout.type !== 'strength') return;
        const totalVolume = workout.exercises.reduce((sum, ex) => sum + (ex.completedSets.reduce((setSum, set) => setSum + (set.reps * set.weight), 0) || 0), 0);
        const calculatedMin = Math.round((workout.durationSeconds || 0) / 60);
        const durationMin = calculatedMin > 0 ? calculatedMin : (workout.durationSeconds > 0 ? 1 : 0);
        const calories = calcCalories('strength', durationMin);
        const strengthRecord = normalizeWorkout({
          id: workout.id, type: 'strength', typeColor: getTypeColor('strength'), planName: workout.planName,
          date: formatShortDate(new Date(workout.startTime)), startTime: workout.startTime, endTime: new Date().toISOString(),
          duration: durationMin, calories, totalVolume: Math.round(totalVolume),
          exercises: workout.exercises.map(ex => ({
            name: EXERCISES_CATALOG.find(e => e.id === ex.exerciseId)?.name || ex.exerciseId,
            sets: ex.completedSets.length, volume: ex.completedSets.reduce((sum, s) => sum + s.reps * s.weight, 0),
          })),
          comment,
        });
        strengthRecord.metrics = generateMetrics(strengthRecord);
        set((state) => ({ workouts: [strengthRecord, ...state.workouts], activeWorkout: null }));
      },

      // --- ОБЩИЕ ---
      cancelWorkout: () => set({ activeWorkout: null }),
      deleteWorkout: (id) => set((state) => ({ workouts: state.workouts.filter((w) => w.id !== id) })),
      clearAll: () => set({
        workouts: [],
        workoutPlans: [],
        activeWorkout: null
      }),
      importWorkouts: (importedWorkouts, mode = 'merge') => set((state) => {
        // Нормализуем каждую загруженную тренировку
        const normalizedImport = importedWorkouts.map(normalizeWorkout);

        if (mode === 'replace') {
          return { workouts: normalizedImport };
        }

        const existingIds = new Set(state.workouts.map(w => w.id));
        const newWorkouts = normalizedImport.filter(w => !existingIds.has(w.id));

        return { workouts: [...newWorkouts, ...state.workouts] };
      }),

      // 🎮 ДЕМО РЕЖИМ — функции для загрузки демо-данных
      addMultipleWorkouts: (workouts) => set((state) => {
        const normalizedWorkouts = workouts.map(normalizeWorkout);
        // Избегаем дублирования: удаляем старые версии демо-тренировок перед добавлением новых
        const demoIds = normalizedWorkouts.map(w => w.id);
        const existingNonDemo = state.workouts.filter(w => !demoIds.includes(w.id));
        // Сортируем новые первыми (по дате)
        const sorted = [...normalizedWorkouts, ...existingNonDemo].sort((a, b) => {
          const dateA = parseWorkoutDate(a.date || a.startTime);
          const dateB = parseWorkoutDate(b.date || b.startTime);
          return dateB.getTime() - dateA.getTime();
        });
        return { workouts: sorted };
      }),

      setWorkoutPlans: (plans) => set({ workoutPlans: plans }),

    }),
    {
      name: 'workout-storage-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ workouts: state.workouts, workoutPlans: state.workoutPlans }),
    }
  )
);
