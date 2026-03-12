import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  TouchableWithoutFeedback, ScrollView, Animated, PanResponder, Dimensions, 
  TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { 
  X, Play, Plus, Footprints, Dumbbell, Activity, Timer, Zap, 
  ChevronLeft, Flag 
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import ManualWorkoutForm from './ManualWorkoutForm';
import colors from '../constants/colors';
import { useWorkoutStore } from '../store/workoutStore';

const { height } = Dimensions.get('window');

// Данные для плиток (Пресеты)
// goalType: 'time' | 'distance' | 'none'
const ACTION_DATA = {
  'Пробежка': [
    { title: 'Свободный бег', subtitle: 'Без цели', color: '#32d74b', icon: <Footprints color="black" size={24} />, goalType: 'none' },
    { title: 'На время', subtitle: 'Укажите время', color: '#ffd500', icon: <Timer color="black" size={24} />, goalType: 'time' },
    { title: 'Дистанция', subtitle: 'Укажите км', color: '#0A84FF', icon: <Activity color="white" size={24} />, goalType: 'distance' },
    { title: 'Интервалы', subtitle: 'Сжигание', color: '#FF453A', icon: <Zap color="black" size={24} />, goalType: 'none' }
  ],
  'Силовая': [
    { title: 'Свободная', subtitle: 'Любые веса', color: '#FF3B30', icon: <Dumbbell color="black" size={24} />, goalType: 'none' },
    { title: 'Фулбоди', subtitle: 'Всё тело', color: '#BF5AF2', icon: <Activity color="white" size={24} />, goalType: 'none' },
    { title: 'На время', subtitle: 'Табата / Круговая', color: '#ffd500', icon: <Timer color="black" size={24} />, goalType: 'time' },
  ],
  'Кардио': [
    { title: 'Эллипс', subtitle: 'Разминка', color: '#FF9F0A', icon: <Activity color="black" size={24} />, goalType: 'none' },
    { title: 'На время', subtitle: 'Кардио-сессия', color: '#ffd500', icon: <Timer color="black" size={24} />, goalType: 'time' },
  ]
};

export default function WorkoutModal({ visible, onClose, initialMode = 'list' }) {
  const addManualWorkout = useWorkoutStore((s) => s.addManualWorkout);
  const startWorkoutInStore = useWorkoutStore((s) => s.startWorkout);

  const navigation = useNavigation();
  
  // Состояния
  const [activeTab, setActiveTab] = useState('Пробежка');
  // step: 'menu' | 'setup' | 'manual'
  const [step, setStep] = useState('menu');
  
  // Данные выбранного пресета для настройки
  const [pendingWorkout, setPendingWorkout] = useState(null); 
  const [goalValue, setGoalValue] = useState(''); // Значение цели (мин или км)

  const panY = useRef(new Animated.Value(0)).current;

  // Сброс при открытии
  useEffect(() => {
    if (visible) {
      panY.setValue(0);
      setStep(initialMode === 'manual' ? 'manual' : 'menu');
      setPendingWorkout(null);
      setGoalValue('');
    }
  }, [visible, initialMode]);

  // Жест закрытия
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150) {
          onClose();
        } else {
          Animated.spring(panY, { toValue: 0, useNativeDriver: false, bounciness: 5 }).start();
        }
      },
    })
  ).current;

  // Обработка нажатия на плитку
  const handleTilePress = (item) => {
    if (item.goalType === 'none') {
      // Сразу стартуем
      startWorkout(activeTab, item.title, item.subtitle);
    } else {
      // Идем настраивать
      setPendingWorkout(item);
      setGoalValue(''); // Сброс
      setStep('setup');
    }
  };

  // Финальный старт
  const startWorkout = (type, title, subtitle) => {
    console.log('🚀 Start:', type, title, subtitle);
    startWorkoutInStore(type, title, subtitle);
    onClose();
    navigation.navigate('ActiveRun', {
      workoutType: type,
      goalTitle: title,
      goalSubtitle: subtitle
    });
  };

  // Старт после настройки цели
  const confirmGoalStart = () => {
    if (!pendingWorkout) return;
    
    let finalSubtitle = pendingWorkout.subtitle;
    if (goalValue) {
        const unit = pendingWorkout.goalType === 'time' ? 'мин' : 'км';
        finalSubtitle = `Цель: ${goalValue} ${unit}`;
    }
    
    startWorkout(activeTab, pendingWorkout.title, finalSubtitle);
  };

  // --- RENDERERS ---

  // Экран настройки цели
  const renderGoalSetup = () => {
    if (!pendingWorkout) return null;
    const isTime = pendingWorkout.goalType === 'time';
    const unit = isTime ? 'мин' : 'км';
    const placeholder = isTime ? '30' : '5.0';
    
    return (
      <View style={{ flex: 1 }}>
         {/* Хедер с кнопкой назад */}
         <View style={styles.setupHeader}>
            <TouchableOpacity onPress={() => setStep('menu')} style={styles.backButton}>
               <ChevronLeft size={24} color="#8E8E93" />
               <Text style={styles.backText}>Назад</Text>
            </TouchableOpacity>
            <View style={{flex: 1}} />
         </View>

         {/* Контент с прокруткой и защитой от клавиатуры */}
         <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
         >
             <ScrollView 
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
             >
                 <View style={{ alignItems: 'center', marginTop: 10 }}>
                    <View style={[styles.iconBigCircle, { backgroundColor: pendingWorkout.color }]}>
                        {isTime ? <Timer color="black" size={40} /> : <Activity color="white" size={40} />}
                    </View>
                    
                    <Text style={styles.setupTitle}>{pendingWorkout.title}</Text>
                    <Text style={styles.setupSub}>
                        {isTime ? 'Сколько планируете заниматься?' : 'Какую дистанцию хотите пробежать?'}
                    </Text>
                 </View>

                 <View style={{ marginTop: 40 }}>
                     <Text style={styles.goalLabel}>
                        {isTime ? 'ДЛИТЕЛЬНОСТЬ' : 'ДИСТАНЦИЯ'}
                     </Text>
                     <View style={styles.inputWrapper}>
                        <TextInput 
                            style={styles.goalInput}
                            value={goalValue}
                            onChangeText={setGoalValue}
                            placeholder={placeholder}
                            placeholderTextColor="#555"
                            keyboardType="numeric"
                            autoFocus
                            returnKeyType="done"
                        />
                        <Text style={styles.unitText}>{unit}</Text>
                     </View>
                 </View>

                 {/* Кнопка внизу */}
                 <TouchableOpacity 
                    style={[styles.bigStartButton, !goalValue && { opacity: 0.6 }]}
                    onPress={confirmGoalStart}
                    disabled={!goalValue}
                 >
                    <Text style={styles.bigStartText}>Погнали</Text>
                    <Play size={20} color="black" fill="black" style={{ marginLeft: 8 }} />
                 </TouchableOpacity>
                 
                 {/* Запас под клавиатуру */}
                 <View style={{ height: Platform.OS === 'ios' ? 150 : 50, backgroundColor: 'transparent' }} />
             </ScrollView>
         </KeyboardAvoidingView>
      </View>
    );
  };

  // Экран меню (плитки)
  const renderMenu = () => (
    <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Табы */}
        <View style={styles.segmentControl}>
            {['Пробежка', 'Силовая', 'Кардио'].map((tab) => (
            <TouchableOpacity
                key={tab}
                style={[styles.segment, activeTab === tab && styles.activeSegment]}
                onPress={() => setActiveTab(tab)}
            >
                <Text style={[styles.segmentText, activeTab === tab && styles.activeSegmentText]}>
                {tab}
                </Text>
            </TouchableOpacity>
            ))}
        </View>

        <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
            {/* Большая кнопка "Быстрый старт" */}
            <TouchableOpacity
            style={styles.heroButton}
            activeOpacity={0.9}
            onPress={() => startWorkout(activeTab, 'Быстрый старт', 'Свободный режим')}
            >
            <LinearGradient
                colors={activeTab === 'Силовая' ? ['#FF3B30', '#D70015'] : ['#32d74b', '#009904']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.heroGradient}
            >
                <View>
                <Text style={styles.heroTitle}>Быстрый старт</Text>
                <Text style={styles.heroSub}>Начать без цели</Text>
                </View>
                <View style={styles.heroIconBox}>
                <Play size={24} color="black" fill="black" style={{ marginLeft: 3 }} />
                </View>
            </LinearGradient>
            </TouchableOpacity>

            {/* Плитки */}
            <View style={styles.tilesGrid}>
            {ACTION_DATA[activeTab]?.map((item, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.tileCard}
                    activeOpacity={0.8}
                    onPress={() => handleTilePress(item)}
                >
                    <View style={[styles.tileIconCircle, { backgroundColor: item.color }]}>
                        {item.icon}
                    </View>
                    <View>
                        <Text style={styles.tileTitle}>{item.title}</Text>
                        <Text style={styles.tileSub}>{item.subtitle}</Text>
                    </View>
                    {/* Если это цель, покажем иконку настройки, иначе Play */}
                    <View style={styles.playMini}>
                         {item.goalType !== 'none' ? (
                             <Flag size={12} color="rgba(255,255,255,0.5)" />
                         ) : (
                             <Play size={12} color="rgba(255,255,255,0.5)" fill="rgba(255,255,255,0.5)" />
                         )}
                    </View>
                </TouchableOpacity>
            ))}
            </View>
        </ScrollView>

        <View style={styles.footer}>
            <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setStep('manual')}
            >
            <Plus size={20} color="#8E8E93" />
            <Text style={styles.manualButtonText}>Добавить запись вручную</Text>
            </TouchableOpacity>
        </View>
    </View>
  );

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      
      {/* Затемнение фона (закрывает модалку при клике) */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      {/* Обертка модалки */}
      <View style={styles.modalWrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{
                translateY: panY.interpolate({
                  inputRange: [-50, 0, height],
                  outputRange: [0, 0, height],
                  extrapolate: 'clamp'
                })
              }]
            }
          ]}
        >
          {/* Хедер (общий) */}
          <View style={styles.swipeHeader} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>
                {step === 'manual' ? 'Ручной ввод' : step === 'setup' ? 'Настройка' : 'Новая тренировка'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Контент в зависимости от шага */}
          {step === 'manual' ? (
              <View style={{ flex: 1, paddingHorizontal: 20 }}>
                <ManualWorkoutForm
                    onCancel={() => {
                        if (initialMode === 'manual') onClose();
                        else setStep('menu');
                    }}
                    onSave={async (data) => {
                        try {
                            await addManualWorkout(data);
                            onClose();
                        } catch (e) { console.error(e) }
                    }}
                />
              </View>
          ) : step === 'setup' ? (
              renderGoalSetup()
          ) : (
              renderMenu()
          )}

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalWrapper: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%', paddingBottom: 20 },
  
  swipeHeader: { paddingTop: 12, paddingBottom: 10, paddingHorizontal: 20, alignItems: 'center' },
  dragHandle: { width: 40, height: 5, backgroundColor: '#3A3A3C', borderRadius: 3, marginBottom: 15 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
  title: { color: colors.textPrimary, fontSize: 22, fontFamily: 'Inter_700Bold' },
  closeBtn: { padding: 4, backgroundColor: '#2C2C2E', borderRadius: 12 },
  
  // Menu Styles
  segmentControl: { flexDirection: 'row', backgroundColor: '#2C2C2E', borderRadius: 12, padding: 4, marginBottom: 20 },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeSegment: { backgroundColor: '#3A3A3C' },
  segmentText: { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' },
  activeSegmentText: { color: colors.textPrimary },
  gridContainer: { paddingBottom: 20 },
  
  heroButton: { marginBottom: 15, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  heroGradient: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 20 },
  heroTitle: { color: 'black', fontSize: 20, fontFamily: 'Inter_700Bold' },
  heroSub: { color: 'rgba(0,0,0,0.6)', fontSize: 14, fontFamily: 'Inter_500Medium' },
  heroIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  
  tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  tileCard: { width: '48%', backgroundColor: '#2C2C2E', borderRadius: 16, padding: 16, minHeight: 110, justifyContent: 'space-between', marginBottom: 12 },
  tileIconCircle: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  tileTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  tileSub: { color: colors.textSecondary, fontSize: 12, fontFamily: 'Inter_500Medium' },
  playMini: { position: 'absolute', right: 10, bottom: 10 },
  
  footer: { paddingTop: 10, borderTopWidth: 1, borderTopColor: '#2C2C2E', marginTop: 'auto', marginBottom: 20 },
  manualButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10 },
  manualButtonText: { color: colors.textSecondary, fontSize: 15, fontFamily: 'Inter_600SemiBold' },

  // Setup Styles
  setupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 10 },
  backButton: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  backText: { color: colors.textSecondary, fontSize: 16, fontFamily: 'Inter_500Medium', marginLeft: 4 },
  
  iconBigCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  setupTitle: { color: colors.textPrimary, fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  setupSub: { color: colors.textSecondary, fontSize: 16, fontFamily: 'Inter_500Medium', marginBottom: 20 },
  
  goalLabel: { color: colors.textSecondary, fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 10, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: '#3A3A3C', paddingBottom: 10 },
  goalInput: { flex: 1, fontSize: 40, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  unitText: { fontSize: 20, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary, marginBottom: 8, marginLeft: 10 },
  
  bigStartButton: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    backgroundColor: colors.primary, width: '100%', paddingVertical: 18, 
    borderRadius: 20, marginTop: 40 
  },
  bigStartText: { color: 'black', fontSize: 18, fontFamily: 'Inter_700Bold' }
});
