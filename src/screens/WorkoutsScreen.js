// WorkoutsScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Alert, Animated, RefreshControl } from 'react-native';
import { Plus, Play, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';

import WorkoutRow from '../components/WorkoutRow';
import WorkoutModal from '../components/WorkoutModal';
import WorkoutDetailsModal from '../components/WorkoutDetailsModal';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWorkoutStore } from '../store/workoutStore';
import { useTranslation } from '../hooks/useTranslation'; 

export default function WorkoutsScreen({ navigation, route }) {
  const colors = useThemeColors();
  const { t } = useTranslation(); 
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('list');
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const workouts = useWorkoutStore((s) => s.workouts);
  const isLoading = useWorkoutStore((s) => s.isLoading);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const deleteWorkout = useWorkoutStore((s) => s.deleteWorkout);
  
  const isFocused = useIsFocused();

  // --------------------------------------------------------
  // 🟢 ЛОГИКА СВАЙПОВ
  // --------------------------------------------------------
  const rowRefs = useRef(new Map()); 
  const currentlyOpenSwipeableId = useRef(null);

  const closeRow = useCallback((id) => {
    if (currentlyOpenSwipeableId.current && currentlyOpenSwipeableId.current !== id) {
       const prevSwipeable = rowRefs.current.get(currentlyOpenSwipeableId.current);
       if (prevSwipeable) prevSwipeable.close(); 
    }
    currentlyOpenSwipeableId.current = id;
  }, []);

  const closeAllRows = useCallback(() => {
    if (currentlyOpenSwipeableId.current) {
        const prevSwipeable = rowRefs.current.get(currentlyOpenSwipeableId.current);
        if (prevSwipeable) prevSwipeable.close();
        currentlyOpenSwipeableId.current = null;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => closeAllRows();
    }, [closeAllRows])
  );

  // Функция для refresh при свайпе вверх
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Данные автоматически обновляются из zustand стора
      // просто небольшая задержка для визуального эффекта
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // --------------------------------------------------------

  useEffect(() => {
    if (isFocused && route.params?.autoStart) {
      const { type, goalTitle, goalSubtitle } = route.params;
      startWorkout(type, goalTitle, goalSubtitle);
      navigation.setParams({ autoStart: undefined });
      navigation.navigate('ActiveRun');
    }
  }, [isFocused, route.params, startWorkout, navigation]);

  const openList = () => {
    closeAllRows(); 
    setModalMode('list');
    setModalVisible(true);
  };

  const openManual = () => {
    closeAllRows(); 
    setModalMode('manual');
    setModalVisible(true);
  };

  const handleWorkoutPress = useCallback((workoutData) => {
    if (currentlyOpenSwipeableId.current === workoutData.id) {
        closeAllRows();
        return;
    }
    closeAllRows(); 
    setSelectedWorkout(workoutData);
    setDetailsVisible(true);
  }, [closeAllRows]);

  const handleDelete = useCallback((id) => {
    Alert.alert(
      t('deleteWorkoutTitle'), 
      t('deleteWorkoutMessage'), 
      [
        { text: t('cancel'), style: "cancel", onPress: () => {
             const ref = rowRefs.current.get(id);
             if (ref) ref.close();
        }},
        { 
          text: t('deleteBtn'),  
          style: "destructive", 
          onPress: () => {
              deleteWorkout(id);
              rowRefs.current.delete(id);
              if (currentlyOpenSwipeableId.current === id) {
                  currentlyOpenSwipeableId.current = null;
              }
          } 
        }
      ]
    );
  }, [deleteWorkout, t]); 

  // 🎨 РЕНДЕР КНОПКИ УДАЛЕНИЯ 
  const renderRightActions = useCallback((progress, dragX, id) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    const transX = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 20], 
      extrapolate: 'clamp',
    });

    const opacity = progress.interpolate({
        inputRange: [0, 0.05], 
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    return (
      <View style={{ width: 100, height: '100%', flexDirection: 'row' }}>
         <TouchableOpacity 
            onPress={() => handleDelete(id)} 
            style={styles.deleteActionWrapper}
            activeOpacity={0.8}
         >
            <Animated.View style={[
                styles.deleteContent, 
                { transform: [{ translateX: transX }, { scale }], opacity: opacity }
            ]}>
                <Trash2 color="white" size={26} style={{ marginBottom: 4 }} />
                <Text style={styles.deleteText}>{t('deleteBtn')}</Text> 
            </Animated.View>
         </TouchableOpacity>
      </View>
    );
  }, [handleDelete, t]); 

  // 🔥 МЕМОИЗИРОВАННЫЙ RENDER ITEM
  const renderItem = useCallback(({ item }) => (
    <View style={{ marginBottom: 12 }}> 
      <Swipeable
        ref={ref => {
          if (!item.id) return;
          if (ref) {
            rowRefs.current.set(item.id, ref);
          } else {
            // Безопасная очистка ссылок при размонтировании элемента
            rowRefs.current.delete(item.id);
          }
        }}
        onSwipeableWillOpen={() => closeRow(item.id)}
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
        overshootRight={false}
        friction={2}
        containerStyle={{ overflow: 'visible' }} 
      >
        <WorkoutRow
          date={item.date}
          type={item.type}
          typeColor={item.typeColor}
          metrics={item.metrics}
          onPress={() => handleWorkoutPress(item)}
        />
      </Swipeable>
    </View>
  ), [closeRow, renderRightActions, handleWorkoutPress]);

  // Вынесено в useCallback, чтобы ListHeaderComponent не пересоздавался
  const renderHeader = useCallback(() => (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>{t('history')}</Text>
        <TouchableOpacity style={[styles.circleButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]} onPress={openManual}>
          <Plus size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.startButton, { shadowColor: colors.primary }]} activeOpacity={0.8} onPress={openList}>
        <LinearGradient
          colors={['#32d74b', '#00C805']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.gradientBtn}
        >
          <View style={styles.btnContent}>
            <Text style={styles.startButtonText}>{t('startWorkout')}</Text>
            <View style={styles.playIconBox}>
              <Play size={20} color="#00C805" fill="#00C805" style={{ marginLeft: 2 }} />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
      <Text style={[styles.listTitle, { color: colors.textSecondary }]}>{t('recentActivity')}</Text>
    </View>
  ), [colors, openManual, openList, t]); 

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary || '#32d74b'} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={[...workouts].sort((a, b) => {
              const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
              const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
              return dateB - dateA;
            })}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            onScrollBeginDrag={closeAllRows} 
            renderItem={renderItem} 
            ListHeaderComponent={renderHeader} 
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh}
                tintColor={colors.primary || '#32d74b'}
                titleColor={colors.textSecondary}
              />
            }
            
            // 🔥 ПАРАМЕТРЫ ОПТИМИЗАЦИИ ФЛЭТЛИСТА 🔥
            initialNumToRender={8} 
            maxToRenderPerBatch={5} 
            windowSize={5} 
            removeClippedSubviews={true} 
            
            ListEmptyComponent={
               <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('emptyHistory')}</Text>
            }
          />
        )}

        <WorkoutModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          initialMode={modalMode}
        />

        <WorkoutDetailsModal
          isVisible={detailsVisible}
          workout={selectedWorkout}
          onClose={() => setDetailsVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  headerContainer: { marginBottom: 10, marginTop: 10 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { fontSize: 32, fontFamily: 'Inter_700Bold' },
  circleButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  startButton: { borderRadius: 20, marginBottom: 25, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
  gradientBtn: { padding: 18, borderRadius: 20 },
  btnContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  startButtonText: { color: '#003300', fontSize: 18, fontFamily: 'Inter_700Bold' },
  playIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  listTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 10 },
  emptyText: { textAlign: 'center', marginTop: 50 },

  // СТИЛИ КНОПКИ УДАЛЕНИЯ 
  deleteActionWrapper: {
    backgroundColor: '#FF453A',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    marginLeft: -25, 
    paddingLeft: 25, 
    height: '100%',
  },
  deleteContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: 'white',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2
  }
});
