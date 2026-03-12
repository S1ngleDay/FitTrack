import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Footprints, MapPin, Flame, Clock, ArrowUpRight } from 'lucide-react-native';
import colors from '../constants/colors';

// Хелпер для выбора иконки
const getIcon = (title, color) => {
  switch (title) {
    case 'Шаги': return <Footprints size={24} color={color} />;
    case 'Дистанция': return <MapPin size={24} color={color} />;
    case 'Калории': return <Flame size={24} color={color} />;
    case 'Время': return <Clock size={24} color={color} />;
    default: return null;
  }
};

export default function StatsCard({ title, value, unit, color, onPress, progress }) {
  // progress - число от 0 до 1 (например 0.7 для 70%)
  
  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.7} 
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}> 
          {/* `${color}20` делает цвет полупрозрачным (hex alpha) */}
          {getIcon(title, color)}
        </View>
        
        {/* Иконка стрелочки (декор) */}
        <ArrowUpRight size={16} color="#48484A" />
      </View>

      <View style={styles.content}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {value} <Text style={styles.unit}>{unit}</Text>
        </Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Прогресс-бар внизу карточки */}
      {progress !== undefined && (
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%', // Чтобы влезало 2 в ряд с отступом
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    justifyContent: 'space-between',
    minHeight: 140, // Фиксированная высота для красоты
    borderWidth: 1,
    borderColor: '#2C2C2E'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginTop: 'auto', // Прижимаем вниз
    marginBottom: 10,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  unit: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
  },
  title: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  
  // Progress Bar
  progressBarBg: {
    height: 4,
    backgroundColor: '#2C2C2E',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
