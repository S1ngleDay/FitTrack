import React, { useState, useEffect } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Animated, Platform
} from 'react-native';
import { 
  ChevronLeft, Dumbbell, TrendingUp, Zap, Clock, Flame, 
  CheckCircle2, Share2, BarChart3, Target
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorkoutStore } from '../store/workoutStore';
import { analyzeExerciseProgress, getHealthScore } from '../utils/coachAnalyzer';
import colors from '../constants/colors';

const { width } = Dimensions.get('window');

export default function WorkoutReportScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const workoutId = route.params?.workoutId;
  
  const workouts = useWorkoutStore(s => s.workouts);
  const workout = workouts.find(w => w.id === workoutId);
  
  const [progressData, setProgressData] = useState({});

  useEffect(() => {
    if (workout) {
      const progress = {};
      workout.exercises.forEach(ex => {
        progress[ex.exerciseId] = analyzeExerciseProgress(ex.exerciseId, workouts);
      });
      setProgressData(progress);
    }
  }, [workout]);

  if (!workout || workout.type !== 'Силовая') {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Тренировка не найдена</Text>
        <TouchableOpacity style={styles.errorBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.errorBtnText}>Вернуться назад</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const durationMin = Math.floor(workout.duration || 0);
  const totalVolume = workout.totalVolume || 0;
  
  const stats = { 
    totalCalories: workout.calories || 0,
    totalMinutes: workout.duration || 0,
    totalVolume: workout.totalVolume || 0,
    strengthCount: 1,
    workoutCount: 1
  };
  const dailyStats = { steps: 0 };
  const healthScore = getHealthScore(stats, dailyStats, { weight: 75, goal: 'gain_muscle' });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{workout.planName || 'Силовая тренировка'}</Text>
          <Text style={styles.headerDate}>
            {workout.date} • {new Date(workout.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <TouchableOpacity style={styles.shareIconBtn}>
          <Share2 size={24} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
              <Dumbbell size={24} color="#FF3B30" />
            </View>
            <Text style={styles.metricValue}>{totalVolume.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>Объём, кг</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(10, 132, 255, 0.1)' }]}>
              <Clock size={24} color="#0A84FF" />
            </View>
            <Text style={styles.metricValue}>{durationMin}</Text>
            <Text style={styles.metricLabel}>Минут</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
              <Flame size={24} color="#FF9500" />
            </View>
            <Text style={styles.metricValue}>{workout.calories}</Text>
            <Text style={styles.metricLabel}>Ккал</Text>
          </View>
        </View>

        <View style={styles.scoreCard}>
          <LinearGradient colors={['#1C1C1E', '#2C2C2E']} style={styles.scoreGradient}>
            <View style={styles.scoreHeader}>
              <BarChart3 size={24} color="#32D74B" />
              <Text style={styles.scoreTitle}>Оценка продуктивности</Text>
            </View>
            <View style={styles.scoreBody}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>{healthScore}</Text>
              </View>
              <View style={styles.scoreTextContent}>
                <Text style={styles.scoreSubtitle}>
                  {healthScore > 85 ? 'Выдающийся результат! 🏆' : healthScore > 70 ? 'Отличная тренировка! 💪' : 'Хорошая работа! 👍'}
                </Text>
                <Text style={styles.scoreDesc}>
                  Вы подняли {totalVolume} кг за {durationMin} минут. Отличный стимул для роста мышц.
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Выполненные упражнения</Text>
          {workout.exercises.map((ex, index) => {
            const prog = progressData[ex.exerciseId];
            return (
              <View key={index} style={styles.exerciseItem}>
                <View style={styles.exerciseLeft}>
                  <View style={styles.exerciseIcon}>
                    <Target size={20} color="#FF9500" />
                  </View>
                  <View>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.exerciseSets}>
                      {ex.sets} подходов • {Math.round(ex.volume)} кг
                    </Text>
                  </View>
                </View>
                
                {prog && prog.trend !== 'no-data' ? (
                  <View style={[
                    styles.trendBadge,
                    prog.trend === 'up' ? styles.trendUp : prog.trend === 'down' ? styles.trendDown : styles.trendStable
                  ]}>
                    <TrendingUp 
                      size={16} 
                      color={prog.trend === 'stable' ? '#000' : 'white'} 
                      style={prog.trend === 'down' ? { transform: [{ rotate: '180deg' }] } : {}} 
                    />
                    <Text style={[
                      styles.trendText,
                      prog.trend === 'stable' && { color: '#000' }
                    ]}>
                      {prog.weightProgress > 0 ? '+' : ''}{prog.weightProgress}%
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Прогресс по плану</Text>
          <View style={styles.progressBarsCard}>
            {workout.exercises.map((ex, index) => {
              const target = ex.targetSets || 4;
              const percent = Math.min((ex.sets / target) * 100, 100);
              
              return (
                <View key={`prog-${index}`} style={styles.progressBarContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>{ex.name}</Text>
                    <Text style={styles.progressPercent}>{Math.round(percent)}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <Animated.View 
                      style={[
                        styles.progressFill,
                        { width: `${percent}%` },
                        percent >= 100 && { backgroundColor: '#32D74B' }
                      ]} 
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {workout.comment ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Заметки</Text>
            <View style={styles.commentCard}>
              <Text style={styles.commentText}>{workout.comment}</Text>
            </View>
          </View>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.newWorkoutBtn} onPress={() => navigation.navigate('Home')}>
          <LinearGradient colors={['#32D74B', '#00C805']} style={styles.gradientBtn}>
            <CheckCircle2 size={24} color="#003300" />
            <Text style={styles.newWorkoutText}>Завершить</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  
  errorContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'white', fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 20 },
  errorBtn: { backgroundColor: '#2C2C2E', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  errorBtnText: { color: 'white', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  
  header: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15,
    backgroundColor: '#1C1C1E', borderBottomWidth: 1, borderBottomColor: '#2C2C2E'
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
  headerContent: { flex: 1, marginLeft: 16 },
  headerTitle: { color: 'white', fontSize: 20, fontFamily: 'Inter_700Bold' },
  headerDate: { color: '#8E8E93', fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 4 },
  shareIconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  
  metricsRow: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, gap: 12 },
  metricCard: { 
    flex: 1, backgroundColor: '#1C1C1E', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 10,
    borderRadius: 20, elevation: 5, shadowColor: '#000', shadowOffset: {width:0,height:4}, shadowOpacity:0.2, shadowRadius: 6 
  },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  metricValue: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  metricLabel: { fontSize: 12, color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
  
  scoreCard: { margin: 20, borderRadius: 24, elevation: 8, shadowColor: '#000', shadowOffset: {width:0,height:6}, shadowOpacity:0.3, shadowRadius: 10 },
  scoreGradient: { borderRadius: 24, padding: 24 },
  scoreHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  scoreTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: 'white' },
  scoreBody: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  scoreCircle: { 
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(50, 215, 75, 0.1)', 
    borderWidth: 2, borderColor: '#32D74B', justifyContent: 'center', alignItems: 'center' 
  },
  scoreNumber: { fontSize: 28, fontFamily: 'Inter_700Bold', color: '#32D74B' },
  scoreTextContent: { flex: 1 },
  scoreSubtitle: { color: 'white', fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  scoreDesc: { color: '#8E8E93', fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  
  section: { marginHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.textPrimary, marginBottom: 16 },
  
  exerciseItem: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1C1C1E', padding: 16, borderRadius: 20, marginBottom: 12 
  },
  exerciseLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  exerciseIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
  exerciseName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: 'white', marginBottom: 4 },
  exerciseSets: { fontSize: 13, color: colors.textSecondary, fontFamily: 'Inter_500Medium' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  trendUp: { backgroundColor: 'rgba(50, 215, 75, 0.2)' },
  trendDown: { backgroundColor: 'rgba(255, 59, 48, 0.2)' },
  trendStable: { backgroundColor: '#FFD60A' },
  trendText: { color: 'white', fontSize: 13, fontFamily: 'Inter_700Bold' },
  
  progressBarsCard: { backgroundColor: '#1C1C1E', borderRadius: 24, padding: 20, gap: 20 },
  progressBarContainer: { gap: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: 'white' },
  progressPercent: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#8E8E93' },
  progressBar: { height: 8, backgroundColor: '#2C2C2E', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FF9500', borderRadius: 4 },
  
  commentCard: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 20 },
  commentText: { fontSize: 15, color: '#E5E5E7', fontFamily: 'Inter_500Medium', lineHeight: 22 },
  
  bottomActions: { 
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    backgroundColor: '#1C1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24
  },
  newWorkoutBtn: { borderRadius: 16, overflow: 'hidden' },
  gradientBtn: { flexDirection: 'row', padding: 18, alignItems: 'center', justifyContent: 'center', gap: 10 },
  newWorkoutText: { color: '#003300', fontSize: 18, fontFamily: 'Inter_700Bold' },
});
