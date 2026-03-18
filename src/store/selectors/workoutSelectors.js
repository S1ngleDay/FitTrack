// src/store/selectors/workoutSelectors.js

export const selectWorkoutStats = (workouts) => {
  const workoutDates = new Set();
  const hoursMap = new Array(24).fill(0);

  let totalMin = 0;

  // 🔹 один проход (вместо 5)
  workouts.forEach(w => {
    const duration = Number(
      w.metrics?.find(m => m.icon === '⏱️')?.value || 0
    );

    totalMin += duration;
    workoutDates.add(w.date);

    const hour = w.startTime
      ? new Date(w.startTime).getHours()
      : 12;

    hoursMap[hour] += duration;
  });

  // 🔹 chart
  const chartRaw = hoursMap.map((val, i) => ({
    value: val,
    label: `${i}:00`,
  }));

  // 🔹 streak (через Set — быстро)
  let streak = 0;
  let checkDate = new Date();

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    });

    if (workoutDates.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    totalMin,
    hours: Math.floor(totalMin / 60),
    minutes: totalMin % 60,
    streak,
    chartRaw,
    workoutDates,
  };
};

export const selectHeatmap = (workoutDates) => {
  const days = [];
  const today = new Date();

  const startDate = new Date();
  startDate.setDate(today.getDate() - 27);

  for (let i = 0; i < 28; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);

    const dateStr = d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    });

    if (!workoutDates.has(dateStr)) {
      days.push(0);
    } else {
      days.push(1); // можно усложнить позже
    }
  }

  return days;
};