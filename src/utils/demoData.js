// src/utils/demoData.js
// Demo data generator for presentation and testing

export const DEMO_MODE = true;  // 🎮 Переключатель режима демо

const generateDateString = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  // Возвращаем в формате "DD.MM" (например "15.04")
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
};

const generateGPSRoute = (count = 20) => {
  // Генерируем примерный маршрут (не реальные координаты, но реалистичные)
  const baseLatitude = 55.7558;
  const baseLongitude = 37.6173;
  const route = [];
  
  for (let i = 0; i < count; i++) {
    route.push({
      latitude: baseLatitude + (Math.random() - 0.5) * 0.05,
      longitude: baseLongitude + (Math.random() - 0.5) * 0.05,
      timestamp: Date.now() + i * 2000,
    });
  }
  return route;
};

export const demoDemoWorkouts = [
  // ===== МЕСЯЦ 1: Январь (90 дней назад) =====
  {
    id: 'workout-001',
    date: generateDateString(90),
    startTime: '06:30',
    type: 'run',
    duration: 45,
    distance: 7.2,
    calories: 420,
    metrics: [
      { icon: '⏱️', value: '45', unit: 'мин' },
      { icon: '📍', value: '7.2', unit: 'км' },
      { icon: '🔥', value: '420', unit: 'ккал' },
      { icon: '👣', value: '8450', unit: 'шагов' },
    ],
    route: generateGPSRoute(45),
  },
  {
    id: 'workout-002',
    date: generateDateString(88),
    startTime: '18:00',
    type: 'strength',
    duration: 60,
    calories: 380,
    exercises: [
      {
        exerciseId: 'bench-press',
        name: 'Жим лёжа',
        category: 'грудь',
        sets: 4,
        volume: 220,
        completedSets: [
          { reps: 8, weight: 80 },
          { reps: 8, weight: 80 },
          { reps: 6, weight: 85 },
          { reps: 5, weight: 85 },
        ],
      },
      {
        exerciseId: 'squat',
        name: 'Приседания',
        category: 'ноги',
        sets: 4,
        volume: 360,
        completedSets: [
          { reps: 10, weight: 100 },
          { reps: 8, weight: 110 },
          { reps: 6, weight: 120 },
          { reps: 4, weight: 120 },
        ],
      },
    ],
    metrics: [
      { icon: '⏱️', value: '60', unit: 'мин' },
      { icon: '🔥', value: '380', unit: 'ккал' },
      { icon: '💪', value: '580', unit: 'кг' },
    ],
  },
  {
    id: 'workout-003',
    date: generateDateString(85),
    startTime: '07:00',
    type: 'bike',
    duration: 50,
    distance: 15.3,
    calories: 450,
    metrics: [
      { icon: '⏱️', value: '50', unit: 'мин' },
      { icon: '📍', value: '15.3', unit: 'км' },
      { icon: '🔥', value: '450', unit: 'ккал' },
    ],
    route: generateGPSRoute(50),
  },
  {
    id: 'workout-004',
    date: generateDateString(82),
    startTime: '20:00',
    type: 'cardio',
    duration: 35,
    calories: 280,
    metrics: [
      { icon: '⏱️', value: '35', unit: 'мин' },
      { icon: '🔥', value: '280', unit: 'ккал' },
    ],
  },
  {
    id: 'workout-005',
    date: generateDateString(80),
    startTime: '06:45',
    type: 'run',
    duration: 40,
    distance: 6.5,
    calories: 380,
    metrics: [
      { icon: '⏱️', value: '40', unit: 'мин' },
      { icon: '📍', value: '6.5', unit: 'км' },
      { icon: '🔥', value: '380', unit: 'ккал' },
      { icon: '👣', value: '7820', unit: 'шагов' },
    ],
    route: generateGPSRoute(40),
  },

  // ===== МЕСЯЦ 2: Февраль (60 дней назад) =====
  {
    id: 'workout-006',
    date: generateDateString(78),
    startTime: '18:00',
    type: 'strength',
    duration: 65,
    calories: 410,
    exercises: [
      {
        exerciseId: 'deadlift',
        name: 'Становая тяга',
        category: 'спина',
        sets: 5,
        volume: 650,
        completedSets: [
          { reps: 5, weight: 140 },
          { reps: 5, weight: 150 },
          { reps: 3, weight: 160 },
          { reps: 5, weight: 150 },
          { reps: 5, weight: 140 },
        ],
      },
    ],
    metrics: [
      { icon: '⏱️', value: '65', unit: 'мин' },
      { icon: '🔥', value: '410', unit: 'ккал' },
      { icon: '💪', value: '650', unit: 'кг' },
    ],
  },
  {
    id: 'workout-007',
    date: generateDateString(76),
    startTime: '07:00',
    type: 'run',
    duration: 55,
    distance: 8.8,
    calories: 520,
    metrics: [
      { icon: '⏱️', value: '55', unit: 'мин' },
      { icon: '📍', value: '8.8', unit: 'км' },
      { icon: '🔥', value: '520', unit: 'ккал' },
      { icon: '👣', value: '10500', unit: 'шагов' },
    ],
    route: generateGPSRoute(55),
  },
  {
    id: 'workout-008',
    date: generateDateString(73),
    startTime: '06:30',
    type: 'walk',
    duration: 45,
    distance: 3.2,
    calories: 180,
    metrics: [
      { icon: '⏱️', value: '45', unit: 'мин' },
      { icon: '📍', value: '3.2', unit: 'км' },
      { icon: '🔥', value: '180', unit: 'ккал' },
      { icon: '👣', value: '6200', unit: 'шагов' },
    ],
  },
  {
    id: 'workout-009',
    date: generateDateString(70),
    startTime: '19:00',
    type: 'cardio',
    duration: 40,
    calories: 320,
    metrics: [
      { icon: '⏱️', value: '40', unit: 'мин' },
      { icon: '🔥', value: '320', unit: 'ккал' },
    ],
  },
  {
    id: 'workout-010',
    date: generateDateString(68),
    startTime: '07:15',
    type: 'bike',
    duration: 60,
    distance: 18.5,
    calories: 550,
    metrics: [
      { icon: '⏱️', value: '60', unit: 'мин' },
      { icon: '📍', value: '18.5', unit: 'км' },
      { icon: '🔥', value: '550', unit: 'ккал' },
    ],
    route: generateGPSRoute(60),
  },

  // ===== МЕСЯЦ 3: Март (30 дней назад) =====
  {
    id: 'workout-011',
    date: generateDateString(65),
    startTime: '18:00',
    type: 'strength',
    duration: 70,
    calories: 430,
    exercises: [
      {
        exerciseId: 'bench-press',
        name: 'Жим лёжа',
        category: 'грудь',
        sets: 5,
        volume: 300,
        completedSets: [
          { reps: 8, weight: 85 },
          { reps: 8, weight: 85 },
          { reps: 6, weight: 90 },
          { reps: 5, weight: 90 },
          { reps: 3, weight: 95 },
        ],
      },
      {
        exerciseId: 'squat',
        name: 'Приседания',
        category: 'ноги',
        sets: 4,
        volume: 420,
        completedSets: [
          { reps: 10, weight: 110 },
          { reps: 8, weight: 120 },
          { reps: 6, weight: 130 },
          { reps: 4, weight: 130 },
        ],
      },
      {
        exerciseId: 'leg-curl',
        name: 'Сгибание ног',
        category: 'ноги',
        sets: 3,
        volume: 180,
        completedSets: [
          { reps: 10, weight: 80 },
          { reps: 10, weight: 80 },
          { reps: 8, weight: 85 },
        ],
      },
    ],
    metrics: [
      { icon: '⏱️', value: '70', unit: 'мин' },
      { icon: '🔥', value: '430', unit: 'ккал' },
      { icon: '💪', value: '900', unit: 'кг' },
    ],
  },
  {
    id: 'workout-012',
    date: generateDateString(62),
    startTime: '06:45',
    type: 'run',
    duration: 50,
    distance: 8.0,
    calories: 480,
    metrics: [
      { icon: '⏱️', value: '50', unit: 'мин' },
      { icon: '📍', value: '8.0', unit: 'км' },
      { icon: '🔥', value: '480', unit: 'ккал' },
      { icon: '👣', value: '9500', unit: 'шагов' },
    ],
    route: generateGPSRoute(50),
  },
  {
    id: 'workout-013',
    date: generateDateString(59),
    startTime: '20:00',
    type: 'cardio',
    duration: 45,
    calories: 360,
    metrics: [
      { icon: '⏱️', value: '45', unit: 'мин' },
      { icon: '🔥', value: '360', unit: 'ккал' },
    ],
  },
  {
    id: 'workout-014',
    date: generateDateString(56),
    startTime: '07:00',
    type: 'bike',
    duration: 55,
    distance: 16.8,
    calories: 500,
    metrics: [
      { icon: '⏱️', value: '55', unit: 'мин' },
      { icon: '📍', value: '16.8', unit: 'км' },
      { icon: '🔥', value: '500', unit: 'ккал' },
    ],
    route: generateGPSRoute(55),
  },
  {
    id: 'workout-015',
    date: generateDateString(53),
    startTime: '18:30',
    type: 'strength',
    duration: 60,
    calories: 390,
    exercises: [
      {
        exerciseId: 'deadlift',
        name: 'Становая тяга',
        category: 'спина',
        sets: 5,
        volume: 750,
        completedSets: [
          { reps: 5, weight: 150 },
          { reps: 5, weight: 160 },
          { reps: 3, weight: 170 },
          { reps: 5, weight: 160 },
          { reps: 5, weight: 150 },
        ],
      },
    ],
    metrics: [
      { icon: '⏱️', value: '60', unit: 'мин' },
      { icon: '🔥', value: '390', unit: 'ккал' },
      { icon: '💪', value: '750', unit: 'кг' },
    ],
  },

  // ===== ПОСЛЕДНЯЯ НЕДЕЛЯ (для детального отображения) =====
  {
    id: 'workout-016',
    date: generateDateString(7),
    startTime: '06:30',
    type: 'run',
    duration: 45,
    distance: 7.0,
    calories: 410,
    metrics: [
      { icon: '⏱️', value: '45', unit: 'мин' },
      { icon: '📍', value: '7.0', unit: 'км' },
      { icon: '🔥', value: '410', unit: 'ккал' },
      { icon: '👣', value: '8320', unit: 'шагов' },
    ],
    route: generateGPSRoute(45),
  },
  {
    id: 'workout-017',
    date: generateDateString(5),
    startTime: '19:00',
    type: 'strength',
    duration: 65,
    calories: 420,
    exercises: [
      {
        exerciseId: 'bench-press',
        name: 'Жим лёжа',
        category: 'грудь',
        sets: 4,
        volume: 290,
        completedSets: [
          { reps: 8, weight: 88 },
          { reps: 7, weight: 90 },
          { reps: 5, weight: 95 },
          { reps: 4, weight: 95 },
        ],
      },
    ],
    metrics: [
      { icon: '⏱️', value: '65', unit: 'мин' },
      { icon: '🔥', value: '420', unit: 'ккал' },
      { icon: '💪', value: '290', unit: 'кг' },
    ],
  },
  {
    id: 'workout-018',
    date: generateDateString(2),
    startTime: '07:00',
    type: 'bike',
    duration: 50,
    distance: 15.0,
    calories: 450,
    metrics: [
      { icon: '⏱️', value: '50', unit: 'мин' },
      { icon: '📍', value: '15.0', unit: 'км' },
      { icon: '🔥', value: '450', unit: 'ккал' },
    ],
    route: generateGPSRoute(50),
  },
  {
    id: 'workout-019',
    date: generateDateString(1),
    startTime: '06:45',
    type: 'run',
    duration: 40,
    distance: 6.5,
    calories: 380,
    metrics: [
      { icon: '⏱️', value: '40', unit: 'мин' },
      { icon: '📍', value: '6.5', unit: 'км' },
      { icon: '🔥', value: '380', unit: 'ккал' },
      { icon: '👣', value: '7800', unit: 'шагов' },
    ],
    route: generateGPSRoute(40),
  },
  // СЕГОДНЯ
  {
    id: 'workout-020',
    date: generateDateString(0),
    startTime: '18:00',
    type: 'cardio',
    duration: 40,
    calories: 320,
    metrics: [
      { icon: '⏱️', value: '40', unit: 'мин' },
      { icon: '🔥', value: '320', unit: 'ккал' },
    ],
  },
];

// Демо-планы тренировок
export const demoWorkoutPlans = [
  {
    id: 'plan-001',
    name: 'Марафонская подготовка',
    description: 'Интенсивная программа для подготовки к марафону за 12 недель',
    type: 'run',
    duration: 12,
    exercises: [
      { name: 'Длительный забег', distance: 20, frequency: '1x в неделю' },
      { name: 'Интервальная тренировка', distance: 10, frequency: '2x в неделю' },
      { name: 'Восстановительный бег', distance: 8, frequency: '2x в неделю' },
    ],
  },
  {
    id: 'plan-002',
    name: 'Постройка мышц',
    description: 'Силовая программа для набора мышечной массы (PPL сплит)',
    type: 'strength',
    duration: 12,
    exercises: [
      { name: 'Push Day (Грудь, плечи, трицепс)', frequency: '1x в неделю' },
      { name: 'Pull Day (Спина, бицепс)', frequency: '1x в неделю' },
      { name: 'Legs Day (Ноги)', frequency: '1x в неделю' },
    ],
  },
  {
    id: 'plan-003',
    name: 'Похудение через кардио',
    description: 'Комбинированная программа для сжигания жира',
    type: 'cardio',
    duration: 8,
    exercises: [
      { name: 'HIIT тренировка', duration: 30, frequency: '3x в неделю' },
      { name: 'Долгая кардиосессия', duration: 60, frequency: '2x в неделю' },
      { name: 'Восстановительное кардио', duration: 20, frequency: '2x в неделю' },
    ],
  },
];

// Демо-активности за день
export const demoTodayActivities = [
  {
    type: 'steps',
    value: 12450,
    goal: 10000,
    unit: 'шагов',
    timestamp: new Date().toISOString(),
  },
  {
    type: 'distance',
    value: 8.5,
    goal: 0,
    unit: 'км',
    timestamp: new Date().toISOString(),
  },
  {
    type: 'calories',
    value: 2150,
    goal: 2000,
    unit: 'ккал',
    timestamp: new Date().toISOString(),
  },
];

// Демо-пользователь
export const demoUser = {
  name: 'Петр Иванов',
  email: 'petr@example.com',
  gender: 'male',
  weight: 75,
  height: 182,
  age: 28,
  avatar: null,
  goalCalories: 2000,
  goalSteps: 10000,
  goalDistance: 50,
};

export const demoSettings = {
  isDark: true,
  notifications: true,
  language: 'ru',
};
