// src/components/ActionCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play } from 'lucide-react-native'; // Иконка Play (треугольник)
import colors from '../constants/colors';

export default function ActionCard({ title, subtitle, colorsGradient, iconColor }) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.touchable}>
      <LinearGradient
        // Градиент идет слева направо
        // colorsGradient - это массив цветов, например ['#1a2e05', '#2b4a08']
        colors={colorsGradient} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.card}
      >
        {/* Левая часть: Текст */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: iconColor }]}>{subtitle}</Text>}
        </View>

        {/* Правая часть: Кнопка Play */}
        <View style={[styles.iconCircle, { backgroundColor: iconColor }]}>
          <Play size={20} color="black" fill="black" style={{ marginLeft: 2 }} />
        </View>

      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    marginBottom: 12, // Отступ снизу между кнопками
  },
  card: {
    flexDirection: 'row', // Текст слева, кнопка справа
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    height: 90, // Фиксированная высота как в дизайне
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24, // Делаем круг
    justifyContent: 'center',
    alignItems: 'center',
  }
});
