// src/hooks/usePedometer.js
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Pedometer from 'expo-sensors/build/Pedometer'; // Прямой импорт, иногда решает баги
import AsyncStorage from '@react-native-async-storage/async-storage';

export function usePedometer() {
  const [steps, setSteps] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    let subscription;

    const init = async () => {
      try {
        // 1. Безопасная проверка разрешений
        let hasPermission = true;
        
        // В новых версиях expo-sensors есть requestPermissionsAsync
        if (typeof Pedometer.requestPermissionsAsync === 'function') {
          const { status } = await Pedometer.requestPermissionsAsync();
          hasPermission = status === 'granted';
        } else if (Platform.OS === 'android') {
          // Fallback для старых версий на Android (если метод undefined)
          const { PermissionsAndroid } = require('react-native');
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
          );
          hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        }

        if (!hasPermission) {
          console.warn('Нет прав на шагомер');
          return;
        }

        // 2. Проверка доступности датчика на устройстве
        const available = await Pedometer.isAvailableAsync();
        setIsAvailable(available);
        if (!available) {
          console.warn('Датчик шагомера недоступен на этом устройстве');
          return;
        }

        // 3. Загрузка кеша
        const today = new Date().toISOString().split('T')[0];
        const cached = await AsyncStorage.getItem(`steps_${today}`);
        if (cached) {
          setSteps(parseInt(cached, 10));
        }

        // 4. Подписка на живые обновления
        subscription = Pedometer.watchStepCount((result) => {
          setSteps(result.steps);
          AsyncStorage.setItem(`steps_${today}`, result.steps.toString());
        });
      } catch (error) {
        console.error('Pedometer init error:', error);
      }
    };

    init();

    return () => {
      if (subscription && subscription.remove) {
        subscription.remove();
      }
    };
  }, []);

  return { steps, isAvailable };
}
