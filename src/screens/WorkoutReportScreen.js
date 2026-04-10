import React, { useState, useEffect } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Animated, Platform, TextInput, KeyboardAvoidingView, Keyboard
} from 'react-native';
import { 
  ChevronLeft, Dumbbell, TrendingUp, Clock, Flame, 
  CheckCircle2, Target, Edit3
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useWorkoutStore } from '../store/workoutStore';
import { analyzeExerciseProgress } from '../utils/coachAnalyzer';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../hooks/useTranslation'; // 👈 Добавили хук перевода

const { width } = Dimensions.get('window');

export default function WorkoutReportScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useThemeColors();
  const { t } = useTranslation(); // 👈 Вызов хука

  const workoutId = route.params?.workoutId;
  const workouts = useWorkoutStore(s => s.workouts);
  const updateWorkout = useWorkoutStore(s => s.updateWorkout);
  
  // Ищем текущую тренировку
  const workout = workouts.find(w => w.id === workoutId);
  
  const [progressData, setProgressData] = useState({});
  const [planName, setPlanName] = useState('');
  const [comment, setComment] = useState('');

  // Инициализация стейтов при загрузке
  useEffect(() => {
    if (workout) {
      setPlanName(workout.planName || (t('type_strength') || 'Силовая тренировка'));
      setComment(workout.comment || '');

      const progress = {};
      workout.exercises.forEach(ex => {
        progress[ex.exerciseId] = analyzeExerciseProgress(ex.exerciseId, workouts);
      });
      setProgressData(progress);
    }
  }, [workout, workouts]);

  // Сохранение изменений
  const handleSaveEdits = () => {
    if (workout) {
      updateWorkout(workout.id, { 
        planName: planName.trim(), 
        comment: comment.trim() 
      });
    }
  };

  if (!workout || workout.type !== 'strength') {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>{t('report_errorNotFound')}</Text>
        <TouchableOpacity 
          style={[styles.errorBtn, { backgroundColor: colors.cardBg }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.errorBtnText, { color: colors.textPrimary }]}>{t('report_backBtn')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const durationMin = Math.floor(workout.duration || 0);
  const totalVolume = workout.totalVolume || 0;

  // Функция для перевода тренда
  const getTrendText = (prog) => {
    if (!prog || prog.trend === 'no-data') return null;
    
    let trendText = '';
    if (prog.trend === 'up') {
      trendText = t('report_trendUp').replace('{percent}', prog.weightProgress);
    } else if (prog.trend === 'down') {
      trendText = t('report_trendDown').replace('{percent}', Math.abs(prog.weightProgress));
    } else {
      trendText = t('report_trendStable').replace('{percent}', Math.abs(prog.weightProgress));
    }
    return trendText;
  };

  // Функция для перевода меток статистики
  const getStatLabel = (statType) => {
    switch (statType) {
      case 'volume': return t('report_volumeUnit');
      case 'time': return t('report_timeUnit');
      case 'kcal': return t('report_kcalUnit');
      default: return statType;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={[styles.backBtn, { backgroundColor: colors.cardBg }]}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerDate, { color: colors.textSecondary }]}>
              {workout.date} • {new Date(workout.startTime).toLocaleTimeString(navigator.language || 'ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scroll} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Редактируемый заголовок */}
          <View style={styles.titleSection}>
            <TextInput
              style={[styles.editableTitle, { color: colors.textPrimary }]}
              value={planName}
              onChangeText={setPlanName}
              onBlur={handleSaveEdits}
              multiline
              maxLength={40}
              placeholder={t('report_notesPlaceholder')}
              placeholderTextColor={colors.textSecondary}
            />
            <Edit3 size={16} color={colors.textSecondary} style={{ marginLeft: 8, marginTop: 8 }} />
          </View>

          {/* Статистика */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: colors.cardBg, shadowColor: colors.textPrimary }]}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                <Dumbbell size={24} color="#FF3B30" />
              </View>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{totalVolume.toLocaleString()}</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{getStatLabel('volume')}</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: colors.cardBg, shadowColor: colors.textPrimary }]}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(10, 132, 255, 0.1)' }]}>
                <Clock size={24} color="#0A84FF" />
              </View>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{durationMin}</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{getStatLabel('time')}</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: colors.cardBg, shadowColor: colors.textPrimary }]}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
                <Flame size={24} color="#FF9500" />
              </View>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{workout.calories}</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{getStatLabel('kcal')}</Text>
            </View>
          </View>

          {/* Редактируемые заметки */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('report_notesTitle')}</Text>
            <View style={[styles.commentCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <TextInput
                style={[styles.commentInput, { color: colors.textPrimary }]}
                value={comment}
                onChangeText={setComment}
                onBlur={handleSaveEdits}
                multiline
                placeholder={t('report_notesPlaceholder')}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          {/* Выполненные упражнения */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('report_exercisesTitle')}</Text>
            {workout.exercises.map((ex, index) => {
              const prog = progressData[ex.exerciseId];
              const trendText = getTrendText(prog);
              const setsText = t('report_setsText')
                .replace('{sets}', ex.sets)
                .replace('{volume}', Math.round(ex.volume));
              
              return (
                <View key={index} style={[styles.exerciseItem, { backgroundColor: colors.cardBg }]}>
                  <View style={styles.exerciseLeft}>
                    <View style={[styles.exerciseIcon, { backgroundColor: colors.background }]}>
                      <Target size={20} color="#FF9500" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>{ex.name}</Text>
                      <Text style={[styles.exerciseSets, { color: colors.textSecondary }]}>{setsText}</Text>
                    </View>
                  </View>
                  
                  {trendText ? (
                    <View style={[
                      styles.trendBadge,
                      prog.trend === 'up' ? styles.trendUp : 
                      prog.trend === 'down' ? styles.trendDown : styles.trendStable
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
                        {trendText}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={[styles.bottomActions, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.newWorkoutBtn} 
            onPress={() => {
              Keyboard.dismiss();
              handleSaveEdits();
              navigation.navigate('Home');
            }}
          >
            <LinearGradient colors={['#32D74B', '#00C805']} style={styles.gradientBtn}>
              <CheckCircle2 size={24} color="#003300" />
              <Text style={styles.newWorkoutText}>{t('report_doneBtn')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 20 },
  errorBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  errorBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  
  header: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10,
    borderBottomWidth: 1
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerContent: { flex: 1, alignItems: 'center', paddingRight: 40 },
  headerDate: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  
  titleSection: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  editableTitle: { flex: 1, fontSize: 32, fontFamily: 'Inter_800ExtraBold', padding: 0, margin: 0, minHeight: 40 },

  metricsRow: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 20, gap: 12 },
  metricCard: { 
    flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 5,
    borderRadius: 20, elevation: 3, shadowOffset: {width:0,height:2}, shadowOpacity:0.1, shadowRadius: 4 
  },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  metricValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  metricLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  
  section: { marginHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  
  commentCard: { borderRadius: 16, borderWidth: 1, minHeight: 100 },
  commentInput: { padding: 16, fontSize: 16, fontFamily: 'Inter_500Medium', minHeight: 100, textAlignVertical: 'top' },

  exerciseItem: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderRadius: 16, marginBottom: 12 
  },
  exerciseLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  exerciseIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  exerciseName: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  exerciseSets: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  trendUp: { backgroundColor: 'rgba(50, 215, 75, 0.2)' },
  trendDown: { backgroundColor: 'rgba(255, 59, 48, 0.2)' },
  trendStable: { backgroundColor: '#FFD60A' },
  trendText: { color: 'white', fontSize: 12, fontFamily: 'Inter_700Bold' },
  
  bottomActions: { 
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    borderTopWidth: 1
  },
  newWorkoutBtn: { borderRadius: 16, overflow: 'hidden' },
  gradientBtn: { flexDirection: 'row', padding: 18, alignItems: 'center', justifyContent: 'center', gap: 10 },
  newWorkoutText: { color: '#003300', fontSize: 18, fontFamily: 'Inter_700Bold' },
});
