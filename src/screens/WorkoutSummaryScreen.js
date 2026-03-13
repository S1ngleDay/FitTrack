import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TextInput, 
  TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Dimensions 
} from 'react-native';
import { Check, Clock, Flame, Footprints, MapPin, X } from 'lucide-react-native';
import { CommonActions } from '@react-navigation/native';
import MapView, { Polyline } from 'react-native-maps';

import colors from '../constants/colors';
import { useWorkoutStore } from '../store/workoutStore';

const { width } = Dimensions.get('window');

export default function WorkoutSummaryScreen({ route, navigation }) {
  // ДОСТАЕМ ДАННЫЕ И МАРШРУТ
  const { 
    type = 'Тренировка', 
    durationSeconds = 0, 
    distanceKm = 0, 
    calories = 0, 
    steps = 0,
    routeCoordinates = [] 
  } = route.params || {};

  const finishWorkout = useWorkoutStore(s => s.finishWorkout);
  const [comment, setComment] = useState('');

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}ч ${minutes}м`;
    return `${minutes}м ${seconds}с`;
  };

  const getMapRegion = () => {
    if (!routeCoordinates || routeCoordinates.length === 0) return null;
    const midPoint = routeCoordinates[Math.floor(routeCoordinates.length / 2)];
    return {
      latitude: midPoint.latitude,
      longitude: midPoint.longitude,
      latitudeDelta: distanceKm > 5 ? 0.05 : 0.01, 
      longitudeDelta: distanceKm > 5 ? 0.05 : 0.01,
    };
  };

  const handleSave = () => {
    // СОХРАНЯЕМ В ХРАНИЛИЩЕ (включая массив координат)
    finishWorkout({
      type,
      duration: Math.floor(durationSeconds / 60), // Сохраняем в минутах для консистентности
      distance: distanceKm,
      calories: Math.round(calories),
      steps,
      route: routeCoordinates, // <--- Важно!
      comment: comment.trim()
    });

    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] })
    );
  };

  const mapRegion = getMapRegion();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }))} style={styles.closeBtn}>
              <X size={24} color="#FF3B30" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Обзор тренировки</Text>
            <View style={{ width: 40 }} /> 
          </View>

          <View style={styles.titleContainer}>
             <Text style={styles.congratsText}>Отличная работа!</Text>
             <Text style={styles.workoutType}>{type} завершена</Text>
          </View>

          <View style={styles.statsGrid}>
             <View style={styles.statCard}>
                <Clock color={colors.primary} size={24} style={{ marginBottom: 8 }} />
                <Text style={styles.statValue}>{formatTime(durationSeconds)}</Text>
                <Text style={styles.statLabel}>Время</Text>
             </View>
             <View style={styles.statCard}>
                <Flame color="#FF453A" size={24} style={{ marginBottom: 8 }} />
                <Text style={styles.statValue}>{Math.round(calories)}</Text>
                <Text style={styles.statLabel}>Ккал</Text>
             </View>
             {distanceKm > 0 && (
                 <View style={styles.statCard}>
                    <MapPin color="#0A84FF" size={24} style={{ marginBottom: 8 }} />
                    <Text style={styles.statValue}>{distanceKm.toFixed(2)}</Text>
                    <Text style={styles.statLabel}>Км</Text>
                 </View>
             )}
          </View>

          {/* ПОКАЗЫВАЕМ МАРШРУТ ЕСЛИ ЕСТЬ */}
          {routeCoordinates.length > 0 && mapRegion && (
            <View style={styles.mapSection}>
              <Text style={styles.sectionTitle}>Ваш маршрут</Text>
              <View style={styles.mapContainer}>
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={mapRegion}
                  scrollEnabled={false} zoomEnabled={false} pitchEnabled={false}
                >
                  <Polyline coordinates={routeCoordinates} strokeColor="#32d74b" strokeWidth={5} lineCap="round" lineJoin="round" />
                </MapView>
              </View>
            </View>
          )}

          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>Заметки</Text>
            <TextInput 
              style={styles.commentInput}
              placeholder="Добавьте заметку о тренировке..."
              placeholderTextColor="#555" multiline value={comment} onChangeText={setComment} textAlignVertical="top"
            />
          </View>

        </ScrollView>

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
  safeArea: { flex: 1, backgroundColor: colors.background || '#000' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 30 },
  headerTitle: { color: colors.textSecondary || '#8E8E93', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  closeBtn: { padding: 8, backgroundColor: 'rgba(255, 59, 48, 0.1)', borderRadius: 12 },
  titleContainer: { alignItems: 'center', marginBottom: 40 },
  congratsText: { color: colors.primary || '#CCFF00', fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 5, textTransform: 'uppercase' },
  workoutType: { color: colors.textPrimary || 'white', fontSize: 28, fontFamily: 'Inter_800ExtraBold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 30 },
  statCard: { width: (width - 52) / 2, backgroundColor: colors.cardBg || '#1C1C1E', borderRadius: 20, padding: 20, alignItems: 'center' },
  statValue: { color: 'white', fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  statLabel: { color: '#8E8E93', fontSize: 13, fontFamily: 'Inter_500Medium' },
  mapSection: { width: '100%', marginBottom: 30 },
  mapContainer: { height: 200, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#2C2C2E', backgroundColor: '#1C1C1E' },
  commentSection: { width: '100%', marginBottom: 20 },
  sectionTitle: { color: 'white', fontSize: 18, fontFamily: 'Inter_600SemiBold', marginBottom: 15 },
  commentInput: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, color: 'white', fontSize: 16, minHeight: 100, borderWidth: 1, borderColor: '#2C2C2E' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#1C1C1E', backgroundColor: '#000' },
  saveButton: { backgroundColor: colors.primary || '#CCFF00', borderRadius: 20, paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  saveText: { color: 'black', fontSize: 18, fontFamily: 'Inter_700Bold' },
});
