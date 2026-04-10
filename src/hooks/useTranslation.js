import { useUserStore } from '../store/userStore';
import { translations } from '../constants/translations';

export const useTranslation = () => {
  // Берем язык из стора. Если его нет, по умолчанию будет 'ru'
  const language = useUserStore(s => s.settings?.language) || 'ru';

  const t = (key) => {
    // Ищем перевод для текущего языка. Если нет — ищем в 'ru'. Если вообще нет — возвращаем сам ключ.
    return translations[language]?.[key] || translations['ru']?.[key] || key;
  };

  return { t, language };
};
