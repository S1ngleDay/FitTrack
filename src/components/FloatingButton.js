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
    position: 'absolute', // Абсолютное позиционирование 
    bottom: 20,           // Отступ снизу
    alignSelf: 'center',  // По центру экрана 
    
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    
    // Тень
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8, // Тень для Android
  },
});
