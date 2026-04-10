import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Flame, Zap, Utensils, Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-gifted-charts';

import DetailsChart from '../components/DetailsChart'; 
import { useThemeColors } from '../hooks/useThemeColors';
import { useCaloriesStats } from '../hooks/useCaloriesStats';
import { useTranslation } from '../hooks/useTranslation';

export default function CaloriesDetailsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const stats = useCaloriesStats();
  const { t } = useTranslation();

  const { totalCal, chartData, pieData, intensity, progressPercent } = stats;
  const { runCal, strengthCal, otherCal, calGoal } = stats;

  const renderDot = (color) => (
    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 6 }} />
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 0 }]} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <ArrowLeft color={colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('energy')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* HERO */}
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Flame size={40} color="#FF9F0A" fill="#FF9F0A" />
          </View>
          <Text style={[styles.heroValue, { color: colors.textPrimary }]}>{totalCal}</Text>
          <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>{t('kcalBurned')}</Text>
          <Text style={styles.heroSubLabel}>{t('goalKcal')} {calGoal} {t('caloriesAbbr')}</Text>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 214, 10, 0.15)' }]}>
              <Zap size={24} color="#FFD60A" />
            </View>
            <View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{intensity}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('intensity')}</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(52, 199, 89, 0.15)' }]}>
              <Activity size={24} color="#34C759" />
            </View>
            <View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{Math.round(progressPercent)}%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('of')} {calGoal}</Text>
            </View>
          </View>
        </View>

        {/* CHART */}
        <View style={styles.chartWrapper}>
          <DetailsChart 
            data={chartData}
            title={t('activityOverTime')}
            color={colors.chartCalories || '#FF453A'}
            yAxisSuffix="" 
            type="line" 
          />
        </View>

        {/* PIE CHART */}
        <View style={[styles.sourcesCard, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('burnSources')}</Text>
          <View style={styles.pieRow}>
            <PieChart
              data={pieData}
              donut
              radius={60}
              innerRadius={45}
              innerCircleColor={colors.cardBg}
              centerLabelComponent={() => <Flame size={24} color="#FF9F0A" />}
            />
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                {renderDot('#FF9F0A')}<Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('runSource')} ({runCal})</Text>
              </View>
              <View style={styles.legendItem}>
                {renderDot('#FF453A')}<Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('strengthSource')} ({strengthCal})</Text>
              </View>
              <View style={styles.legendItem}>
                {renderDot('#FFD60A')}<Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('otherSource')} ({otherCal})</Text>
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
              <Text style={styles.funFactTitle}>{t('greatJob')}</Text>
              <Text style={styles.funFactText}>
                {t('youBurned')} {totalCal} {t('likeBurgers')} {Math.round(totalCal / 250)} {t('burgers')}
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

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_600SemiBold' },
  backButton: { padding: 8, borderRadius: 12, borderWidth: 1 },
  
  heroSection: { alignItems: 'center', marginBottom: 30, paddingHorizontal: 20 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 159, 10, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255, 159, 10, 0.3)' },
  heroValue: { fontSize: 56, fontFamily: 'Inter_700Bold', lineHeight: 60 },
  heroLabel: { fontSize: 16, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  heroSubLabel: { color: '#FF9F0A', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20, paddingHorizontal: 20 },
  statCard: { flex: 1, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  
  chartWrapper: { marginBottom: 20 },
  
  sourcesCard: { borderRadius: 24, padding: 20, marginHorizontal: 20, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginBottom: 20 },
  pieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  legend: { flex: 1, marginLeft: 20, gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  
  funFactCard: { borderRadius: 24, padding: 20, marginHorizontal: 20 },
  funFactContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  funFactTitle: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: 'white', marginBottom: 4 },
  funFactText: { fontSize: 13, color: 'rgba(255,255,255,0.95)', fontFamily: 'Inter_500Medium', lineHeight: 18 },
  trophyBox: { backgroundColor: 'rgba(255,255,255,0.2)', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
});
