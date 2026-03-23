import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  TextInput, FlatList, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, ScrollView, Dimensions, Alert
} from 'react-native';
import { X, Trash2, Dumbbell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorkoutStore, EXERCISES_CATALOG } from '../store/workoutStore';
import colors from '../constants/colors';

const { height } = Dimensions.get('window');

// Категории мышц для фильтрации
const MUSCLE_GROUPS = ['грудь', 'спина', 'ноги', 'плечи', 'бицепс', 'трицепс', 'пресс'];

export default function CreateWorkoutPlanModal({ visible, onClose }) {
  const [planName, setPlanName] = useState('Новая силовая тренировка');
  const [description, setDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [activeMuscleGroup, setActiveMuscleGroup] = useState('грудь'); // 🟢 Стейт для активной вкладки
  
  const createWorkoutPlan = useWorkoutStore(s => s.createWorkoutPlan);

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
      Alert.alert('Внимание', 'Добавьте название и хотя бы 1 упражнение!');
      return;
    }
    createWorkoutPlan({ name: planName.trim(), description: description.trim(), exercises: selectedExercises });
    
    // Сбрасываем стейт после сохранения
    setPlanName('Новая силовая тренировка');
    setDescription('');
    setSelectedExercises([]);
    onClose();
  };

  const exerciseName = (exerciseId) => 
    EXERCISES_CATALOG.find(e => e.id === exerciseId)?.name || exerciseId;

  // Фильтруем каталог по выбранной группе мышц
  const filteredCatalog = EXERCISES_CATALOG.filter(item => item.category === activeMuscleGroup);

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.modalWrapper}>
        <View style={styles.modalContent}>
          
          {/* 🟢 Хедер */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.title}>Новый план</Text>
            <View style={{ width: 44 }} />
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              
              <TextInput
                style={styles.nameInput}
                value={planName}
                onChangeText={setPlanName}
                placeholder="Название плана"
                placeholderTextColor="#8E8E93"
              />

              <TextInput
                style={styles.descInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Описание (опционально)"
                placeholderTextColor="#8E8E93"
                multiline
                textAlignVertical="top"
              />

              {/* 🟢 Вкладки групп мышц */}
              <Text style={styles.sectionTitle}>Добавить упражнение</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.muscleTabsScroll}
                contentContainerStyle={styles.muscleTabsContainer}
              >
                {MUSCLE_GROUPS.map((group) => (
                  <TouchableOpacity 
                    key={group} 
                    style={[styles.muscleTab, activeMuscleGroup === group && styles.muscleTabActive]}
                    onPress={() => setActiveMuscleGroup(group)}
                  >
                    <Text style={[styles.muscleTabText, activeMuscleGroup === group && styles.muscleTabTextActive]}>
                      {group.charAt(0).toUpperCase() + group.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* 🟢 Отфильтрованный каталог упражнений */}
              <FlatList
                data={filteredCatalog}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.id}
                renderItem={({ item }) => {
                  const isSelected = selectedExercises.some(ex => ex.exerciseId === item.id);
                  return (
                    <TouchableOpacity 
                      style={[styles.catalogItem, isSelected && styles.catalogItemActive]}
                      onPress={() => addExercise(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.catalogIconWrapper}>
                        <Dumbbell size={20} color={isSelected ? "#32D74B" : "#8E8E93"} />
                      </View>
                      <Text style={[styles.catalogName, isSelected && { color: 'white' }]} numberOfLines={2}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={styles.catalogList}
              />

              {/* 🟢 Выбранные упражнения */}
              <View style={styles.exercisesHeader}>
                <Text style={styles.sectionTitle}>В плане ({selectedExercises.length})</Text>
              </View>
              
              {selectedExercises.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Выберите упражнения из списка выше</Text>
                </View>
              ) : (
                selectedExercises.map((ex) => (
                  <View key={ex.exerciseId} style={styles.exerciseRow}>
                    <Text style={styles.exerciseName} numberOfLines={2}>{exerciseName(ex.exerciseId)}</Text>
                    
                    <View style={styles.targetsRow}>
                      <View style={styles.targetInputWrapper}>
                        <TextInput
                          style={styles.targetInput}
                          value={String(ex.targetSets)}
                          onChangeText={v => updateTarget(ex.exerciseId, 'targetSets', v)}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                        <Text style={styles.targetLabel}>подх.</Text>
                      </View>
                      <Text style={styles.setsSeparator}>×</Text>
                      <View style={styles.targetInputWrapper}>
                        <TextInput
                          style={styles.targetInput}
                          value={String(ex.targetReps)}
                          onChangeText={v => updateTarget(ex.exerciseId, 'targetReps', v)}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                        <Text style={styles.targetLabel}>повт.</Text>
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

          {/* 🟢 Кнопка сохранения */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={savePlan} 
              disabled={selectedExercises.length === 0}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={selectedExercises.length === 0 ? ['#2C2C2E', '#2C2C2E'] : ['#32D74B', '#00C805']}
                style={styles.saveGradient}
              >
                <Text style={[styles.saveText, selectedExercises.length === 0 && { color: '#8E8E93' }]}>
                  {selectedExercises.length === 0 ? 'Выберите упражнения' : `Сохранить план`}
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
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)' 
  },
  modalWrapper: { 
    flex: 1, 
    justifyContent: 'flex-end',
  },
  modalContent: { 
    height: height * 0.90, 
    backgroundColor: '#1C1C1E', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20
  },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E'
  },
  closeBtn: { padding: 8, borderRadius: 12, backgroundColor: '#2C2C2E' },
  title: { flex: 1, textAlign: 'center', fontSize: 20, fontFamily: 'Inter_700Bold', color: 'white' },

  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  
  nameInput: { 
    backgroundColor: '#2C2C2E', color: 'white', borderRadius: 16, padding: 16, 
    fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 16
  },
  descInput: { 
    backgroundColor: '#2C2C2E', color: 'white', borderRadius: 16, padding: 16, 
    fontSize: 15, fontFamily: 'Inter_500Medium', height: 80, textAlignVertical: 'top', marginBottom: 24
  },

  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: 'white', marginBottom: 12 },
  
  // Вкладки групп мышц
  muscleTabsScroll: { marginBottom: 15 },
  muscleTabsContainer: { gap: 8, paddingRight: 20 },
  muscleTab: { 
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, 
    backgroundColor: '#2C2C2E', borderWidth: 1, borderColor: '#3A3A3C'
  },
  muscleTabActive: { backgroundColor: 'rgba(50, 215, 75, 0.15)', borderColor: '#32D74B' },
  muscleTabText: { color: '#8E8E93', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  muscleTabTextActive: { color: '#32D74B', fontFamily: 'Inter_700Bold' },

  // Каталог
  catalogList: { paddingBottom: 15, paddingRight: 20, gap: 12 },
  catalogItem: { 
    width: 130, height: 120, backgroundColor: '#2C2C2E', borderRadius: 16, padding: 12, 
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3A3A3C'
  },
  catalogItemActive: { borderColor: '#32D74B', backgroundColor: 'rgba(50, 215, 75, 0.1)' },
  catalogIconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  catalogName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#8E8E93', textAlign: 'center' },

  // Выбранные упражнения
  exercisesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  emptyState: { backgroundColor: '#2C2C2E', borderRadius: 16, padding: 30, alignItems: 'center', marginTop: 10 },
  emptyStateText: { color: '#8E8E93', fontFamily: 'Inter_500Medium', fontSize: 14 },

  exerciseRow: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E',
    borderRadius: 16, padding: 16, marginBottom: 12
  },
  exerciseName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: 'white', flex: 1, paddingRight: 10 },
  targetsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 12 },
  targetInputWrapper: { alignItems: 'center' },
  targetInput: { 
    width: 44, height: 44, backgroundColor: '#1C1C1E', color: 'white',
    borderRadius: 10, textAlign: 'center', fontSize: 18, fontFamily: 'Inter_700Bold' 
  },
  targetLabel: { fontSize: 11, color: '#8E8E93', fontFamily: 'Inter_500Medium', marginTop: 4 },
  setsSeparator: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#8E8E93', paddingBottom: 15 },
  removeBtn: { padding: 10, borderRadius: 12, backgroundColor: 'rgba(255, 69, 58, 0.1)' },

  footer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 35 : 20, backgroundColor: '#1C1C1E', borderTopWidth: 1, borderTopColor: '#2C2C2E' },
  saveButton: { borderRadius: 16, overflow: 'hidden' },
  saveGradient: { padding: 18, alignItems: 'center' },
  saveText: { color: '#003300', fontSize: 18, fontFamily: 'Inter_700Bold' }
});
