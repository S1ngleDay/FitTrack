// src/constants/colors.js

const sharedColors = {
  primary: '#aed900',         // Неоновый лайм остается одинаковым везде
  blue: '#4da6ff',
  yellow: '#ffd500',
  red: '#ff3b30',
  green: '#32d74b',
  chartSteps: "#E0B0FF",
  chartDistance: '#4da6ff',
  chartCalories: '#ff3b30',
  chartTime: '#32d74b',
};

export const darkTheme = {
  ...sharedColors,
  background: '#000000',      // Основной фон (черный)
  cardBg: '#1C1C1E',          // Фон плашек (темно-серый)
  textPrimary: '#FFFFFF',     // Белый текст
  textSecondary: '#8E8E93',   // Серый текст
  border: '#2C2C2E',          // Цвет рамок
};

export const lightTheme = {
  ...sharedColors,
  background: '#F2F2F7',      // Основной фон (светло-серый, как в iOS)
  cardBg: '#FFFFFF',          // Фон плашек (чисто белый)
  textPrimary: '#000000',     // Черный текст
  textSecondary: '#8E8E93',   // Серый текст
  border: '#E5E5EA',          // Цвет рамок (светлый)
};

// Для совместимости оставляем дефолтный экспорт темной темы, 
// если где-то еще не успели переписать на новый хук
export default darkTheme;
