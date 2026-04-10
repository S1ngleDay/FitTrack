import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  TextInput, FlatList, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, ScrollView, Dimensions, Alert
} from 'react-native';
import { X, Trash2, Dumbbell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorkoutStore, EXERCISES_CATALOG } from '../store/workoutStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../hooks/useTranslation';

const { height } = Dimensions.get('window');

const MUSCLE_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps', 'core'];

// Маппинг для русских категорий
const CATEGORY_MAPPING = {
  'chest': 'грудь',
  'back': 'спина',
  'legs': 'ноги',
  'shoulders': 'плечи',
  'biceps': 'бицепс',
  'triceps': 'трицепс',
  'core': 'пресс',
};

export default function CreateWorkoutPlanModal({ visible, onClose, initialPlan = null }) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  const [planName, setPlanName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [activeMuscleGroup, setActiveMuscleGroup] = useState('chest');

  const createWorkoutPlan = useWorkoutStore(s => s.createWorkoutPlan);
  const updateWorkoutPlan = useWorkoutStore(s => s.updateWorkoutPlan);

  useEffect(() => {
    if (visible) {
      if (initialPlan) {
        setPlanName(initialPlan.name || '');
        setDescription(initialPlan.description || '');
        setSelectedExercises(initialPlan.exercises || []);
        setActiveMuscleGroup('chest');
      } else {
        setPlanName(t('defaultPlanName') || 'Новый план');
        setDescription('');
        setSelectedExercises([]);
        setActiveMuscleGroup('chest');
      }
    }
  }, [visible, initialPlan]);

  const addExercise = (exercise) => {
    if (selectedExercises.some(ex => ex.exerciseId === exercise.id)) return;
    setSelectedExercises([...selectedExercises, {
      exerciseId: exercise.id,
      targetSets: 4,
      targetReps: 10,
    }]);
  };

  const updateTarget = (exerciseId, field, value) => {
    setSelectedExercises(selectedExercises.map(ex =>
      ex.exerciseId === exerciseId ? { ...ex, [field]: Number(value) || 0 } : ex
    ));
  };

  const removeExercise = (exerciseId) => {
    setSelectedExercises(selectedExercises.filter(ex => ex.exerciseId !== exerciseId));
  };

  const savePlan = () => {
    if (!planName.trim() || selectedExercises.length === 0) {
      Alert.alert(t('alertAttention'), t('alertNeedEx'));
      return;
    }

    // 👈 Сохраняем ИЛИ обновляем план
    if (initialPlan) {
      updateWorkoutPlan(initialPlan.id, {
        name: planName.trim(),
        description: description.trim(),
        exercises: selectedExercises
      });
    } else {
      createWorkoutPlan({
        name: planName.trim(),
        description: description.trim(),
        exercises: selectedExercises
      });
    }
    onClose();
  };

  // Перевод имени упражнения
  const exerciseName = (exerciseId) => {
    const translation = t(`ex_${exerciseId}`);
    if (translation !== `ex_${exerciseId}`) return translation;
    return EXERCISES_CATALOG.find(e => e.id === exerciseId)?.name || exerciseId;
  };

  // Фильтруем каталог по категории
  const filteredCatalog = EXERCISES_CATALOG.filter(item =>
    item.category === activeMuscleGroup || item.category === CATEGORY_MAPPING[activeMuscleGroup]
  );

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.modalWrapper}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>

          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.cardBg }]}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{t('createPlanTitle')}</Text>
            <View style={{ width: 44 }} />
          </View>

          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >

              <TextInput
                style={[styles.nameInput, { backgroundColor: colors.cardBg, color: colors.textPrimary }]}
                value={planName}
                onChangeText={setPlanName}
                placeholder={t('planNamePlaceholder')}
                placeholderTextColor={colors.textSecondary}
              />

              <TextInput
                style={[styles.descInput, { backgroundColor: colors.cardBg, color: colors.textPrimary }]}
                value={description}
                onChangeText={setDescription}
                placeholder={t('planDescPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                multiline
                textAlignVertical="top"
              />

              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('addExerciseTitle')}</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.muscleTabsScroll}
                contentContainerStyle={styles.muscleTabsContainer}
              >
                {MUSCLE_GROUPS.map((group) => (
                  <TouchableOpacity
                    key={group}
                    style={[
                      styles.muscleTab,
                      { backgroundColor: colors.cardBg, borderColor: colors.border },
                      activeMuscleGroup === group && { backgroundColor: 'rgba(50, 215, 75, 0.15)', borderColor: '#32D74B' }
                    ]}
                    onPress={() => setActiveMuscleGroup(group)}
                  >
                    <Text style={[
                      styles.muscleTabText,
                      { color: colors.textSecondary },
                      activeMuscleGroup === group && { color: '#32D74B', fontFamily: 'Inter_700Bold' }
                    ]}>
                      {t(`muscle_${group}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <FlatList
                data={filteredCatalog}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.id}
                renderItem={({ item }) => {
                  const isSelected = selectedExercises.some(ex => ex.exerciseId === item.id);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.catalogItem,
                        { backgroundColor: colors.cardBg, borderColor: colors.border },
                        isSelected && { borderColor: '#32D74B', backgroundColor: 'rgba(50, 215, 75, 0.1)' }
                      ]}
                      onPress={() => addExercise(item)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.catalogIconWrapper, { backgroundColor: colors.background }]}>
                        <Dumbbell size={20} color={isSelected ? "#32D74B" : colors.textSecondary} />
                      </View>
                      <Text style={[
                        styles.catalogName,
                        { color: colors.textSecondary },
                        isSelected && { color: colors.textPrimary }
                      ]} numberOfLines={2}>
                        {exerciseName(item.id)}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={styles.catalogList}
              />

              <View style={styles.exercisesHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {t('inPlanTitle')} ({selectedExercises.length})
                </Text>
              </View>

              {selectedExercises.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.cardBg }]}>
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>{t('emptyPlanState')}</Text>
                </View>
              ) : (
                selectedExercises.map((ex) => (
                  <View key={ex.exerciseId} style={[styles.exerciseRow, { backgroundColor: colors.cardBg }]}>
                    <Text style={[styles.exerciseName, { color: colors.textPrimary }]} numberOfLines={2}>
                      {exerciseName(ex.exerciseId)}
                    </Text>

                    <View style={styles.targetsRow}>
                      <View style={styles.targetInputWrapper}>
                        <TextInput
                          style={[styles.targetInput, { backgroundColor: colors.background, color: colors.textPrimary }]}
                          value={String(ex.targetSets)}
                          onChangeText={v => updateTarget(ex.exerciseId, 'targetSets', v)}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                        <Text style={[styles.targetLabel, { color: colors.textSecondary }]}>{t('setsLabel')}</Text>
                      </View>
                      <Text style={[styles.setsSeparator, { color: colors.textSecondary }]}>×</Text>
                      <View style={styles.targetInputWrapper}>
                        <TextInput
                          style={[styles.targetInput, { backgroundColor: colors.background, color: colors.textPrimary }]}
                          value={String(ex.targetReps)}
                          onChangeText={v => updateTarget(ex.exerciseId, 'targetReps', v)}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                        <Text style={[styles.targetLabel, { color: colors.textSecondary }]}>{t('repsLabel')}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeExercise(ex.exerciseId)}
                    >
                      <Trash2 size={20} color="#FF453A" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </KeyboardAvoidingView>

          <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={savePlan}
              disabled={selectedExercises.length === 0}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={selectedExercises.length === 0 ? [colors.cardBg, colors.cardBg] : ['#32D74B', '#00C805']}
                style={styles.saveGradient}
              >
                <Text style={[styles.saveText, selectedExercises.length === 0 && { color: colors.textSecondary }]}>
                  {selectedExercises.length === 0 ? t('chooseExercisesBtn') : t('savePlanBtn')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalWrapper: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    height: height * 0.90, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 20
  },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 20, borderBottomWidth: 1 },
  closeBtn: { padding: 8, borderRadius: 12 },
  title: { flex: 1, textAlign: 'center', fontSize: 20, fontFamily: 'Inter_700Bold' },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  nameInput: { borderRadius: 16, padding: 16, fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  descInput: { borderRadius: 16, padding: 16, fontSize: 15, fontFamily: 'Inter_500Medium', height: 80, textAlignVertical: 'top', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  muscleTabsScroll: { marginBottom: 15 },
  muscleTabsContainer: { gap: 8, paddingRight: 20 },
  muscleTab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  muscleTabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  catalogList: { paddingBottom: 15, paddingRight: 20, gap: 12 },
  catalogItem: { width: 130, height: 120, borderRadius: 16, padding: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  catalogIconWrapper: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  catalogName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  exercisesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  emptyState: { borderRadius: 16, padding: 30, alignItems: 'center', marginTop: 10 },
  emptyStateText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 12 },
  exerciseName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', flex: 1, paddingRight: 10 },
  targetsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 12 },
  targetInputWrapper: { alignItems: 'center' },
  targetInput: { width: 44, height: 44, borderRadius: 10, textAlign: 'center', fontSize: 18, fontFamily: 'Inter_700Bold' },
  targetLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 4 },
  setsSeparator: { fontSize: 18, fontFamily: 'Inter_700Bold', paddingBottom: 15 },
  removeBtn: { padding: 10, borderRadius: 12, backgroundColor: 'rgba(255, 69, 58, 0.1)' },
  footer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 35 : 20, borderTopWidth: 1 },
  saveButton: { borderRadius: 16, overflow: 'hidden' },
  saveGradient: { padding: 18, alignItems: 'center' },
  saveText: { color: '#003300', fontSize: 18, fontFamily: 'Inter_700Bold' }
});
