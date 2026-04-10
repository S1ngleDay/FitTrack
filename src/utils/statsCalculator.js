// src/utils/statsCalculator.js

// Парсинг даты "13.02" в объект Date (текущий год)
export const parseWorkoutDate = (dateString, timeString) => {
  if (!dateString && !timeString) return new Date();
  
  // Если это timestamp (число или ISO строка)
  if (typeof dateString === 'number' || (typeof dateString === 'string' && dateString.includes('T'))) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) return date;
  }
  
  // Если это формат "DD.MM"
  if (typeof dateString === 'string' && dateString.includes('.')) {
    const [day, month] = dateString.split('.').map(Number);
    const year = new Date().getFullYear();
    return new Date(year, month - 1, day);
  }
  
  return new Date();
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
    // Ищем метрики по emoji иконкам
    steps += getMetricValue(w.metrics, '👣') || 0;
    distance += getMetricValue(w.metrics, '📍') || 0;
    calories += getMetricValue(w.metrics, '🔥') || 0;
    duration += getMetricValue(w.metrics, '⏱️') || 0;
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
