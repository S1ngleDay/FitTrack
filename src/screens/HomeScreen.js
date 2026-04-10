import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleUser, Play, Footprints, Flame, Clock, Dumbbell, Wind, Bike, MapPin } from 'lucide-react-native';
import { useUserStore } from '../store/userStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { usePedometer } from '../hooks/usePedometer';
import { getDailyStats, calculateProgress, getMetricValue } from '../utils/statsCalculator';
import StatsCard from '../components/StatsCard';
import { useTranslation } from '../hooks/useTranslation';
import WorkoutModal from '../components/WorkoutModal';

// Выносим функцию-генератор конфига наружу, чтобы передавать в нее функцию перевода 't'
const getTypeConfig = (t) => ({
  'run': { 
    Icon: Footprints, 
    getSubtitle: (stats) => `${stats.avgDistance} ${t('avgKm')}` 
  },
  'strength': { 
    Icon: Dumbbell,   
    getSubtitle: (stats) => `${stats.avgCalories} ${t('avgKcal')}` 
  },
  'cardio': { 
    Icon: Flame,      
    getSubtitle: (stats) => `${stats.avgDuration} ${t('avgMin')}` 
  },
  'bike': { 
    Icon: Bike,       
    getSubtitle: (stats) => `${stats.avgDistance} ${t('avgKm')}` 
  },
  'walk': { 
    Icon: Wind,       
    getSubtitle: (stats) => `${stats.avgSteps.toLocaleString('ru-RU')} ${t('avgSteps')}` 
  },
});

const getFallbackConfig = (t) => ({
  Icon: Clock,
  getSubtitle: (stats) => `${stats.count} ${t('workoutsCount')}`
});

export default function HomeScreen({ navigation }) {
  const colors = useThemeColors();
  const { t, language } = useTranslation();
  
  const workouts = useWorkoutStore(s => s.workouts);
  const user = useUserStore(state => state.user);
  
  const firstName = user.name ? user.name.split(' ')[0] : '';
  const { steps: liveSteps, isAvailable } = usePedometer();

  const dailyStats = useMemo(() => getDailyStats(workouts), [workouts]);

  const [isWorkoutModalVisible, setWorkoutModalVisible] = useState(false);
  const [modalInitialMode, setModalInitialMode] = useState('menu');

  const [selectedWorkoutParams, setSelectedWorkoutParams] = useState(null);

  const today = new Date();
  // Используем локаль из настроек для форматирования даты
  const dateLocale = language === 'ru' ? 'ru-RU' : 'en-US';
  const dateStr = today.toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' });
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  // Использовать цели из профиля пользователя
  const goals = { 
    steps: user.goalSteps || 10000, 
    distance: user.goalDistance || 5, 
    calories: user.goalCalories || 2000, 
    duration: 120 
  };

  const formatDuration = (m) => {
    if (!m) return '0';
    if (m < 60) return `${m}`;
    return `${Math.floor(m / 60)}ч ${m % 60}м`; // В карточках на главной мы отображаем сырое значение, поэтому пока оставим простую логику.
  };

  const displaySteps = isAvailable ? liveSteps : dailyStats.steps;

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
          totalSteps: 0
        };
      }
      
      typeMap[type].count += 1;
      typeMap[type].totalCalories += (typeof w.calories === 'number' ? w.calories : (getMetricValue(w.metrics, '🔥') || 0));
      typeMap[type].totalDistance += (typeof w.distance === 'number' ? w.distance : (getMetricValue(w.metrics, '📍') || 0));
      typeMap[type].totalDuration += (typeof w.duration === 'number' ? w.duration : (getMetricValue(w.metrics, '⏱️') || 0));
      typeMap[type].totalSteps += (typeof w.steps === 'number' ? w.steps : (getMetricValue(w.metrics, '👣') || 0));
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
        avgSteps: Math.round(t.totalSteps / t.count)
      }));
  }, [workouts]);

  const startProgram = (type, title, subtitle, goalType = null, goalValue = null) => {
    if (type === 'run' || type === 'Пробежка') {
      // Если это просто "быстрый старт", открываем главное меню модалки
      setModalInitialMode('menu');
      setSelectedWorkoutParams(null); // Очищаем параметры
    } else {
      // Передаем параметры для предзаполнения формы цели
      // initialMode остается 'menu', но WorkoutModal самостоятельно перейдет в 'setup' благодаря initialWorkout
      setModalInitialMode('menu');
      setSelectedWorkoutParams({
        type: type,
        title: title,
        subtitle: subtitle,
        goalType: goalType, // 'distance' или 'time'
        goalValue: goalValue // числовое значение цели (например "5" или "30")
      });
    }
    
    setWorkoutModalVisible(true);
  };
  const typeConfig = getTypeConfig(t);
  const fallbackConfig = getFallbackConfig(t);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.date, { color: colors.textSecondary }]}>{formattedDate}</Text>
            <Text style={[styles.greeting, { color: colors.textPrimary }]}>{t('greeting')}, {firstName}!</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[styles.avatarContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: 32, height: 32, borderRadius: 16 }} />
            ) : (
              <CircleUser color={colors.textSecondary} size={32} />
            )}
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('activity')}</Text>
        <View style={styles.statsGrid}>
          <StatsCard 
            icon={Footprints}
            title={t('steps')}
            value={displaySteps.toLocaleString('ru-RU')}
            color={colors.chartSteps || '#0A84FF'}
            progress={calculateProgress(displaySteps, goals.steps)}
            onPress={() => navigation.navigate('StepsDetails')}
          />
          <StatsCard 
            icon={MapPin}
            title={t('distanceAbbr')}
            value={dailyStats.distance.toLocaleString('ru-RU')}
            unit={t('distanceAbbr')}
            color={colors.chartDistance || '#32d74b'}
            progress={calculateProgress(dailyStats.distance, goals.distance)}
            onPress={() => navigation.navigate('DistanceDetails')}
          />
          <StatsCard 
            icon={Flame}
            title={t('caloriesAbbr')}
            value={String(dailyStats.calories)}
            unit={t('caloriesAbbr')}
            color={colors.chartCalories || '#FF453A'}
            progress={calculateProgress(dailyStats.calories, goals.calories)}
            onPress={() => navigation.navigate('CaloriesDetails')}
          />
          <StatsCard 
            icon={Clock}
            title={t('timeAbbr')}
            value={formatDuration(dailyStats.duration)}
            unit={t('timeAbbr')}
            color={colors.chartTime || '#FFD60A'}
            progress={calculateProgress(dailyStats.duration, goals.duration)}
            onPress={() => navigation.navigate('TimeDetails')}
          />
        </View>

        {/* ACTIONS */}
        <View style={styles.actionSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('workoutsTitle')}</Text>
          
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={[styles.quickStartBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            onPress={() => startProgram('Пробежка', t('freeWorkout'), '')}
          >
            <View style={styles.quickStartContent}>
              <View style={styles.playCircle}>
                <Play size={20} color="black" fill="black" style={{ marginLeft: 2 }} />
              </View>
              <Text style={styles.quickStartText}>{t('quickStart')}</Text>
            </View>
            <Text style={styles.quickStartSub}>{t('freeWorkout')}</Text>
          </TouchableOpacity>

          <Text style={[styles.subHeader, { color: colors.textSecondary }]}>{t('frequentPrograms')}</Text>
          
          {topPrograms.length === 0 ? (
            <View style={[styles.emptyPrograms, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={[styles.emptyProgramsText, { color: colors.textSecondary }]}>
                {t('noProgramsYet')}
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.programsScroll}>
              {topPrograms.map((program) => {
                const config = typeConfig[program.type] || fallbackConfig;
                const Icon = config.Icon;
                const subtitle = config.getSubtitle(program);
                
                // Определяем тип цели и значение для каждого типа программы
                let goalType = null;
                let goalValue = null;
                if (program.type === 'run' || program.type === 'walk' || program.type === 'bike') {
                  goalType = 'distance';
                  goalValue = String(program.avgDistance);
                } else if (program.type === 'cardio') {
                  goalType = 'time';
                  goalValue = String(program.avgDuration);
                }
                
                return (
                  <TouchableOpacity 
                    key={program.type}
                    style={[styles.programCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                    activeOpacity={0.8}
                    onPress={() => startProgram(program.type, t(program.type), subtitle, goalType, goalValue)}
                  >
                    <View style={[styles.cardBg, { backgroundColor: program.typeColor }]}>
                      <Icon size={90} color="rgba(255,255,255,0.2)" style={{ position: 'absolute', right: -15, top: -5 }} />
                    </View>
                    <View style={styles.cardContent}>
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{program.count}</Text>
                      </View>
                      <Text style={styles.cardTitle}>{t(program.type)}</Text>
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
      <WorkoutModal 
        visible={isWorkoutModalVisible} 
        onClose={() => setWorkoutModalVisible(false)}
        initialMode={modalInitialMode}
        initialWorkout={selectedWorkoutParams}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 25 },
  date: { fontSize: 14, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', marginBottom: 4 },
  greeting: { fontSize: 30, fontFamily: 'Inter_700Bold' },
  avatarContainer: { padding: 8, borderRadius: 20, borderWidth: 1 },
  sectionTitle: { fontSize: 20, fontFamily: 'Inter_600SemiBold', marginBottom: 15 },
  subHeader: { fontSize: 16, marginTop: 25, marginBottom: 15, fontFamily: 'Inter_500Medium' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30, gap: 12 },
  actionSection: { marginBottom: 10 },
  quickStartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 20, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
  quickStartContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center' },
  quickStartText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: 'black' },
  quickStartSub: { fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(0,0,0,0.6)' },
  programsScroll: { gap: 12, paddingRight: 20 },
  programCard: { width: 145, height: 170, borderRadius: 24, borderWidth: 1, position: 'relative', overflow: 'hidden' },
  cardBg: { ...StyleSheet.absoluteFillObject },
  cardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 },
  countBadge: { backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
  countBadgeText: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  cardTitle: { color: 'white', fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  cardSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: 'Inter_500Medium' },
  emptyPrograms: { borderRadius: 20, padding: 20, borderWidth: 1 },
  emptyProgramsText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
});
