// src/components/SettingItem.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors'; 

export default function SettingItem({ icon: Icon, title, type = 'link', value, onToggle, onPress, color }) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.cardBg, 
          borderBottomColor: colors.border 
        }
      ]} 
      onPress={onPress} 
      disabled={type === 'switch'} 
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        {/* Иконка в цветном квадратике (иконка всегда белая) */}
        <View style={[styles.iconContainer, { backgroundColor: color || '#333' }]}>
          <Icon size={20} color="white" />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      </View>

      <View style={styles.right}>
        {/* Свитч */}
        {type === 'switch' && (
          <Switch 
            value={value} 
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.green || '#32d74b' }}
            thumbColor={'white'}
          />
        )}
        
        {/* Стрелочка */}
        {type === 'link' && (
          <ChevronRight size={20} color={colors.textSecondary} />
        )}

        {/* Текст */}
        {type === 'value' && (
          <Text style={[styles.valueText, { color: colors.textSecondary }]}>{value}</Text>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  }
});
