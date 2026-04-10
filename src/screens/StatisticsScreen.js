import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Share } from 'react-native';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import { Share as ShareIcon, Dumbbell, MapPin, Clock, Flame, Activity } from 'lucide-react-native';

import { useThemeColors } from '../hooks/useThemeColors';
import { useWorkoutStore, EXERCISES_CATALOG } from '../store/workoutStore';
import { parseWorkoutDate, getMetricValue } from '../utils/statsCalculator';
import { getExerciseChartData } from '../utils/coachAnalyzer';
import { useTranslation } from '../hooks/useTranslation'; // 👈 Добавили хук перевода

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80;

export default function StatisticsScreen() {
  const colors = useThemeColors();
  const { t, language } = useTranslation(); // 👈 Вытаскиваем функцию перевода

  const [period, setPeriod] = useState('7 дней'); // Мы будем использовать ключи t('period7d'), но в стейте оставим русские id для логики
  const [chartMetric, setChartMetric] = useState('duration');
  const [selectedExercise, setSelectedExercise] = useState('Жим лежа');
  const [pickerVisible, setPickerVisible] = useState(false);

  const workouts = useWorkoutStore((s) => s.workouts);

  // Выбор периода: 7 дней, 28 дней, 180 дней
  const startDate = useMemo(() => {
    const now = new Date();
    const daysToSubtract = period === '7 дней' ? 7 : period === '28 дней' ? 28 : 180;
    return new Date(now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
  }, [period]);

  // Сводка
  const summaryStats = useMemo(() => {
    const now = new Date();
    const periodWorkouts = workouts.filter(w => {
      const wDate = parseWorkoutDate(w.date, w.startTime);
      return wDate >= startDate && wDate <= now;
    });

    let totalCal = 0, totalDist = 0, totalDur = 0, totalVolume = 0;
    const typeMap = {};
    const muscleMap = {};

    periodWorkouts.forEach(w => {// ИСПРАВЛЕНИЕ: Оборачиваем всё в Number() для защиты от строк
      totalCal += Number(getMetricValue(w.metrics, '🔥') || w.calories) || 0;
      totalDist += Number(getMetricValue(w.metrics, '📍') || w.distance) || 0;
      totalDur += Number(getMetricValue(w.metrics, '⏱️') || w.duration) || 0;
      totalVolume += Number(getMetricValue(w.metrics, '💪') || w.totalVolume) || 0;

      // Данные для кругового графика (Типы)
      const typeStr = w.type ? t(w.type) : t('otherSource');
      if (!typeMap[typeStr]) {
        typeMap[typeStr] = { count: 0, originalType: w.type };
      }
      typeMap[typeStr].count += 1;

      // Данные для кругового графика (Мышцы)
      if (w.type === '' && w.exercises) {
        w.exercises.forEach(ex => {
          const catalogEx = EXERCISES_CATALOG.find(e => e.name === ex.name || e.id === ex.exerciseId);
          if (catalogEx && catalogEx.category) {
            const originalCat = catalogEx.category.toLowerCase();
            if (originalCat !== '') {
              const translatedCategory = t(originalCat) !== originalCat
                ? t(originalCat)
                : originalCat.charAt(0).toUpperCase() + originalCat.slice(1);

              if (!muscleMap[translatedCategory]) muscleMap[translatedCategory] = 0;
              muscleMap[translatedCategory] += (ex.sets?.length || 1);
            }
          }
        });
      }
    });

    const pieColors = {
      [t('Пробежка')]: colors.blue || '#0A84FF',
      [t('Силовая')]: colors.red || '#FF3B30',
      [t('Кардио')]: colors.yellow || '#FFD60A',
      [t('Велосипед')]: colors.green || '#32d74b',
      [t('Ходьба')]: colors.chartSteps || '#BF5AF2',
      default: '#8E8E93'
    };

    const muscleColors = ['#FF453A', '#32D74B', '#0A84FF', '#FF9F0A', '#BF5AF2', '#FF375F', '#FFD60A'];

    const pieData = Object.keys(typeMap).map(type => ({
      value: typeMap[type].count,
      color: pieColors[type] || pieColors[typeMap[type].originalType] || pieColors.default,
      label: type
    }));

    const muscleData = Object.keys(muscleMap).map((category, i) => ({
      value: muscleMap[category],
      color: muscleColors[i % muscleColors.length] || '#8E8E93',
      label: category // 👈 Теперь здесь уже переведенное название (Chest, Legs и т.д.)
    }));


    return {
      totalCal: Math.round(totalCal),
      totalDist: Math.round(totalDist * 10) / 10,
      totalDur,
      totalVolume: Math.round(totalVolume * 10) / 10,
      count: periodWorkouts.length,
      pieData,
      muscleData
    };
  }, [workouts, startDate, colors, t]);

  // Данные для BarChart
  const chartStats = useMemo(() => {
    const now = new Date();
    const dataMap = {};

    workouts.forEach(w => {
      const wDate = parseWorkoutDate(w.date, w.startTime);
      if (wDate >= startDate) {
        let val = 0;
        // ИСПРАВЛЕНИЕ: Безопасное извлечение метрик для графика
        if (chartMetric === 'calories') {
          val = Number(getMetricValue(w.metrics, '🔥') || w.calories) || 0;
        }
        if (chartMetric === 'distance') {
          val = Number(getMetricValue(w.metrics, '📍') || w.distance) || 0;
        }
        if (chartMetric === 'duration') {
          val = Number(getMetricValue(w.metrics, '⏱️') || w.duration) || 0;
        }
        const dateKey = wDate.toDateString();
        if (!dataMap[dateKey]) dataMap[dateKey] = 0;
        dataMap[dateKey] += val;
      }
    });

    let rawBarData = [];

    // Обратите внимание: убедитесь, что стейт period действительно хранит строки с текстом " дней", 
    // а не просто числа '7', '28', '180', как это было в прошлых версиях кода.

    if (period === '7 дней') {
      const labels = [t('daySun'), t('dayMon'), t('dayTue'), t('dayWed'), t('dayThu'), t('dayFri'), t('daySat')];

      // Инициализируем локальный массив и потом присваиваем, 
      // чтобы избежать дублирования старых данных при рендере
      const daysData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        daysData.push({
          value: Number(dataMap[d.toDateString()]) || 0,
          label: labels[d.getDay()] // getDay() вернет 0 для Воскресенья, что идеально совпадает с массивом
        });
      }
      rawBarData = daysData;

    } else if (period === '28 дней') {
      // 1. Обязательно инициализируем нулями
      const weeks = [0, 0, 0, 0];

      const labels = [
        `1 ${t('weekPrefix') || 'нед.'}`,
        `2 ${t('weekPrefix') || 'нед.'}`,
        `3 ${t('weekPrefix') || 'нед.'}`,
        `4 ${t('weekPrefix') || 'нед.'}`
      ];

      for (let i = 27; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toDateString();

        // Индекс недели: 0 (21-27 дней назад) ... 3 (0-6 дней назад)
        const weekIndex = Math.floor((27 - i) / 7);

        // Аккуратно прибавляем, оборачивая в Number(), чтобы избежать багов с '0150'
        if (dataMap[dateStr]) {
          weeks[weekIndex] += Number(dataMap[dateStr]);
        }
        console.log(weeks)
      }

      // Формируем финальный объект
      rawBarData = weeks.map((val, idx) => ({
        value: val,
        label: labels[idx]
      }));

    } else if (period === '180 дней') {
      const months = [0, 0, 0, 0, 0, 0];
      const monthNames = [t('monthJan'), t('monthFeb'), t('monthMar'), t('monthApr'), t('monthMay'), t('monthJun'), t('monthJul'), t('monthAug'), t('monthSep'), t('monthOct'), t('monthNov'), t('monthDec')];
      const labels = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(monthNames[d.getMonth()]);
      }

      workouts.forEach(w => {
        const wDate = parseWorkoutDate(w.date, w.startTime);

        if (wDate >= startDate) {
          let val = 0;
          // Обертка в Number() гарантирует, что метрики сложатся математически
          if (chartMetric === 'calories') val = Number(getMetricValue(w.metrics, '🔥') || w.calories || 0);
          if (chartMetric === 'distance') val = Number(getMetricValue(w.metrics, '📍') || w.distance || 0);
          if (chartMetric === 'duration') val = Number(getMetricValue(w.metrics, '⏱️') || w.duration || 0);
          if (chartMetric === 'totalVolume') val = Number(getMetricValue(w.metrics, '💪') || w.totalVolume || 0);

          const monthDiff = (now.getFullYear() - wDate.getFullYear()) * 12 + (now.getMonth() - wDate.getMonth());
          if (monthDiff >= 0 && monthDiff <= 5) {
            // monthDiff = 0 для текущего месяца (запишется в индекс 5)
            months[5 - monthDiff] += val;
          }
        }
      });

      rawBarData = months.map((val, idx) => ({
        value: val,
        label: labels[idx]
      }));
    }

    const rawMax = Math.max(...rawBarData.map(b => b.value));
    const maxValue = rawMax === 0 ? 10 : rawMax * 1.2;

    const barData = rawBarData.map(item => {
      let baseColor = colors.border;
      if (item.value > 0) {
        if (chartMetric === 'calories') baseColor = colors.red || '#ff3b30';
        if (chartMetric === 'distance') baseColor = colors.blue || '#0A84FF';
        if (chartMetric === 'duration') baseColor = colors.green || '#32d74b';
      }
      return {
        ...item,
        value: item.value === 0 ? (maxValue * 0.05) : item.value,
        frontColor: item.value === 0 ? colors.border : baseColor,
      };
    });

    const total = rawBarData.reduce((s, b) => s + b.value, 0);
    const unit = chartMetric === 'calories' ? t('caloriesAbbr') : (chartMetric === 'distance' ? t('distanceAbbr') : t('minAbbr'));

    console.log(rawBarData);
    return {
      barData,
      totalValue: chartMetric === 'distance' ? total.toFixed(1) : total,
      unit,
      maxValue
    };
  }, [workouts, period, chartMetric, startDate, colors, t]);

  // Данные LineChart (Силовые)
  const strengthData = useMemo(() => {
    const rawData = getExerciseChartData(selectedExercise, workouts, startDate);
    if (!rawData || rawData.length === 0) return [];
    return rawData.map(item => ({
      value: item.value,
      label: item.date, // В идеале здесь тоже локализовать дату, если getExerciseChartData возвращает строку
      dataPointText: String(item.value),
    }));
  }, [workouts, selectedExercise, startDate]);

  const handleShare = async () => {
    try {
      const periodLabel = period === '7 дней' ? t('period7d') : period === '28 дней' ? t('period28d') : t('period6m');
      await Share.share({
        message: `🔥 FitTrack\n${t('shareMessage')} ${periodLabel.toLowerCase()}:\n🏃‍♂️ ${summaryStats.count} ${t('shareWorkouts')}\n🔥 ${summaryStats.totalCal} ${t('shareCalories')}\n🏋️ ${summaryStats.totalVolume} ${t('shareVolume')}`
      });
    } catch (error) {
      console.log(t('shareError'), error);
    }
  };

  const formatTime = (m) => {
    if (m < 60) return `${m} ${t('minAbbr')}`;
    return `${Math.floor(m / 60)}${t('hourAbbr')} ${m % 60}${t('minAbbr')}`;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('statisticsTitle')}</Text>
          <TouchableOpacity onPress={handleShare} style={[styles.shareBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <ShareIcon size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Сегментированный контроль */}
        <View style={[styles.segmentControl, { backgroundColor: colors.cardBg }]}>
          {['7 дней', '28 дней', '180 дней'].map(p => {
            const label = p === '7 дней' ? t('period7d') : p === '28 дней' ? t('period28d') : t('period6m');
            return (
              <TouchableOpacity
                key={p}
                style={[styles.segment, period === p && [styles.activeSegment, { backgroundColor: colors.border }]]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.segmentText, period === p && { color: colors.textPrimary }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 2x2 MINI GRID */}
        <View style={styles.miniGrid}>
          <View style={[styles.gridItem, { backgroundColor: colors.cardBg }]}>
            <Activity size={20} color={colors.primary || '#CCFF00'} />
            <View>
              <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{summaryStats.count}</Text>
              <Text style={styles.gridLabel}>{t('workoutsLabel')}</Text>
            </View>
          </View>
          <View style={[styles.gridItem, { backgroundColor: colors.cardBg }]}>
            <Clock size={20} color={colors.green || '#32d74b'} />
            <View>
              <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{formatTime(summaryStats.totalDur)}</Text>
              <Text style={styles.gridLabel}>{t('timeLabel')}</Text>
            </View>
          </View>
          <View style={[styles.gridItem, { backgroundColor: colors.cardBg }]}>
            <Flame size={20} color={colors.red || '#FF3B30'} />
            <View>
              <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{summaryStats.totalCal.toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')}</Text>
              <Text style={styles.gridLabel}>{t('caloriesLabel')}</Text>
            </View>
          </View>
          <View style={[styles.gridItem, { backgroundColor: colors.cardBg }]}>
            <Dumbbell size={20} color={colors.yellow || '#FFD60A'} />
            <View>
              <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{summaryStats.totalVolume}</Text>
              <Text style={styles.gridLabel}>{t('volumeLabel')}</Text>
            </View>
          </View>
        </View>

        {/* MAIN CHART */}
        <View style={[styles.chartCard, { backgroundColor: colors.cardBg }]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.sectionTitle}>{t('activityByPeriod')}</Text>
              <Text style={[styles.chartSubtitle, { color: colors.textPrimary }]}>
                {Number(chartStats.totalValue).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')} {chartStats.unit}
              </Text>
            </View>
            <View style={[styles.metricToggles, { backgroundColor: colors.background }]}>
              <TouchableOpacity onPress={() => setChartMetric('duration')} style={[styles.metricBtn, chartMetric === 'duration' && { backgroundColor: colors.border }]}>
                <Clock size={16} color={chartMetric === 'duration' ? (colors.green || '#32d74b') : '#8E8E93'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setChartMetric('calories')} style={[styles.metricBtn, chartMetric === 'calories' && { backgroundColor: colors.border }]}>
                <Flame size={16} color={chartMetric === 'calories' ? (colors.red || '#ff3b30') : '#8E8E93'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setChartMetric('distance')} style={[styles.metricBtn, chartMetric === 'distance' && { backgroundColor: colors.border }]}>
                <MapPin size={16} color={chartMetric === 'distance' ? (colors.blue || '#0A84FF') : '#8E8E93'} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ marginTop: 20 }}>
            <BarChart
            key={`bar-chart-${period}-${chartStats.maxValue}`}
              data={chartStats.barData}
              disableScroll={true}
              barWidth={period === '7 дней' ? 18 : (period === '28 дней' ? 45 : 23)}
              adjustToWidth={false}
              noOfSections={3}
              maxValue={chartStats.maxValue}
              barBorderRadius={4}
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor={colors.border}
              rulesLength={CHART_WIDTH - 30}
              height={160}
              width={CHART_WIDTH - 40}
              yAxisTextStyle={{ color: '#8E8E93', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#8E8E93', fontSize: 11, textAlign: 'center' }}
              hideRules={false}
              rulesColor={colors.border}
              isAnimated
              animationDuration={500}
            />
          </View>
        </View>

        {/* STRENGTH CHART */}
        <View style={[styles.chartCard, { backgroundColor: colors.cardBg }]}>
          <View style={styles.strengthHeader}>
            <Text style={styles.sectionTitle}>{t('maxWeight')}</Text>
            <TouchableOpacity style={[styles.customPickerButton, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => setPickerVisible(true)} activeOpacity={0.7}>
              <Text style={[styles.customPickerText, { color: colors.textPrimary }]}>{selectedExercise}</Text>
              <Text style={styles.customPickerChevron}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 15 }}>
            {strengthData.length > 1 ? (
              <LineChart
                data={strengthData}
                height={180}
                width={CHART_WIDTH - 40}
                adjustToWidth={true}
                color={colors.red || '#FF3B30'}
                thickness={3}
                startFillColor="rgba(255,59,48,0.3)"
                endFillColor="rgba(255,59,48,0.0)"
                startOpacity={0.9}
                endOpacity={0.2}
                areaChart
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor={colors.border}
                yAxisTextStyle={{ color: '#8E8E93', fontSize: 10 }}
                xAxisLabelTextStyle={{ color: '#8E8E93', fontSize: 10, width: 40, marginLeft: -10 }}
                hideRules={false}
                rulesColor={colors.border}
                rulesLength={CHART_WIDTH - 30}
                dataPointsColor={colors.red || '#FF3B30'}
                dataPointsRadius={4}
                textShiftY={-5}
                textShiftX={-8}
                textFontSize={12}
                textColor={colors.textPrimary}
                isAnimated
              />
            ) : (
              <View style={[styles.emptyChart, { backgroundColor: colors.background }]}>
                <Text style={styles.emptyChartText}>{t('notEnoughData')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* PIE CHARTS */}
        {summaryStats.pieData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 20 }]}>{t('activityTypes')}</Text>
            <View style={styles.pieContainer}>
              <PieChart data={summaryStats.pieData} donut radius={75} innerRadius={45} backgroundColor="transparent" />
              <View style={styles.pieLegend}>
                {summaryStats.pieData.map((item, idx) => (
                  <View key={idx} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>{item.label}</Text>
                    <Text style={[styles.legendValue, { color: colors.textPrimary }]}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {summaryStats.muscleData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 20 }]}>{t('muscleGroups')}</Text>
            <View style={styles.pieContainer}>
              <PieChart data={summaryStats.muscleData} donut radius={75} innerRadius={45} backgroundColor="transparent" />
              <View style={styles.pieLegend}>
                {summaryStats.muscleData.map((item, idx) => (
                  <View key={idx} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>{item.label}</Text>
                    <Text style={[styles.legendValue, { color: colors.textPrimary }]}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* MODAL PICKER EXERCISES */}
      {pickerVisible && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('chooseExerciseModal')}</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.border }]}>
                <Text style={styles.closeBtnText}>{t('closeBtn')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {EXERCISES_CATALOG
                .filter(e => e.category && e.category !== 'кардио')
                .map((ex, idx) => (
                  <TouchableOpacity
                    key={ex.id}
                    style={[
                      styles.modalItem,
                      { borderTopColor: colors.border },
                      selectedExercise === ex.name && styles.modalItemActive,
                      idx === 0 && { borderTopWidth: 0 }
                    ]}
                    onPress={() => {
                      setSelectedExercise(ex.name);
                      setPickerVisible(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, { color: colors.textPrimary }, selectedExercise === ex.name && styles.modalItemTextActive]}>{ex.name}</Text>
                    {selectedExercise === ex.name && <Text style={styles.modalItemCheck}>✓</Text>}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 32, fontFamily: 'Inter_700Bold' },
  shareBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  segmentControl: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  segment: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeSegment: {},
  segmentText: { color: '#8E8E93', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  gridItem: { flex: 1, minWidth: '45%', borderRadius: 20, padding: 18, alignItems: 'flex-start', gap: 10 },
  gridValue: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 4 },
  gridLabel: { color: '#8E8E93', fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 2 },
  chartCard: { borderRadius: 24, padding: 20, marginBottom: 20 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sectionTitle: { color: '#8E8E93', fontSize: 13, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase' },
  chartSubtitle: { fontSize: 26, fontFamily: 'Inter_800ExtraBold', marginTop: 4 },
  metricToggles: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  metricBtn: { padding: 8, borderRadius: 8 },
  strengthHeader: { marginBottom: 10 },
  emptyChart: { height: 160, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  emptyChartText: { color: '#8E8E93', textAlign: 'center', fontFamily: 'Inter_500Medium', lineHeight: 20 },
  pieContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pieLegend: { flex: 1, marginLeft: 25, gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  legendText: { color: '#8E8E93', fontSize: 14, fontFamily: 'Inter_500Medium', flex: 1 },
  legendValue: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  customPickerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginTop: 10 },
  customPickerText: { fontSize: 16, fontFamily: 'Inter_500Medium' },
  customPickerChevron: { color: '#8E8E93', fontSize: 12 },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', zIndex: 999 },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: '70%', borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: '#8E8E93', fontSize: 16, lineHeight: 18 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderTopWidth: 1 },
  modalItemActive: { backgroundColor: 'rgba(255, 59, 48, 0.1)' },
  modalItemText: { fontSize: 16, fontFamily: 'Inter_500Medium' },
  modalItemTextActive: { color: '#FF3B30', fontFamily: 'Inter_700Bold' },
  modalItemCheck: { color: '#FF3B30', fontSize: 18, fontWeight: 'bold' },
});
