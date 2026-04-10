// src/hooks/useThemeColors.js
import { useUserStore } from '../store/userStore';
import { lightTheme, darkTheme } from '../constants/colors';

export function useThemeColors() {
  const isDark = useUserStore((state) => state.settings.isDark);
  return isDark ? darkTheme : lightTheme;
}
