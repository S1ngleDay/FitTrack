// src/components/ActivityChart.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import colors from '../constants/colors';

export default function ActivityChart() {
  // Данные для графика (например, шаги или минуты)
  const barData = [
    { value: 2500, label: 'Пн', frontColor: '#32d74b' },
    { value: 5000, label: 'Вт', frontColor: '#32d74b' },
    { value: 7450, label: 'Ср', frontColor: '#CCFF00' }, // Лидер (лайм)
    { value: 3200, label: 'Чт', frontColor: '#32d74b' },
    { value: 6000, label: 'Пт', frontColor: '#32d74b' },
    { value: 2560, label: 'Сб', frontColor: '#32d74b' },
    { value: 3000, label: 'Вс', frontColor: '#32d74b' },
  ];

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Активность за неделю</Text>
      
      <BarChart
        data={barData}
        barWidth={22}
        noOfSections={3}       // Количество горизонтальных линий
        barBorderRadius={4}
        frontColor={colors.primary}
        yAxisThickness={0}     // Скрыть ось Y
        xAxisThickness={0}     // Скрыть ось X
        yAxisTextStyle={{ color: 'gray' }}
        xAxisLabelTextStyle={{ color: 'gray', fontSize: 12 }}
        hideRules              // Скрыть сетку
        isAnimated             // Анимация появления
        animationDuration={1000}
        height={150}           // Высота самих столбиков
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: colors.cardBg,
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  chartTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 20,
  }
});
