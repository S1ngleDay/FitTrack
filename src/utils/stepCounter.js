import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STEPS_STORAGE_KEY = 'fittrack_steps_today';
const DATE_STORAGE_KEY = 'fittrack_steps_date';
const HOURLY_STORAGE_KEY = 'fittrack_hourly_steps';

// ====== глобальное “единственное” состояние ======

let sharedSteps = 0;
let subscribers = new Set();
let subscription = null;
let nativeStart = null;
let lastTotal = 0;

// ====== вспомогательные методы для хранения ======

const getStoredSteps = async () => {
  try {
    const storedDate = await AsyncStorage.getItem(DATE_STORAGE_KEY);
    const today = new Date().toISOString().split('T')[0];

    if (storedDate !== today) {
      await AsyncStorage.removeItem(STEPS_STORAGE_KEY);
      await AsyncStorage.setItem(DATE_STORAGE_KEY, today);
      return 0;
    }
    

    const steps = await AsyncStorage.getItem(STEPS_STORAGE_KEY);
    return steps ? parseInt(steps, 10) : 0;
  } catch (e) {
    console.error('stepCounter/getStoredSteps', e);
    return 0;
  }
};

const saveStepsToStorage = async (steps) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem(STEPS_STORAGE_KEY, String(steps));
    await AsyncStorage.setItem(DATE_STORAGE_KEY, today);
  } catch (e) {
    console.error('stepCounter/saveStepsToStorage', e);
  }
};

const logHourlyIncrement = async (inc) => {
  try {
    if (inc <= 0) return;
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const hour = now.getHours();

    const raw = await AsyncStorage.getItem(HOURLY_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    if (!all[date]) all[date] = new Array(24).fill(0);

    all[date][hour] += inc;
    await AsyncStorage.setItem(HOURLY_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('stepCounter/logHourlyIncrement', e);
  }
};

export const getHourlyStepsForToday = async () => {
  try {
    const date = new Date().toISOString().split('T')[0];
    const raw = await AsyncStorage.getItem(HOURLY_STORAGE_KEY);
    if (!raw) return new Array(24).fill(0);
    const all = JSON.parse(raw);
    return all[date] || new Array(24).fill(0);
  } catch (e) {
    console.error('stepCounter/getHourlyStepsForToday', e);
    return new Array(24).fill(0);
  }
};

export const resetHourlyLogs = async () => {
  try {
    await AsyncStorage.removeItem(HOURLY_STORAGE_KEY);
  } catch {}
};

// ====== подписка (один экземпляр для всего приложения) ======

const ensureSubscription = async () => {
  if (subscription) return;

  const base = await getStoredSteps();
  sharedSteps = base;
  lastTotal = base;

  subscription = Pedometer.watchStepCount(({ steps: native }) => {
    if (nativeStart === null) nativeStart = native;
    const deltaNative = native - nativeStart;
    if (deltaNative < 0) {
      nativeStart = native; // телефон перезагрузился
      return;
    }

    const total = base + deltaNative;
    const increment = total - lastTotal;
    lastTotal = total;
    sharedSteps = total;

    saveStepsToStorage(total);
    logHourlyIncrement(increment);

    subscribers.forEach(cb => cb(total));
  });
};

export const watchStepCount = (cb) => {
  subscribers.add(cb);
  ensureSubscription();

  return {
    remove: () => subscribers.delete(cb),
  };
};

// API

export const isPedometerAvailable = async () => {
  try {
    return await Pedometer.isAvailableAsync();
  } catch {
    return false;
  }
};

export const requestStepPermissions = async () => {
  try {
    const avail = await isPedometerAvailable();
    return avail;
  } catch {
    return false;
  }
};

export const getStepsForToday = async () => {
  if (subscription) return sharedSteps;
  return await getStoredSteps();
};

export const resetStepCounter = async () => {
  try {
    await AsyncStorage.removeItem(STEPS_STORAGE_KEY);
    await AsyncStorage.removeItem(DATE_STORAGE_KEY);
    sharedSteps = 0;
    lastTotal = 0;
    nativeStart = null;
  } catch {}
};