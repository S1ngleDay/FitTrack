import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { ArrowLeft, Clock, CalendarCheck, Moon, Sun, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DetailsChart from '../components/DetailsChart';

import { useThemeColors } from '../hooks/useThemeColors';
import { useWorkoutStats } from '../hooks/useWorkoutStats';
import { useTranslation } from '../hooks/useTranslation'; // 👈 Добавили хук перевода

const { width } = Dimensions.get('window');

export default function TimeDetailsScreen({ navigation }) {
  const colors = useThemeColors();
  const stats = useWorkoutStats();
  const { t } = useTranslation(); // 👈 Вытаскиваем функцию перевода

  if (!stats) return null;

  const { totalMin, h, m, streak, chartRaw, heatmapData } = stats;
  const chartData = chartRaw; 

  const renderHeatmapItem = (level, index) => {
    let bg = colors.border;
    if (level === 1) bg = 'rgba(191, 90, 242, 0.4)';
    if (level === 2) bg = '#BF5AF2';
    return <View key={index} style={[styles.heatmapBox, { backgroundColor: bg }]} />;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <ArrowLeft color={colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('discipline')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* HERO */}
        <View style={styles.heroSection}>
          <View style={styles.timeRow}>
            <Text style={[styles.heroValue, { color: colors.textPrimary }]}>{h}</Text>
            <Text style={[styles.heroUnit, { color: colors.textSecondary }]}>{t('hourAbbr')}</Text>
            <Text style={[styles.heroValue, { color: colors.textPrimary }]}>{m}</Text>
            <Text style={[styles.heroUnit, { color: colors.textSecondary }]}>{t('minAbbr')}</Text>
          </View>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>{t('activityToday')}</Text>

          <View style={styles.streakBadge}>
            <Flame size={18} color="#FF9F0A" fill="#FF9F0A" />
            <Text style={styles.streakText}>{streak} {t('streakDays')}</Text>
          </View>
        </View>

        {/* HEATMAP */}
        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
          <View style={styles.cardHeader}>
            <CalendarCheck size={20} color="#BF5AF2" />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('yourRegularity')}</Text>
          </View>
          <View style={styles.heatmapGrid}>
            {heatmapData.map((level, i) => renderHeatmapItem(level, i))}
          </View>
          <Text style={[styles.heatmapFooter, { color: colors.textSecondary }]}>{t('last4Weeks')}</Text>
        </View>

        {/* CHART */}
        <View style={styles.chartWrapper}>
          <DetailsChart 
            data={chartData}
            title={t('loadDistribution')}
            color="#BF5AF2"
            yAxisSuffix={` ${t('minAbbr')}`} // Пробел перед мин/min
            type="bar"
          />
        </View>

        {/* STATS ROW */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 214, 10, 0.15)' }]}>
              <Sun size={24} color="#FFD60A" />
            </View>
            <View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{t('morning')}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('activityPeak')}</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
              <Clock size={24} color="#0A84FF" />
            </View>
            <View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{Math.round(totalMin * 7 / 60)} {t('hourAbbr')}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('weeklyForecast')}</Text>
            </View>
          </View>
        </View>

        {/* MOTIVATION */}
        <LinearGradient
          colors={['#BF5AF2', '#5E5CE6']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.funFactCard}
        >
          <View style={styles.funFactContent}>
            <View style={{flex: 1}}>
              <Text style={styles.funFactTitle}>{t('habitForming')}</Text>
              <Text style={styles.funFactText}>
                {t('extraLife')} {totalMin * 7} {t('lifeMinutes')}
              </Text>
            </View>
            <View style={styles.trophyBox}>
              <Moon size={28} color="white" />
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
  timeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  heroValue: { fontSize: 64, fontFamily: 'Inter_700Bold', lineHeight: 70 },
  heroUnit: { fontSize: 24, fontFamily: 'Inter_600SemiBold', marginRight: 10 },
  heroSubtitle: { fontSize: 16, marginBottom: 15, fontFamily: 'Inter_500Medium' },
  
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 159, 10, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: 'rgba(255, 159, 10, 0.3)' },
  streakText: { color: '#FF9F0A', fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  
  card: { borderRadius: 24, padding: 20, marginHorizontal: 20, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-start' },
  heatmapBox: { width: Math.floor((width - 80 - 36) / 7), height: 30, borderRadius: 6 },
  heatmapFooter: { marginTop: 10, fontSize: 12, textAlign: 'right' },
  
  chartWrapper: { marginBottom: 20 },
  
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20, paddingHorizontal: 20 },
  statCard: { flex: 1, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  
  funFactCard: { borderRadius: 24, padding: 20, marginHorizontal: 20 },
  funFactContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  funFactTitle: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: 'white', marginBottom: 4 },
  funFactText: { fontSize: 13, color: 'rgba(255,255,255,0.95)', fontFamily: 'Inter_500Medium', lineHeight: 18 },
  trophyBox: { backgroundColor: 'rgba(255,255,255,0.2)', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
});
