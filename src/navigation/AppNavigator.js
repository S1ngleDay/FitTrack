import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import SwipeableScreens from './SwipeableScreens';
import ActiveRunScreen from '../screens/ActiveRunScreen';
import WorkoutSummaryScreen from '../screens/WorkoutSummaryScreen';
import SecurityScreen from '../screens/SecurityScreen';

// ✅ ИМПОРТИРУЙТЕ ВАШИ ЭКРАНЫ ДЕТАЛЕЙ
import TimeDetailsScreen from '../screens/TimeDetailsScreen';       // Проверьте путь!
import CaloriesDetailsScreen from '../screens/CaloriesDetailsScreen';
import DistanceDetailsScreen from '../screens/DistanceDetailsScreen';
import StepsDetailsScreen from '../screens/StepsDetailsScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {/* Главный экран с табами и свайпом */}
      <Stack.Screen 
        name="Home" 
        component={SwipeableScreens} 
      />

      {/* Тренировка */}
      <Stack.Screen 
        name="ActiveRun" 
        component={ActiveRunScreen}
        options={{ gestureEnabled: false, animation: 'slide_from_bottom' }}
      />
      <Stack.Screen 
        name="WorkoutSummary" 
        component={WorkoutSummaryScreen}
        options={{ gestureEnabled: false, animation: 'fade_from_bottom' }}
      />

      {/* ✅ ДОБАВЬТЕ ЭТИ ЭКРАНЫ СЮДА */}
      {/* Имена 'TimeDetails' должны совпадать с тем, что вы вызываете в navigation.navigate('TimeDetails') */}
      
      <Stack.Screen 
        name="TimeDetails" 
        component={TimeDetailsScreen} 
        options={{ headerShown: false, title: 'Время', headerTintColor: 'white', headerStyle: { backgroundColor: 'black' } }}
      />
      
      <Stack.Screen 
        name="CaloriesDetails" 
        component={CaloriesDetailsScreen} 
        options={{ headerShown: false, title: 'Калории', headerTintColor: 'white', headerStyle: { backgroundColor: 'black' } }}
      />
      
      <Stack.Screen 
        name="DistanceDetails" 
        component={DistanceDetailsScreen} 
        options={{ headerShown: false, title: 'Дистанция', headerTintColor: 'white', headerStyle: { backgroundColor: 'black' } }}
      />
      
      <Stack.Screen 
        name="StepsDetails" 
        component={StepsDetailsScreen} 
        options={{ headerShown: false, title: 'Шаги', headerTintColor: 'white', headerStyle: { backgroundColor: 'black' } }}
      />

      <Stack.Screen 
        name="SecurityScreen" 
        component={SecurityScreen} 
        options={{ headerShown: false }}
      />

    </Stack.Navigator>
  );
}
