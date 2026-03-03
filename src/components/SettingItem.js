// src/components/SettingItem.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import colors from '../constants/colors';

export default function SettingItem({ icon: Icon, title, type = 'link', value, onToggle, onPress, color }) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress} 
      disabled={type === 'switch'} // Если это свитч, то нажимать на всю строку нельзя (только на свитч)
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        {/* Иконка в цветном квадратике */}
        <View style={[styles.iconContainer, { backgroundColor: color || '#333' }]}>
          <Icon size={20} color="white" />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.right}>
        {/* Если тип 'switch', показываем переключатель */}
        {type === 'switch' && (
          <Switch 
            value={value} 
            onValueChange={onToggle}
            trackColor={{ false: '#3A3A3C', true: colors.primary }}
            thumbColor={'white'}
          />
        )}
        
        {/* Если тип 'link', показываем стрелочку */}
        {type === 'link' && (
          <ChevronRight size={20} color={colors.textSecondary} />
        )}

        {/* Если тип 'value', показываем текст (например, версию приложения) */}
        {type === 'value' && (
          <Text style={styles.valueText}>{value}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1C1C1E', // Темно-серый фон
    marginBottom: 1, // Тонкая линия между пунктами
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  valueText: {
    color: '#8E8E93',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  }
});
