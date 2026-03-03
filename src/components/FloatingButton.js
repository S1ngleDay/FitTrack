// src/components/FloatingButton.js
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native'; // Иконка плюса
import colors from '../constants/colors';

export default function FloatingButton({ onPress }) {
  return (
    <TouchableOpacity 
      style={styles.button} 
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Plus size={32} color="black" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute', // Абсолютное позиционирование (поверх всего)
    bottom: 20,           // Отступ снизу
    alignSelf: 'center',  // По центру экрана (как на скриншоте)
    // Если хотите справа, замените alignSelf на: right: 20,
    
    width: 64,
    height: 64,
    borderRadius: 32,     // Идеальный круг
    backgroundColor: colors.primary, // Неоновый зеленый
    justifyContent: 'center',
    alignItems: 'center',
    
    // Тень (чтобы кнопка "парила")
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8, // Тень для Android
  },
});
