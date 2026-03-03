import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft, Footprints, MapPin, Flame, Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-gifted-charts';

import DetailsChart from '../components/DetailsChart'; 
import colors from '../constants/colors';
import generateFullDayData from '../utils/chartUtils';
import { useWorkoutStore } from '../store/workoutStore';
import { getMetricValue, isToday } from '../utils/statsCalculator';

export default function StepsDetailsScreen({ navigation }) {
  const workouts = useWorkoutStore(s => s.workouts);

  const stats = useMemo(() => {
    const todayWorkouts = workouts.filter(w => isToday(w.date));
    
    let steps = 0;
    let distance = 0;
    let calories = 0;
    
    // Агрегация по часам
    const hoursMap = new Array(24).fill(0);

    todayWorkouts.forEach(w => {
      const s = getMetricValue(w.metrics, '👣');
      steps += s;
      distance += getMetricValue(w.metrics, '📍');
      calories += getMetricValue(w.metrics, '🔥');

      let h = 12; // Дефолт если нет времени
      if (w.startTime) {
        h = new Date(w.startTime).getHours();
      }
      if (h >= 0 && h <= 23) {
        hoursMap[h] += s;
      }
    });

    // Формируем rawData: [{ value: 100, label: 13 }]
    const chartRaw = hoursMap.map((val, i) => ({ 
      value: val, 
      label: i // Передаем числом!
    }));

    return { steps, distance, calories, chartRaw };
  }, [workouts]);

  const stepGoal = 11000;
  const remaining = Math.max(0, stepGoal - stats.steps);
  
  const pieData = [
    { value: stats.steps || 1, color: '#32d74b', focused: true },
    { value: remaining, color: '#2C2C2E' } 
  ];

  const chartData = generateFullDayData(stats.chartRaw);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Активность</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* HERO */}
        <View style={styles.heroSection}>
          <PieChart
            donut
            innerRadius={80}
            radius={100}
            data={pieData}
            innerCircleColor={colors.background}
            centerLabelComponent={() => (
              <View style={{ alignItems: 'center' }}>
                <Footprints size={28} color="#32d74b" style={{marginBottom: 4}} />
                <Text style={styles.heroValue}>{stats.steps.toLocaleString()}</Text>
                <Text style={styles.heroLabel}>из {stepGoal.toLocaleString()}</Text>
              </View>
            )}
          />
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
            <View style={styles.statCard}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
                    <MapPin size={24} color="#0A84FF" />
                </View>
                <View>
                    <Text style={styles.statValue}>{stats.distance.toFixed(1)} км</Text>
                    <Text style={styles.statLabel}>Дистанция</Text>
                </View>
            </View>

            <View style={styles.statCard}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 159, 10, 0.15)' }]}>
                    <Flame size={24} color="#FF9F0A" />
                </View>
                <View>
                    <Text style={styles.statValue}>{stats.calories} ккал</Text>
                    <Text style={styles.statLabel}>Сожжено</Text>
                </View>
            </View>
        </View>

        {/* CHART */}
        <View style={styles.chartWrapper}>
            <DetailsChart 
              data={chartData}
              title="Активность по часам"
              color={colors.chartSteps}
              yAxisSuffix=""
              type="bar"
            />
        </View>

        {/* FUN FACT */}
        <LinearGradient
            colors={['#32d74b', '#007D35']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.funFactCard}
        >
            <View style={styles.funFactContent}>
                <View style={{flex: 1}}>
                    <Text style={styles.funFactTitle}>Отличный темп! ⚡</Text>
                    <Text style={styles.funFactText}>
                        Вы сделали {stats.steps} шагов сегодня.
                    </Text>
                </View>
                <View style={styles.trophyBox}>
                    <Trophy size={28} color="white" />
                </View>
            </View>
        </LinearGradient>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: 40},
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20, paddingHorizontal: 20 },
  headerTitle: { color: 'white', fontSize: 20, fontFamily: 'Inter_600SemiBold' },
  backButton: { padding: 8, backgroundColor: '#2C2C2E', borderRadius: 12 },
  heroSection: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  heroValue: { color: 'white', fontSize: 32, fontFamily: 'Inter_800ExtraBold', lineHeight: 38 },
  heroLabel: { color: '#8E8E93', fontSize: 14, fontFamily: 'Inter_500Medium' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20, paddingHorizontal: 20},
  statCard: { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: 'white' },
  statLabel: { fontSize: 12, color: '#8E8E93', fontFamily: 'Inter_500Medium' },
  chartWrapper: { marginBottom: 20 },
  funFactCard: { borderRadius: 24, padding: 20, marginTop: 10, marginHorizontal: 20 },
  funFactContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  funFactTitle: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: 'white', marginBottom: 4 },
  funFactText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontFamily: 'Inter_500Medium', lineHeight: 18 },
  trophyBox: { backgroundColor: 'rgba(255,255,255,0.2)', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
});
