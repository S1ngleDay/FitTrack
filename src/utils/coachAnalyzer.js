// src/utils/coachAnalyzer.js
// Weight recommendation algorithm for strength training

export const getWeightRecommendation = (exerciseId, pastWorkouts, userWeight = 70) => {
  // Based on maxWeight from past workouts
  const exerciseHistory = pastWorkouts
    .filter(w => w.type === 'strength' && w.exercises)
    .map(w => {
      const ex = w.exercises.find(e => e.exerciseId === exerciseId);
      return ex ? { date: w.date, maxWeight: Math.max(...(ex.completedSets || []).map(s => s.weight || 0)) || 0 } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  if (exerciseHistory.length === 0) {
    const starterWeight = Math.round(userWeight * 0.5);
    return { weight: starterWeight, advice: `Начните с ${starterWeight}кг`, confidence: 'low' };
  }

  const lastMaxWeight = exerciseHistory[0].maxWeight;
  const suggested = lastMaxWeight > 0 ? Math.round(lastMaxWeight * 1.05) : 40;

  return {
    weight: Math.max(suggested, 20),
    advice: `Прошлый max: ${lastMaxWeight}кг → ${suggested}кг`,
    confidence: lastMaxWeight > 0 ? 'medium' : 'low'
  };
};

export const analyzeExerciseProgress = (exerciseId, workouts) => {
  const history = workouts
    .filter(w => w.type === 'strength' && w.exercises)
    .map(w => {
      const ex = w.exercises.find(e => e.exerciseId === exerciseId);
      return ex ? {
        date: w.date,
        maxWeight: ex.sets > 0 ? (ex.volume / (ex.sets * 10)) : 0, // Примерный вес
        volume: ex.volume || 0
      } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (history.length < 2) return { trend: 'no-data', weightProgress: 0, sessions: history.length };

  const first = history[history.length - 1]; // Самая старая
  const last = history[0]; // Последняя
  const weightProgress = first.maxWeight > 0 ? ((last.maxWeight - first.maxWeight) / first.maxWeight * 100) : 0;

  return {
    trend: weightProgress > 5 ? 'up' : weightProgress < -5 ? 'down' : 'stable',
    weightProgress: Math.round(weightProgress),
    volumeProgress: Math.round(((last.volume - first.volume) / first.volume * 100) || 0),
    sessions: history.length,
  };
};

// src/utils/coachAnalyzer.js
import { parseWorkoutDate } from './statsCalculator'; // 👈 ДОБАВИТЬ ЭТОТ ИМПОРТ В НАЧАЛО ФАЙЛА

export const getExerciseChartData = (exerciseName, workouts, startDate) => {
  if (!workouts || !Array.isArray(workouts)) return [];

  const rawData = workouts
    .filter(w => {
      if (w.type !== 'strength' || !Array.isArray(w.exercises)) return false;
      
      // ✅ ИСПОЛЬЗУЕМ ТВОЙ ПАРСЕР ДАТ
      const wDate = parseWorkoutDate(w.date || w.startTime); 
      
      wDate.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      return wDate >= start;
    })
    .map(w => {
      const ex = w.exercises.find(e => {
        const nameMatch = e.name && e.name.toLowerCase() === exerciseName.toLowerCase();
        const idMatch = e.exerciseId && e.exerciseId.toLowerCase() === exerciseName.toLowerCase();
        return nameMatch || idMatch;
      });

      if (!ex) return null;
      
      let maxWeightForSession = 0;
      if (ex.completedSets && Array.isArray(ex.completedSets) && ex.completedSets.length > 0) {
        maxWeightForSession = Math.max(...ex.completedSets.map(s => Number(s.weight) || 0));
      } else if (ex.volume && ex.sets) {
        maxWeightForSession = Math.round(ex.volume / (ex.sets * 10));
      }

      if (maxWeightForSession <= 0) return null;

      // ✅ Получаем дату для подписи через парсер
      const parsedDateObj = parseWorkoutDate(w.date || w.startTime);
      const parsedDateLabel = parsedDateObj.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

      return {
        date: parsedDateLabel,
        value: maxWeightForSession,
      };
    })
    .filter(Boolean);

  // Сортировка
  return rawData.sort((a, b) => {
    const [dayA, monthA] = a.date.split('.');
    const [dayB, monthB] = b.date.split('.');
    const dateA = new Date(new Date().getFullYear(), parseInt(monthA) - 1, parseInt(dayA));
    const dateB = new Date(new Date().getFullYear(), parseInt(monthB) - 1, parseInt(dayB));
    return dateA - dateB;
  });
};
