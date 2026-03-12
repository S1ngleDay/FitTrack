import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Alert, Animated } from 'react-native';
import { Plus, Play, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';

import WorkoutRow from '../components/WorkoutRow';
import WorkoutModal from '../components/WorkoutModal';
import WorkoutDetailsModal from '../components/WorkoutDetailsModal';
import colors from '../constants/colors';
import { useWorkoutStore } from '../store/workoutStore';

export default function WorkoutsScreen({ navigation, route }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('list');
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

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

  const closeRow = (id) => {
    if (currentlyOpenSwipeableId.current && currentlyOpenSwipeableId.current !== id) {
       const prevSwipeable = rowRefs.current.get(currentlyOpenSwipeableId.current);
       if (prevSwipeable) prevSwipeable.close(); 
    }
    currentlyOpenSwipeableId.current = id;
  };

  const closeAllRows = () => {
    if (currentlyOpenSwipeableId.current) {
        const prevSwipeable = rowRefs.current.get(currentlyOpenSwipeableId.current);
        if (prevSwipeable) prevSwipeable.close();
        currentlyOpenSwipeableId.current = null;
    }
  };

  useFocusEffect(
    useCallback(() => {
      return () => closeAllRows();
    }, [])
  );
  // --------------------------------------------------------

  useEffect(() => {
    if (isFocused && route.params?.autoStart) {
      const { type, goalTitle, goalSubtitle } = route.params;
      startWorkout(type, goalTitle, goalSubtitle);
      navigation.setParams({ autoStart: undefined });
      navigation.navigate('ActiveRun');
    }
  }, [isFocused, route.params]);

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

  const handleWorkoutPress = (workoutData) => {
    if (currentlyOpenSwipeableId.current === workoutData.id) {
        closeAllRows();
        return;
    }
    closeAllRows(); 
    setSelectedWorkout(workoutData);
    setDetailsVisible(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Удалить тренировку?",
      "Это действие нельзя отменить.",
      [
        { text: "Отмена", style: "cancel", onPress: () => {
             const ref = rowRefs.current.get(id);
             if (ref) ref.close();
        }},
        { 
          text: "Удалить", 
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
  };

  // 🎨 РЕНДЕР КНОПКИ УДАЛЕНИЯ (Как на фото)
  const renderRightActions = (progress, dragX, id) => {
    // Анимация иконки (увеличение при открытии)
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    // Анимация сдвига текста и иконки (чтобы они не уезжали слишком далеко)
    const transX = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 20], // Небольшой параллакс эффект
      extrapolate: 'clamp',
    });

    const opacity = progress.interpolate({
        inputRange: [0, 0.05], // Очень быстрый переход
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    return (
      <View style={{ width: 100, height: '100%', flexDirection: 'row' }}>
         {/* 
            Основной контейнер кнопки. 
            trick: marginLeft: -20 позволяет красному фону "залезть" 
            в щель между скругленной карточкой и кнопкой.
         */}
         <TouchableOpacity 
            onPress={() => handleDelete(id)} 
            style={styles.deleteActionWrapper}
            activeOpacity={0.8}
         >
            <Animated.View style={[
                styles.deleteContent, 
                { transform: [{ translateX: transX }, { scale }],
              opacity: opacity}
            ]}>
                <Trash2 color="white" size={26} style={{ marginBottom: 4 }} />
                <Text style={styles.deleteText}>Удалить</Text>
            </Animated.View>
         </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <Text style={styles.pageTitle}>История</Text>
        <TouchableOpacity style={styles.circleButton} onPress={openManual}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.startButton} activeOpacity={0.8} onPress={openList}>
        <LinearGradient
          colors={['#32d74b', '#00C805']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.gradientBtn}
        >
          <View style={styles.btnContent}>
            <Text style={styles.startButtonText}>Начать тренировку</Text>
            <View style={styles.playIconBox}>
              <Play size={20} color="#00C805" fill="#00C805" style={{ marginLeft: 2 }} />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
      <Text style={styles.listTitle}>Недавние активности</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={workouts}
            keyExtractor={(item) => String(item.id)}
            onScrollBeginDrag={closeAllRows} 
            renderItem={({ item }) => (
              // Важно: margin вынесен сюда, чтобы свайп и карточка были одной высоты
              <View style={{ marginBottom: 12 }}> 
                <Swipeable
                  ref={ref => {
                    if (ref && item.id) rowRefs.current.set(item.id, ref);
                  }}
                  onSwipeableWillOpen={() => closeRow(item.id)}
                  renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
                  overshootRight={false} // Запрещаем оттягивать слишком далеко
                  friction={2}
                  containerStyle={{ overflow: 'visible' }} // Разрешаем вылезать за границы
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
            )}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
               <Text style={styles.emptyText}>История пуста. Начните первую тренировку!</Text>
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
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 20 },
  headerContainer: { marginBottom: 10, marginTop: 10 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { color: colors.textPrimary, fontSize: 32, fontFamily: 'Inter_700Bold' },
  circleButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3A3A3C' },
  startButton: { borderRadius: 20, marginBottom: 25, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
  gradientBtn: { padding: 18, borderRadius: 20 },
  btnContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  startButtonText: { color: '#003300', fontSize: 18, fontFamily: 'Inter_700Bold' },
  playIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  listTitle: { color: colors.textSecondary, fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 10 },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: 50 },

  // СТИЛИ КНОПКИ УДАЛЕНИЯ (ИСПРАВЛЕННЫЕ)
  deleteActionWrapper: {
    backgroundColor: '#FF453A', // Ярко-красный
    flex: 1, // Занимает все доступное место в renderRightActions
    justifyContent: 'center',
    alignItems: 'center',
    
    // Скругляем правые углы, чтобы совпадало с дизайном карточки
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    
    // Оставляем левые углы прямыми для стыка
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    
    // МАГИЯ СТЫКОВКИ:
    // Сдвигаем весь красный блок влево, чтобы перекрыть зазор от скругления карточки
    marginLeft: -25, 
    paddingLeft: 25, // Компенсируем сдвиг, чтобы иконка осталась в центре визуально
    
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
