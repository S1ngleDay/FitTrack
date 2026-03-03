// src/navigation/BottomTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { House, Dumbbell, ChartBar, User } from 'lucide-react-native'; // Иконки
import colors from '../constants/colors';

// Импортируем наши экраны
import HomeScreen from '../screens/HomeScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // Скрываем верхнюю панель (заголовок экрана)
        tabBarStyle: {
          backgroundColor: '#1C1C1E', // Темно-серый фон меню
          borderTopWidth: 0,          // Убираем серую полоску сверху
          height: 85,                 // Высота меню (для удобства нажатия)
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary, // Цвет активной иконки (неоновый)
        tabBarInactiveTintColor: '#8E8E93',    // Цвет неактивной (серый)
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter_600SemiBold',
          marginBottom: 10,
        }
      }}
    >
      <Tab.Screen 
        name="Главная" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color }) => <House size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Тренировки" 
        component={WorkoutsScreen} 
        options={{
          tabBarIcon: ({ color }) => <Dumbbell size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Статистика" 
        component={StatisticsScreen} 
        options={{
          tabBarIcon: ({ color }) => <ChartBar size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Настройки" 
        component={SettingsScreen} 
        options={{
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
