// src/screens/WelcomeScreen.js
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  TouchableOpacity, TextInput, Platform, KeyboardAvoidingView, Alert
} from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../hooks/useTranslation';
import { useUserStore } from '../store/userStore';

export default function WelcomeScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const updateUser = useUserStore((s) => s.updateUser);

  const [name, setName] = useState('');
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goalCalories, setGoalCalories] = useState('2000');
  const [goalSteps, setGoalSteps] = useState('10000');
  const [goalDistance, setGoalDistance] = useState('5');

  const handleSave = () => {
    // Validation
    if (!name.trim()) {
      Alert.alert(t('alertErrorTitle'), 'Пожалуйста, введите ваше имя');
      return;
    }

    const ageNum = parseInt(age, 10);
    if (!ageNum || ageNum <= 0 || ageNum > 150) {
      Alert.alert(t('alertErrorTitle'), 'Пожалуйста, введите корректный возраст (от 1 до 150)');
      return;
    }

    const weightNum = parseFloat(weight);
    if (!weightNum || weightNum <= 0 || weightNum > 500) {
      Alert.alert(t('alertErrorTitle'), 'Пожалуйста, введите корректный вес (от 1 до 500 кг)');
      return;
    }

    const heightNum = parseFloat(height);
    if (!heightNum || heightNum <= 0 || heightNum > 300) {
      Alert.alert(t('alertErrorTitle'), 'Пожалуйста, введите корректный рост (от 1 до 300 см)');
      return;
    }

    const goalCaloriesNum = parseInt(goalCalories, 10);
    if (!goalCaloriesNum || goalCaloriesNum <= 0 || goalCaloriesNum > 10000) {
      Alert.alert(t('alertErrorTitle'), 'Пожалуйста, введите корректную цель калорий (от 1 до 10000)');
      return;
    }

    const goalStepsNum = parseInt(goalSteps, 10);
    if (!goalStepsNum || goalStepsNum <= 0 || goalStepsNum > 100000) {
      Alert.alert(t('alertErrorTitle'), 'Пожалуйста, введите корректную цель шагов (от 1 до 100000)');
      return;
    }

    const goalDistanceNum = parseFloat(goalDistance);
    if (goalDistanceNum < 0 || goalDistanceNum > 1000) {
      Alert.alert(t('alertErrorTitle'), 'Пожалуйста, введите корректную цель дистанции (от 0 до 1000 км)');
      return;
    }

    updateUser({
      name: name.trim(),
      gender,
      age: ageNum,
      weight: weightNum,
      height: heightNum,
      goalCalories: goalCaloriesNum,
      goalSteps: goalStepsNum,
      goalDistance: goalDistanceNum,
    });
  };

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
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t('welcomeTitle') || 'Добро пожаловать! 👋'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('welcomeSubtitle') || 'Давай настроим профиль, чтобы точнее считать калории и подбирать тренировки.'}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            
            {/* ИМЯ */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('name') || 'ИМЯ'}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                value={name}
                onChangeText={setName}
                placeholder={t('yourName')}
                placeholderTextColor={colors.textSecondary}
                selectionColor={colors.primary}
              />
            </View>

            {/* ПОЛ */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('gender') || 'ПОЛ'}</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[
                    styles.genderBtn,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    gender === 'male' && { borderColor: colors.blue, backgroundColor: 'rgba(77, 166, 255, 0.15)' }
                  ]}
                  onPress={() => setGender('male')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.genderText, { color: colors.textSecondary }, gender === 'male' && { color: colors.blue }]}>
                    {t('male') || 'Мужской'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderBtn,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    gender === 'female' && { borderColor: colors.blue, backgroundColor: 'rgba(77, 166, 255, 0.15)' }
                  ]}
                  onPress={() => setGender('female')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.genderText, { color: colors.textSecondary }, gender === 'female' && { color: colors.blue }]}>
                    {t('female') || 'Женский'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ВОЗРАСТ, ВЕС, РОСТ */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('age') || 'ВОЗРАСТ'}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  maxLength={3}
                  placeholder="25"
                  placeholderTextColor={colors.textSecondary}
                  selectionColor={colors.primary}
                />
              </View>
              <View style={{ width: 10 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('weight') || 'ВЕС (КГ)'}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  maxLength={4}
                  placeholder="70"
                  placeholderTextColor={colors.textSecondary}
                  selectionColor={colors.primary}
                />
              </View>
              <View style={{ width: 10 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('height') || 'РОСТ (СМ)'}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  maxLength={3}
                  placeholder="175"
                  placeholderTextColor={colors.textSecondary}
                  selectionColor={colors.primary}
                />
              </View>
            </View>

            {/* GOALS SECTION */}
            <Text style={[styles.goalsTitle, { color: colors.textPrimary }]}>Daily Goals</Text>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('goalCalories')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  value={goalCalories}
                  onChangeText={setGoalCalories}
                  keyboardType="numeric"
                  maxLength={5}
                  placeholder="2000"
                  placeholderTextColor={colors.textSecondary}
                  selectionColor={colors.primary}
                />
              </View>
              <View style={{ width: 10 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('goalSteps')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  value={goalSteps}
                  onChangeText={setGoalSteps}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="10000"
                  placeholderTextColor={colors.textSecondary}
                  selectionColor={colors.primary}
                />
              </View>
              <View style={{ width: 10 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('goalDistance')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  value={goalDistance}
                  onChangeText={setGoalDistance}
                  keyboardType="numeric"
                  maxLength={5}
                  placeholder="5"
                  placeholderTextColor={colors.textSecondary}
                  selectionColor={colors.primary}
                />
              </View>
            </View>

            {/* КНОПКА ГОТОВО (Используем твой Неоновый Лайм) */}
            <TouchableOpacity 
              style={[
                styles.saveButton, 
                { backgroundColor: colors.primary }, 
                !name.trim() && { opacity: 0.3 }
              ]} 
              onPress={handleSave}
              disabled={!name.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>{t('continueText') || 'Начать'}</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, flexGrow: 1, justifyContent: 'center' },
  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, fontFamily: 'Inter_500Medium', textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  card: { borderRadius: 24, padding: 20, borderWidth: 1 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' },
  input: { borderRadius: 12, padding: 16, fontSize: 16, fontFamily: 'Inter_500Medium', borderWidth: 1, textAlign: 'center' },
  rowInputs: { flexDirection: 'row', marginBottom: 10 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1 },
  genderText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  goalsTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 15, marginTop: 20, textTransform: 'uppercase' },
  
  // Кнопка сохранения
  saveButton: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  // Текст на неоновом фоне делаем строго черным, иначе белое на салатовом будет нечитаемо
  saveButtonText: { color: '#000000', fontSize: 16, fontFamily: 'Inter_700Bold' }, 
});
