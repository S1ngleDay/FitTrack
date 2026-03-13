import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { House, Dumbbell, ChartBar, User } from 'lucide-react-native';
import colors from '../constants/colors';

import HomeScreen from '../screens/HomeScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function StandardBottomTabs() {
  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.label,
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  tabBar: {
    backgroundColor: '#1C1C1E',
    borderTopWidth: 0,
    height: 70, // Можно регулировать по вкусу
    paddingTop: 8,
    paddingBottom: 8, 
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
});
