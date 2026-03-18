// src/screens/StatisticsScreen.js
import React, { useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  TouchableOpacity, Dimensions, Share 
} from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts'; 
import { 
  Info, Activity, Flame, MessageSquare, 
  Share as ShareIcon, Target, Dumbbell, MapPin, Clock 
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePedometer } from '../hooks/usePedometer';

import colors from '../constants/colors';
import { useWorkoutStore } from '../store/workoutStore';
import { useUserStore } from '../store/userStore';
import { getMetricValue, parseWorkoutDate } from '../utils/statsCalculator';

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
  const [chartMetric, setChartMetric] = useState('calories'); // calories | distance | duration
  
  const workouts = useWorkoutStore(s => s.workouts);
  const user = useUserStore(s => s.user); 
  
  const { steps: liveSteps, isAvailable } = usePedometer();
  const dailyStats = { steps: liveSteps }; 

  // ✅ 1. БАЗОВЫЙ АНАЛИЗ И СОВЕТЫ
  const analysisData = useMemo(() => {
    const stats = analyzeWeeklyStats(workouts);
    const healthScore = getHealthScore(stats, dailyStats, user);
    const scoreInfo = getScoreDescription(healthScore);
    const advices = generateCoachAdvice(stats, dailyStats, user);
    const quote = getMotivationalQuote();

    return { stats, healthScore, scoreInfo, advices, quote };
  }, [workouts, isAvailable, dailyStats.steps, user]);

  // ✅ 2. СВОДКА И КРУГОВАЯ ДИАГРАММА (ЗА ПЕРИОД)
  const summaryStats = useMemo(() => {
    const now = new Date();
    const daysToSubtract = period === 'Неделя' ? 7 : 28;
    const startDate = new Date(now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);

    const periodWorkouts = workouts.filter(w => {
      const wDate = parseWorkoutDate(w.date || w.startTime);
      return wDate >= startDate && wDate <= now;
    });

    let totalCal = 0, totalDist = 0, totalDur = 0;
    const typeMap = {};

    periodWorkouts.forEach(w => {
      totalCal += getMetricValue(w.metrics, '🔥') || w.calories || 0;
      totalDist += getMetricValue(w.metrics, '📍') || w.distance || 0;
      totalDur += getMetricValue(w.metrics, '⏱️') || w.duration || 0;
      const type = w.type || 'Другое';
      typeMap[type] = (typeMap[type] || 0) + 1;
    });

    const pieColors = { 
      'Пробежка': colors.green || '#32d74b', 
      'Силовая': colors.yellow || '#FF9F0A', 
      'Кардио': colors.red || '#FF3B30', 
      'Велосипед': colors.blue || '#0A84FF', 
      'Ходьба': colors.chartSteps || '#E0B0FF', 
      'Другое': '#8E8E93' 
    };

    const pieData = Object.keys(typeMap).map(type => ({
      value: typeMap[type],
      color: pieColors[type] || pieColors['Другое'],
      label: type
    }));

    return { 
      totalCal: Math.round(totalCal), 
      totalDist: (Math.round(totalDist * 10) / 10), 
      totalDur, 
      count: periodWorkouts.length,
      pieData 
    };
  }, [workouts, period]);

  // ✅ 3. ГРАФИК АКТИВНОСТИ (BarChart) - С ДИНАМИЧЕСКИМИ ЦВЕТАМИ
  const chartStats = useMemo(() => {
    const now = new Date();
    const dataMap = {};

    workouts.forEach(w => {
      const wDate = parseWorkoutDate(w.date || w.startTime);
      const dateKey = wDate.toDateString();
      
      let val = 0;
      if (chartMetric === 'calories') val = getMetricValue(w.metrics, '🔥') || w.calories || 0;
      if (chartMetric === 'distance') val = getMetricValue(w.metrics, '📍') || w.distance || 0;
      if (chartMetric === 'duration') val = getMetricValue(w.metrics, '⏱️') || w.duration || 0;
      
      dataMap[dateKey] = (dataMap[dateKey] || 0) + val;
    });

    let rawBarData = [];

    if (period === 'Неделя') {
      const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i); dates.push(d);
      }
      rawBarData = dates.map((d, i) => ({ value: dataMap[d.toDateString()] || 0, label: labels[i] || '' }));
    } else {
      const weeks = [0, 0, 0, 0];
      const labels = ['1 нед', '2 нед', '3 нед', '4 нед'];
      for (let i = 27; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i);
        const weekIndex = Math.floor((27 - i) / 7); 
        weeks[weekIndex] += dataMap[d.toDateString()] || 0;
      }
      rawBarData = weeks.map((val, idx) => ({ value: val, label: labels[idx] }));
    }

    const rawMax = Math.max(...rawBarData.map(b => b.value));
    const maxValue = rawMax === 0 ? 10 : rawMax * 1.2;

    const barData = rawBarData.map(item => {
      const isLeader = item.value === rawMax && rawMax > 0;
      
      // ✅ Динамический цвет в зависимости от выбранной метрики
      let baseColor = '#2C2C2E';
      if (item.value > 0) {
        if (chartMetric === 'calories') baseColor = colors.chartCalories || '#ff3b30';
        if (chartMetric === 'distance') baseColor = colors.chartDistance || '#4da6ff';
        if (chartMetric === 'duration') baseColor = colors.chartTime || '#32d74b';
      }
      const leaderColor = colors.primary || '#CCFF00';

      return {
        ...item,
        // Если 0, рисуем серую заглушку
        value: item.value === 0 ? (maxValue * 0.05) : item.value, 
        frontColor: item.value === 0 ? '#2C2C2E' : (isLeader ? leaderColor : baseColor),
        topLabelComponent: isLeader && period === 'Неделя' ? () => <Text style={styles.topLabelText}>Пик</Text> : undefined,
      };
    });

    const unit = chartMetric === 'calories' ? 'ккал' : chartMetric === 'distance' ? 'км' : 'мин';
    const total = rawBarData.reduce((s, b) => s + b.value, 0);

    return { barData, totalValue: chartMetric === 'distance' ? total.toFixed(1) : total, unit, maxValue };
  }, [workouts, period, chartMetric]);

  // ✅ Функция Поделиться
  const handleShare = async () => {
    try {
      await Share.share({
        message: `🔥 Мой фитнес-отчет за ${period.toLowerCase()}: Оценка здоровья ${analysisData.healthScore} баллов! Я провел ${summaryStats.count} тренировок, сжег ${summaryStats.totalCal} ккал и прошел ${summaryStats.totalDist} км. Присоединяйся к тренировкам в FitTrack! 💪`,
      });
    } catch (error) {
      console.log('Ошибка шаринга', error);
    }
  };

  const formatTime = (m) => m < 60 ? `${m}м` : `${Math.floor(m/60)}ч ${m%60}м`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
         <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Статистика</Text>
            <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
               <ShareIcon size={20} color="white" />
            </TouchableOpacity>
         </View>
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
         
         {/* 🎯 ОЦЕНКА ЗДОРОВЬЯ И ЦЕЛЬ */}
         <View style={styles.topRowCards}>
            <View style={[styles.scoreContainer, { flex: user?.targetWeight ? 1.2 : 1 }]}>
               <View style={[styles.scoreCircle, { borderColor: analysisData.scoreInfo.color }]}>
                  <Text style={styles.scoreNumber}>{analysisData.healthScore}</Text>
               </View>
               <View style={styles.scoreTextContainer}>
                  <Text style={[styles.scoreTitle, { color: analysisData.scoreInfo.color }]}>{analysisData.scoreInfo.level}</Text>
                  <Text style={styles.scoreSubtitle}>{analysisData.scoreInfo.text}</Text>
               </View>
            </View>

            {/* ПРОГРЕСС ЦЕЛИ */}
            {user?.targetWeight && (
              <View style={styles.goalProgressCard}>
                 <Target size={20} color="#0A84FF" style={{ marginBottom: 4 }} />
                 <Text style={styles.goalLabel}>Цель: {user.targetWeight} кг</Text>
                 <Text style={styles.goalValue}>Вес: {user.weight} кг</Text>
                 <Text style={styles.goalDiff}>
                    {Number(user.weight) === Number(user.targetWeight)
                      ? '✅ Идеально!'
                      : Number(user.weight) > Number(user.targetWeight)
                        ? `Осталось сбросить: ${(user.weight - user.targetWeight).toFixed(1)} кг`
                        : `Осталось набрать: ${(user.targetWeight - user.weight).toFixed(1)} кг`
                    }
                 </Text>
              </View>
            )}
         </View>

         {/* 🧮 СЕТКА ИТОГОВ 2x2 */}
         <View style={styles.miniGrid}>
            <View style={styles.gridItem}>
               <Dumbbell size={18} color={colors.yellow || "#FFD60A"} />
               <View>
                 <Text style={styles.gridValue}>{summaryStats.count}</Text>
                 <Text style={styles.gridLabel}>Тренировок</Text>
               </View>
            </View>
            <View style={styles.gridItem}>
               <Clock size={18} color={colors.green || "#32d74b"} />
               <View>
                 <Text style={styles.gridValue}>{formatTime(summaryStats.totalDur)}</Text>
                 <Text style={styles.gridLabel}>Время</Text>
               </View>
            </View>
            <View style={styles.gridItem}>
               <Flame size={18} color={colors.red || "#FF3B30"} />
               <View>
                 <Text style={styles.gridValue}>{summaryStats.totalCal.toLocaleString()}</Text>
                 <Text style={styles.gridLabel}>Калорий</Text>
               </View>
            </View>
            <View style={styles.gridItem}>
               <MapPin size={18} color={colors.blue || "#0A84FF"} />
               <View>
                 <Text style={styles.gridValue}>{summaryStats.totalDist}</Text>
                 <Text style={styles.gridLabel}>Километров</Text>
               </View>
            </View>
         </View>

         {/* 📊 ГРАФИК АКТИВНОСТИ */}
         <View style={styles.chartCard}>
             <View style={styles.chartHeader}>
                 <View>
                     <Text style={styles.chartSubtitle}>{chartStats.totalValue.toLocaleString()} {chartStats.unit}</Text>
                 </View>
                 <View style={styles.metricToggles}>
                    <TouchableOpacity onPress={() => setChartMetric('calories')} style={[styles.metricBtn, chartMetric === 'calories' && styles.metricBtnActive]}>
                       <Flame size={14} color={chartMetric === 'calories' ? (colors.chartCalories || '#ff3b30') : '#8E8E93'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setChartMetric('distance')} style={[styles.metricBtn, chartMetric === 'distance' && styles.metricBtnActive]}>
                       <MapPin size={14} color={chartMetric === 'distance' ? (colors.chartDistance || '#4da6ff') : '#8E8E93'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setChartMetric('duration')} style={[styles.metricBtn, chartMetric === 'duration' && styles.metricBtnActive]}>
                       <Clock size={14} color={chartMetric === 'duration' ? (colors.chartTime || '#32d74b') : '#8E8E93'} />
                    </TouchableOpacity>
                 </View>
             </View>
             
             <View style={{ marginTop: 20 }}>
                <BarChart 
                    data={chartStats.barData} 
                    disableScroll={true} 
                    
                    barWidth={period === 'Месяц' ? 36 : 18} 
                    adjustToWidth={period === 'Неделя'}
                    spacing={period === 'Месяц' ? (width - 130 - (4 * 36)) / 3 : undefined}
                    
                    noOfSections={3} 
                    maxValue={chartStats.maxValue} 
                    barBorderRadius={4} 
                    yAxisThickness={0} 
                    xAxisThickness={1} 
                    xAxisColor="#2C2C2E"
                    
                    height={160} 
                    width={width - 130}
                    
                    endSpacing={period === 'Неделя' ? 0 : 10} 
                    initialSpacing={period === 'Месяц' ? 10 : 0}
                    
                    yAxisTextStyle={{ color: '#8E8E93', fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: '#8E8E93', fontSize: 11, textAlign: 'center' }}
                    hideRules={false} 
                    rulesColor="rgba(255,255,255,0.05)"
                    isAnimated 
                    animationDuration={500} 
                />
             </View>
         </View>

         {/* 🍕 КРУГОВАЯ ДИАГРАММА */}
         {summaryStats.pieData.length > 0 && (
           <View style={styles.chartCard}>
              <Text style={[styles.sectionTitle, { marginBottom: 20 }]}>Виды активности</Text>
              <View style={styles.pieContainer}>
                 <PieChart 
                    data={summaryStats.pieData} 
                    donut radius={70} innerRadius={45} 
                    backgroundColor="transparent"
                 />
                 <View style={styles.pieLegend}>
                    {summaryStats.pieData.map((item, idx) => (
                      <View key={idx} style={styles.legendItem}>
                         <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                         <Text style={styles.legendText}>{item.label} ({item.value})</Text>
                      </View>
                    ))}
                 </View>
              </View>
           </View>
         )}

         {/* 🤖 СОВЕТЫ ТРЕНЕРА */}
         <Text style={styles.sectionTitle}>Тренер рекомендует</Text>
         {analysisData.advices.map((advice, i) => {
            const getIcon = () => {
              if(advice.type === 'success') return <Activity color={colors.green || "#32d74b"} size={24} />;
              if(advice.type === 'warning') return <Flame color={colors.yellow || "#FF9F0A"} size={24} />;
              if(advice.type === 'info') return <Info color={colors.blue || "#0A84FF"} size={24} />;
              return <MessageSquare color="#8E8E93" size={24} />;
            };
            return (
               <View key={i} style={styles.insightCard}>
                   <View style={styles.iconBox}>{getIcon()}</View>
                   <View style={styles.insightContent}>
                       <Text style={styles.insightTitle}>{advice.title}</Text>
                       <Text style={styles.insightText}>{advice.text}</Text>
                   </View>
               </View>
            );
         })}

         {/* 💬 МОТИВАЦИЯ */}
         <LinearGradient colors={['#1C1C1E', '#2C2C2E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quoteCard}>
            <Text style={styles.quoteText}>"{analysisData.quote}"</Text>
         </LinearGradient>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background || '#000' },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 32, fontFamily: 'Inter_700Bold', color: 'white' },
  shareBtn: { width: 40, height: 40, backgroundColor: '#1C1C1E', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2C2C2E' },
  
  segmentControl: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 12, padding: 4 },
  segment: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeSegment: { backgroundColor: '#2C2C2E' },
  segmentText: { color: '#8E8E93', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  activeSegmentText: { color: 'white' },

  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },

  topRowCards: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  scoreContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', padding: 15, borderRadius: 20, gap: 15 },
  scoreCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  scoreNumber: { color: 'white', fontSize: 18, fontFamily: 'Inter_800ExtraBold' },
  scoreTextContainer: { flex: 1 },
  scoreTitle: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', marginBottom: 2 },
  scoreSubtitle: { color: '#8E8E93', fontSize: 11, fontFamily: 'Inter_500Medium', lineHeight: 14 },

  goalProgressCard: { flex: 1, backgroundColor: 'rgba(10, 132, 255, 0.1)', padding: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(10, 132, 255, 0.3)', justifyContent: 'center' },
  goalLabel: { color: '#0A84FF', fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  goalValue: { color: 'white', fontSize: 11, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  goalDiff: { color: '#8E8E93', fontSize: 10, fontFamily: 'Inter_600SemiBold' },

  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  gridItem: { flex: 1, minWidth: '45%', backgroundColor: '#1C1C1E', borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  gridValue: { color: 'white', fontSize: 18, fontFamily: 'Inter_700Bold' },
  gridLabel: { color: '#8E8E93', fontSize: 11, fontFamily: 'Inter_500Medium' },

  chartCard: { backgroundColor: '#1C1C1E', borderRadius: 24, padding: 20, marginBottom: 20 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chartSubtitle: { color: 'white', fontSize: 24, fontFamily: 'Inter_700Bold', marginTop: 4 },
  
  metricToggles: { flexDirection: 'row', backgroundColor: '#000', borderRadius: 12, padding: 4 },
  metricBtn: { padding: 8, borderRadius: 8 },
  metricBtnActive: { backgroundColor: '#2C2C2E' },
  
  topLabelText: { color: '#CCFF00', fontSize: 10, fontFamily: 'Inter_600SemiBold', marginBottom: 4, textAlign: 'center', width: 40, marginLeft: -10 },

  pieContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pieLegend: { flex: 1, marginLeft: 20, gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#8E8E93', fontSize: 12, fontFamily: 'Inter_500Medium' },

  sectionTitle: { color: 'white', fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 15 },
  
  insightCard: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 20, padding: 16, marginBottom: 12, gap: 15 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
  insightContent: { flex: 1 },
  insightTitle: { color: 'white', fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  insightText: { color: '#8E8E93', fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },

  quoteCard: { borderRadius: 20, padding: 20, marginTop: 10, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  quoteText: { color: 'white', fontSize: 15, fontFamily: 'Inter_600SemiBold', fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
});
