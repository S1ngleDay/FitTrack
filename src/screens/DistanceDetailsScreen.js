import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft, Map, Timer, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import DetailsChart from '../components/DetailsChart'; 
import colors from '../constants/colors';
import generateFullDayData from '../utils/chartUtils';
import { useWorkoutStore } from '../store/workoutStore';
import { getMetricValue, isToday } from '../utils/statsCalculator';

export default function DistanceDetailsScreen({ navigation }) {
  const workouts = useWorkoutStore(s => s.workouts);

  const stats = useMemo(() => {
    const todayWorkouts = workouts.filter(w => isToday(w.date));
    let totalDist = 0;
    const hoursMap = new Array(24).fill(0);
    let maxDist = 0;

    todayWorkouts.forEach(w => {
      const d = getMetricValue(w.metrics, '📍');
      totalDist += d;
      if (d > maxDist) maxDist = d;

      let h = 12;
      if (w.startTime) {
        h = new Date(w.startTime).getHours();
      }
      if (h >= 0 && h <= 23) {
        hoursMap[h] += d;
      }
    });

    const chartRaw = hoursMap.map((val, i) => ({ value: val, label: i }));
    const avgPace = totalDist > 0 ? "5'30\"" : "-";

    return { totalDist, maxDist, chartRaw, avgPace };
  }, [workouts]);

  const goalDistance = 12.3;
  const progressPercent = Math.min((stats.totalDist / goalDistance) * 100, 100);
  const chartData = generateFullDayData(stats.chartRaw);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Дистанция</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.heroSection}>
          <View style={styles.distanceValueRow}>
             <Text style={styles.heroValue}>{stats.totalDist.toFixed(1)}</Text>
             <Text style={styles.heroUnit}>км</Text>
          </View>
          <Text style={styles.heroSubtitle}>Цель: {goalDistance} км</Text>
          <View style={styles.progressBarBg}>
            <LinearGradient
               colors={['#0A84FF', '#5AC8FA']}
               start={{x: 0, y: 0}} end={{x: 1, y: 0}}
               style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
            <View style={styles.statCard}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(50, 215, 75, 0.15)' }]}>
                    <Timer size={24} color="#32d74b" />
                </View>
                <View>
                    <Text style={styles.statValue}>{stats.avgPace}</Text>
                    <Text style={styles.statLabel}>Средний темп</Text>
                </View>
            </View>

            <View style={styles.statCard}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 69, 58, 0.15)' }]}>
                    <TrendingUp size={24} color="#FF453A" />
                </View>
                <View>
                    <Text style={styles.statValue}>{stats.maxDist.toFixed(1)} км</Text>
                    <Text style={styles.statLabel}>Максимум</Text>
                </View>
            </View>
        </View>

        <View style={styles.chartWrapper}>
            <DetailsChart 
              data={chartData}
              title="Динамика по часам"
              color="#0A84FF"
              yAxisSuffix=" км" 
              type="line" 
            />
        </View>

        <View style={styles.routeCard}>
            <View style={styles.routeHeader}>
                <View style={styles.routeIconBg}>
                    <Map size={24} color="#0A84FF" />
                </View>
                <View>
                    <Text style={styles.routeTitle}>Москва — Питер</Text>
                    <Text style={styles.routeSubtitle}>
                      Вы прошли {Math.round(stats.totalDist)} из 700 км
                    </Text>
                </View>
            </View>
            <View style={styles.mapVisual}>
                <View style={styles.mapLine} />
                <View style={[styles.mapDot, { left: `${Math.min(stats.totalDist/7, 100)}%`, backgroundColor: '#0A84FF' }]} />
                <View style={{ position: 'absolute', left: `${Math.min(stats.totalDist/7, 100)}%`, top: 25, transform: [{translateX: -15}] }}>
                     <Text style={styles.youAreHereText}>Вы здесь</Text>
                </View>
            </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 40 }, 
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20, paddingHorizontal: 20 },
  headerTitle: { color: 'white', fontSize: 20, fontFamily: 'Inter_600SemiBold' },
  backButton: { padding: 8, backgroundColor: '#2C2C2E', borderRadius: 12 },
  heroSection: { alignItems: 'center', marginBottom: 30, paddingHorizontal: 20 },
  distanceValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  heroValue: { color: 'white', fontSize: 64, fontFamily: 'Inter_700Bold', lineHeight: 70 },
  heroUnit: { color: '#8E8E93', fontSize: 24, fontFamily: 'Inter_600SemiBold' },
  heroSubtitle: { color: '#8E8E93', fontSize: 16, marginBottom: 15, fontFamily: 'Inter_500Medium' },
  progressBarBg: { width: '100%', height: 8, backgroundColor: '#2C2C2E', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20, paddingHorizontal: 20 },
  statCard: { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: 'white' },
  statLabel: { fontSize: 12, color: '#8E8E93', fontFamily: 'Inter_500Medium' },
  chartWrapper: { marginBottom: 20 },
  routeCard: { backgroundColor: '#1C1C1E', borderRadius: 24, padding: 20, marginHorizontal: 20, marginTop: 10 },
  routeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 30 },
  routeIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(10, 132, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
  routeTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: 'white' },
  routeSubtitle: { fontSize: 13, color: '#8E8E93', fontFamily: 'Inter_500Medium' },
  mapVisual: { height: 40, justifyContent: 'center', marginBottom: 10 },
  mapLine: { height: 2, backgroundColor: '#3A3A3C', width: '100%' },
  mapDot: { width: 12, height: 12, borderRadius: 6, position: 'absolute', top: 14 }, 
  youAreHereText: { color: '#0A84FF', fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 4 },
});
