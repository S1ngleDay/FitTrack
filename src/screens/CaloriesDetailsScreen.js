// src/screens/CaloriesDetailsScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Flame, Zap, Utensils, Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-gifted-charts';

import DetailsChart from '../components/DetailsChart'; 
import colors from '../constants/colors';
import { useCaloriesStats } from '../hooks/useCaloriesStats';

export default function CaloriesDetailsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const stats = useCaloriesStats();

  const { totalCal, chartData, pieData, avgHeartRate, intensity } = stats;
  const { runCal, strengthCal, otherCal, calGoal } = stats;

  const renderDot = (color) => (
    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 6 }} />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 0 }]}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Энергия</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* HERO */}
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Flame size={40} color="#FF9F0A" fill="#FF9F0A" />
          </View>
          <Text style={styles.heroValue}>{totalCal}</Text>
          <Text style={styles.heroLabel}>ккал сожжено</Text>
          <Text style={styles.heroSubLabel}>Цель: {calGoal} ккал</Text>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 69, 58, 0.15)' }]}>
              <Activity size={24} color="#FF453A" />
            </View>
            <View>
              <Text style={styles.statValue}>~{avgHeartRate}</Text>
              <Text style={styles.statLabel}>Средний пульс</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 214, 10, 0.15)' }]}>
              <Zap size={24} color="#FFD60A" />
            </View>
            <View>
              <Text style={styles.statValue}>{intensity}</Text>
              <Text style={styles.statLabel}>Интенсивность</Text>
            </View>
          </View>
        </View>

        {/* CHART */}
        <View style={styles.chartWrapper}>
          <DetailsChart 
            data={chartData}
            title="Активность по времени"
            color={colors.chartCalories}
            yAxisSuffix="" 
            type="line" 
          />
        </View>

        {/* PIE CHART */}
        <View style={styles.sourcesCard}>
          <Text style={styles.cardTitle}>Источники сжигания</Text>
          <View style={styles.pieRow}>
            <PieChart
              data={pieData}
              donut
              radius={60}
              innerRadius={45}
              innerCircleColor="#1C1C1E"
              centerLabelComponent={() => <Flame size={24} color="#FF9F0A" />}
            />
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                {renderDot('#FF9F0A')}<Text style={styles.legendText}>Пробежка ({runCal})</Text>
              </View>
              <View style={styles.legendItem}>
                {renderDot('#FF453A')}<Text style={styles.legendText}>Силовая ({strengthCal})</Text>
              </View>
              <View style={styles.legendItem}>
                {renderDot('#FFD60A')}<Text style={styles.legendText}>Другое ({otherCal})</Text>
              </View>
            </View>
          </View>
        </View>

        {/* FUN FACT */}
        <LinearGradient
          colors={['#FF9F0A', '#FF3B30']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.funFactCard}
        >
          <View style={styles.funFactContent}>
            <View style={{flex: 1}}>
              <Text style={styles.funFactTitle}>Отличная работа! 🍔</Text>
              <Text style={styles.funFactText}>
                Вы сожгли {totalCal} ккал. Это как {Math.round(totalCal / 250)} бургера!
              </Text>
            </View>
            <View style={styles.trophyBox}>
              <Utensils size={28} color="white" />
            </View>
          </View>
        </LinearGradient>

      </ScrollView>
    </SafeAreaView>
  );
}

// styles остаются без изменений
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20, paddingHorizontal: 20 },
  headerTitle: { color: colors.textPrimary, fontSize: 20, fontFamily: 'Inter_600SemiBold' },
  backButton: { padding: 8, backgroundColor: '#2C2C2E', borderRadius: 12 },
  heroSection: { alignItems: 'center', marginBottom: 30, paddingHorizontal: 20 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 159, 10, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255, 159, 10, 0.3)' },
  heroValue: { color: colors.textPrimary, fontSize: 56, fontFamily: 'Inter_700Bold', lineHeight: 60 },
  heroLabel: { color: colors.textSecondary, fontSize: 16, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  heroSubLabel: { color: '#FF9F0A', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20, paddingHorizontal: 20 },
  statCard: { flex: 1, backgroundColor: colors.cardBg, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  statLabel: { fontSize: 12, color: colors.textSecondary, fontFamily: 'Inter_500Medium' },
  chartWrapper: { marginBottom: 20 },
  sourcesCard: { backgroundColor: colors.cardBg, borderRadius: 24, padding: 20, marginHorizontal: 20, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary, marginBottom: 20 },
  pieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  legend: { flex: 1, marginLeft: 20, gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendText: { color: colors.textSecondary, fontSize: 14, fontFamily: 'Inter_500Medium' },
  funFactCard: { borderRadius: 24, padding: 20, marginHorizontal: 20 },
  funFactContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  funFactTitle: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: 'white', marginBottom: 4 },
  funFactText: { fontSize: 13, color: 'rgba(255,255,255,0.95)', fontFamily: 'Inter_500Medium', lineHeight: 18 },
  trophyBox: { backgroundColor: 'rgba(255,255,255,0.2)', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
});
