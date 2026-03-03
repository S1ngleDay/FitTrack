import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Platform, 
  ScrollView, 
  KeyboardAvoidingView 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock, ChevronDown } from 'lucide-react-native';
import colors from '../constants/colors';

const TYPES = ['Пробежка', 'Кардио', 'Силовая', 'Велосипед', 'Ходьба'];

export default function ManualWorkoutForm({ onCancel, onSave }) {
  const [type, setType] = useState('Пробежка');
  
  // Дата и время тренировки
  const [date, setDate] = useState(new Date());

  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Обработчик изменения даты/времени
  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
        const newDate = new Date(date);
        newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        setDate(newDate);
    }
  };

  const onChangeTime = (event, selectedDate) => {
    if (Platform.OS === 'android') {
        setShowTimePicker(false);
    }
    if (selectedDate) {
        const newDate = new Date(date);
        newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
        setDate(newDate);
    }
  };

  const handleSave = () => {
    console.log('📦 Сохраняем ручную тренировку:', { type, date, duration, distance });
    // Передаем только то, что ввел пользователь. Калории посчитает store.
    onSave({ 
      type, 
      date, 
      duration, 
      distance 
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 150 : 0} // Отступ для хедера
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        
        {/* Тип тренировки */}
        <Text style={styles.sectionLabel}>Тип активности</Text>
        <View style={styles.typeSelector}>
          {TYPES.map(t => (
            <TouchableOpacity 
              key={t} 
              style={[
                styles.typeButton, 
                type === t && styles.activeTypeBtn
              ]}
              onPress={() => setType(t)}
            >
              <Text style={[
                styles.typeText, 
                type === t && styles.activeTypeText
              ]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Выбор ДАТЫ */}
        <Text style={styles.label}>Дата начала</Text>
        <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(!showDatePicker)}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <Calendar size={20} color="#8E8E93" />
                <Text style={styles.dateTimeText}>
                {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
            </View>
            <ChevronDown size={16} color="#555" />
        </TouchableOpacity>

        {showDatePicker && (
            <View style={styles.pickerContainer}>
                <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={onChangeDate}
                    textColor="white"
                    themeVariant="dark"
                    accentColor={colors.primary}
                    style={{ width: '100%' }}
                />
            </View>
        )}

        {/* Выбор ВРЕМЕНИ */}
        <Text style={styles.label}>Время начала</Text>
        <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowTimePicker(!showTimePicker)}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <Clock size={20} color="#8E8E93" />
                <Text style={styles.dateTimeText}>
                {date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            <ChevronDown size={16} color="#555" />
        </TouchableOpacity>

        {showTimePicker && (
            <View style={styles.pickerContainer}>
                <DateTimePicker
                    value={date}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onChangeTime}
                    textColor="white"
                    themeVariant="dark"
                    is24Hour={true}
                    style={{ width: '100%', height: 180 }}
                />
            </View>
        )}

        <View style={{ height: 20 }} />

        {/* Поля ввода */}
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Длительность (мин)</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric" 
              placeholder="0" 
              placeholderTextColor="#555"
              value={duration}
              onChangeText={setDuration}
              returnKeyType="done"
            />
        </View>

        {/* Дистанция нужна только для определенных типов */}
        {(type === 'Пробежка' || type === 'Велосипед' || type === 'Ходьба') && (
          <View style={styles.inputGroup}>
              <Text style={styles.label}>Дистанция (км)</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                placeholder="0.0" 
                placeholderTextColor="#555"
                value={distance}
                onChangeText={setDistance}
                returnKeyType="done"
              />
          </View>
        )}

        {/* Кнопки */}
        <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelText}>Отмена</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.saveButton, (!duration) && { opacity: 0.5 }]} 
                onPress={handleSave}
                disabled={!duration}
            >
                <Text style={styles.saveText}>Добавить</Text>
            </TouchableOpacity>
        </View>

        {/* Отступ снизу, чтобы кнопки не прилипали к клавиатуре вплотную */}
        <View style={{ height: 200 }} />

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 50 },
  
  sectionLabel: {
    color: 'white', fontSize: 18, fontFamily: 'Inter_600SemiBold', marginBottom: 15
  },

  typeSelector: {
    flexDirection: 'row', 
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 25,
  },
  typeButton: {
    paddingVertical: 10, 
    paddingHorizontal: 16,
    borderRadius: 20, 
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  activeTypeBtn: {
    backgroundColor: 'rgba(50, 215, 75, 0.15)', // Полупрозрачный зеленый
    borderColor: colors.primary,
  },
  typeText: { 
    color: '#8E8E93', 
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  activeTypeText: { 
    color: colors.primary 
  },
  
  label: { color: '#8E8E93', marginBottom: 8, fontSize: 13, fontFamily: 'Inter_500Medium' },

  dateTimeButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1C1C1E', padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#2C2C2E',
    marginBottom: 15,
  },
  dateTimeText: { color: 'white', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  
  pickerContainer: {
      marginBottom: 20, backgroundColor: '#1C1C1E', borderRadius: 16, overflow: 'hidden', alignItems: 'center',
      borderWidth: 1, borderColor: '#2C2C2E'
  },

  inputGroup: { marginBottom: 20 },
  input: {
    backgroundColor: '#1C1C1E', color: 'white', padding: 16, borderRadius: 16, fontSize: 18, fontFamily: 'Inter_600SemiBold',
    borderWidth: 1, borderColor: '#2C2C2E'
  },
  
  buttonsRow: { flexDirection: 'row', gap: 15, marginTop: 10 },
  cancelButton: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: '#1C1C1E', alignItems: 'center', borderWidth: 1, borderColor: '#2C2C2E' },
  cancelText: { color: '#FF3B30', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  saveButton: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center' },
  saveText: { color: '#003300', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
