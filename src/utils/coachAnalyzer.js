// src/utils/coachAnalyzer.js
// Анализ данных и генерация рекомендаций персонального тренера

export const analyzeWeeklyStats = (workouts) => {
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weekWorkouts = workouts.filter(w => {
    const workoutDate = new Date(w.date || w.startTime);
    return workoutDate >= oneWeekAgo && workoutDate <= today;
  });

  let totalCalories = 0;
  let totalDistance = 0;
  let totalMinutes = 0;
  let totalSteps = 0;
  let workoutCount = weekWorkouts.length;
  const typeMap = {};

  weekWorkouts.forEach(w => {
    const calories = w.calories || 0;
    const distance = w.distance || 0;
    const duration = w.duration || 0;
    const steps = w.steps || 0;

    totalCalories += calories;
    totalDistance += distance;
    totalMinutes += duration;
    totalSteps += steps;

    const type = w.type || 'Другое';
    typeMap[type] = (typeMap[type] || 0) + 1;
  });

  // Считаем количество кардио и силовых (для анализа по целям)
  const cardioCount = (typeMap['Пробежка'] || 0) + (typeMap['Кардио'] || 0) + (typeMap['Велосипед'] || 0);
  const strengthCount = typeMap['Силовая'] || 0;

  return {
    totalCalories: Math.round(totalCalories),
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalMinutes,
    totalSteps: Math.round(totalSteps),
    workoutCount,
    cardioCount,
    strengthCount,
    typeMap,
    weekWorkouts,
  };
};

export const generateCoachAdvice = (stats, dailyStats, user) => {
  const advices = [];
  const goal = user?.goal || 'maintenance'; 
  
  // ✅ ПРЕВРАЩАЕМ В ЧИСЛА ДЛЯ БЕЗОПАСНОГО СРАВНЕНИЯ
  const targetWeight = user?.targetWeight ? Number(user.targetWeight) : 0;
  const currentWeight = user?.weight ? Number(user.weight) : 0;

  // 1. СОВЕТЫ ПО ЦЕЛИ (Самые приоритетные)
  if (goal === 'lose_weight') {
    if (stats.cardioCount < 2) {
      advices.push({
        type: 'warning',
        title: '🔥 Мало кардио для сброса',
        text: 'Для похудения добавьте минимум 2-3 кардио сессии в неделю (бег, велосипед).',
        priority: 1,
      });
    }
    if (dailyStats.steps < 8000) {
      advices.push({
        type: 'info',
        title: '🚶 Шаги сжигают жир',
        text: 'Старайтесь держать планку от 8 000 до 10 000 шагов в день. Это основа для дефицита калорий.',
        priority: 3,
      });
    }
    // ✅ ИСПРАВЛЕННАЯ ПРОВЕРКА ДЛЯ СБРОСА ВЕСА (Защита от пустых значений)
    if (targetWeight > 0 && currentWeight > 0 && currentWeight <= targetWeight) {
      advices.push({
        type: 'success',
        title: '🏆 Цель достигнута!',
        text: `Вы достигли желаемого веса (${targetWeight} кг). Пора переходить в режим поддержания!`,
        priority: 0,
      });
    }
  } else if (goal === 'gain_muscle') {
    if (stats.strengthCount < 3) {
      advices.push({
        type: 'warning',
        title: '💪 Нужны силовые тренировки',
        text: 'Для набора массы делайте упор на силовые тренировки (минимум 3 раза в неделю), а не на кардио.',
        priority: 1,
      });
    }
    if (stats.totalCalories > 2500 && stats.strengthCount === 0) {
      advices.push({
        type: 'info',
        title: '🥩 Профицит без мышц',
        text: 'Вы тратите много калорий, но без силовых нагрузок масса не будет расти. Идите в зал!',
        priority: 2,
      });
    }
    // ✅ ИСПРАВЛЕННАЯ ПРОВЕРКА ДЛЯ НАБОРА МАССЫ (Защита от пустых значений)
    if (targetWeight > 0 && currentWeight > 0 && currentWeight >= targetWeight) {
      advices.push({
        type: 'success',
        title: '🏆 Цель достигнута!',
        text: `Вы набрали массу до ${targetWeight} кг. Отличная работа!`,
        priority: 0,
      });
    }
  } else { // maintenance
    if (stats.workoutCount >= 3 && dailyStats.steps >= 7000) {
      advices.push({
        type: 'success',
        title: '⚖️ Идеальный баланс',
        text: 'Вы отлично поддерживаете форму! Хорошее сочетание тренировок и активности.',
        priority: 1,
      });
    }
  }

  // 2. ОБЩИЕ СОВЕТЫ (Анализ количества тренировок)
  if (stats.workoutCount === 0) {
    advices.push({
      type: 'warning',
      title: '⚠️ Нет тренировок на этой неделе',
      text: 'Начните с небольшой нагрузки. Даже 20 минут активности сделают вас здоровее!',
      priority: 10,
    });
  } else if (stats.workoutCount < 3 && goal !== 'lose_weight' && goal !== 'gain_muscle') {
    advices.push({
      type: 'info',
      title: '📈 Увеличьте частоту тренировок',
      text: `Сейчас у вас ${stats.workoutCount} тренировки. Рекомендуем 3-4 в неделю.`,
      priority: 8,
    });
  }

  // 3. Анализ калорий
  if (stats.totalCalories < 1000 && goal === 'lose_weight') {
    advices.push({
      type: 'info',
      title: '⚡ Увеличьте интенсивность',
      text: `${stats.totalCalories} ккал за неделю — маловато для активного сброса веса.`,
      priority: 7,
    });
  } else if (stats.totalCalories > 3000) {
    advices.push({
      type: 'success',
      title: '🚀 Мощный расход калорий!',
      text: `Вы сожгли ${stats.totalCalories} ккал за неделю! ${goal === 'gain_muscle' ? 'Не забудьте хорошо поесть для роста мышц.' : 'Отличный вклад в похудение!'}`,
      priority: 4,
    });
  }

  // 4. Анализ шагов (если еще не добавили в блок сброса веса)
  if (dailyStats.steps < 5000 && goal !== 'lose_weight') {
    advices.push({
      type: 'info',
      title: '🚶 Больше ходите!',
      text: 'Даже при наборе массы обычная ходьба полезна для сердца. Старайтесь делать хотя бы 5-7 тысяч шагов.',
      priority: 6,
    });
  } else if (dailyStats.steps > 12000) {
    advices.push({
      type: 'success',
      title: '👣 Лидер по шагам!',
      text: `${dailyStats.steps.toLocaleString('ru-RU')} шагов сегодня — отличная базовая активность!`,
      priority: 5,
    });
  }

  // Сортируем по приоритету (меньше = выше) и возвращаем топ-3 совета
  return advices.sort((a, b) => a.priority - b.priority).slice(0, 3);
};

export const getMotivationalQuote = () => {
  const quotes = [
    '💪 Каждый день без тренировки — это день, потерянный для твоего здоровья.',
    '🔥 Боль временна, слава вечна!',
    '🏃 Легче предотвратить болезнь, чем её лечить.',
    '⚡ Здоровье — это не предмет роскоши, это фундамент счастья.',
    '💯 Ты сильнее, чем думаешь!',
    '🎯 Маленькие шаги приводят к большим переменам.',
    '🌟 Вложи в здоровье — и оно вернёт тебе сотни раз!',
    '🚀 Никогда не поздно начать!',
    '👑 Сегодня ты лучше, чем вчера.',
    '💖 Люби своё тело и оно полюбит тебя.',
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
};

export const getWeeklyProgress = (weekWorkouts) => {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const today = new Date();
  const dailyData = new Array(7).fill(null).map((_, i) => {
    const date = new Date(today.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dayWorkouts = weekWorkouts.filter(
      w => (w.date || w.startTime).startsWith(dateStr)
    );
    const totalCalories = dayWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0);
    return {
      day: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
      date: dateStr,
      calories: totalCalories,
      count: dayWorkouts.length,
    };
  });

  return dailyData;
};

export const getHealthScore = (stats, dailyStats, user) => {
  let score = 0;
  const goal = user?.goal || 'maintenance';

  // 1. Тренировки (Макс 25 баллов)
  if (stats.workoutCount >= 4) score += 25;
  else score += stats.workoutCount * 6;

  // 2. Шаги (Макс 25 баллов)
  let stepsTarget = 7000; 
  if (goal === 'lose_weight') stepsTarget = 10000; 
  if (goal === 'gain_muscle') stepsTarget = 5000; 
  
  const stepsRatio = Math.min(dailyStats.steps / stepsTarget, 1);
  score += stepsRatio * 25;

  // 3. Специфика цели (Макс 30 баллов)
  if (goal === 'lose_weight') {
    const calorieRatio = Math.min(stats.totalCalories / 2500, 1);
    const cardioRatio = Math.min(stats.cardioCount / 3, 1);
    score += (calorieRatio * 15) + (cardioRatio * 15);
  } else if (goal === 'gain_muscle') {
    const strengthRatio = Math.min(stats.strengthCount / 3, 1);
    score += (strengthRatio * 30);
  } else {
    const typeCount = Object.keys(stats.typeMap || {}).length;
    const varietyRatio = Math.min(typeCount / 3, 1);
    const calorieRatio = Math.min(stats.totalCalories / 1500, 1);
    score += (varietyRatio * 15) + (calorieRatio * 15);
  }

  // 4. Длительность активности (Макс 20 баллов)
  const durationTarget = 150; 
  const durationRatio = Math.min(stats.totalMinutes / durationTarget, 1);
  score += durationRatio * 20;

  return Math.round(score);
};

export const getScoreDescription = (score) => {
  if (score >= 90) return { level: 'Чемпион! 🏆', color: '#FFD60A', text: 'Вы в отличной форме!' };
  if (score >= 75) return { level: 'Отлично! 🔥', color: '#32d74b', text: 'Продолжайте в том же духе!' };
  if (score >= 60) return { level: 'Хорошо! 💪', color: '#0A84FF', text: 'Вы на верном пути!' };
  if (score >= 40) return { level: 'Средне 📈', color: '#FF9F0A', text: 'Чуть больше усилий!' };
  return { level: 'Начинаем! 🚀', color: '#FF3B30', text: 'Самое время начать действовать!' };
};
