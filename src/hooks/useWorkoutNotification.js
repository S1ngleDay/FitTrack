import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { sendTimerNotification } from '../utils/notifications';

/**
 * Hook for managing persistent background workout notifications
 * Shows a persistent notification with the current timer value
 * Works even when the app is minimized on Android
 */
export function useWorkoutNotification(activeWorkout, elapsedSeconds) {
  useEffect(() => {
    if (!activeWorkout || elapsedSeconds === undefined) {
      return;
    }

    let notificationInterval;

    const showNotification = async () => {
      try {
        const hours = Math.floor(elapsedSeconds / 3600);
        const minutes = Math.floor((elapsedSeconds % 3600) / 60);
        const seconds = elapsedSeconds % 60;
        
        const timeString = hours > 0 
          ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
          : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        const workoutType = activeWorkout?.type || 'Тренировка';
        
        await Notifications.presentNotificationAsync({
          content: {
            title: `${workoutType} в процессе ⏱️`,
            body: `Время: ${timeString} | Коснитесь, чтобы вернуться`,
            badge: 1,
            sound: false,
            sticky: true,
            tag: 'workout-timer',
            categoryIdentifier: 'workout',
            data: {
              workoutId: activeWorkout?.id,
              type: 'workout-timer',
            },
          },
        });
      } catch (error) {
        console.warn('⚠️ Error updating notification:', error);
      }
    };

    // Показываем уведомление сразу
    showNotification();

    // Обновляем уведомление каждую секунду
    notificationInterval = setInterval(showNotification, 1000);

    return () => {
      if (notificationInterval) {
        clearInterval(notificationInterval);
      }
    };
  }, [activeWorkout, elapsedSeconds]);
}
