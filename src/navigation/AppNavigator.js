import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import SwipeableScreens from './SwipeableScreens';
import ActiveRunScreen from '../screens/ActiveRunScreen';
import WorkoutSummaryScreen from '../screens/WorkoutSummaryScreen';
import SecurityScreen from '../screens/SecurityScreen';

// ✅ Детали экраны
import TimeDetailsScreen from '../screens/TimeDetailsScreen';
import CaloriesDetailsScreen from '../screens/CaloriesDetailsScreen';
import DistanceDetailsScreen from '../screens/DistanceDetailsScreen';
import StepsDetailsScreen from '../screens/StepsDetailsScreen';

// 🆕 СИЛОВЫЕ ЭКРАНЫ (импортируй созданные файлы)
import CreateWorkoutPlanScreen from '../screens/CreateWorkoutPlanScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import WorkoutReportScreen from '../screens/WorkoutReportScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      {/* Главный экран с табами и свайпом */}
      <Stack.Screen name="Home" component={SwipeableScreens} />

      {/* 🟢 КАРДИО (твои текущие) */}
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

      {/* Детали экраны */}
      <Stack.Screen name="TimeDetails" component={TimeDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CaloriesDetails" component={CaloriesDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DistanceDetails" component={DistanceDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StepsDetails" component={StepsDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SecurityScreen" component={SecurityScreen} options={{ headerShown: false }} />

      {/* 🆕 СИЛОВЫЕ ТРЕНИРОВКИ — ПОЛНЫЙ ФЛОУ */}
      <Stack.Screen 
        name="CreateWorkoutPlan" 
        component={CreateWorkoutPlanScreen}
        options={{ 
          gestureEnabled: true,
          animation: 'slide_from_right',
          title: 'Новый план',
          headerStyle: { backgroundColor: '#1C1C1E' },
          headerTintColor: 'white',
          headerTitleStyle: { fontFamily: 'Inter_700Bold' }
        }}
      />
      
      <Stack.Screen 
        name="ActiveWorkout" 
        component={ActiveWorkoutScreen}
        options={{ 
          gestureEnabled: false, // Не свайпить во время подходов!
          animation: 'slide_from_bottom',
          title: 'Тренировка'
        }}
      />
      
      <Stack.Screen 
        name="WorkoutReport" 
        component={WorkoutReportScreen}
        options={{ 
          gestureEnabled: true,
          animation: 'fade_from_bottom',
          title: 'Отчёт о тренировке',
          headerStyle: { backgroundColor: '#1C1C1E' },
          headerTintColor: 'white',
          headerTitleStyle: { fontFamily: 'Inter_700Bold' }
        }}
      />

    </Stack.Navigator>
  );
}
