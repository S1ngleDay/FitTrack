import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { TrendingUp, TrendingDown, Calendar, ArrowRight, Zap, AlertCircle, Award } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import colors from '../constants/colors';
import { useWorkoutStore } from '../store/workoutStore';
import { getMetricValue, parseWorkoutDate } from '../utils/statsCalculator';

const { width } = Dimensions.get('window');

export default function StatisticsScreen() {
  const [period, setPeriod] = useState('Неделя'); // 'Неделя' | 'Месяц' | 'Год'
  const workouts = useWorkoutStore(s => s.workouts);

  // ✅ 1. РАСЧЕТ ДАННЫХ ДЛЯ ГРАФИКА
  const chartStats = useMemo(() => {
    const now = new Date();
    let daysCount = 7;
    let labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    if (period === 'Месяц') {
      daysCount = 30;
      labels = Array.from({ length: 30 }, (_, i) => String(i + 1));
    } else if (period === 'Год') {
      daysCount = 12;
      labels = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    }

    // Создаем массив дат (от daysCount назад до сегодня)
    const dates = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      dates.push(d);
    }

    // Группируем калории по дням
    const dataMap = {};
    workouts.forEach(w => {
      const wDate = parseWorkoutDate(w.date);
      const dateKey = wDate.toDateString();
      const cal = getMetricValue(w.metrics, '🔥');
      dataMap[dateKey] = (dataMap[dateKey] || 0) + cal;
    });

    // Формируем данные для графика
    const barData = dates.map((d, i) => {
      const key = d.toDateString();
      const value = dataMap[key] || 0;
      const isWeekend = period === 'Неделя' && (i === 5 || i === 6);
      
      return {
        value,
        label: labels[i] || '',
        frontColor: isWeekend && value === 0 ? '#2C2C2E' : '#32d74b',
      };
    });

    // Находим максимум (для бейджа)
    const maxValue = Math.max(...barData.map(b => b.value));
    const maxIndex = barData.findIndex(b => b.value === maxValue);
    if (maxIndex >= 0 && maxValue > 0) {
      barData[maxIndex].topLabelComponent = () => (
        <Text style={{ color: '#32d74b', fontSize: 10, marginBottom: 5 }}>Пик</Text>
      );
    }

    // Считаем тотал
    const totalCal = barData.reduce((sum, b) => sum + b.value, 0);

    return { barData, totalCal };
  }, [workouts, period]);

  // ✅ 2. ТРЕНД (Сравнение с предыдущим периодом)
  const trend = useMemo(() => {
    // Упрощенно: берем последние 7 дней vs предыдущие 7
    const now = new Date();
    const last7 = [];
    const prev7 = [];

    for (let i = 0; i < 7; i++) {
      const d1 = new Date(now);
      d1.setDate(now.getDate() - i);
      last7.push(d1.toDateString());

      const d2 = new Date(now);
      d2.setDate(now.getDate() - i - 7);
      prev7.push(d2.toDateString());
    }

    const calcTotal = (keys) => {
      return workouts
        .filter(w => keys.includes(parseWorkoutDate(w.date).toDateString()))
        .reduce((sum, w) => sum + getMetricValue(w.metrics, '🔥'), 0);
    };

    const lastTotal = calcTotal(last7);
    const prevTotal = calcTotal(prev7);

    if (prevTotal === 0) return { percent: 0, isPositive: true };
    const percent = Math.round(((lastTotal - prevTotal) / prevTotal) * 100);
    return { percent: Math.abs(percent), isPositive: percent >= 0 };
  }, [workouts]);

  // ✅ 3. КАТЕГОРИИ (Типы тренировок)
  const categories = useMemo(() => {
    const types = {};
    workouts.forEach(w => {
      const dur = getMetricValue(w.metrics, '⏱️');
      types[w.type] = (types[w.type] || 0) + dur;
    });

    const totalMin = Object.values(types).reduce((a, b) => a + b, 0);
    
    return Object.keys(types).map(type => ({
      type,
      minutes: types[type],
      percent: totalMin > 0 ? Math.round((types[type] / totalMin) * 100) : 0,
      color: type === 'Пробежка' ? '#0A84FF' : type === 'Силовая' ? '#FF453A' : '#FFD60A',
    }));
  }, [workouts]);

  // ✅ 4. AI ИНСАЙТЫ (умные подсказки)
  const insights = useMemo(() => {
    const result = [];
    
    // Инсайт 1: Стрик
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 10; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      if (workouts.some(w => w.date === dateStr)) streak++;
      else break;
    }

    if (streak >= 5) {
      result.push({
        icon: Award,
        color: '#FFD60A',
        title: `Серия ${streak} дней! 🔥`,
        text: 'Отличная регулярность! Ты входишь в топ 5% пользователей по дисциплине.',
      });
    }

    // Инсайт 2: Если тренд положительный
    if (trend.isPositive && trend.percent > 10) {
      result.push({
        icon: Zap,
        color: '#32d74b',
        title: 'Отличный прогресс!',
        text: `Твоя активность выросла на ${trend.percent}% за эту неделю. Продолжай в том же духе!`,
      });
    }

    // Инсайт 3: Если много тренировок подряд (нужен отдых)
    const last3Days = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      last3Days.push(d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }));
    }
    const recentWorkouts = workouts.filter(w => last3Days.includes(w.date));
    const recentIntensity = recentWorkouts.reduce((sum, w) => sum + getMetricValue(w.metrics, '🔥'), 0);

    if (recentWorkouts.length >= 3 && recentIntensity > 1000) {
      result.push({
        icon: AlertCircle,
        color: '#FF453A',
        title: 'Нужен отдых',
        text: 'Высокая нагрузка 3 дня подряд. Рекомендуем день активного восстановления (йога, прогулка).',
      });
    }

    // Заглушка если пусто
    if (result.length === 0) {
      result.push({
        icon: Calendar,
        color: '#0A84FF',
        title: 'Добавьте больше тренировок',
        text: 'Чем больше данных, тем точнее анализ и рекомендации.',
      });
    }

    return result;
  }, [workouts, trend]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
         <Text style={styles.headerTitle}>Статистика</Text>
         
         {/* Переключатель периодов */}
         <View style={styles.segmentControl}>
             {['Неделя', 'Месяц', 'Год'].map(p => (
                 <TouchableOpacity 
                    key={p} 
                    style={[styles.segment, period === p && styles.activeSegment]}
                    onPress={() => setPeriod(p)}
                 >
                     <Text style={[styles.segmentText, period === p && styles.activeSegmentText]}>{p}</Text>
                 </TouchableOpacity>
             ))}
         </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
         
         {/* ГЛАВНЫЙ ГРАФИК */}
         <View style={styles.chartCard}>
             <View style={styles.chartHeader}>
                 <View>
                     <Text style={styles.chartTitle}>Активность</Text>
                     <Text style={styles.chartSubtitle}>
                       {chartStats.totalCal.toLocaleString()} ккал
                     </Text>
                 </View>
                 <View style={[styles.trendBadge, !trend.isPositive && { backgroundColor: 'rgba(255, 69, 58, 0.1)' }]}>
                     {trend.isPositive ? <TrendingUp size={16} color="#32d74b" /> : <TrendingDown size={16} color="#FF453A" />}
                     <Text style={[styles.trendText, !trend.isPositive && { color: '#FF453A' }]}>
                       {trend.isPositive ? '+' : '-'}{trend.percent}%
                     </Text>
                 </View>
             </View>
             
             <View style={{ marginTop: 20 }}>
                <BarChart 
                    data={chartStats.barData} 
                    barWidth={period === 'Месяц' ? 8 : 22} 
                    noOfSections={3} 
                    barBorderRadius={4} 
                    yAxisThickness={0} 
                    xAxisThickness={0} 
                    height={180}
                    width={width - 80}
                    yAxisTextStyle={{ color: '#8E8E93' }}
                    xAxisLabelTextStyle={{ color: '#8E8E93', fontSize: period === 'Месяц' ? 9 : 12 }}
                    hideRules
                    spacing={period === 'Месяц' ? 4 : undefined}
                />
             </View>
         </View>

         {/* AI ИНСАЙТЫ */}
         <Text style={styles.sectionTitle}>Анализ тренера</Text>
         
         {insights.map((insight, i) => {
           const Icon = insight.icon;
           return (
             <View key={i} style={styles.insightCard}>
                 <View style={[styles.iconBox, { backgroundColor: `${insight.color}20` }]}>
                     <Icon size={24} color={insight.color} />
                 </View>
                 <View style={styles.insightContent}>
                     <Text style={styles.insightTitle}>{insight.title}</Text>
                     <Text style={styles.insightText}>{insight.text}</Text>
                 </View>
             </View>
           );
         })}

         {/* КАТЕГОРИИ */}
         {categories.length > 0 && (
           <>
             <Text style={styles.sectionTitle}>Категории</Text>
             <View style={styles.categoriesGrid}>
                 {categories.slice(0, 2).map((cat, i) => (
                   <View key={i} style={styles.catCard}>
                       <Text style={styles.catValue}>
                         {Math.floor(cat.minutes / 60)}ч {cat.minutes % 60}м
                       </Text>
                       <Text style={styles.catLabel}>{cat.type}</Text>
                       <View style={[styles.catBar, { width: `${cat.percent}%`, backgroundColor: cat.color }]} />
                   </View>
                 ))}
             </View>
           </>
         )}

         {/* Кнопка отчета */}
         <TouchableOpacity style={styles.reportButton}>
             <Text style={styles.reportText}>Сгенерировать отчет за {period.toLowerCase()}</Text>
             <ArrowRight size={20} color="#0A84FF" />
         </TouchableOpacity>
         
         <View style={{ height: 40 }} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  headerTitle: { fontSize: 32, fontFamily: 'Inter_700Bold', color: 'white', marginBottom: 15 },
  
  segmentControl: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 12, padding: 4 },
  segment: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeSegment: { backgroundColor: '#2C2C2E' },
  segmentText: { color: '#8E8E93', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  activeSegmentText: { color: 'white' },

  content: { paddingHorizontal: 20, paddingTop: 20 },

  chartCard: { backgroundColor: '#1C1C1E', borderRadius: 24, padding: 20, marginBottom: 30 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chartTitle: { color: '#8E8E93', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  chartSubtitle: { color: 'white', fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 4 },
  trendBadge: { flexDirection: 'row', backgroundColor: 'rgba(50, 215, 75, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignItems: 'center', gap: 4 },
  trendText: { color: '#32d74b', fontSize: 12, fontFamily: 'Inter_700Bold' },

  sectionTitle: { color: 'white', fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 15 },
  insightCard: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 20, padding: 16, marginBottom: 12, gap: 15 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  insightContent: { flex: 1 },
  insightTitle: { color: 'white', fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  insightText: { color: '#8E8E93', fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },

  categoriesGrid: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  catCard: { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16 },
  catValue: { color: 'white', fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  catLabel: { color: '#8E8E93', fontSize: 12, marginBottom: 10 },
  catBar: { height: 4, borderRadius: 2 },

  reportButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#0A84FF', marginBottom: 20 },
  reportText: { color: '#0A84FF', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
