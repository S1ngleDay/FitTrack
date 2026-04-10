// useRouteTracker.js
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TRACKING_TASK = 'BACKGROUND_LOCATION_TASK';
let globalRoute = []; // Глобальный массив, чтобы не терять данные в фоне

TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Ошибка фонового трекинга GPS:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const newCoords = locations.map(loc => ({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      timestamp: loc.timestamp,
    }));
    globalRoute = [...globalRoute, ...newCoords];
  }
});

export function useRouteTracker() {
  const [route, setRoute] = useState([]);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    let interval;
    if (isTracking) {
      interval = setInterval(() => {
        setRoute([...globalRoute]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const startTracking = async () => {
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      alert('Нет доступа к GPS');
      return;
    }

    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== 'granted') {
      alert('Для записи маршрута при заблокированном экране нужен фоновый доступ');
      return;
    }

    globalRoute = [];
    setRoute([]);
    setIsTracking(true);

    await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 2000,
      distanceInterval: 5,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Тренировка идет',
        notificationBody: 'Записываем ваш маршрут',
      }
    });
  };

  const stopTracking = async () => {
    setIsTracking(false);
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING_TASK);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
    }
    return globalRoute; 
  };

  return { route, isTracking, startTracking, stopTracking };
}
