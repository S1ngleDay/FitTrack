import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Footprints, Dumbbell, Activity, Calendar } from 'lucide-react-native'; // Импорт иконок
import colors from '../constants/colors';

// Хелпер для выбора иконки
const getWorkoutIcon = (type, color) => {
  const t = type.toLowerCase();
  if (t.includes('бег') || t.includes('пробежка')) return <Footprints size={20} color={color} />;
  if (t.includes('силовая') || t.includes('зал')) return <Dumbbell size={20} color={color} />;
  return <Activity size={20} color={color} />;
};

export default function WorkoutRow({ date, type, typeColor, metrics, onPress }) {
  
  const workoutData = { date, type, metrics };
  const icon = getWorkoutIcon(type, typeColor);

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.7} 
      onPress={() => onPress && onPress(workoutData)}
    >
      {/* Левая часть: Иконка + Инфо */}
      <View style={styles.leftGroup}>
        
        {/* Квадратик с иконкой */}
        <View style={[styles.iconBox, { backgroundColor: `${typeColor}20` }]}>
           {icon}
        </View>

        <View>
           <Text style={[styles.type, { color: typeColor }]}>{type}</Text>
           <View style={styles.dateRow}>
              <Calendar size={12} color="#8E8E93" />
              <Text style={styles.date}>{date}</Text>
           </View>
        </View>
      </View>

      {/* Правая часть: Метрики (немного компактнее) */}
      <View style={styles.metricsContainer}>
        {metrics.map((metric, index) => (
          <View key={index} style={styles.metricColumn}>
            <Text style={[
              styles.metricValue, 
              index === 1 && { color: '#32d74b' },
              index === 2 && { color: '#ff9f0a' }
            ]}>
              {metric.value}
            </Text>
            <Text style={styles.metricUnit}>{metric.unit}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderRadius: 20, // Больше скругления
    padding: 16,
    //marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2C2C2E'
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44, height: 44,
    borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  type: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4
  },
  date: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 15, // Просто отступы, без кружочков (чище)
  },
  metricColumn: {
    alignItems: 'flex-end', // Выравнивание по правому краю
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  metricUnit: {
    color: '#555',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'lowercase'
  }
});
