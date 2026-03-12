import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { X, Calendar, Clock, Flame, Footprints, Activity, MapPin, Heart, AlignLeft, Share2, Timer, Dumbbell, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../constants/colors';
const { width } = Dimensions.get('window');

export default function WorkoutDetailsModal({ isVisible, onClose, workout }) {
  if (!workout) return null;

  // --- Helpers ---
  const getMetric = (iconChar) => workout.metrics?.find(m => m.icon === iconChar);
  
  // Достаем данные из metrics (которые мы сохраняли в WorkoutStore)
  // Иконки: '⏱️', '🔥', '📍', '👣'
  const durationM = getMetric('⏱️');
  const caloriesM = getMetric('🔥');
  const distanceM = getMetric('📍');
  const stepsM    = getMetric('👣');

  // Если метрик нет, берем из корня объекта (совместимость)
  const durationVal = durationM ? parseFloat(durationM.value) : (workout.duration || 0);
  const caloriesVal = caloriesM ? parseFloat(caloriesM.value) : (workout.calories || 0);
  const distanceVal = distanceM ? parseFloat(distanceM.value) : (workout.distance || 0);
  const stepsVal    = stepsM    ? parseFloat(stepsM.value)    : (workout.steps || 0);

  // Тип тренировки
  const isRun = workout.type.includes('Пробежка') || workout.type.includes('Бег');
  const isStrength = workout.type.includes('Силовая');
  
  // Цвета
  let themeColor = '#FF9F0A'; // Default Orange
  let gradientColors = ['#FF9F0A', '#FF3B30'];
  let HeaderIcon = Activity;

  if (isRun) {
      themeColor = '#32d74b';
      gradientColors = ['#32d74b', '#007D35'];
      HeaderIcon = Footprints;
  } else if (isStrength) {
      themeColor = '#0A84FF';
      gradientColors = ['#0A84FF', '#0040DD'];
      HeaderIcon = Dumbbell;
  }

  // Расчет темпа (мин/км)
  let pace = '-';
  if (isRun && distanceVal > 0 && durationVal > 0) {
      const paceVal = durationVal / distanceVal; // мин / км
      const mins = Math.floor(paceVal);
      const secs = Math.round((paceVal - mins) * 60);
      pace = `${mins}'${secs < 10 ? '0' : ''}${secs}"`;
  }

  // Форматирование даты
  const dateObj = new Date(workout.startTime || new Date());
  const dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const timeStr = dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        
        {/* Хедер с градиентом */}
        <LinearGradient colors={gradientColors} style={styles.headerBackground}>
             <View style={styles.headerTopRow}>
                 <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                     <X size={24} color="rgba(255,255,255,0.9)" />
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.shareButton}>
                     <Share2 size={20} color="white" />
                 </TouchableOpacity>
             </View>

             <View style={styles.headerContent}>
                <View style={styles.iconCircle}>
                    <HeaderIcon size={32} color={themeColor} />
                </View>
                <View>
                    <Text style={styles.headerTitle}>{workout.type}</Text>
                    <Text style={styles.headerDate}>{dateStr} • {timeStr}</Text> 
                </View>
             </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* 1. Основные цифры (Карточки) */}
            <View style={styles.statsRow}>
                 <View style={styles.statCard}>
                     <Text style={[styles.statValue, { color: themeColor }]}>
                        {durationVal}
                     </Text>
                     <Text style={styles.statLabel}>мин</Text>
                     <Clock size={16} color="#555" style={styles.statIcon} />
                 </View>

                 <View style={styles.statCard}>
                     <Text style={[styles.statValue, { color: '#FF453A' }]}>
                        {caloriesVal}
                     </Text>
                     <Text style={styles.statLabel}>ккал</Text>
                     <Flame size={16} color="#555" style={styles.statIcon} />
                 </View>
                 
                 {distanceVal > 0 && (
                     <View style={styles.statCard}>
                         <Text style={[styles.statValue, { color: '#0A84FF' }]}>
                            {distanceVal}
                         </Text>
                         <Text style={styles.statLabel}>км</Text>
                         <MapPin size={16} color="#555" style={styles.statIcon} />
                     </View>
                 )}
            </View>

            {/* 2. Детали (Сетка) */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Детали</Text>
                <View style={styles.detailsGrid}>
                    
                    {/* Средний темп (для бега) */}
                    {isRun && (
                        <View style={styles.detailItem}>
                            <View style={[styles.detailIconBox, { backgroundColor: colors.cardBg }]}>
                                <Activity size={20} color="#8E8E93" />
                            </View>
                            <View>
                                <Text style={styles.detailValue}>{pace}</Text>
                                <Text style={styles.detailLabel}>Темп</Text>
                            </View>
                        </View>
                    )}

                    {/* Шаги */}
                    {stepsVal > 0 && (
                        <View style={styles.detailItem}>
                            <View style={[styles.detailIconBox, { backgroundColor: colors.cardBg }]}>
                                <Footprints size={20} color="#BF5AF2" />
                            </View>
                            <View>
                                <Text style={styles.detailValue}>{stepsVal}</Text>
                                <Text style={styles.detailLabel}>Шаги</Text>
                            </View>
                        </View>
                    )}

                    {/* Интенсивность (расчетная) */}
                    <View style={styles.detailItem}>
                        <View style={[styles.detailIconBox, { backgroundColor: colors.cardBg }]}>
                            <Zap size={20} color="#FFD60A" />
                        </View>
                        <View>
                            <Text style={styles.detailValue}>
                                {durationVal > 0 ? Math.round(caloriesVal / durationVal) : '-'}
                            </Text>
                            <Text style={styles.detailLabel}>ккал/мин</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* 3. Комментарий (если есть) */}
            {workout.comment ? (
                <View style={styles.section}>
                     <Text style={styles.sectionTitle}>Заметки</Text>
                     <View style={styles.noteCard}>
                         <AlignLeft size={20} color="#8E8E93" style={{marginRight: 12, marginTop: 2}} />
                         <Text style={styles.noteText}>
                             {workout.comment}
                         </Text>
                     </View>
                </View>
            ) : (
                /* Если нет комментария, можно показать заглушку или кнопку "Добавить" */
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Заметки</Text>
                    <View style={[styles.noteCard, { opacity: 0.5 }]}>
                        <Text style={styles.noteText}>Нет заметок для этой тренировки.</Text>
                    </View>
                </View>
            )}

            {/* 4. Карта (Заглушка для бега) */}
            {isRun && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Маршрут</Text>
                    <View style={styles.mapContainer}>
                        <LinearGradient colors={['#2C2C2E', '#1C1C1E']} style={styles.mapPlaceholder}>
                            <MapPin size={40} color={themeColor} />
                            <Text style={styles.mapPlaceholderText}>Карта недоступна</Text>
                        </LinearGradient>
                    </View>
                </View>
            )}
            
            <View style={{height: 60}} />

        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  
  // Header
  headerBackground: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  closeButton: { padding: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20 },
  shareButton: { padding: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20 },
  
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 5 },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_800ExtraBold', color: colors.textPrimary, marginBottom: 2 },
  headerDate: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.8)' },

  scrollContent: { padding: 20, paddingTop: 30 },

  // Stats Cards
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 30 },
  statCard: { 
      flex: 1, backgroundColor: colors.cardBg, borderRadius: 20, padding: 16, 
      alignItems: 'center', justifyContent: 'center', minHeight: 100, position: 'relative'
  },
  statValue: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 4, color: colors.textPrimary },
  statLabel: { color: colors.textSecondary, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  statIcon: { position: 'absolute', top: 10, right: 10, opacity: 0.3 },

  // Section
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary, marginBottom: 15, marginLeft: 5 },
  
  // Details Grid
  detailsGrid: { backgroundColor: colors.cardBg, borderRadius: 20, padding: 20, gap: 20 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  detailIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2C2C2E' },
  detailValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  detailLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary },

  // Notes
  noteCard: { flexDirection: 'row', backgroundColor: colors.cardBg, borderRadius: 20, padding: 20 },
  noteText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22, flex: 1 },

  // Map
  mapContainer: { height: 180, borderRadius: 20, overflow: 'hidden' },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  mapPlaceholderText: { color: colors.textSecondary, fontSize: 14, fontFamily: 'Inter_500Medium' },
});
