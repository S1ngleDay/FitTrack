// workoutSummaryScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { Check, Clock, Flame, MapPin, X } from 'lucide-react-native';
import { CommonActions } from '@react-navigation/native';
import MapView, { Polyline, UrlTile } from 'react-native-maps';

import { useThemeColors } from '../hooks/useThemeColors';
import { useWorkoutStore } from '../store/workoutStore';
import { useTranslation } from '../hooks/useTranslation'; // 👈 Добавили хук перевода

const { width } = Dimensions.get('window');

export default function WorkoutSummaryScreen({ route, navigation }) {
  const colors = useThemeColors();
  const { t } = useTranslation(); // 👈 Вызов хука

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

  // Локализованное форматирование времени
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hStr = t('summary_hoursShort');
    const mStr = t('summary_minsShort');
    const sStr = t('summary_secsShort');

    if (hours > 0) return `${hours}${hStr} ${minutes}${mStr}`;
    return `${minutes}${mStr} ${seconds}${sStr}`;
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
    // СОХРАНЯЕМ В ХРАНИЛИЩЕ
    finishWorkout({
      type,
      durationSeconds, // Лучше передавать секунды, стор сам переведет в минуты
      distanceKm: distanceKm,
      calories: Math.round(calories),
      steps,
      route: routeCoordinates,
      comment: comment.trim()
    });

    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] })
    );
  };

  const mapRegion = getMapRegion();

  // Локализация типа тренировки (если он стандартный из стора)
  const getTranslatedType = (typeStr) => {
    if (typeStr === 'Пробежка' || typeStr.includes('Бег')) return t('type_run');
    if (typeStr === 'Ходьба') return t('type_walk');
    if (typeStr === 'Силовая') return t('type_strength');
    if (typeStr === 'Кардио') return t('type_cardio');
    if (typeStr === 'Велосипед') return t('type_bike');
    return typeStr;
  };

  const translatedType = getTranslatedType(type);
  const completedText = t('summary_completed').replace('{type}', translatedType);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }))} style={[styles.closeBtn, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
              <X size={24} color="#FF3B30" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>{t('summary_title')}</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.titleContainer}>
            <Text style={[styles.congratsText, { color: colors.primary || '#CCFF00' }]}>{t('summary_congrats')}</Text>
            <Text style={[styles.workoutType, { color: colors.textPrimary }]}>{completedText}</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
              <Clock color={colors.primary || '#CCFF00'} size={24} style={{ marginBottom: 8 }} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatTime(durationSeconds)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('summary_statTime')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
              <Flame color="#FF453A" size={24} style={{ marginBottom: 8 }} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{Math.round(calories)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('summary_statKcal')}</Text>
            </View>
            {distanceKm > 0 && (
              <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
                <MapPin color="#0A84FF" size={24} style={{ marginBottom: 8 }} />
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{distanceKm.toFixed(2)}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('summary_statKm')}</Text>
              </View>
            )}
          </View>

          {routeCoordinates.length > 0 && mapRegion && (
            <View style={styles.mapSection}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('summary_routeTitle')}</Text>
              <View style={[styles.mapContainer, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={mapRegion}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  mapType="none"
                >
                  {/* Подключаем бесплатные тайлы OpenStreetMap */}
                  <UrlTile
                    urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maximumZ={19}
                    flipY={false}
                  />

                  {/* Рисуем маршрут поверх OSM */}
                  <Polyline
                    coordinates={routeCoordinates}
                    strokeColor="#32d74b"
                    strokeWidth={5}
                    lineCap="round"
                    lineJoin="round"
                  />
                </MapView>
              </View>
            </View>
          )}

          <View style={styles.commentSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('summary_notesTitle')}</Text>
            <TextInput
              style={[styles.commentInput, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder={t('summary_notesPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              multiline
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />
          </View>

        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary || '#CCFF00' }]} onPress={handleSave}>
            <Text style={styles.saveText}>{t('summary_saveBtn')}</Text>
            <Check size={20} color="black" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 30 },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  closeBtn: { padding: 8, borderRadius: 12 },
  titleContainer: { alignItems: 'center', marginBottom: 40 },
  congratsText: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 5, textTransform: 'uppercase' },
  workoutType: { fontSize: 28, fontFamily: 'Inter_800ExtraBold', textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 30 },
  statCard: { width: (width - 52) / 2, borderRadius: 20, padding: 20, alignItems: 'center' },
  statValue: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  statLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  mapSection: { width: '100%', marginBottom: 30 },
  mapContainer: { height: 200, borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  commentSection: { width: '100%', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginBottom: 15 },
  commentInput: { borderRadius: 16, padding: 16, fontSize: 16, minHeight: 100, borderWidth: 1 },
  footer: { padding: 20, borderTopWidth: 1 },
  saveButton: { borderRadius: 20, paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  saveText: { color: 'black', fontSize: 18, fontFamily: 'Inter_700Bold' },
});
