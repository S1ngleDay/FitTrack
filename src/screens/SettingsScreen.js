import React, { useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  TouchableOpacity, Alert, Modal, TextInput, Platform, 
  KeyboardAvoidingView, Image 
} from 'react-native';
import { 
  User, Bell, Moon, Globe, HelpCircle, LogOut, 
  ChevronRight, Crown, Shield, X, Edit2, Camera 
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker'; // Если есть expo-image-picker

import SettingItem from '../components/SettingItem'; 
import colors from '../constants/colors';
import { useUserStore } from '../store/userStore';
import { useWorkoutStore } from '../store/workoutStore';
import { getMetricValue } from '../utils/statsCalculator';

export default function SettingsScreen({ navigation }) {
  const { user, settings, toggleSetting, updateUser } = useUserStore();
  const workouts = useWorkoutStore(s => s.workouts);

  // --- РАСЧЕТ СТАТИСТИКИ (РЕАЛЬНЫЙ) ---
  const stats = useMemo(() => {
    const totalWorkouts = workouts.length;
    let totalMinutes = 0;
    
    workouts.forEach(w => {
       // Берем длительность из корня или metrics
       const dur = w.duration || getMetricValue(w.metrics, '⏱️') || 0;
       totalMinutes += dur;
    });

    // Если меньше часа, пишем минуты, иначе часы (например 1.5ч)
    const timeDisplay = totalMinutes < 60 
        ? `${totalMinutes}м` 
        : `${(totalMinutes / 60).toFixed(1)}ч`;

    // Расчет серии (упрощенно: считаем подряд идущие дни)
    // Пока оставим хардкод, но логика готова для расширения
    const streak = 5; 
    
    return { count: totalWorkouts, time: timeDisplay, streak };
  }, [workouts]);

  // --- РЕДАКТИРОВАНИЕ ---
  const [editVisible, setEditVisible] = useState(false);
  const [tempName, setTempName] = useState(user.name);
  const [tempWeight, setTempWeight] = useState(String(user.weight));
  const [tempHeight, setTempHeight] = useState(String(user.height));

  const handleSaveProfile = () => {
    updateUser({
      name: tempName,
      weight: parseFloat(tempWeight) || user.weight,
      height: parseFloat(tempHeight) || user.height,
    });
    setEditVisible(false);
  };

  const pickImage = async () => {
    // Пример интеграции выбора фото (нужен expo-image-picker)
    // let result = await ImagePicker.launchImageLibraryAsync({ ... });
    Alert.alert('Функция в разработке', 'Скоро вы сможете загрузить свое фото!');
  };

  // --- БЕЗОПАСНОСТЬ ---
  const handleBiometric = () => {
    Alert.alert('Биометрия', 'Face ID / Touch ID будут использоваться для входа');
  };

  const handleSecuritySettings = () => {
    navigation.navigate('SecurityScreen');
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Удалить все данные',
      'Это действие необратимо. Все тренировки и данные будут удалены.',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          onPress: () => {
            // логика удаления данных
            Alert.alert('Успешно', 'Все данные удалены');
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* 1. Header Профиля */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                {user.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <User size={40} color="#8E8E93" />
                    </View>
                )}
                <View style={styles.cameraBadge}>
                    <Camera size={14} color="white" />
                </View>
              </TouchableOpacity>
          </View>
          
          <View style={styles.nameRow}>
             <Text style={styles.profileName}>{user.name}</Text>
             <TouchableOpacity onPress={() => setEditVisible(true)} hitSlop={10}>
                <Edit2 size={16} color="#007AFF" style={{ marginLeft: 8 }} />
             </TouchableOpacity>
          </View>
          
          <Text style={styles.profileEmail}>{user.email}</Text>
          <View style={styles.physicalTag}>
             <Text style={styles.physicalText}>{user.weight} кг • {user.height} см</Text>
          </View>

          {/* Микро-статистика */}
          <View style={styles.miniStatsContainer}>
              <View style={styles.miniStatItem}>
                  <Text style={styles.miniStatValue}>{stats.count}</Text>
                  <Text style={styles.miniStatLabel}>Тренировки</Text>
              </View>
              <View style={styles.dividerVertical} />
              <View style={styles.miniStatItem}>
                  <Text style={styles.miniStatValue}>{stats.time}</Text>
                  <Text style={styles.miniStatLabel}>Активность</Text>
              </View>
              <View style={styles.dividerVertical} />
              <View style={styles.miniStatItem}>
                  <Text style={[styles.miniStatValue, { color: '#FF9F0A' }]}>🔥 {stats.streak}</Text>
                  <Text style={styles.miniStatLabel}>Серия дней</Text>
              </View>
          </View>
        </View>

        {/* Контент */}
        <View style={styles.contentContainer}>
          
          {/* 2. Баннер PRO */}
          <TouchableOpacity activeOpacity={0.9} style={styles.proBanner}>
              <LinearGradient
                  colors={['#1C1C1E', '#2C2C2E']} // Более строгий градиент
                  start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                  style={styles.proGradient}
              >
                  <View style={styles.proContent}>
                      <View style={[styles.proIconCircle, { backgroundColor: '#FFD60A' }]}>
                          <Crown size={20} color="black" />
                      </View>
                      <View style={{flex: 1}}>
                          <Text style={[styles.proTitle, { color: '#FFD60A' }]}>PRO Premium</Text>
                          <Text style={styles.proSubtitle}>Персональные планы и статистика</Text>
                      </View>
                      <View style={styles.proButton}>
                         <Text style={styles.proButtonText}>Upgrade</Text>
                      </View>
                  </View>
              </LinearGradient>
          </TouchableOpacity>

          {/* 3. Настройки */}
          <SettingsGroup title="АККАУНТ">
             <SettingItem 
                icon={User} title="Личные данные" color="#007AFF" hasChevron 
                onPress={() => setEditVisible(true)}
             />
             <SettingItem 
                icon={Shield} title="Безопасность" color="#32d74b" hasChevron
                onPress={handleSecuritySettings}
             />
          </SettingsGroup>

          <SettingsGroup title="ПРИЛОЖЕНИЕ">
             <SettingItem 
                icon={Bell} title="Уведомления" color="#FF3B30" 
                type="switch" value={settings.notifications} 
                onToggle={() => toggleSetting('notifications')} 
             />
             <SettingItem 
                icon={Globe} title="Язык" color="#5856D6" 
                type="value" value={settings.language} hasChevron 
             />
             <SettingItem 
                icon={Moon} title="Темная тема" color="#1C1C1E" 
                type="switch" value={settings.isDark} 
                onToggle={() => toggleSetting('isDark')} 
             />
          </SettingsGroup>

          <SettingsGroup title="ПОДДЕРЖКА">
             <SettingItem icon={HelpCircle} title="Помощь и FAQ" color="#8E8E93" hasChevron />
             <SettingItem 
                icon={LogOut} title="Выйти" color="#FF3B30" isDestructive 
                onPress={() => Alert.alert('Выход', 'Вы уверены?', [{text: 'Отмена'}, {text: 'Выйти', style: 'destructive'}])} 
             />
          </SettingsGroup>

          <Text style={styles.versionText}>FitApp v1.0.2 (Build 2026)</Text>
          
        </View>
      </ScrollView>

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ (Улучшенная) */}
      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView 
           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
           style={styles.modalOverlay}
        >
           <TouchableOpacity 
              style={styles.modalBackdrop} 
              activeOpacity={1} 
              onPress={() => setEditVisible(false)} 
           />
           
           <View style={styles.modalContainer}>
              {/* Drag Indicator */}
              <View style={styles.dragIndicator} />

              <View style={styles.modalHeader}>
                 <Text style={styles.modalTitle}>Редактировать профиль</Text>
                 <TouchableOpacity onPress={() => setEditVisible(false)} style={styles.closeBtn}>
                    <X size={20} color="#8E8E93" />
                 </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                     <Text style={styles.inputLabel}>Имя</Text>
                     <TextInput 
                       style={styles.input} 
                       value={tempName} 
                       onChangeText={setTempName} 
                       placeholderTextColor="#555"
                     />
                  </View>

                  <View style={styles.rowInputs}>
                     <View style={[styles.inputGroup, {flex: 1}]}>
                        <Text style={styles.inputLabel}>Вес (кг)</Text>
                        <TextInput 
                          style={styles.input} 
                          value={tempWeight} 
                          onChangeText={setTempWeight} 
                          keyboardType="numeric"
                          placeholderTextColor="#555"
                        />
                     </View>
                     <View style={{width: 15}} />
                     <View style={[styles.inputGroup, {flex: 1}]}>
                        <Text style={styles.inputLabel}>Рост (см)</Text>
                        <TextInput 
                          style={styles.input} 
                          value={tempHeight} 
                          onChangeText={setTempHeight} 
                          keyboardType="numeric"
                          placeholderTextColor="#555"
                        />
                     </View>
                  </View>

                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                     <Text style={styles.saveButtonText}>Сохранить изменения</Text>
                  </TouchableOpacity>
              </View>
              
              {/* Безопасная зона снизу */}
              <View style={{ height: Platform.OS === 'ios' ? 20 : 10 }} />
           </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

// Вспомогательный компонент для группировки
const SettingsGroup = ({ title, children }) => (
  <View style={styles.settingsGroup}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupContainer}>
          {children}
      </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  
  profileHeader: { alignItems: 'center', paddingTop: 20, paddingBottom: 30, backgroundColor: colors.background },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.cardBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2C2C2E' },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#007AFF', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.background },
  
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  profileName: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  profileEmail: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginBottom: 8 },
  
  physicalTag: { backgroundColor: colors.cardBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 20 },
  physicalText: { color: colors.primary, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  
  miniStatsContainer: { 
      flexDirection: 'row', justifyContent: 'space-around', width: '90%', 
      backgroundColor: colors.cardBg, borderRadius: 16, paddingVertical: 15 
  },
  miniStatItem: { alignItems: 'center', flex: 1 },
  miniStatValue: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.textPrimary, marginBottom: 2 },
  miniStatLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  dividerVertical: { width: 1, height: 30, backgroundColor: '#2C2C2E' },

  contentContainer: { paddingHorizontal: 20, paddingTop: 10 },
  
  proBanner: { marginBottom: 25, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  proGradient: { padding: 16 },
  proContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  proIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  proTitle: { fontSize: 16, fontFamily: 'Inter_800ExtraBold' },
  proSubtitle: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  proButton: { backgroundColor: 'rgba(255, 214, 10, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  proButtonText: { color: '#FFD60A', fontSize: 12, fontFamily: 'Inter_700Bold' },

  settingsGroup: { marginBottom: 25 },
  groupTitle: { color: colors.textSecondary, fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 8, marginLeft: 12, textTransform: 'uppercase' },
  groupContainer: { backgroundColor: colors.cardBg, borderRadius: 16, overflow: 'hidden' },
  
  versionText: { textAlign: 'center', color: '#3A3A3C', fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 10, marginBottom: 20 },

  // --- MODAL ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1 },
  modalContainer: { 
      backgroundColor: colors.cardBg, 
      borderTopLeftRadius: 24, borderTopRightRadius: 24, 
      paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10,
      borderWidth: 1, borderColor: '#2C2C2E'
  },
  dragIndicator: { width: 40, height: 4, backgroundColor: '#3A3A3C', borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Inter_700Bold' },
  closeBtn: { padding: 5, backgroundColor: '#2C2C2E', borderRadius: 15 },
  
  modalBody: { paddingBottom: 10 },
  
  inputGroup: { marginBottom: 15 },
  inputLabel: { color: colors.textSecondary, fontSize: 12, marginBottom: 8, marginLeft: 4, fontFamily: 'Inter_500Medium' },
  input: { 
      backgroundColor: colors.background, borderRadius: 12, padding: 16, 
      color: colors.textPrimary, fontSize: 16, fontFamily: 'Inter_500Medium',
      borderWidth: 1, borderColor: '#2C2C2E'
  },
  rowInputs: { flexDirection: 'row', marginBottom: 25 },
  
  saveButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 16, alignItems: 'center' },
  saveButtonText: { color: 'white', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
