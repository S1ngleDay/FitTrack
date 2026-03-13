import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Clock, Flame, Footprints, Activity, MapPin, AlignLeft, Share2, Dumbbell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Polyline } from 'react-native-maps';

import colors from '../constants/colors';

export default function WorkoutDetailsModal({ isVisible, onClose, workout }) {
  if (!workout) return null;

  const durationVal = workout.duration || 0;
  const caloriesVal = workout.calories || 0;
  const distanceVal = workout.distance || 0;
  const stepsVal    = workout.steps || 0;

  const workoutType = workout.type || 'Тренировка';
  const isRun = workoutType.includes('Пробежка') || workoutType.includes('Бег');
  const isWalking = workoutType.includes('Ходьба');
  const isStrength = workoutType.includes('Силовая');
  
  let themeColor = '#FF9F0A'; 
  let HeaderIcon = Activity;

  if (isRun || isWalking) {
      themeColor = '#32d74b';
      HeaderIcon = Footprints;
  } else if (isStrength) {
      themeColor = '#0A84FF';
      HeaderIcon = Dumbbell;
  }

  let pace = '-';
  if (isRun && distanceVal > 0 && durationVal > 0) {
      const paceVal = durationVal / distanceVal; 
      let mins = Math.floor(paceVal);
      let secs = Math.round((paceVal - mins) * 60);
      if (secs === 60) { mins += 1; secs = 0; }
      pace = `${mins}'${secs.toString().padStart(2, '0')}"`;
  }

  const dateObj = workout.date ? new Date(workout.date) : new Date();
  const dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const timeStr = dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  // ПОЛУЧАЕМ СОХРАНЕННЫЙ МАРШРУТ ИЗ ИСТОРИИ
  const savedRoute = workout.route || [];
  const getMapRegion = () => {
    if (!savedRoute || savedRoute.length === 0) return null;
    const midPoint = savedRoute[Math.floor(savedRoute.length / 2)];
    return {
      latitude: midPoint.latitude,
      longitude: midPoint.longitude,
      latitudeDelta: distanceVal > 5 ? 0.05 : 0.01,
      longitudeDelta: distanceVal > 5 ? 0.05 : 0.01,
    };
  };
  const mapRegion = getMapRegion();

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={isVisible} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={Platform.OS === 'android' ? ['top'] : []}>
        
        <View style={styles.dragIndicator} />

        <View style={styles.headerTopRow}>
            <Text style={styles.headerTopTitle}>Итоги</Text>
            <View style={styles.headerActions}>
                <TouchableOpacity style={styles.iconButton}><Share2 size={20} color="#8E8E93" /></TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.iconButton}><X size={24} color="#8E8E93" /></TouchableOpacity>
            </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <View style={styles.heroSection}>
              <View style={[styles.heroIconCircle, { backgroundColor: `${themeColor}15`, borderColor: `${themeColor}40` }]}>
                 <HeaderIcon size={44} color={themeColor} />
              </View>
              <Text style={styles.heroTitle}>{workoutType}</Text>
              <Text style={styles.heroDate}>{dateStr} • {timeStr}</Text> 
            </View>

            <View style={styles.statsGrid}>
                 <View style={styles.statCard}>
                     <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 159, 10, 0.15)' }]}><Flame size={24} color="#FF9F0A" /></View>
                     <View><Text style={styles.statValue}>{caloriesVal}</Text><Text style={styles.statLabel}>ккал</Text></View>
                 </View>
                 <View style={styles.statCard}>
                     <View style={[styles.iconBox, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}><Clock size={24} color="#0A84FF" /></View>
                     <View><Text style={styles.statValue}>{durationVal}</Text><Text style={styles.statLabel}>минут</Text></View>
                 </View>
                 {distanceVal > 0 && (
                     <View style={styles.statCard}>
                         <View style={[styles.iconBox, { backgroundColor: 'rgba(50, 215, 75, 0.15)' }]}><MapPin size={24} color="#32d74b" /></View>
                         <View><Text style={styles.statValue}>{distanceVal}</Text><Text style={styles.statLabel}>км</Text></View>
                     </View>
                 )}
                 {isRun && (
                     <View style={styles.statCard}>
                         <View style={[styles.iconBox, { backgroundColor: 'rgba(191, 90, 242, 0.15)' }]}><Activity size={24} color="#BF5AF2" /></View>
                         <View><Text style={styles.statValue}>{pace}</Text><Text style={styles.statLabel}>темп</Text></View>
                     </View>
                 )}
            </View>

            <Text style={styles.sectionTitle}>Заметки</Text>
            {workout?.comment ? (
                <View style={styles.noteCard}>
                    <AlignLeft size={20} color="#8E8E93" style={{marginRight: 12, marginTop: 2}} />
                    <Text style={styles.noteText}>{workout.comment}</Text>
                </View>
            ) : (
                <View style={[styles.noteCard, { opacity: 0.6 }]}>
                    <AlignLeft size={20} color="#555" style={{marginRight: 12}} />
                    <Text style={[styles.noteText, { color: '#8E8E93' }]}>Нет заметок.</Text>
                </View>
            )}

            {/* РИСУЕМ КАРТУ ИЗ ИСТОРИИ */}
            {(isRun || isWalking) && (
                <>
                    <Text style={[styles.sectionTitle, { marginTop: 25 }]}>Маршрут</Text>
                    <View style={styles.mapContainer}>
                        {savedRoute.length > 0 && mapRegion ? (
                            <MapView style={{ flex: 1 }} initialRegion={mapRegion} scrollEnabled={false} zoomEnabled={false} pitchEnabled={false}>
                                <Polyline coordinates={savedRoute} strokeColor="#32d74b" strokeWidth={5} lineCap="round" lineJoin="round" />
                            </MapView>
                        ) : (
                            <LinearGradient colors={['#2C2C2E', '#1C1C1E']} style={styles.mapPlaceholder}>
                                <MapPin size={40} color={themeColor} opacity={0.5} />
                                <Text style={styles.mapPlaceholderText}>GPS маршрут не записан</Text>
                            </LinearGradient>
                        )}
                    </View>
                </>
            )}
            <View style={{height: 40}} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background || '#000' },
  dragIndicator: { width: 40, height: 4, backgroundColor: '#3A3A3C', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 10 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  headerTopTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: 'white' },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconButton: { padding: 6, backgroundColor: '#1C1C1E', borderRadius: 16 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  heroSection: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  heroIconCircle: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 1 },
  heroTitle: { color: 'white', fontSize: 26, fontFamily: 'Inter_800ExtraBold', marginBottom: 6 },
  heroDate: { color: '#8E8E93', fontSize: 14, fontFamily: 'Inter_500Medium' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
  statCard: { width: '48%', backgroundColor: '#1C1C1E', borderRadius: 20, padding: 16, flexDirection: 'column', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold', color: 'white', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#8E8E93', fontFamily: 'Inter_500Medium' },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: 'white', marginBottom: 15, marginLeft: 5 },
  noteCard: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#2C2C2E' },
  noteText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontFamily: 'Inter_500Medium', lineHeight: 22, flex: 1 },
  mapContainer: { height: 180, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#2C2C2E' },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  mapPlaceholderText: { color: '#8E8E93', fontSize: 14, fontFamily: 'Inter_500Medium' },
});
