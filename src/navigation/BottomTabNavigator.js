// src/navigation/BottomTabNavigator.js
import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { House, Dumbbell, ChartBar, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // 👈 Поможет с отступами внизу

import { useThemeColors } from '../hooks/useThemeColors'; // 👈 Наша тема
import { useTranslation } from '../hooks/useTranslation'; // 👈 Перевод

// Импортируем экраны
import HomeScreen from '../screens/HomeScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets(); // Получаем размеры системных отступов (челка/полоска)
  const { t } = useTranslation(); // 👈 Добавляем перевод

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.cardBg, // В темной - темно-серый, в светлой - белый
          borderTopWidth: 1,
          borderTopColor: colors.border, // Тонкая линия разделителя
          // Динамическая высота: базовые 60px + отступ полоски Home на iOS
          height: 60 + insets.bottom, 
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
          elevation: 0, // Убираем грубую тень на Android
          shadowOpacity: 0, // Убираем тень на iOS (оставляем только borderTop)
        },
        tabBarActiveTintColor: colors.primary || '#32d74b', // Цвет активного таба
        tabBarInactiveTintColor: colors.textSecondary,      // Цвет неактивного
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter_600SemiBold',
          marginTop: 4,
        }
      }}
    >
      <Tab.Screen 
        name="Main" 
        component={HomeScreen} 
        options={{
          tabBarLabel: t('tabHome'),
          // Если таб активен, делаем линию иконки чуть толще (strokeWidth 2.5 вместо 2)
          tabBarIcon: ({ color, focused }) => (
            <House size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tab.Screen 
        name="Workouts" 
        component={WorkoutsScreen} 
        options={{
          tabBarLabel: t('tabWorkouts'),
          tabBarIcon: ({ color, focused }) => (
            <Dumbbell size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tab.Screen 
        name="Statistics" 
        component={StatisticsScreen} 
        options={{
          tabBarLabel: t('tabStatistics'),
          tabBarIcon: ({ color, focused }) => (
            <ChartBar size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          tabBarLabel: t('tabSettings'),
          tabBarIcon: ({ color, focused }) => (
            <User size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
