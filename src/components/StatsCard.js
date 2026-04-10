import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors';

export default function StatsCard({ icon: Icon, title, value, unit, color, onPress, progress }) {
  const colors = useThemeColors(); 
  
  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { backgroundColor: colors.cardBg, borderColor: colors.border }
      ]} 
      activeOpacity={0.7} 
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}> 
          {/* Если иконка передана, рендерим её */}
          {Icon && <Icon size={24} color={color} />}
        </View>
        
        <ArrowUpRight size={16} color={colors.textSecondary} /> 
      </View>

      <View style={styles.content}>
        <Text style={[styles.value, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      </View>

      {progress !== undefined && (
        <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}> 
          <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: '48%', borderRadius: 20, padding: 16, marginBottom: 12, justifyContent: 'space-between', minHeight: 140, borderWidth: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  content: { marginTop: 'auto', marginBottom: 10 },
  value: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  unit: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  title: { fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 2 },
  progressBarBg: { height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 8 },
  progressBarFill: { height: '100%', borderRadius: 2 },
});
