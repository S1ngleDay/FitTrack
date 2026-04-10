// WorkoutModal.js
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, ScrollView, Animated, PanResponder, Dimensions, TextInput, KeyboardAvoidingView, Platform, FlatList, Alert } from 'react-native';
import { X, Play, Plus, Footprints, Dumbbell, Activity, Timer, Zap, ChevronLeft, Flag, List, PlusCircle, Menu, Bike, Edit2, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import ManualWorkoutForm from './ManualWorkoutForm';

import { useThemeColors } from '../hooks/useThemeColors';
import { useWorkoutStore } from '../store/workoutStore';
import CreateWorkoutPlanModal from './CreateWorkoutPlanModal';
import { useTranslation } from '../hooks/useTranslation';

const { height } = Dimensions.get('window');

const ACTION_DATA_KEYS = {
  run: [
    { titleKey: 'tileFreeRunTitle', subtitleKey: 'tileFreeRunSub', color: '#32d74b', icon: <Footprints color="black" size={24} />, goalType: 'none' },
    { titleKey: 'tileTimeRunTitle', subtitleKey: 'tileTimeRunSub', color: '#ffd500', icon: <Timer color="black" size={24} />, goalType: 'time' },
    { titleKey: 'tileDistRunTitle', subtitleKey: 'tileDistRunSub', color: '#0A84FF', icon: <Activity color="white" size={24} />, goalType: 'distance' },
  ],
  'walk': [
    { titleKey: 'tileFreeWalkTitle', subtitleKey: 'tileFreeWalkSub', color: '#BF5AF2', icon: <Footprints color="white" size={24} />, goalType: 'none' },
    { titleKey: 'tileTimeWalkTitle', subtitleKey: 'tileTimeWalkSub', color: '#ffd500', icon: <Timer color="black" size={24} />, goalType: 'time' },
    { titleKey: 'tileDistWalkTitle', subtitleKey: 'tileDistWalkSub', color: '#0A84FF', icon: <Activity color="white" size={24} />, goalType: 'distance' },
  ],
  'bike': [
    { titleKey: 'tileFreeBikeTitle', subtitleKey: 'tileFreeBikeSub', color: '#30D158', icon: <Bike color="black" size={24} />, goalType: 'none' },
    { titleKey: 'tileTimeBikeTitle', subtitleKey: 'tileTimeBikeSub', color: '#ffd500', icon: <Timer color="black" size={24} />, goalType: 'time' },
    { titleKey: 'tileDistBikeTitle', subtitleKey: 'tileDistBikeSub', color: '#0A84FF', icon: <Activity color="white" size={24} />, goalType: 'distance' },
  ],
  strength: [
    { titleKey: 'tilePlansTitle', subtitleKey: 'tilePlansSub', color: '#FF3B30', icon: <List color="white" size={24} />, goalType: 'plans' },
  ],
  cardio: [
    { titleKey: 'tileFreeCardioTitle', subtitleKey: 'tileFreeCardioSub', color: '#FF9F0A', icon: <Activity color="black" size={24} />, goalType: 'none' },
    { titleKey: 'tileTimeCardioTitle', subtitleKey: 'tileTimeCardioSub', color: '#ffd500', icon: <Timer color="black" size={24} />, goalType: 'time' },
  ]
};

export default function WorkoutModal({ visible, onClose, initialMode = 'menu', initialWorkout = null }) {
  const colors = useThemeColors();
  const { t } = useTranslation();



  const addManualWorkout = useWorkoutStore((s) => s.addManualWorkout);
  const startWorkoutInStore = useWorkoutStore((s) => s.startWorkout);
  const getPlans = useWorkoutStore((s) => s.getPlans());
  const startWorkoutFromPlan = useWorkoutStore((s) => s.startWorkoutFromPlan);

  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('run');
  const [step, setStep] = useState('menu');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [pendingWorkout, setPendingWorkout] = useState(null);
  const [goalValue, setGoalValue] = useState('');

  const panY = useRef(new Animated.Value(0)).current;

  const deleteWorkoutPlan = useWorkoutStore(s => s.deleteWorkoutPlan);
  const handleDeletePlan = (planId) => {
    Alert.alert(
      t('deletePlanTitle') || 'Удалить план?',
      t('deletePlanDesc') || 'Это действие нельзя отменить.',
      [
        { text: t('cancelBtn') || 'Отмена', style: 'cancel' },
        { text: t('deleteBtn') || 'Удалить', style: 'destructive', onPress: () => deleteWorkoutPlan(planId) }
      ]
    );
  };

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
      
      // Если есть initialWorkout с предзаполненной целью
      if (initialWorkout && initialWorkout.goalType && initialWorkout.goalValue) {
        // Определяем тип тренировки для activeTab
        const normalizedType = initialWorkout.type.toLowerCase();
        if (normalizedType.includes('run') || normalizedType === 'бег') {
          setActiveTab('run');
        } else if (normalizedType.includes('walk') || normalizedType === 'ходьба') {
          setActiveTab('walk');
        } else if (normalizedType.includes('bike') || normalizedType === 'вело') {
          setActiveTab('bike');
        } else if (normalizedType.includes('strength') || normalizedType === 'силовая') {
          setActiveTab('strength');
        } else if (normalizedType.includes('cardio')) {
          setActiveTab('cardio');
        }
        
        // Ищем соответствующий элемент из ACTION_DATA с нужным goalType
        const workoutType = normalizedType.includes('run') ? 'run' : normalizedType.includes('walk') ? 'walk' : 
                           normalizedType.includes('bike') ? 'bike' : normalizedType.includes('cardio') ? 'cardio' : 'run';
        const actionItems = ACTION_DATA_KEYS[workoutType] || [];
        const matchingAction = actionItems.find(item => item.goalType === initialWorkout.goalType);
        
        if (matchingAction) {
          setPendingWorkout({
            ...matchingAction,
            title: initialWorkout.title || matchingAction.title,
            subtitle: initialWorkout.subtitle || matchingAction.subtitle,
            color: matchingAction.color,
            icon: matchingAction.icon,
            goalType: matchingAction.goalType
          });
          setGoalValue(initialWorkout.goalValue);
          setStep('setup');
        } else {
          // Fallback если не нашли нужный тип
          setStep(initialMode === 'manual' ? 'manual' : 'menu');
          setPendingWorkout(null);
          setGoalValue('');
        }
      } else {
        // Обычная инициализация
        setStep(initialMode === 'manual' ? 'manual' : 'menu');
        setPendingWorkout(null);
        setGoalValue('');
      }
    }
  }, [visible, initialMode, initialWorkout]);

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

  const actionData = ACTION_DATA_KEYS[activeTab].map(item => {
    let sub = t(item.subtitleKey);
    if (item.goalType === 'plans') {
      sub = `${getPlans.length} ${t('tilePlansSub')}`;
    }
    return { ...item, title: t(item.titleKey), subtitle: sub };
  });


  const handleTilePress = (item) => {
    if (item.goalType === 'none') {
      startWorkout(activeTab, item.title, item.subtitle);
    } else if (item.goalType === 'plans') {
      setStep('plans');
    } else {
      setPendingWorkout(item);
      setGoalValue('');
      setStep('setup');
    }
  };

  const getSystemType = (displayType) => {
    if (!displayType) return 'workout';
    const lower = displayType.toLowerCase();

    // Ищем совпадения с русским или любым другим языком и возвращаем системный ключ
    if (lower.includes('бег') || lower.includes('пробежка') || lower.includes('run')) return 'run';
    if (lower.includes('силов') || lower.includes('strength')) return 'strength';
    if (lower.includes('кардио') || lower.includes('cardio')) return 'cardio';
    if (lower.includes('вело') || lower.includes('bike') || lower.includes('cycl')) return 'bike';
    if (lower.includes('ходьба') || lower.includes('walk')) return 'walk';

    return displayType;
  };

  const startWorkout = (type, title, subtitle) => {
    const systemType = getSystemType(type);

    // Сохраняем системный тип в стор
    startWorkoutInStore(systemType, title, subtitle);
    onClose();

    navigation.navigate('ActiveRun', {
      workoutType: systemType,
      goalTitle: title,
      goalSubtitle: subtitle
    });
  };


  const startPlanWorkout = (planId) => {
    startWorkoutFromPlan(planId);
    onClose();
    navigation.navigate('ActiveWorkout');
  };

  const confirmGoalStart = () => {
    if (!pendingWorkout) return;
    let finalSubtitle = pendingWorkout.subtitle;
    if (goalValue) {
      const unit = pendingWorkout.goalType === 'time' ? t('minAbbr') : t('unitKm');
      finalSubtitle = `${goalValue} ${unit}`;
    }
    startWorkout(activeTab, pendingWorkout.title, finalSubtitle);
  };

  const renderPlansScreen = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.setupHeader}>
        <TouchableOpacity onPress={() => setStep('menu')} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.textSecondary} />
          <Text style={[styles.backText, { color: colors.textSecondary }]}>{t('backBtn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.createPlanBtn, { shadowColor: '#FF3B30' }]} 
          onPress={() => { setEditingPlan(null); setShowPlanModal(true); }} 
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF3B30', '#D70015']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createPlanGradient}
          >
            <Plus size={18} color="white" strokeWidth={3} />
            <Text style={styles.createPlanText}>{t('createPlanBtn')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={getPlans.length === 0 ? [{ id: 'empty', isEmpty: true }] : getPlans}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          if (item.isEmpty) {
            return (
              <View style={[styles.emptyPlans, { marginTop: 100 }]}>
                <Menu size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t('emptyPlansTitle')}</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{t('emptyPlansSub')}</Text>
              </View>
            );
          }
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.planCard, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => startPlanWorkout(item.id)}
            >
              <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: colors.textPrimary, flex: 1, paddingRight: 12 }]} numberOfLines={1}>
                  {item.name}
                </Text>

                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TouchableOpacity
                    style={[styles.actionIconBtn, { backgroundColor: colors.cardBg }]} // Подложка чуть светлее/темнее фона
                    onPress={() => { setEditingPlan(item); setShowPlanModal(true); }}
                  >
                    <Edit2 size={16} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionIconBtn, { backgroundColor: '#FF453A15' }]} // iOS-стиль: 15% прозрачности красного
                    onPress={() => handleDeletePlan(item.id)}
                  >
                    <Trash2 size={16} color="#FF453A" />
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text style={[styles.planDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item.description ? `${item.description} • ` : ''}{item.exercises?.length || 0} {t('exercisesCount') || 'упр.'}
                </Text>
              </View>

              <View style={styles.planFooter}>
                <Text style={[styles.planDate, { color: colors.textSecondary }]}>
                  {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                </Text>
                <LinearGradient
                  colors={['#FF3B30', '#D70015']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.planStartBtn}
                >
                  <Text style={styles.planStartText}>{t('startPlanBtn') || 'Начать'}</Text>
                  <Play size={14} color="white" fill="white" />
                </LinearGradient>
              </View>
            </TouchableOpacity>
          );

        }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderGoalSetup = () => {
    if (!pendingWorkout) return null;
    const isTime = pendingWorkout.goalType === 'time';
    const unit = isTime ? t('minAbbr') : t('unitKm');
    const placeholder = isTime ? "30" : "5.0";

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.setupHeader}>
          <TouchableOpacity onPress={() => setStep('menu')} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.textSecondary} />
            <Text style={[styles.backText, { color: colors.textSecondary }]}>{t('backBtn')}</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <View style={[styles.iconBigCircle, { backgroundColor: pendingWorkout.color }]}>
                {isTime ? <Timer color="black" size={40} /> : <Activity color="white" size={40} />}
              </View>
              <Text style={[styles.setupTitle, { color: colors.textPrimary }]}>{pendingWorkout.title}</Text>
              <Text style={[styles.setupSub, { color: colors.textSecondary }]}>{isTime ? t('howManyMinutes') : t('howManyKm')}</Text>
            </View>
            <View style={{ marginTop: 40 }}>
              <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>{isTime ? t('enterTimeLabel') : t('enterDistLabel')}</Text>
              <View style={[styles.inputWrapper, { borderBottomColor: colors.border }]}>
                <TextInput style={[styles.goalInput, { color: colors.textPrimary }]} value={goalValue} onChangeText={setGoalValue} placeholder={placeholder} placeholderTextColor={colors.textSecondary} keyboardType="numeric" autoFocus returnKeyType="done" />
                <Text style={[styles.unitText, { color: colors.textSecondary }]}>{unit}</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.bigStartButton, { backgroundColor: colors.primary || '#32d74b' }, !goalValue && { opacity: 0.6 }]} onPress={confirmGoalStart} disabled={!goalValue}>
              <Text style={styles.bigStartText}>{t('startGoalBtn')}</Text>
              <Play size={20} color="black" fill="black" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
            <View style={{ height: Platform.OS === 'ios' ? 150 : 50, backgroundColor: 'transparent' }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  };

  const renderMenu = () => {
    // Определяем тексты для Hero кнопки в зависимости от таба
    let heroTitle = t('quickStartRun');
    let heroSub = t('quickStartRunSub');
    if (activeTab === 'strength') { heroTitle = t('quickStartStrength'); heroSub = t('quickStartStrengthSub'); }
    if (activeTab === 'cardio') { heroTitle = t('quickStartCardio'); heroSub = t('quickStartCardioSub'); }

    return (
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <View style={[styles.segmentControl, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {['run', 'walk', 'bike', 'strength', 'cardio'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.segment, activeTab === tab && { backgroundColor: colors.cardBg, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.segmentText, { color: activeTab === tab ? colors.textPrimary : colors.textSecondary }]}>
                {t(tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
          {/* HERO START BUTTON */}
          <TouchableOpacity
            style={styles.heroButton}
            activeOpacity={0.9}
            onPress={() => startWorkout(activeTab, heroTitle, '')}
          >
            <LinearGradient
              // Возвращаем правильные цвета градиентов для каждого таба
              colors={activeTab === 'strength' ? ['#FF3B30', '#D70015'] : (activeTab === 'cardio' ? ['#FF9F0A', '#FF453A'] : ['#32d74b', '#009904'])}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.heroGradient}
            >
              <View>
                <Text style={styles.heroTitle}>{heroTitle}</Text>
                <Text style={styles.heroSub}>{heroSub}</Text>
              </View>
              <View style={styles.heroIconBox}>
                <Play size={24} color="black" fill="black" style={{ marginLeft: 3 }} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* TILES GRID */}
          <View style={styles.tilesGrid}>
            {actionData.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.tileCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() => handleTilePress(item)}
              >
                <View style={[styles.tileIconCircle, { backgroundColor: item.color }]}>
                  {item.icon}
                </View>
                <View>
                  <Text style={[styles.tileTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.tileSub, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                </View>
                {item.goalType !== 'none' && (
                  <View style={styles.playMini}>
                    {item.goalType === 'plans' ? <List size={12} color={colors.textSecondary} /> : <Flag size={12} color={colors.textSecondary} />}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.manualButton} onPress={() => setStep('manual')}>
            <Plus size={20} color={colors.textSecondary} />
            <Text style={[styles.manualButtonText, { color: colors.textSecondary }]}>{t('manualEntry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal 
      animationType="slide" 
      presentationStyle="pageSheet"
      transparent={true} 
      visible={visible} 
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.modalWrapper} pointerEvents="box-none">
        <Animated.View style={[
          styles.modalContent,
          { backgroundColor: colors.cardBg },
          { transform: [{ translateY: panY.interpolate({ inputRange: [-50, 0, height], outputRange: [0, 0, height], extrapolate: 'clamp' }) }] }
        ]}>

          <View style={styles.swipeHeader} {...panResponder.panHandlers}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {step === 'manual' ? t('modalTitleManual') : (step === 'setup' ? t('modalTitleSetup') : step === 'plans' ? t('myPlansTitle') : t('modalTitleMenu'))}
              </Text>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
                <X size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {step === 'manual' && (
            <View style={{ flex: 1, paddingHorizontal: 20 }}>
              <ManualWorkoutForm
                onCancel={() => initialMode === 'manual' ? onClose() : setStep('menu')}
                onSave={(workoutData) => { addManualWorkout(workoutData); onClose(); }}
              />
            </View>
          )}
          {step === 'setup' && renderGoalSetup()}
          {step === 'plans' && renderPlansScreen()}
          {step === 'menu' && renderMenu()}

        </Animated.View>
      </View>

      <CreateWorkoutPlanModal visible={showPlanModal} onClose={() => setShowPlanModal(false)} initialPlan={editingPlan} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalWrapper: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { height: height * 0.95, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 20 },
  swipeHeader: { paddingTop: 12, paddingBottom: 10, paddingHorizontal: 20, alignItems: 'center' },
  dragHandle: { width: 40, height: 5, borderRadius: 3, marginBottom: 15 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  closeBtn: { padding: 4, borderRadius: 12 },
  segmentControl: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1 },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segmentText: { fontFamily: 'Inter_600SemiBold' },
  gridContainer: { paddingBottom: 20 },
  heroButton: { marginBottom: 15, borderRadius: 20, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  heroGradient: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 20 },
  heroTitle: { color: 'black', fontSize: 20, fontFamily: 'Inter_700Bold' },
  heroSub: { color: 'rgba(0,0,0,0.6)', fontSize: 14, fontFamily: 'Inter_500Medium' },
  heroIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  tileCard: { width: '48%', borderRadius: 16, padding: 16, minHeight: 110, justifyContent: 'space-between', marginBottom: 12, borderWidth: 1 },
  tileIconCircle: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  tileTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  tileSub: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  playMini: { position: 'absolute', right: 10, bottom: 10 },
  footer: { paddingTop: 10, borderTopWidth: 1, marginTop: 'auto', marginBottom: 20 },
  manualButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10 },
  manualButtonText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  setupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 10 },
  backButton: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  backText: { fontSize: 16, fontFamily: 'Inter_500Medium', marginLeft: 4 },
  iconBigCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  setupTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  setupSub: { fontSize: 16, fontFamily: 'Inter_500Medium', marginBottom: 20 },
  goalLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 10, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', borderBottomWidth: 1, paddingBottom: 10 },
  goalInput: { flex: 1, fontSize: 40, fontFamily: 'Inter_700Bold' },
  unitText: { fontSize: 20, fontFamily: 'Inter_600SemiBold', marginBottom: 8, marginLeft: 10 },
  bigStartButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: 18, borderRadius: 20, marginTop: 40 },
  bigStartText: { color: 'black', fontSize: 18, fontFamily: 'Inter_700Bold' },
  createPlanBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, overflow: 'hidden' },
  createPlanGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  createPlanText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: 'white' },
  emptyPlans: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', marginTop: 16 },
  emptySub: { textAlign: 'center', fontSize: 16, marginTop: 8 },
  planCard: { borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  planName: { fontSize: 18, fontFamily: 'Inter_700Bold', flex: 1 },
  planDesc: { fontSize: 14, marginBottom: 12 },
  planFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planDate: { fontSize: 12 },
  planStartBtn: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignItems: 'center', gap: 4 },
  planStartText: { color: 'white', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  actionIconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center',},

});
