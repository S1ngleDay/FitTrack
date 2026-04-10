import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { useWorkoutStore } from '../store/workoutStore';
import { requestNotificationPermission, sendTimerNotification } from './notifications';

// Регистрируем фоновую задачу
const BACKGROUND_TIMER_TASK = 'background-timer-task';

export const registerBackgroundTimer = async () => {
  try {
    // Запрашиваем разрешение на отправку уведомлений
    const permission = await requestNotificationPermission();
    if (!permission) {
      console.log('⚠️ Notification permission not granted');
      return false;
    }

    // Проверяем, зарегистрирована ли задача
    if (TaskManager.isTaskRegisteredAsync(BACKGROUND_TIMER_TASK)) {
      console.log('✅ Background timer task already registered');
      return true;
    }

    // Определяем саму фоновую задачу
    TaskManager.defineTask(BACKGROUND_TIMER_TASK, async () => {
      try {
        const activeWorkout = useWorkoutStore.getState().activeWorkout;
        
        if (activeWorkout) {
          // Здесь происходит обновление времени тренировки
          console.log('⏱️ Background timer running...');
          
          // Периодически обновляем уведомление с текущим временем
          await sendTimerNotification(activeWorkout);
        }
        
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (err) {
        console.error('❌ Background timer error:', err);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    // Регистрируем фоновую выборку
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TIMER_TASK, {
      minimumInterval: 1, // каждую секунду (минимум)
      stopOnTerminate: false, // продолжать даже если приложение закрыто
      startOnBoot: true, // начинать при перезагрузке устройства
    });

    console.log('✅ Background timer registered successfully');
    return true;
  } catch (err) {
    console.error('❌ Failed to register background timer:', err);
    return false;
  }
};

export const unregisterBackgroundTimer = async () => {
  try {
    if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_TIMER_TASK)) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TIMER_TASK);
      console.log('✅ Background timer unregistered');
    }
  } catch (err) {
    console.error('❌ Failed to unregister background timer:', err);
  }
};

export const isBackgroundTimerRegistered = async () => {
  try {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_TIMER_TASK);
  } catch (err) {
    console.error('❌ Error checking background timer status:', err);
    return false;
  }
};
