// src/screens/HomeScreen.js
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleUser, Play, Footprints, Flame, Clock, Dumbbell, Wind, Bike } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../store/userStore';

import StatsCard from '../components/StatsCard';
import colors from '../constants/colors';
import { useWorkoutStore } from '../store/workoutStore';
import { getDailyStats, calculateProgress, getMetricValue } from '../utils/statsCalculator';

// ✅ НОВЫЙ ИМПОРТ (единый источник правды для шагов)
import { usePedometer } from '../hooks/usePedometer';

// Конфиг иконок и подзаголовков для каждого типа тренировки
const TYPE_CONFIG = {
  'Пробежка': {
    Icon: Footprints,
    getSubtitle: (stats) => `Ср. дистанция: ${stats.avgDistance} км`,
  },
  'Силовая': {
    Icon: Dumbbell,
    getSubtitle: (stats) => `Ср. калории: ${stats.avgCalories} ккал`,
  },
  'Кардио': {
    Icon: Flame,
    getSubtitle: (stats) => `Ср. время: ${stats.avgDuration} мин`,
  },
  'Велосипед': {
    Icon: Bike,
    getSubtitle: (stats) => `Ср. дистанция: ${stats.avgDistance} км`,
  },
  'Ходьба': {
    Icon: Wind,
    getSubtitle: (stats) => `Ср. шагов: ${stats.avgSteps.toLocaleString('ru-RU')}`,
  },
};

// Фолбек для неизвестных типов
const FALLBACK_CONFIG = {
  Icon: Clock,
  getSubtitle: (stats) => `${stats.count} тренировок`,
};

export default function HomeScreen({ navigation }) {
  const workouts = useWorkoutStore(s => s.workouts);
  const user = useUserStore(state => state.user);
  const firstName = user.name ? user.name.split(' ')[0] : 'Гость';

  // ✅ ПОЛУЧАЕМ ШАГИ ИЗ ХУКА
  const { steps: liveSteps, isAvailable } = usePedometer();

  const dailyStats = useMemo(() => getDailyStats(workouts), [workouts]);

  const today = new Date();
  const dateStr = today.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const goals = { steps: 11000, distance: 12.3, calories: 600, duration: 80 };

  const formatDuration = (m) => {
    if (!m) return '0м';
    if (m < 60) return `${m}м`;
    return `${Math.floor(m / 60)}ч ${m % 60}м`;
  };

  // ✅ ОПРЕДЕЛЯЕМ ШАГИ ДЛЯ ОТОБРАЖЕНИЯ (датчик ИЛИ тренировки)
  const displaySteps = isAvailable ? liveSteps : dailyStats.steps;

  // ✅ ВЫЧИСЛЯЕМ ПОПУЛЯРНЫЕ ПРОГРАММЫ ИЗ ИСТОРИИ
  const topPrograms = useMemo(() => {
    if (!workouts || workouts.length === 0) return [];

    const typeMap = {};

    workouts.forEach(w => {
      const type = w?.type;
      if (!type) return;

      if (!typeMap[type]) {
        typeMap[type] = {
          type,
          typeColor: w.typeColor || '#8E8E93',
          count: 0,
          totalCalories: 0,
          totalDistance: 0,
          totalDuration: 0,
          totalSteps: 0,
        };
      }

      typeMap[type].count += 1;

      typeMap[type].totalCalories +=
        (typeof w.calories === 'number' ? w.calories : 0) ||
        getMetricValue(w.metrics, '🔥') ||
        getMetricValue(w.metrics, 'ккал');

      typeMap[type].totalDistance +=
        (typeof w.distance === 'number' ? w.distance : 0) ||
        getMetricValue(w.metrics, '📍') ||
        getMetricValue(w.metrics, 'км');

      typeMap[type].totalDuration +=
        (typeof w.duration === 'number' ? w.duration : 0) ||
        getMetricValue(w.metrics, '⏱️') ||
        getMetricValue(w.metrics, 'мин');

      typeMap[type].totalSteps +=
        (typeof w.steps === 'number' ? w.steps : 0) ||
        getMetricValue(w.metrics, '👣') ||
        getMetricValue(w.metrics, 'шагов');
    });

    return Object.values(typeMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map(t => ({
        type: t.type,
        typeColor: t.typeColor,
        count: t.count,
        avgCalories: Math.round(t.totalCalories / t.count),
        avgDistance: Math.round((t.totalDistance / t.count) * 10) / 10,
        avgDuration: Math.round(t.totalDuration / t.count),
        avgSteps: Math.round(t.totalSteps / t.count),
      }));
  }, [workouts]);

  const startProgram = (type, title, subtitle) => {
    navigation.navigate('Тренировки', {
      autoStart: true,
      type,
      goalTitle: title,
      goalSubtitle: subtitle,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.date}>{formattedDate}</Text>
            <Text style={styles.greeting}>Привет, {firstName}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Настройки')} style={styles.avatarContainer}>
            {user.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={{ width: 32, height: 32, borderRadius: 16 }}
              />
            ) : (
              <CircleUser color="#E5E5EA" size={32} />
            )}
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <Text style={styles.sectionTitle}>Обзор дня</Text>
        <View style={styles.statsGrid}>
          <StatsCard
            title="Шаги"
            value={displaySteps.toLocaleString('ru-RU')}
            color={colors.chartSteps || '#0A84FF'}
            progress={calculateProgress(displaySteps, goals.steps)}
            onPress={() => navigation.navigate('StepsDetails')}
          />
          <StatsCard
            title="Дистанция"
            value={dailyStats.distance.toLocaleString('ru-RU')}
            unit="км"
            color={colors.chartDistance || '#32d74b'}
            progress={calculateProgress(dailyStats.distance, goals.distance)}
            onPress={() => navigation.navigate('DistanceDetails')}
          />
          <StatsCard
            title="Калории"
            value={String(dailyStats.calories)}
            unit="ккал"
            color={colors.chartCalories || '#FF453A'}
            progress={calculateProgress(dailyStats.calories, goals.calories)}
            onPress={() => navigation.navigate('CaloriesDetails')}
          />
          <StatsCard
            title="Время"
            value={formatDuration(dailyStats.duration)}
            unit=""
            color={colors.chartTime || '#FFD60A'}
            progress={calculateProgress(dailyStats.duration, goals.duration)}
            onPress={() => navigation.navigate('TimeDetails')}
          />
        </View>

        {/* ACTIONS */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Начать тренировку</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.quickStartBtn}
            onPress={() => startProgram('Пробежка', 'Быстрый старт', 'Свободный режим')}
          >
            <View style={styles.quickStartContent}>
              <View style={styles.playCircle}>
                <Play size={20} color="black" fill="black" style={{ marginLeft: 2 }} />
              </View>
              <Text style={styles.quickStartText}>Быстрый старт</Text>
            </View>
            <Text style={styles.quickStartSub}>Свободный режим</Text>
          </TouchableOpacity>

          <Text style={styles.subHeader}>
            Популярные программы
          </Text>

          {topPrograms.length === 0 ? (
            <View style={styles.emptyPrograms}>
              <Text style={styles.emptyProgramsText}>
                Здесь появятся ваши любимые тренировки после нескольких занятий 💪
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.programsScroll}
            >
              {topPrograms.map((program) => {
                const config = TYPE_CONFIG[program.type] || FALLBACK_CONFIG;
                const { Icon, getSubtitle } = config;
                const subtitle = getSubtitle(program);

                return (
                  <TouchableOpacity
                    key={program.type}
                    style={styles.programCard}
                    activeOpacity={0.8}
                    onPress={() => startProgram(program.type, program.type, subtitle)}
                  >
                    <View style={[styles.cardBg, { backgroundColor: program.typeColor }]}>
                      <Icon
                        size={90}
                        color="rgba(255,255,255,0.2)"
                        style={{ position: 'absolute', right: -15, top: -5 }}
                      />
                    </View>

                    <View style={styles.cardContent}>
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{program.count}×</Text>
                      </View>
                      <Text style={styles.cardTitle}>{program.type}</Text>
                      <Text style={styles.cardSub}>{subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background || 'black' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 15, marginBottom: 25,
  },
  date: {
    color: colors.textSecondary, fontSize: 14,
    fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', marginBottom: 4,
  },
  greeting: { color: colors.textPrimary, fontSize: 30, fontFamily: 'Inter_700Bold' },
  avatarContainer: {
    backgroundColor: colors.cardBg, padding: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#2C2C2E',
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 20, fontFamily: 'Inter_600SemiBold', marginBottom: 15 },
  subHeader: {
    fontSize: 16, marginTop: 25, marginBottom: 15,
    color: colors.textSecondary, fontFamily: 'Inter_500Medium',
  },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', marginBottom: 30, gap: 12,
  },
  actionSection: { marginBottom: 10 },
  quickStartBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.primary, padding: 18, borderRadius: 20,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  quickStartContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  quickStartText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: 'black' },
  quickStartSub: { fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(0,0,0,0.6)' },
  programsScroll: { gap: 12, paddingRight: 20 },

  programCard: {
    width: 145, height: 170, borderRadius: 24,
    backgroundColor: colors.cardBg, borderWidth: 1,
    borderColor: '#2C2C2E', position: 'relative', overflow: 'hidden',
  },
  cardBg: { ...StyleSheet.absoluteFillObject },
  cardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 },
  countBadge: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
    alignSelf: 'flex-start', marginBottom: 4,
  },
  countBadgeText: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  cardTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  cardSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: 'Inter_500Medium' },

  // Заглушка
  emptyPrograms: {
    backgroundColor: colors.cardBg, borderRadius: 20,
    padding: 20, borderWidth: 1, borderColor: '#2C2C2E',
  },
  emptyProgramsText: {
    color: colors.textSecondary, fontSize: 14,
    fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22,
  },
});
