import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Platform, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X, Clock, Flame, Footprints, Activity,
  MapPin, AlignLeft, Share2, Dumbbell, Target, TrendingUp, TrendingDown
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Polyline } from 'react-native-maps';

import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../hooks/useTranslation';
import { EXERCISES_CATALOG, useWorkoutStore } from '../store/workoutStore';
import { parseWorkoutDate } from '../utils/statsCalculator';

export default function WorkoutDetailsModal({ isVisible, onClose, workout }) {
  const colors = useThemeColors();
  const { t, locale } = useTranslation();
  const workouts = useWorkoutStore((state) => state.workouts);

  if (!workout) return null;

  const durationVal = workout.duration || 0;
  const caloriesVal = workout.calories || 0;
  const distanceVal = workout.distance || 0;

  // Достаем специфичные данные для силовых
  const totalVolume = workout.totalVolume || 0;
  const exercisesList = workout.exercises || [];

  const workoutType = workout.type || 'Тренировка';

  // Проверки на ходьбу и велосипед 
  const isRun = workoutType.includes('Пробежка') || workoutType.includes('Бег') || workoutType.includes('run');
  const isWalking = workoutType.includes('Ходьба') || workoutType.includes('walk');
  const isBike = workoutType.includes('Велосипед') || workoutType.includes('bike');
  const isStrength = workoutType === 'Силовая' || workoutType === 'strength';

  // Общая переменная для кардио на улице 
  const isOutdoorCardio = isRun || isWalking || isBike;

  // Функция для получения локализованного названия типа тренировки
  const getTranslatedType = (typeStr) => {
    if (typeStr === 'Пробежка' || typeStr.includes('Бег') || typeStr.includes('run')) return t('type_run');
    if (typeStr === 'Ходьба' || typeStr.includes('walk')) return t('type_walk');
    if (typeStr === 'Силовая' || typeStr === 'strength') return t('type_strength');
    if (typeStr === 'Кардио' || typeStr === 'cardio') return t('type_cardio');
    if (typeStr === 'Велосипед' || typeStr.includes('bike')) return t('type_bike');
    return typeStr; // если кастомное имя плана - оставляем как есть
  };

  const displayTitle = workout.planName || getTranslatedType(workoutType);

  let themeColor = colors.orange || '#FF9F0A';
  let HeaderIcon = Activity;

  // Цвет и иконка в шапке для всего уличного кардио
  if (isOutdoorCardio) {
    themeColor = colors.green || '#32d74b';
    HeaderIcon = Footprints; // Можно заменить на кастомные иконки
  } else if (isStrength) {
    themeColor = '#FF3B30';
    HeaderIcon = Dumbbell;
  }

  let pace = '-';
  // Считаем темп для всех уличных активностей, а не только для бега
  if (isOutdoorCardio && distanceVal > 0 && durationVal > 0) {
    const paceVal = durationVal / distanceVal;
    let mins = Math.floor(paceVal);
    let secs = Math.round((paceVal - mins) * 60);
    if (secs === 60) { mins += 1; secs = 0; }
    pace = `${mins}'${secs.toString().padStart(2, '0')}"`;
  }

  const dateObj = parseWorkoutDate(workout.date || workout.startTime);
  const dateStr = dateObj.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long' });
  const timeStr = dateObj.toLocaleTimeString(locale === 'ru' ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' });

  // Получаем маршрут только для кардио типов
  const savedRoute = (isOutdoorCardio && workout.route) ? workout.route : [];
  const getMapRegion = () => {
    if (!isOutdoorCardio || !savedRoute || savedRoute.length === 0) return null;
    const midPoint = savedRoute[Math.floor(savedRoute.length / 2)];
    return {
      latitude: midPoint.latitude,
      longitude: midPoint.longitude,
      latitudeDelta: distanceVal > 5 ? 0.05 : 0.01,
      longitudeDelta: distanceVal > 5 ? 0.05 : 0.01,
    };
  };
  const mapRegion = getMapRegion();

  const getTranslatedExName = (exName) => {
    const catalogItem = EXERCISES_CATALOG.find(e => e.name === exName);
    const id = catalogItem ? catalogItem.id : null;
    if (id) {
      const translation = t(`ex_${id}`);
      if (translation !== `ex_${id}`) return translation;
    }
    return exName;
  };

  // Функция для поделиться результатом
  const handleShare = async () => {
    try {
      const avgSpeed = distanceVal > 0 && durationVal > 0 ? (distanceVal / (durationVal / 60)).toFixed(1) : 0;
      const speedText = isOutdoorCardio ? `\n⚡ Скорость: ${avgSpeed} км/ч` : '';
      const distanceText = isOutdoorCardio ? `\n📍 ${distanceVal.toFixed(2)} км • Темп: ${pace}${speedText}` : '';
      const volumeText = isStrength && totalVolume > 0 ? `\n💪 Объем: ${totalVolume} кг` : '';
      
      const workoutText = `📊 ${displayTitle}\n📅 ${dateStr} • ${timeStr}\n⏱️ ${(durationVal / 60).toFixed(1)} мин\n🔥 ${caloriesVal.toFixed(0)} ккал${distanceText}${volumeText}\n\n#FitTrack #Workout #Fitness`;
      
      await Share.share({
        message: workoutText,
        title: `${displayTitle} - FitTrack`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Функция для получения предыдущего результата упражнения
  const getPreviousExerciseResult = (exerciseName) => {
    const previousWorkouts = workouts
      .filter(w => w.id !== workout.id && w.type === 'strength')
      .sort((a, b) => new Date(b.startTime || b.date) - new Date(a.startTime || a.date));

    for (const prevWorkout of previousWorkouts) {
      const exercise = prevWorkout.exercises?.find(e => e.name === exerciseName);
      if (exercise && exercise.completedSets && exercise.completedSets.length > 0) {
        // Возвращаем максимальный вес из всех подходов
        const maxWeight = Math.max(...exercise.completedSets.map(s => Number(s.weight) || 0));
        return { 
          weight: maxWeight, 
          sets: exercise.completedSets.length,
          date: new Date(prevWorkout.startTime || prevWorkout.date).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })
        };
      }
    }
    return null;
  };

  // Функция для вычисления тренда упражнения
  const getExerciseTrend = (currentExercise, previousResult) => {
    if (!previousResult || !currentExercise.completedSets || currentExercise.completedSets.length === 0) {
      return { type: 'neutral', value: null };
    }

    const currentMaxWeight = Math.max(...currentExercise.completedSets.map(s => Number(s.weight) || 0));
    const diff = currentMaxWeight - previousResult.weight;
    const percent = Math.round((diff / previousResult.weight) * 100);

    if (diff > 0) {
      return { type: 'up', value: `+${percent}%` };
    } else if (diff < 0) {
      return { type: 'down', value: `${percent}%` };
    }
    return { type: 'neutral', value: '0%' };
  };

  const getSetsText = (sets) => {
    if (locale === 'en') return sets === 1 ? t('setsText_1') : t('setsText_2');
    if (sets % 10 === 1 && sets % 100 !== 11) return t('setsText_1');
    if ([2, 3, 4].includes(sets % 10) && ![12, 13, 14].includes(sets % 100)) return t('setsText_2');
    return t('setsText_5');
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={isVisible} onRequestClose={onClose}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={Platform.OS === 'android' ? ['top'] : []}>

        <View style={[styles.dragIndicator, { backgroundColor: colors.border }]} />

        <View style={styles.headerTopRow}>
          <Text style={[styles.headerTopTitle, { color: colors.textPrimary }]}>{t('workoutResultsTitle') || 'Тренировка'}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={handleShare}
              style={[styles.iconButton, { backgroundColor: colors.primary + '20' }]}
              activeOpacity={0.7}
            >
              <Share2 size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={[styles.iconButton, { backgroundColor: colors.cardBg }]}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.heroSection}>
            <View style={[styles.heroIconCircle, { backgroundColor: `${themeColor}15`, borderColor: `${themeColor}40` }]}>
              <HeaderIcon size={44} color={themeColor} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{displayTitle}</Text>
            <Text style={[styles.heroDate, { color: colors.textSecondary }]}>{dateStr} • {timeStr}</Text>
          </View>

          <View style={styles.statsGrid}>
            {/* Карточка: Время */}
            <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
                <Clock size={24} color="#0A84FF" />
              </View>
              <View>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{durationVal}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('minutesLabel')}</Text>
              </View>
            </View>

            {/* Карточка: Калории */}
            <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 159, 10, 0.15)' }]}>
                <Flame size={24} color="#FF9F0A" />
              </View>
              <View>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{caloriesVal.toFixed(0)}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('kcalLabel')}</Text>
              </View>
            </View>

            {/* Карточка дистанции - показывается для бега, ходьбы и велосипеда */}
            {isOutdoorCardio && distanceVal > 0 && (
              <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(50, 215, 75, 0.15)' }]}>
                  <MapPin size={24} color="#32d74b" />
                </View>
                <View>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{distanceVal.toFixed(2)}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('kmLabel')}</Text>
                </View>
              </View>
            )}

            {/* Карточка темпа - показывается для бега, ходьбы и велосипеда */}
            {isOutdoorCardio && distanceVal > 0 && (
              <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(191, 90, 242, 0.15)' }]}>
                  <Activity size={24} color="#BF5AF2" />
                </View>
                <View>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{pace}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('paceLabel') || 'Темп'}</Text>
                </View>
              </View>
            )}

            {/* Карточка: Скорость (среднее) */}
            {isOutdoorCardio && distanceVal > 0 && durationVal > 0 && (
              <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 45, 85, 0.15)' }]}>
                  <TrendingUp size={24} color="#FF2D55" />
                </View>
                <View>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{(distanceVal / (durationVal / 60)).toFixed(1)}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('speedKmhLabel') || 'км/ч'}</Text>
                </View>
              </View>
            )}

            {/* Карточка: Объем (только для силовых) */}
            {isStrength && totalVolume > 0 && (
              <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 59, 48, 0.15)' }]}>
                  <Target size={24} color="#FF3B30" />
                </View>
                <View>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalVolume}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('kgLabel')}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Карта маршрута - теперь показывается для всех уличных кардио тренировок 
          {isOutdoorCardio && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 25 }]}>{t('routeTitle')}</Text>
              <View style={[styles.mapContainer, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
                {savedRoute.length > 0 && mapRegion ? (
                  <MapView
                    style={{ flex: 1 }}
                    initialRegion={mapRegion}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    pitchEnabled={false}
                  >
                    <Polyline
                      coordinates={savedRoute}
                      strokeColor="#32d74b"
                      strokeWidth={5}
                      lineCap="round"
                      lineJoin="round"
                    />
                  </MapView>
                ) : (
                  <View style={styles.noRouteBox}>
                    <MapPin size={32} color={colors.textSecondary} />
                    <Text style={[styles.noRouteText, { color: colors.textSecondary }]}>{t('noRouteData') || 'Нет данных о маршруте'}</Text>
                  </View>
                )}
              </View>
            </>
          )}
            */}

          {/* Список упражнений (для силовых) */}
          {exercisesList.length > 0 && (
            <View style={styles.exercisesSection}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('completedExercisesTitle')}</Text>
              {exercisesList.map((ex, index) => {
                const previousResult = getPreviousExerciseResult(ex.name);
                const trend = getExerciseTrend(ex, previousResult);
                const currentMaxWeight = ex.completedSets && ex.completedSets.length > 0 
                  ? Math.max(...ex.completedSets.map(s => Number(s.weight) || 0))
                  : 0;

                return (
                  <View key={index} style={[styles.exerciseRowContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    {/* Левая часть: Иконка */}
                    <View style={[styles.exerciseIconBox, { backgroundColor: `${colors.primary}15` }]}>
                      <Dumbbell size={20} color={colors.primary || '#FF3B30'} />
                    </View>

                    {/* Середина: Название, Подходы/Повторения */}
                    <View style={styles.exerciseInfoContainer}>
                      <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>
                        {getTranslatedExName(ex.name)}
                      </Text>
                      <Text style={[styles.exerciseStats, { color: colors.textSecondary }]}>
                        {ex.completedSets ? ex.completedSets.length : 0} {getSetsText(ex.completedSets ? ex.completedSets.length : 0)} • {currentMaxWeight} {t('unitKg')}
                      </Text>
                      {previousResult && (
                        <Text style={[styles.exercisePrevious, { color: colors.textSecondary }]}>
                          {t('exercisePreviousResult').replace('{weight}', previousResult.weight).replace('{unit}', t('unitKg')).replace('{date}', previousResult.date)}
                        </Text>
                      )}
                    </View>

                    {/* Правая часть: Тренд */}
                    {previousResult && (
                      <View style={styles.trendContainer}>
                        {trend.type === 'up' && (
                          <View style={styles.trendBadgeUp}>
                            <TrendingUp size={16} color="#34C759" />
                            <Text style={[styles.trendText, { color: '#34C759' }]}>{trend.value}</Text>
                          </View>
                        )}
                        {trend.type === 'down' && (
                          <View style={styles.trendBadgeDown}>
                            <TrendingDown size={16} color="#FF3B30" />
                            <Text style={[styles.trendText, { color: '#FF3B30' }]}>{trend.value}</Text>
                          </View>
                        )}
                        {trend.type === 'neutral' && (
                          <View style={styles.trendBadgeNeutral}>
                            <Activity size={16} color={colors.textSecondary} />
                            <Text style={[styles.trendText, { color: colors.textSecondary }]}>—</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1,},
  dragIndicator: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: 10, marginBottom: 10,},
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15,},
  headerTopTitle: { fontSize: 20, fontWeight: '700',},
  headerActions: { flexDirection: 'row', gap: 12,},
  iconButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',},
  scrollContent: { paddingHorizontal: 20, paddingTop: 10,},
  heroSection: { alignItems: 'center', marginBottom: 30,},
  heroIconCircle: { width: 88, height: 88, borderRadius: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16,},
  heroTitle: { fontSize: 28, fontWeight: '800', marginBottom: 8, textAlign: 'center',},
  heroDate: { fontSize: 15, fontWeight: '500',},
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12,},
  statCard: { width: '48%', borderRadius: 20, padding: 16, flexDirection: 'column', justifyContent: 'space-between', minHeight: 110,},
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12,},
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 2,},
  statLabel: { fontSize: 13, fontWeight: '500',},
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, marginTop: 10,},
  mapContainer: { height: 220, borderRadius: 20, overflow: 'hidden', borderWidth: 1,},
  noRouteBox: { flex: 1, alignItems: 'center', justifyContent: 'center',},
  noRouteText: { marginTop: 8, fontSize: 14, fontWeight: '500',},
  exercisesSection: { marginTop: 30,},
  exerciseRowContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1,},
  exerciseIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12,},
  exerciseInfoContainer: { flex: 1, justifyContent: 'space-evenly',},
  exerciseName: { fontSize: 16, fontWeight: '700', marginBottom: 4,},
  exerciseStats: { fontSize: 13, fontWeight: '600', marginBottom: 2,},
  exercisePrevious: { fontSize: 11, fontWeight: '500', fontStyle: 'italic',},
  trendContainer: { marginLeft: 12, alignItems: 'center', justifyContent: 'center',},
  trendBadgeUp: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(52, 199, 89, 0.12)', borderRadius: 8,},
  trendBadgeDown: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255, 59, 48, 0.12)', borderRadius: 8,},
  trendBadgeNeutral: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(142, 142, 147, 0.12)', borderRadius: 8,},
  trendText: { fontSize: 12, fontWeight: '700',},
});
