// src/screens/StepsDetailsScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Footprints, MapPin, Flame, Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-gifted-charts';

import DetailsChart from '../components/DetailsChart';
import colors from '../constants/colors';
import { useStepsStats } from '../hooks/useStepsStats';

export default function StepsDetailsScreen({ navigation }) {
  const stats = useStepsStats();

  if (stats.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary || '#32d74b'} />
          <Text style={styles.loadingText}>Загрузка данных шагомера…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const {
    steps,
    distance,
    calories,
    chartData,
    pieData,
    stepGoal,
  } = stats;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
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
                <Footprints size={28} color="#32d74b" style={{ marginBottom: 4 }} />
                <Text style={styles.heroValue}>
                  {steps.toLocaleString('ru-RU')}
                </Text>
                <Text style={styles.heroLabel}>
                  из {stepGoal.toLocaleString('ru-RU')}
                </Text>
              </View>
            )}
          />
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: 'rgba(10, 132, 255, 0.15)' },
              ]}
            >
              <MapPin size={24} color="#0A84FF" />
            </View>
            <View>
              <Text style={styles.statValue}>
                {distance.toFixed(1)} км
              </Text>
              <Text style={styles.statLabel}>Дистанция</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: 'rgba(255, 159, 10, 0.15)' },
              ]}
            >
              <Flame size={24} color="#FF9F0A" />
            </View>
            <View>
              <Text style={styles.statValue}>{calories} ккал</Text>
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
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.funFactCard}
        >
          <View style={styles.funFactContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.funFactTitle}>Отличный темп! ⚡</Text>
              <Text style={styles.funFactText}>
                Вы сделали {steps.toLocaleString('ru-RU')} шагов сегодня.
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
  scroll: { backgroundColor: colors.background },
  container: {
    paddingBottom: 40,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
  },

  heroSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  heroValue: {
    color: colors.textPrimary,
    fontSize: 32,
    fontFamily: 'Inter_800ExtraBold',
    lineHeight: 38,
  },
  heroLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },

  chartWrapper: { marginBottom: 20 },

  funFactCard: {
    borderRadius: 24,
    padding: 20,
    marginTop: 10,
    marginHorizontal: 20,
  },
  funFactContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  funFactTitle: {
    fontSize: 18,
    fontFamily: 'Inter_800ExtraBold',
    color: 'white',
    marginBottom: 4,
  },
  funFactText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Inter_500Medium',
    lineHeight: 18,
  },
  trophyBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
});
