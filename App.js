// App.js
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { requestNotificationPermission, scheduleWorkoutReminder, cancelAllNotifications } from './src/utils/notifications';
import { registerBackgroundTimer } from './src/utils/backgroundTimer';
import { useDemoDataInit } from './src/hooks/useDemoDataInit';  // 🎮 Демо режим
import { 
  useFonts, 
  Inter_400Regular, 
  Inter_500Medium, // 👈 Добавил этот шрифт, он нужен для WelcomeScreen!
  Inter_600SemiBold, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack'; 
import { StatusBar } from 'expo-status-bar';

import colors from './src/constants/colors';
import AppNavigator from './src/navigation/AppNavigator';

// 1. Импортируем новый экран и стор
import WelcomeScreen from './src/screens/WelcomeScreen';
import { useUserStore } from './src/store/userStore';

const Stack = createStackNavigator(); 

export default function App() {
  // 🎮 Инициализируем демо-данные если включен режим демо
  useDemoDataInit();

  // 2. Загружаем шрифты
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium, // 👈 Обязательно загружаем Medium
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // 3. Достаем пользователя из стора и проверяем, есть ли имя
  const user = useUserStore((state) => state.user);
  const settings = useUserStore((state) => state.settings);
  const isFirstLaunch = !user?.name;

  useEffect(() => {
    async function setupNotifications() {
      if (settings?.notifications) {
        // Если тумблер включен: просим разрешение и ставим таймер
        const granted = await requestNotificationPermission();
        if (granted) {
          await scheduleWorkoutReminder();
          // Регистрируем фоновый таймер для Android
          await registerBackgroundTimer();
        }
      } else {
        // Если тумблер выключен: отменяем все уведомления
        await cancelAllNotifications();
      }
    }

    // Запускаем настройку только если юзер уже прошел онбординг
    if (!isFirstLaunch) {
      setupNotifications();
    }
  }, [settings?.notifications, isFirstLaunch]); 

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        {/* 4. Условный рендеринг в зависимости от наличия данных */}
        {isFirstLaunch ? (
          <Stack.Screen 
            name="Welcome" 
            component={WelcomeScreen} 
            options={{ animationEnabled: true }} // Плавное появление
          />
        ) : (
          <Stack.Screen 
            name="MainApp" 
            component={AppNavigator} 
            options={{ animationEnabled: true }} 
          />
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}
