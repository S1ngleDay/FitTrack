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

  return {
    totalCalories: Math.round(totalCalories),
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalMinutes,
    totalSteps: Math.round(totalSteps),
    workoutCount,
    typeMap,
    weekWorkouts,
  };
};

export const generateCoachAdvice = (stats, dailyStats) => {
  const advices = [];

  // Анализ количества тренировок
  if (stats.workoutCount === 0) {
    advices.push({
      type: 'warning',
      title: '⚠️ Нет тренировок на этой неделе',
      text: 'Начните с небольшой нагрузки. Даже 20 минут активности сделают вас здоровее!',
      priority: 10,
    });
  } else if (stats.workoutCount < 3) {
    advices.push({
      type: 'info',
      title: '📈 Увеличьте частоту тренировок',
      text: `Сейчас у вас ${stats.workoutCount} тренировки. Рекомендуем 3-4 в неделю для оптимальных результатов.`,
      priority: 8,
    });
  } else if (stats.workoutCount >= 5) {
    advices.push({
      type: 'success',
      title: '🔥 Отличный темп активности!',
      text: `${stats.workoutCount} тренировок — вы на правильном пути! Не забывайте отдыхать.`,
      priority: 2,
    });
  }

  // Анализ калорий
  if (stats.totalCalories < 1000) {
    advices.push({
      type: 'info',
      title: '💪 Увеличьте интенсивность',
      text: `${stats.totalCalories} ккал за неделю — это мало. Попробуйте более интенсивные тренировки.`,
      priority: 7,
    });
  } else if (stats.totalCalories > 3000) {
    advices.push({
      type: 'success',
      title: '🚀 Отличный результат!',
      text: `Вы сожгли ${stats.totalCalories} ккал за неделю. Продолжайте в том же духе!`,
      priority: 2,
    });
  } else {
    advices.push({
      type: 'success',
      title: '✅ Калории в норме',
      text: `${stats.totalCalories} ккал — хороший результат. Это примерно ${Math.round(stats.totalCalories / 7)} ккал в день.`,
      priority: 3,
    });
  }

  // Анализ шагов
  if (dailyStats.steps < 5000) {
    advices.push({
      type: 'warning',
      title: '🚶 Больше ходите!',
      text: 'Даже обычная ходьба полезна. Старайтесь делать минимум 7000-10000 шагов в день.',
      priority: 6,
    });
  } else if (dailyStats.steps > 12000) {
    advices.push({
      type: 'success',
      title: '👣 Лидер по шагам!',
      text: `${dailyStats.steps.toLocaleString('ru-RU')} шагов сегодня — отличная активность!`,
      priority: 2,
    });
  }

  // Анализ разнообразия упражнений
  const typeCount = Object.keys(stats.typeMap).length;
  if (typeCount === 1) {
    advices.push({
      type: 'info',
      title: '🎯 Разнообразьте упражнения',
      text: 'Тренируетесь в одном стиле. Добавьте силовые упражнения или растяжку для баланса.',
      priority: 5,
    });
  } else if (typeCount >= 3) {
    advices.push({
      type: 'success',
      title: '⚡ Хороший баланс тренировок',
      text: 'Вы занимаетесь разными видами тренировок. Это предотвращает скуку и травмы!',
      priority: 2,
    });
  }

  // Анализ расстояния
  if (stats.totalDistance > 0) {
    if (stats.totalDistance < 5) {
      advices.push({
        type: 'info',
        title: '🏃 Бегите дальше',
        text: 'Попробуйте увеличить расстояние на 10-20% каждую неделю.',
        priority: 4,
      });
    } else if (stats.totalDistance > 20) {
      advices.push({
        type: 'success',
        title: '🏆 Дистанция чемпиона',
        text: `${stats.totalDistance} км за неделю — впечатляет! Следите за восстановлением.`,
        priority: 2,
      });
    }
  }

  // Сортируем по приоритету (меньше = выше)
  return advices.sort((a, b) => a.priority - b.priority);
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

export const getHealthScore = (stats, dailyStats) => {
  let score = 0;

  // Максимум 20 баллов за тренировки
  if (stats.workoutCount >= 5) score += 20;
  else score += stats.workoutCount * 4;

  // Максимум 20 баллов за калории
  const calorieTarget = 2500;
  const calorieRatio = Math.min(stats.totalCalories / calorieTarget, 1);
  score += calorieRatio * 20;

  // Максимум 20 баллов за шаги
  const stepsTarget = 70000; // 10000 в день * 7
  const stepsRatio = Math.min(dailyStats.steps / (stepsTarget / 7), 1);
  score += stepsRatio * 20;

  // Максимум 20 баллов за разнообразие
  const typeCount = Object.keys(stats.typeMap || {}).length;
  score += Math.min(typeCount * 5, 20);

  // Максимум 20 баллов за длительность
  const durationTarget = 180; // минут в неделю
  const durationRatio = Math.min(stats.totalMinutes / durationTarget, 1);
  score += durationRatio * 20;

  return Math.round(score);
};

export const getScoreDescription = (score) => {
  if (score >= 90) return { level: 'Чемпион! 🏆', color: '#FFD60A', text: 'Вы в отличной форме!' };
  if (score >= 75) return { level: 'Отлично! 🔥', color: '#32d74b', text: 'Продолжайте в том же духе!' };
  if (score >= 60) return { level: 'Хорошо! 💪', color: '#0A84FF', text: 'Есть ещё куда расти!' };
  if (score >= 40) return { level: 'Средне 📈', color: '#FF9F0A', text: 'Увеличьте нагрузку!' };
  return { level: 'Начинаем! 🚀', color: '#FF3B30', text: 'Пора в путь!' };
};
