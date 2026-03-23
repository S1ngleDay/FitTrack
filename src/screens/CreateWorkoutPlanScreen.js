import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { Plus, Save, Trash2 } from 'lucide-react-native';
import { useWorkoutStore } from '../store/workoutStore';
import { EXERCISES_CATALOG } from '../store/workoutStore'; // импорт из стора
import colors from '../constants/colors';

export default function CreateWorkoutPlanScreen({ navigation }) {
  const [planName, setPlanName] = useState('Новая силовая тренировка');
  const [description, setDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
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
      ex.exerciseId === exerciseId ? { ...ex, [field]: Number(value) } : ex
    ));
  };

  const removeExercise = (exerciseId) => {
    setSelectedExercises(selectedExercises.filter(ex => ex.exerciseId !== exerciseId));
  };

  const savePlan = () => {
    if (selectedExercises.length === 0) {
      Alert.alert('Добавьте хотя бы одно упражнение!');
      return;
    }
    createWorkoutPlan({ name: planName, description, exercises: selectedExercises });
    Alert.alert('План сохранён!', 'Теперь можно начать тренировку.');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.nameInput}
        value={planName}
        onChangeText={setPlanName}
        placeholder="Название плана"
      />
      <TextInput
        style={styles.descInput}
        value={description}
        onChangeText={setDescription}
        placeholder="Описание (опционально)"
        multiline
      />

      <Text style={styles.sectionTitle}>Упражнения</Text>
      <FlatList
        data={selectedExercises}
        keyExtractor={ex => ex.exerciseId}
        renderItem={({ item }) => (
          <View style={styles.exerciseRow}>
            <Text style={styles.exerciseName}>
              {EXERCISES_CATALOG.find(e => e.id === item.exerciseId)?.name}
            </Text>
            <View style={styles.targets}>
              <TextInput
                style={styles.targetInput}
                value={String(item.targetSets)}
                onChangeText={v => updateTarget(item.exerciseId, 'targetSets', v)}
                placeholder="4"
                keyboardType="numeric"
                maxLength={2}
              />
              <Text> × </Text>
              <TextInput
                style={styles.targetInput}
                value={String(item.targetReps)}
                onChangeText={v => updateTarget(item.exerciseId, 'targetReps', v)}
                placeholder="10"
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
            <TouchableOpacity onPress={() => removeExercise(item.exerciseId)}>
              <Trash2 size={20} color="#FF453A" />
            </TouchableOpacity>
          </View>
        )}
        style={styles.exercisesList}
      />

      <Text style={styles.sectionTitle}>Каталог упражнений</Text>
      <FlatList
        data={EXERCISES_CATALOG}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.catalogItem}
            onPress={() => addExercise(item)}
          >
            <Text style={styles.catalogName}>{item.name}</Text>
            <Text style={styles.catalogCat}>{item.category}</Text>
          </TouchableOpacity>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={savePlan}>
        <Save size={24} color="white" />
        <Text style={styles.saveBtnText}>Сохранить план</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  nameInput: { 
    backgroundColor: 'white', borderRadius: 12, padding: 16, fontSize: 20, 
    fontFamily: 'Inter_700Bold', marginBottom: 12, elevation: 2 
  },
  descInput: { 
    backgroundColor: 'white', borderRadius: 12, padding: 16, fontSize: 16, 
    fontFamily: 'Inter_400Regular', height: 80, textAlignVertical: 'top', marginBottom: 24 
  },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary, marginBottom: 12 },
  exerciseRow: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', 
    padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 
  },
  exerciseName: { flex: 1, fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  targets: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  targetInput: { 
    width: 40, height: 36, borderWidth: 1, borderColor: '#E5E5E7', 
    borderRadius: 8, textAlign: 'center', fontSize: 16, marginHorizontal: 4 
  },
  exercisesList: { maxHeight: 200 },
  catalogItem: { 
    width: 140, height: 80, backgroundColor: '#F2F2F7', 
    borderRadius: 12, padding: 12, marginRight: 12, justifyContent: 'center' 
  },
  catalogName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  catalogCat: { fontSize: 12, color: colors.textSecondary },
  saveBtn: { 
    flexDirection: 'row', backgroundColor: '#32D74B', padding: 18, 
    borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 24 
  },
  saveBtnText: { color: 'white', fontSize: 18, fontFamily: 'Inter_700Bold', marginLeft: 12 },
});
