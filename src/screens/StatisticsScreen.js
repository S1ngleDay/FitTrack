import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { TrendingUp, TrendingDown, Info, ArrowRight, Activity, Flame, MessageSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import colors from '../constants/colors';
import { useWorkoutStore } from '../store/workoutStore';
import { getMetricValue, parseWorkoutDate } from '../utils/statsCalculator';

// Импортируем функции анализа
import { 
  analyzeWeeklyStats, 
  generateCoachAdvice, 
  getMotivationalQuote, 
  getHealthScore, 
  getScoreDescription 
} from '../utils/coachAnalyzer'; 

const { width } = Dimensions.get('window');

export default function StatisticsScreen() {
  const [period, setPeriod] = useState('Неделя'); 
  const workouts = useWorkoutStore(s => s.workouts);
  
  // В реальном приложении шаги берутся из датчика
  const dailyStats = { steps: 8500 }; 

  // ✅ 1. АНАЛИЗ И СОВЕТЫ ТРЕНЕРА
  const analysisData = useMemo(() => {
    const stats = analyzeWeeklyStats(workouts);
    const healthScore = getHealthScore(stats, dailyStats);
    const scoreInfo = getScoreDescription(healthScore);
    const advices = generateCoachAdvice(stats, dailyStats);
    const quote = getMotivationalQuote();

    return { stats, healthScore, scoreInfo, advices, quote };
  }, [workouts]);

  // ✅ 2. ГРАФИК АКТИВНОСТИ (С группировкой)
  const chartStats = useMemo(() => {
    const now = new Date();

    // 1. Собираем все калории по датам в словарь
    const dataMap = {};
    workouts.forEach(w => {
      const wDate = parseWorkoutDate(w.date || w.startTime);
      const dateKey = wDate.toDateString();
      const cal = getMetricValue(w.metrics, '🔥') || w.calories || 0;
      dataMap[dateKey] = (dataMap[dateKey] || 0) + cal;
    });

    let rawBarData = [];

    // 2. Логика для НЕДЕЛИ (7 дней)
    if (period === 'Неделя') {
      const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      const dates = [];
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dates.push(d);
      }

      rawBarData = dates.map((d, i) => ({
        value: dataMap[d.toDateString()] || 0,
        label: labels[i] || '',
      }));
    } 
    // 3. Логика для МЕСЯЦА (4 недели)
    else {
      const weeks = [0, 0, 0, 0]; // 4 корзины для 4 недель
      const labels = ['1 нед', '2 нед', '3 нед', '4 нед'];

      // Берем последние 28 дней и раскидываем их по неделям
      for (let i = 27; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        
        // Индекс недели: 0, 1, 2 или 3
        const weekIndex = Math.floor((27 - i) / 7); 
        const key = d.toDateString();
        
        weeks[weekIndex] += dataMap[key] || 0;
      }

      rawBarData = weeks.map((val, idx) => ({
        value: val,
        label: labels[idx],
      }));
    }

    // 4. Находим максимумы и нули для стилизации
    const maxValue = Math.max(...rawBarData.map(b => b.value));
    const totalCal = rawBarData.reduce((sum, b) => sum + b.value, 0);
    const allZero = rawBarData.every(b => b.value === 0);

    // 5. Формируем финальные данные для графика
    const barData = rawBarData.map(item => {
      const isLeader = item.value === maxValue && maxValue > 0;
      
      return {
        ...item,
        // Обычные зеленые, лидер лаймовый, пустые - темно-серые
        frontColor: item.value === 0 ? '#2C2C2E' : (isLeader ? '#CCFF00' : '#32d74b'),
        topLabelComponent: isLeader && period === 'Неделя' ? () => (
          <Text style={styles.topLabelText}>Пик</Text>
        ) : undefined,
      };
    });

    return { barData, totalCal, allZero, maxValue };
  }, [workouts, period]);

  // Рендер иконок для советов
  const renderAdviceIcon = (type) => {
    switch(type) {
      case 'success': return <Activity color="#32d74b" size={24} />;
      case 'warning': return <Flame color="#FF9F0A" size={24} />;
      case 'info': return <Info color="#0A84FF" size={24} />;
      default: return <MessageSquare color="#8E8E93" size={24} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
         <Text style={styles.headerTitle}>Статистика</Text>
         <View style={styles.segmentControl}>
             {['Неделя', 'Месяц'].map(p => (
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
         
         {/* 🎯 ОЦЕНКА ЗДОРОВЬЯ */}
         <View style={styles.scoreContainer}>
            <View style={[styles.scoreCircle, { borderColor: analysisData.scoreInfo.color }]}>
               <Text style={styles.scoreNumber}>{analysisData.healthScore}</Text>
               <Text style={styles.scoreLabel}>баллов</Text>
            </View>
            <View style={styles.scoreTextContainer}>
               <Text style={[styles.scoreTitle, { color: analysisData.scoreInfo.color }]}>
                  {analysisData.scoreInfo.level}
               </Text>
               <Text style={styles.scoreSubtitle}>{analysisData.scoreInfo.text}</Text>
            </View>
         </View>

         {/* 📊 ГРАФИК */}
         <View style={styles.chartCard}>
             <View style={styles.chartHeader}>
                 <View>
                     <Text style={styles.chartTitle}>Сожжено калорий</Text>
                     <Text style={styles.chartSubtitle}>{chartStats.totalCal.toLocaleString()} ккал</Text>
                 </View>
             </View>
             
             <View style={{ marginTop: 20 }}>
                <BarChart 
                    data={chartStats.barData} 
                    disableScroll={true} 
                    barWidth={period === 'Месяц' ? 50 : 22} 
                    noOfSections={3} // 3 линии сетки
                    maxValue={chartStats.maxValue === 0 ? 1000 : undefined} // Если пусто, ставим шкалу 1000
                    barBorderRadius={4} 
                    yAxisThickness={0} 
                    xAxisThickness={0} 
                    height={150}
                    width={width - 80}
                    // Прячем шкалу Y, если данных нет
                    yAxisTextStyle={{ color: 'gray', fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: 'gray', fontSize: 12 }}
                    hideRules
                    isAnimated
                    animationDuration={500} // Сделали анимацию быстрее (0.5 сек)
                    initialSpacing={10} 
                />
             </View>
         </View>

         {/* 🤖 СОВЕТЫ ТРЕНЕРА */}
         <Text style={styles.sectionTitle}>Тренер рекомендует</Text>
         
         {analysisData.advices.map((advice, i) => (
             <View key={i} style={styles.insightCard}>
                 <View style={styles.iconBox}>
                     {renderAdviceIcon(advice.type)}
                 </View>
                 <View style={styles.insightContent}>
                     <Text style={styles.insightTitle}>{advice.title}</Text>
                     <Text style={styles.insightText}>{advice.text}</Text>
                 </View>
             </View>
         ))}

         {/* 💬 МОТИВАЦИЯ */}
         <LinearGradient
            colors={['#1C1C1E', '#2C2C2E']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.quoteCard}
         >
            <Text style={styles.quoteText}>"{analysisData.quote}"</Text>
         </LinearGradient>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background || '#000' },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  headerTitle: { fontSize: 32, fontFamily: 'Inter_700Bold', color: 'white', marginBottom: 15 },
  
  segmentControl: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 12, padding: 4 },
  segment: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeSegment: { backgroundColor: '#2C2C2E' },
  segmentText: { color: '#8E8E93', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  activeSegmentText: { color: 'white' },

  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },

  // Стили для оценки здоровья
  scoreContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', padding: 20, borderRadius: 24, marginBottom: 20, gap: 20 },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  scoreNumber: { color: 'white', fontSize: 24, fontFamily: 'Inter_800ExtraBold' },
  scoreLabel: { color: '#8E8E93', fontSize: 10, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase' },
  scoreTextContainer: { flex: 1 },
  scoreTitle: { fontSize: 20, fontFamily: 'Inter_800ExtraBold', marginBottom: 4 },
  scoreSubtitle: { color: '#8E8E93', fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },

  // Стили для графика
  chartCard: { backgroundColor: '#1C1C1E', borderRadius: 24, padding: 20, marginBottom: 30 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chartTitle: { color: '#8E8E93', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  chartSubtitle: { color: 'white', fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 4 },
  topLabelText: { color: '#CCFF00', fontSize: 10, fontFamily: 'Inter_600SemiBold', marginBottom: 4, textAlign: 'center', width: 40, marginLeft: -10 },

  sectionTitle: { color: 'white', fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 15 },
  
  // Стили для карточек тренера
  insightCard: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 20, padding: 16, marginBottom: 12, gap: 15 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
  insightContent: { flex: 1 },
  insightTitle: { color: 'white', fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  insightText: { color: '#8E8E93', fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },

  // Цитата
  quoteCard: { borderRadius: 20, padding: 20, marginTop: 10, borderWidth: 1, borderColor: '#333' },
  quoteText: { color: 'white', fontSize: 15, fontFamily: 'Inter_600SemiBold', fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
});
