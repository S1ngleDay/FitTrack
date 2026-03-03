import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@workouts_repository';

export const workoutsRepository = {
  async getAll() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const workouts = data ? JSON.parse(data) : [];
      console.log('📋 Repository: getAll вызван, тренировок:', workouts.length);
      return workouts;
    } catch (error) {
      console.error('❌ Repository: ошибка чтения:', error);
      return [];
    }
  },

  async add(workout) {
    try {
      console.log('➕ Repository: добавляем тренировку:', workout);
      const workouts = await this.getAll();
      const updated = [workout, ...workouts];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log('✅ Repository: теперь тренировок:', updated.length);
      return workout;
    } catch (error) {
      console.error('❌ Repository: ошибка записи:', error);
      throw error;
    }
  },

  async remove(id) {
    try {
      const workouts = await this.getAll();
      const filtered = workouts.filter(w => w.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log('🗑️ Repository: удалена тренировка', id);
    } catch (error) {
      console.error('❌ Repository: ошибка удаления:', error);
      throw error;
    }
  },

  async clear() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('🧹 Repository: хранилище очищено');
    } catch (error) {
      console.error('❌ Repository: ошибка очистки:', error);
    }
  },
};
