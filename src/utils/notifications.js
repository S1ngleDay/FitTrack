import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Настройка того, как уведомления ведут себя, когда приложение открыто
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Запрос разрешения у пользователя
export async function requestNotificationPermission() {
    if (!Device.isDevice) {
        console.log('Уведомления работают только на реальном устройстве');
        return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'Notifications',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#32d74b',
        });

        Notifications.setNotificationChannelAsync('reminders', {
            name: 'Workout Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 200, 100, 200],
            lightColor: '#FF9F0A',
        });

        Notifications.setNotificationChannelAsync('achievements', {
            name: 'Achievements',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 100, 100, 100],
            lightColor: '#5AC8FA',
        });
    }

    return finalStatus === 'granted';
}

// Уведомление о напоминании тренировки
export async function scheduleWorkoutReminder(hour = 18) {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const messages = [
        {
            title: "Пора размяться! 💪",
            body: "Твоя цель еще не выполнена. Начни тренировку сейчас!",
        },
        {
            title: "Не забывай о своих целях! 🏃",
            body: "Совсем немного времени, и ты их достигнешь. Поехали!",
        },
        {
            title: "Тебя ждет отличная тренировка! 🔥",
            body: "Даже 5 минут активности - это шаг вперед!",
        },
        {
            title: "Время действовать! ⚡",
            body: "Включи энергию и начни свой фитнес-день!",
        }
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    await Notifications.scheduleNotificationAsync({
        content: {
            ...randomMessage,
            sound: true,
            badge: 1,
        },
        trigger: {
            hour: hour,
            minute: 0,
            repeats: true,
        },
    });
}

// Уведомление о завершенной тренировке
export async function sendWorkoutCompletedNotification(type, calories, time) {
    const messages = [
        `Отлично! Ты сжег ${Math.round(calories)} ккал! 🔥`,
        `Потрясающе! ${time} минут активности - это настоящий прогресс! 💪`,
        `Превосходно! Такая дисциплина приведет к результатам! 🎯`,
        `Ты молод! ${Math.round(calories)} ккал сожжены! 🎉`,
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    return await Notifications.scheduleNotificationAsync({
        content: {
            title: `${type} завершена!`,
            body: randomMessage,
            sound: true,
            badge: 1,
        },
        trigger: null, // Отправить сразу
    });
}

// Уведомление о достижении цели
export async function sendGoalAchievedNotification(goalType, value) {
    const goalMessages = {
        calories: `🎉 Ты достиг цели по калориям! Сожгли ${value} ккал!`,
        steps: `🎉 Превосходно! Сделано ${value} шагов!`,
        distance: `🎉 Отличная дистанция! Прошли ${value} км!`,
        time: `🎉 Аккордеон! Тренировался ${value} минут!`,
    };

    return await Notifications.scheduleNotificationAsync({
        content: {
            title: "Цель достигнута! 🏆",
            body: goalMessages[goalType] || "Отличная работа!",
            sound: true,
            badge: 1,
        },
        trigger: null, // Отправить сразу
    });
}

// Уведомление о длинной серии
export async function sendStreakNotification(days) {
    const streakMessages = [
        `${days} дней подряд! Ты на огне! 🔥`,
        `Серия на ${days} дней! Продолжай так! 💪`,
        `${days} дней без пропусков! Ты - звезда! ⭐`,
    ];

    const randomMessage = streakMessages[Math.floor(Math.random() * streakMessages.length)];

    return await Notifications.scheduleNotificationAsync({
        content: {
            title: "Отличная серия! 🎊",
            body: randomMessage,
            sound: true,
            badge: 1,
        },
        trigger: null, // Отправить сразу
    });
}

// Мотивирующие уведомления
export async function scheduleMotivatinalNotifications() {
    const motivationalMessages = [
        { title: "💡 Совет дня", body: "Регулярность - это ключ к успеху в фитнесе!" },
        { title: "🎯 Не забывай!", body: "Даже малая часть твоего плана - это победа!" },
        { title: "🚀 Вперед!", body: "Каждая тренировка приближает тебя к своим целям!" },
        { title: "💪 Помни!", body: "Боль от тренировки лучше боли сожалений!" },
    ];

    // Расписание на разные дни недели
    const schedule = [
        { day: 1, hour: 7, message: motivationalMessages[0] }, // Понедельник
        { day: 3, hour: 12, message: motivationalMessages[1] }, // Среда
        { day: 5, hour: 18, message: motivationalMessages[2] }, // Пятница
        { day: 7, hour: 19, message: motivationalMessages[3] }, // Воскресенье
    ];

    for (const item of schedule) {
        // Note: Expo Notifications не поддерживает расписание по дням неделе
        // Используем только час и время
        await Notifications.scheduleNotificationAsync({
            content: {
                title: item.message.title,
                body: item.message.body,
                sound: false,
                badge: 1,
            },
            trigger: {
                hour: item.hour,
                minute: 0,
                repeats: true,
            },
        });
    }
}

// Отключение всех уведомлений
export async function cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

// Уведомление для фонового таймера (для Android)
export async function sendTimerNotification(activeWorkout) {
    const elapsedSeconds = activeWorkout?.elapsedSeconds || 0;
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    
    const timeString = hours > 0 
        ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const workoutType = activeWorkout?.type || 'Тренировка';
    
    try {
        await Notifications.presentNotificationAsync({
            content: {
                title: `${workoutType} в процессе ⏱️`,
                body: `Время: ${timeString}`,
                badge: 1,
                sound: false, // Без звука, чтобы не раздражать
                sticky: true, // Закрепить уведомление
                tag: 'workout-timer', // Уникальный тег для обновления одного уведомления
            },
        });
    } catch (err) {
        console.warn('Не удалось отправить уведомление таймера:', err);
    }
}
