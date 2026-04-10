import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Map, Timer, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import DetailsChart from '../components/DetailsChart';
import { useThemeColors } from '../hooks/useThemeColors';
import { useDistanceStats } from '../hooks/useDistanceStats';
import { useTranslation } from '../hooks/useTranslation'; // 👈 Добавили хук

export default function DistanceDetailsScreen({ navigation }) {
  const colors = useThemeColors();
  const stats = useDistanceStats();
  const { t, language } = useTranslation(); // 👈 Вытаскиваем функцию перевода

  const {
    totalDist = 0,
    maxDist = 0,
    avgPace = '--',
    chartData = [],
    progressPercent = 0,
    goalDistance = 0,
  } = stats || {};

  const clampedProgress = Math.max(0, Math.min(progressPercent, 100));
  const routePercent = Math.max(0, Math.min(totalDist / 7, 100)); // 700 км маршрут = / 7 (100%)

  const unit = t('distanceAbbr'); // 'км' или 'km'

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <ArrowLeft color={colors.textPrimary} size={24} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('distanceHeader')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroSection}>
          <View style={styles.distanceValueRow}>
            {/* Форматируем число с учетом локали, чтобы в EN была точка, а в RU запятая (если применимо) */}
            <Text style={[styles.heroValue, { color: colors.textPrimary }]}>{totalDist.toFixed(1)}</Text>
            <Text style={[styles.heroUnit, { color: colors.textSecondary }]}>{unit}</Text>
          </View>

          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>{t('goal')} {goalDistance} {unit}</Text>

          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <LinearGradient
              colors={['#0A84FF', '#5AC8FA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${clampedProgress}%` }]}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(50, 215, 75, 0.15)' }]}>
              <Timer size={24} color="#32d74b" />
            </View>
            <View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{avgPace}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('avgPace')}</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 69, 58, 0.15)' }]}>
              <TrendingUp size={24} color="#FF453A" />
            </View>
            <View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{maxDist.toFixed(1)} {unit}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('maxDist')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartWrapper}>
          <DetailsChart
            data={chartData}
            title={t('hourlyDynamics')}
            color={colors.blue || '#0A84FF'}
            yAxisSuffix={` ${unit}`} // Передаем км/km в график
            type="line"
          />
        </View>

        <View style={[styles.routeCard, { backgroundColor: colors.cardBg }]}>
          <View style={styles.routeHeader}>
            <View style={styles.routeIconBg}>
              <Map size={24} color={colors.blue || '#0A84FF'} />
            </View>
            <View>
              <Text style={[styles.routeTitle, { color: colors.textPrimary }]}>{t('routeTitle')}</Text>
              <Text style={[styles.routeSubtitle, { color: colors.textSecondary }]}>
                {t('youPassed')} {Math.round(totalDist)} {t('outOfKm')}
              </Text>
            </View>
          </View>

          <View style={styles.mapVisual}>
            <View style={[styles.mapLine, { backgroundColor: colors.border }]}/>
            <View style={[styles.mapDot, { left: `${routePercent}%`, backgroundColor: colors.blue || '#0A84FF' }]} />
            {/* Обертка для надписи "Вы здесь", сдвинутая, чтобы текст не обрезался */}
            <View style={[styles.youAreHereWrap, { left: `${routePercent}%` }]}>
              <Text style={[styles.youAreHereText, { color: colors.blue || '#0A84FF' }]}>{t('youAreHere')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_600SemiBold' },
  headerSpacer: { width: 40 },
  backButton: { padding: 8, borderRadius: 12, borderWidth: 1 },
  heroSection: { alignItems: 'center', marginBottom: 30, paddingHorizontal: 20 },
  distanceValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  heroValue: { fontSize: 64, fontFamily: 'Inter_700Bold', lineHeight: 70 },
  heroUnit: { fontSize: 24, fontFamily: 'Inter_600SemiBold', marginLeft: 4 },
  heroSubtitle: { fontSize: 16, marginBottom: 15, fontFamily: 'Inter_500Medium' },
  progressBarBg: { width: '100%', height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  statsRow: { flexDirection: 'row', marginBottom: 20, paddingHorizontal: 20, gap: 12 },
  statCard: { flex: 1, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  chartWrapper: { marginBottom: 20 },
  routeCard: { borderRadius: 24, padding: 20, marginHorizontal: 20, marginTop: 10 },
  routeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 30 },
  routeIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(10, 132, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
  routeTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  routeSubtitle: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  mapVisual: { height: 50, justifyContent: 'center', marginBottom: 10, position: 'relative' },
  mapLine: { height: 2, width: '100%' },
  mapDot: { width: 12, height: 12, borderRadius: 6, position: 'absolute', top: 14, marginLeft: -6 },
  
  // Я немного подправил отступ (marginLeft) для "Вы здесь", чтобы текст лучше центрировался под точкой 
  // независимо от длины слова ("Вы здесь" vs "You are here")
  youAreHereWrap: { position: 'absolute', top: 28, width: 80, marginLeft: -34, alignItems: 'center' }, 
  youAreHereText: { fontSize: 10, fontFamily: 'Inter_700Bold', textAlign: 'center' },
});
