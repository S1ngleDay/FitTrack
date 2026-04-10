// WorkoutRow.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Footprints, Dumbbell, Activity, Calendar } from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../hooks/useTranslation';
import { getSystemType, getTypeColor } from '../store/workoutStore';

// Хелпер для нормализации любого типа тренировки в системный ключ
const normalizeWorkoutType = (type) => {
  const s = String(type || '').toLowerCase();
  
  if (s.includes('run') || s.includes('бег') || s.includes('пробеж')) return 'run';
  if (s.includes('walk') || s.includes('ходьб')) return 'walk';
  if (s.includes('strength') || s.includes('сил') || s.includes('зал')) return 'strength';
  if (s.includes('bike') || s.includes('cycle') || s.includes('вел')) return 'bike';
  if (s.includes('cardio') || s.includes('кардио')) return 'cardio';
  
  return 'workout'; // Фолбэк для остальных
};

// Выбор иконки на основе системного ключа
const getWorkoutIcon = (typeKey, color) => {
  if (typeKey === 'run' || typeKey === 'walk') return <Footprints size={20} color={color} />;
  if (typeKey === 'strength') return <Dumbbell size={20} color={color} />;
  return <Activity size={20} color={color} />;
};

// Словарь для перевода единиц измерения
const UNIT_MAP = {
  'км': 'unitKm', 'km': 'unitKm',
  'ккал': 'unitKcal', 'kcal': 'unitKcal',
  'мин': 'unitMin', 'min': 'unitMin',
  'кг': 'unitKg', 'kg': 'unitKg',
  'подх': 'unitSets', 'sets': 'unitSets',
  'упр': 'unitEx', 'ex': 'unitEx',
};

export default function WorkoutRow({ date, type, typeColor, metrics, onPress }) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  const workoutData = { date, type, metrics };
  const typeKey = normalizeWorkoutType(type);
  const icon = getWorkoutIcon(typeKey, typeColor);

  const translateUnit = (unit) => {
    const normalizedUnit = String(unit || '').toLowerCase();
    const translationKey = UNIT_MAP[normalizedUnit];
    return translationKey ? t(translationKey) : unit;
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.border }]} 
      activeOpacity={0.7} 
      onPress={() => onPress && onPress(workoutData)}
    >
      {/* Левая часть: Иконка + Инфо */}
      <View style={styles.leftGroup}>
        <View style={[styles.iconBox, { backgroundColor: `${typeColor}20` }]}>
           {icon}
        </View>

        <View>
           {/* Переводим системный ключ. Если перевода нет — показываем оригинальный тип */}
           <Text style={[styles.type, { color: typeColor }]}>{t(typeKey) || type}</Text>
           <View style={styles.dateRow}>
              <Calendar size={12} color={colors.textSecondary} />
              <Text style={[styles.date, { color: colors.textSecondary }]}>{date}</Text>
           </View>
        </View>
      </View>

      {/* Правая часть: Метрики */}
      <View style={styles.metricsContainer}>
        {metrics.map((metric, index) => (
          <View key={index} style={styles.metricColumn}>
            <Text style={[
              styles.metricValue, 
              { color: colors.textPrimary },
              index === 1 && { color: colors.green || '#32d74b' },
              index === 2 && { color: colors.orange || '#ff9f0a' }
            ]}>
              {metric.value}
            </Text>
            <Text style={[styles.metricUnit, { color: colors.textSecondary }]}>
              {translateUnit(metric.unit)}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1 },
  leftGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  type: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  metricsContainer: { flexDirection: 'row', gap: 15 },
  metricColumn: { alignItems: 'flex-end' },
  metricValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  metricUnit: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'lowercase' }
});
