import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TextInput, 
  TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Dimensions 
} from 'react-native';
import { Check, Clock, Flame, Footprints, MapPin, X } from 'lucide-react-native';
import { CommonActions } from '@react-navigation/native';
import colors from '../constants/colors';
import { useWorkoutStore } from '../store/workoutStore';

const { width } = Dimensions.get('window');

export default function WorkoutSummaryScreen({ route, navigation }) {
  // Получаем данные, переданные с экрана ActiveRun
  const { 
    type = 'Тренировка', 
    durationSeconds = 0, 
    distanceKm = 0, 
    calories = 0, 
    steps = 0 
  } = route.params || {};

  const finishWorkout = useWorkoutStore(s => s.finishWorkout);
  const [comment, setComment] = useState('');

  // Форматирование времени
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) return `${hours}ч ${minutes}м`;
    return `${minutes}м ${seconds}с`;
  };

  const handleSave = () => {
    // 1. Сохраняем в стейт (store сам посчитает финальные метрики, если нужно)
    finishWorkout({
      durationSeconds,
      distanceKm,
      calories,
      steps,
      comment: comment.trim()
    });

    // 2. Сбрасываем навигацию и возвращаемся домой
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      })
    );
  };

  const handleDiscard = () => {
    // Если нужно просто выйти без сохранения
    // useWorkoutStore.getState().cancelWorkout(); // Если нужно сбросить активную
    navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleDiscard} style={styles.closeBtn}>
              <X size={24} color="#FF3B30" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Обзор тренировки</Text>
            <View style={{ width: 40 }} /> 
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
             <Text style={styles.congratsText}>Отличная работа!</Text>
             <Text style={styles.workoutType}>{type} завершена</Text>
          </View>

          {/* Main Stats Grid */}
          <View style={styles.statsGrid}>
             {/* Время */}
             <View style={styles.statCard}>
                <Clock color={colors.primary} size={24} style={{ marginBottom: 8 }} />
                <Text style={styles.statValue}>{formatTime(durationSeconds)}</Text>
                <Text style={styles.statLabel}>Время</Text>
             </View>

             {/* Калории */}
             <View style={styles.statCard}>
                <Flame color="#FF453A" size={24} style={{ marginBottom: 8 }} />
                <Text style={styles.statValue}>{Math.round(calories)}</Text>
                <Text style={styles.statLabel}>Ккал</Text>
             </View>

             {/* Дистанция (если есть) */}
             {distanceKm > 0 && (
                 <View style={styles.statCard}>
                    <MapPin color="#0A84FF" size={24} style={{ marginBottom: 8 }} />
                    <Text style={styles.statValue}>{distanceKm.toFixed(2)}</Text>
                    <Text style={styles.statLabel}>Км</Text>
                 </View>
             )}

             {/* Шаги (если есть) */}
             {steps > 0 && (
                 <View style={styles.statCard}>
                    <Footprints color="#BF5AF2" size={24} style={{ marginBottom: 8 }} />
                    <Text style={styles.statValue}>{steps}</Text>
                    <Text style={styles.statLabel}>Шаги</Text>
                 </View>
             )}
          </View>

          {/* Comment Input */}
          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>Как всё прошло?</Text>
            <TextInput 
              style={styles.commentInput}
              placeholder="Добавьте заметку о тренировке..."
              placeholderTextColor="#555"
              multiline
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />
          </View>

        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
           <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Сохранить тренировку</Text>
              <Check size={20} color="black" style={{ marginLeft: 8 }} />
           </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'black' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 30 },
  headerTitle: { color: '#8E8E93', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  closeBtn: { padding: 8, backgroundColor: 'rgba(255, 59, 48, 0.1)', borderRadius: 12 },

  titleContainer: { alignItems: 'center', marginBottom: 40 },
  congratsText: { color: colors.primary, fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 5, textTransform: 'uppercase' },
  workoutType: { color: 'white', fontSize: 28, fontFamily: 'Inter_800ExtraBold' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 40 },
  statCard: { 
     width: (width - 52) / 2, 
     backgroundColor: '#1C1C1E', borderRadius: 20, padding: 20, 
     alignItems: 'center', justifyContent: 'center' 
  },
  statValue: { color: 'white', fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  statLabel: { color: '#8E8E93', fontSize: 13, fontFamily: 'Inter_500Medium' },

  commentSection: { width: '100%' },
  sectionTitle: { color: 'white', fontSize: 18, fontFamily: 'Inter_600SemiBold', marginBottom: 15 },
  commentInput: { 
    backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, 
    color: 'white', fontSize: 16, fontFamily: 'Inter_400Regular',
    minHeight: 120, borderWidth: 1, borderColor: '#2C2C2E'
  },

  footer: { 
    padding: 20, borderTopWidth: 1, borderTopColor: '#1C1C1E', 
    backgroundColor: 'black'
  },
  saveButton: { 
    backgroundColor: colors.primary, borderRadius: 20, paddingVertical: 18, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center' 
  },
  saveText: { color: 'black', fontSize: 18, fontFamily: 'Inter_700Bold' },
});
