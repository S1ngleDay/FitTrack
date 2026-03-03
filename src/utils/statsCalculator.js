// src/utils/statsCalculator.js

// Парсинг даты "13.02" в объект Date (текущий год)
export const parseWorkoutDate = (dateString) => {
  if (!dateString) return new Date();
  const [day, month] = dateString.split('.').map(Number);
  const year = new Date().getFullYear();
  return new Date(year, month - 1, day);
};

// Проверка на сегодня
export const isToday = (dateString) => {
  const d = parseWorkoutDate(dateString);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

// ✅ ГЛАВНОЕ: Экспортируем эту функцию
export const getMetricValue = (metrics, icon) => {
  if (!metrics) return 0;
  const metric = metrics.find(m => m.icon === icon);
  // Убираем пробелы, запятые (если есть), парсим float
  if (metric) {
    const val = parseFloat(String(metric.value).replace(',', '.').replace(/\s/g, ''));
    return isNaN(val) ? 0 : val;
  }
  return 0;
};

// Расчет статистики за день
export const getDailyStats = (workouts) => {
  const todayWorkouts = workouts.filter(w => isToday(w.date));
  let steps = 0;
  let distance = 0;
  let calories = 0;
  let duration = 0;

  todayWorkouts.forEach(w => {
    steps += getMetricValue(w.metrics, '👣');
    distance += getMetricValue(w.metrics, '📍');
    calories += getMetricValue(w.metrics, '🔥');
    duration += getMetricValue(w.metrics, '⏱️');
  });

  return {
    steps: Math.round(steps),
    distance: parseFloat(distance.toFixed(1)),
    calories: Math.round(calories),
    duration: Math.round(duration),
  };
};

// Прогресс (0..1)
export const calculateProgress = (current, goal) => {
  if (!goal) return 0;
  return Math.max(0, Math.min(current / goal, 1));
};
