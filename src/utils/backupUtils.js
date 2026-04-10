// src/utils/backupUtils.js
import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

export const exportWorkouts = async (workouts) => {
  try {
    // 1. Формируем JSON структуру
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      workouts: workouts
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    
    // 2. Создаем файл во временной директории с помощью нового API [web:23]
    const fileName = `fittrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    const file = new File(Paths.cache, fileName);
    
    // Создаем файл (с перезаписью, если вдруг такой уже есть) [web:23]
    file.create({ overwrite: true });
    
    // Записываем данные (синхронно, так как это просто текст) [web:23]
    file.write(jsonString);

    // 3. Открываем системное меню "Поделиться"
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Функция "Поделиться" недоступна на этом устройстве');
    }

    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Экспорт тренировок',
      UTI: 'public.json'
    });

    return true;
  } catch (error) {
    console.error('Ошибка экспорта:', error);
    throw error;
  }
};

export const importWorkoutsFromFile = async () => {
  try {
    // 1. Открываем выбор файла
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true, 
    });

    if (result.canceled) return null;

    // 2. Читаем содержимое файла через новый API [web:23]
    const fileUri = result.assets[0].uri;
    const file = new File(fileUri);
    const fileContent = await file.text();

    // 3. Парсим и валидируем
    const parsedData = JSON.parse(fileContent);

    if (!parsedData.workouts || !Array.isArray(parsedData.workouts)) {
      throw new Error('Неверный формат файла. Ожидался список тренировок.');
    }

    return parsedData.workouts;
  } catch (error) {
    console.error('Ошибка импорта:', error);
    throw new Error('Не удалось прочитать или распознать файл');
  }
};
