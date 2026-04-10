import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform, KeyboardAvoidingView, Image, Linking
} from 'react-native';
import { User, Bell, Moon, Globe, HelpCircle, LogOut, X, Edit2, Camera, DownloadCloud, UploadCloud, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { exportWorkouts, importWorkoutsFromFile } from '../utils/backupUtils';
import SettingItem from '../components/SettingItem';
import { useThemeColors } from '../hooks/useThemeColors';
import { useUserStore } from '../store/userStore';
import { useWorkoutStore } from '../store/workoutStore';
import { getMetricValue } from '../utils/statsCalculator';
import { useTranslation } from '../hooks/useTranslation';

export default function SettingsScreen({ navigation }) {
  const colors = useThemeColors();
  const { t, language } = useTranslation();

  const user = useUserStore(s => s.user);
  const settings = useUserStore(s => s.settings);
  const toggleSetting = useUserStore(s => s.toggleSetting);
  const updateUser = useUserStore(s => s.updateUser);
  const workouts = useWorkoutStore(s => s.workouts);
  const importWorkouts = useWorkoutStore(s => s.importWorkouts);
  const clearUser = useUserStore(s => s.clearUser);
  const clearWorkouts = useWorkoutStore(s => s.clearAll);

  const stats = useMemo(() => {
    const totalWorkouts = workouts.length;
    let totalMinutes = 0;
    workouts.forEach(w => {
      const dur = w.duration || getMetricValue(w.metrics, '⏱️') || 0;
      totalMinutes += dur;
    });
    const timeDisplay = totalMinutes < 60 ? totalMinutes : (totalMinutes / 60).toFixed(1);
    const streak = 5;
    return { count: totalWorkouts, time: timeDisplay, streak };
  }, [workouts]);

  // --- Profile Edit State ---
  const [editVisible, setEditVisible] = useState(false);
  const [tempName, setTempName] = useState(user.name);
  const [tempWeight, setTempWeight] = useState(String(user.weight));
  const [tempHeight, setTempHeight] = useState(String(user.height));
  const [tempAge, setTempAge] = useState(String(user.age));
  const [tempGender, setTempGender] = useState(user.gender || 'male');
  const [tempGoalCalories, setTempGoalCalories] = useState(String(user.goalCalories || 2000));
  const [tempGoalSteps, setTempGoalSteps] = useState(String(user.goalSteps || 10000));
  const [tempGoalDistance, setTempGoalDistance] = useState(String(user.goalDistance || 0));

  // --- Language Modal State ---
  const [langVisible, setLangVisible] = useState(false);

  const handleSaveProfile = () => {
    updateUser({
      name: tempName,
      weight: parseFloat(tempWeight) || user.weight,
      height: parseFloat(tempHeight) || user.height,
      age: parseInt(tempAge, 10) || user.age,
      gender: tempGender,
      goalCalories: parseInt(tempGoalCalories, 10) || 2000,
      goalSteps: parseInt(tempGoalSteps, 10) || 10000,
      goalDistance: parseFloat(tempGoalDistance) || 0,
    });
    setEditVisible(false);
  };

  const handleOpenEdit = () => {
    setTempName(user.name);
    setTempWeight(String(user.weight));
    setTempHeight(String(user.height));
    setTempAge(String(user.age));
    setTempGender(user.gender || 'male');
    setTempGoalCalories(String(user.goalCalories || 2000));
    setTempGoalSteps(String(user.goalSteps || 10000));
    setTempGoalDistance(String(user.goalDistance || 0));
    setEditVisible(true);
  };

  const handleAvatarPress = () => {
    const buttons = [
      { text: t('chooseFromLibrary'), onPress: () => setTimeout(pickImage, 100) },
    ];
    if (user.avatar) {
      buttons.push({ text: t('removePhoto'), onPress: removeAvatar, style: 'destructive' });
    }
    buttons.push({ text: t('cancel'), style: 'cancel' });
    Alert.alert('', '', buttons);
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') return;
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (!result.canceled) {
        const tempUri = result.assets[0].uri;
        const fileName = tempUri.split('/').pop();
        const permanentUri = FileSystem.documentDirectory + fileName;
        if (user.avatar && user.avatar.includes(FileSystem.documentDirectory)) {
          await FileSystem.deleteAsync(user.avatar, { idempotent: true });
        }
        await FileSystem.copyAsync({ from: tempUri, to: permanentUri });
        updateUser({ avatar: permanentUri });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const removeAvatar = async () => {
    if (user.avatar && user.avatar.includes(FileSystem.documentDirectory)) {
      try { await FileSystem.deleteAsync(user.avatar, { idempotent: true }); }
      catch (error) { }
    }
    updateUser({ avatar: null });
  };

  const handleExport = async () => {
    try {
      if (workouts.length === 0) return;
      await exportWorkouts(workouts);
    } catch (error) { }
  };

  const handleImport = async () => {
    try {
      const importedData = await importWorkoutsFromFile();
      if (!importedData || importedData.length === 0) return;
      Alert.alert(
        'Импорт',
        `Найдено ${importedData.length} тренировок. Что сделать?`,
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Заменить текущие', style: 'destructive', onPress: () => importWorkouts(importedData, 'replace') },
          { text: 'Объединить', onPress: () => importWorkouts(importedData, 'merge') },
        ]
      );
    } catch (error) { }
  };

  const changeLanguage = (langCode) => {
    // В сторе userStore функция toggleSetting(key, value)
    toggleSetting('language', langCode);
    setLangVisible(false);
  };

    // 1. Функция полного удаления данных и выхода
  const performLogout = async () => {
    // Очищаем сторы Zustand
    clearWorkouts();
    clearUser();

    // Опционально: если у тебя есть другие ключи в AsyncStorage или кэшированные картинки
    // можно вызвать полную очистку AsyncStorage:
    // await AsyncStorage.clear();

    // Если у тебя есть авторизация (Login screen), отправляем туда.
    // Если используешь условный рендеринг (например, если user.email пустой -> экран логина),
    // то навигация произойдет автоматически.
    // Иначе: navigation.replace('Login');
  };

  // 2. Обработчик нажатия на кнопку "Log Out"
  const handleLogoutPress = () => {
    Alert.alert(
      t('logoutConfirm') || 'Выход из аккаунта',
      'Хотите экспортировать ваши тренировки перед выходом, чтобы не потерять данные?',
      [
        { 
          text: t('cancel') || 'Отмена', 
          style: 'cancel' 
        },
        { 
          text: 'Выйти без сохранения', 
          style: 'destructive',
          onPress: performLogout 
        },
        { 
          text: 'Экспортировать и выйти', 
          onPress: async () => {
            await handleExport(); // Вызываем твою уже готовую функцию экспорта
            performLogout();      // После экспорта удаляем данные
          } 
        }
      ]
    );
  };


  const handleOpenHelp = async () => {
    const url = 'https://t.me/FitTrackSD';

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Ошибка', 'Не удалось открыть ссылку');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось открыть Telegram-канал');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <User size={40} color={colors.textSecondary} />
                </View>
              )}
              <View style={[styles.cameraBadge, { borderColor: colors.background }]}>
                <Camera size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.nameRow}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>{user.name}</Text>
            <TouchableOpacity onPress={handleOpenEdit} hitSlop={10}>
              <Edit2 size={16} color="#0A84FF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user.email}</Text>

          <View style={[styles.physicalTag, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.physicalText, { color: colors.textPrimary }]}>
              {user.age ? `${user.age} лет • ` : ''}{user.weight} кг • {user.height} см
            </Text>
          </View>

          <View style={[styles.miniStatsContainer, { backgroundColor: colors.cardBg }]}>
            <View style={styles.miniStatItem}>
              <Text style={[styles.miniStatValue, { color: colors.textPrimary }]}>{stats.count}</Text>
              <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>{t('workoutsCount')}</Text>
            </View>
            <View style={[styles.dividerVertical, { backgroundColor: colors.border }]} />
            <View style={styles.miniStatItem}>
              <Text style={[styles.miniStatValue, { color: colors.textPrimary }]}>{stats.time}</Text>
              <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>{t('timeSpent')}</Text>
            </View>
            <View style={[styles.dividerVertical, { backgroundColor: colors.border }]} />
            <View style={styles.miniStatItem}>
              <Text style={[styles.miniStatValue, { color: '#FF9F0A' }]}>{stats.streak}</Text>
              <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>{t('streak')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentContainer}>

          <SettingsGroup title={t('profile')} colors={colors}>
            <SettingItem icon={User} title={t('editProfile')} color="#0A84FF" hasChevron onPress={handleOpenEdit} />
          </SettingsGroup>

          <SettingsGroup title={t('data')} colors={colors}>
            <SettingItem icon={UploadCloud} title={t('exportData')} color="#34C759" hasChevron onPress={handleExport} />
            <SettingItem icon={DownloadCloud} title={t('importData')} color="#FF9F0A" hasChevron onPress={handleImport} />
          </SettingsGroup>

          <SettingsGroup title={t('preferences')} colors={colors}>
            <SettingItem icon={Bell} title={t('notifications')} color="#FF3B30" type="switch" value={settings?.notifications} onToggle={() => toggleSetting('notifications')} />
            <SettingItem icon={Globe} title={t('language')} color="#5856D6" type="value" value={language === 'ru' ? 'РУС' : 'ENG'} hasChevron onPress={() => setLangVisible(true)} />
            <SettingItem icon={Moon} title={t('darkMode')} color="#1C1C1E" type="switch" value={settings?.isDark} onToggle={() => toggleSetting('isDark')} />
          </SettingsGroup>

          <SettingsGroup title={t('other')} colors={colors}>
            <SettingItem icon={HelpCircle} title={t('help')} color="#8E8E93" hasChevron onPress={handleOpenHelp}/>
            <SettingItem icon={LogOut} title={t('logout')} color="#FF3B30" isDestructive onPress={handleLogoutPress} />
          </SettingsGroup>

          <Text style={[styles.versionText, { color: colors.textSecondary }]}>FitTrack v1.0.0 (Build 2026)</Text>
        </View>
      </ScrollView>

      {/* --- EDIT PROFILE MODAL --- */}
      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setEditVisible(false)} />
          <View style={[styles.modalContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={[styles.dragIndicator, { backgroundColor: colors.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('editProfile')}</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.border }]}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('name')}</Text>
                <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]} value={tempName} onChangeText={setTempName} placeholderTextColor={colors.textSecondary} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('gender')}</Text>
                <View style={styles.genderRow}>
                  <TouchableOpacity style={[styles.genderBtn, { backgroundColor: colors.background, borderColor: colors.border }, tempGender === 'male' && styles.genderBtnActive]} onPress={() => setTempGender('male')}>
                    <Text style={[styles.genderText, { color: colors.textSecondary }, tempGender === 'male' && styles.genderTextActive]}>{t('male')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.genderBtn, { backgroundColor: colors.background, borderColor: colors.border }, tempGender === 'female' && styles.genderBtnActive]} onPress={() => setTempGender('female')}>
                    <Text style={[styles.genderText, { color: colors.textSecondary }, tempGender === 'female' && styles.genderTextActive]}>{t('female')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('age')}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]} value={tempAge} onChangeText={setTempAge} keyboardType="numeric" maxLength={3} />
                </View>
                <View style={{ width: 10 }} />
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('weight')}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]} value={tempWeight} onChangeText={setTempWeight} keyboardType="numeric" maxLength={4} />
                </View>
                <View style={{ width: 10 }} />
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('height')}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]} value={tempHeight} onChangeText={setTempHeight} keyboardType="numeric" maxLength={3} />
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 15, marginTop: 10 }]}>{t('dailyGoals')}</Text>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('goalCalories')}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]} value={tempGoalCalories} onChangeText={setTempGoalCalories} keyboardType="numeric" maxLength={5} />
                </View>
                <View style={{ width: 10 }} />
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('goalSteps')}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]} value={tempGoalSteps} onChangeText={setTempGoalSteps} keyboardType="numeric" maxLength={6} />
                </View>
                <View style={{ width: 10 }} />
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('goalDistance')}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]} value={tempGoalDistance} onChangeText={setTempGoalDistance} keyboardType="numeric" maxLength={5} />
                </View>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: Platform.OS === 'ios' ? 20 : 10 }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- LANGUAGE SELECTOR MODAL --- */}
      <Modal visible={langVisible} animationType="slide" transparent onRequestClose={() => setLangVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setLangVisible(false)} />
          <View style={[styles.modalContainer, { backgroundColor: colors.cardBg, borderColor: colors.border, paddingBottom: 40 }]}>
            <View style={[styles.dragIndicator, { backgroundColor: colors.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setLangVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.border }]}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TouchableOpacity
                style={[styles.langRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                onPress={() => changeLanguage('ru')}
              >
                <Text style={[styles.langText, { color: colors.textPrimary }]}>{t('russian')} (RU)</Text>
                {language === 'ru' && <Check size={20} color="#0A84FF" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.langRow}
                onPress={() => changeLanguage('en')}
              >
                <Text style={[styles.langText, { color: colors.textPrimary }]}>{t('english')} (EN)</Text>
                {language === 'en' && <Check size={20} color="#0A84FF" />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const SettingsGroup = ({ title, children, colors }) => (
  <View style={styles.settingsGroup}>
    <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>{title}</Text>
    <View style={[styles.groupContainer, { backgroundColor: colors.cardBg }]}>
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  profileHeader: { alignItems: 'center', paddingTop: 20, paddingBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: '#0A84FF', justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  profileName: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  profileEmail: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 8 },
  physicalTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 20 },
  physicalText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  miniStatsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '90%', borderRadius: 16, paddingVertical: 15 },
  miniStatItem: { alignItems: 'center', flex: 1 },
  miniStatValue: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  miniStatLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  dividerVertical: { width: 1, height: 30 },
  contentContainer: { paddingHorizontal: 20, paddingTop: 10 },
  settingsGroup: { marginBottom: 25 },
  groupTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 8, marginLeft: 12, textTransform: 'uppercase' },
  groupContainer: { borderRadius: 16, overflow: 'hidden' },
  versionText: { textAlign: 'center', fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 10, marginBottom: 20 },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1 },
  modalContainer: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10, borderWidth: 1 },
  dragIndicator: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  closeBtn: { padding: 5, borderRadius: 15 },
  modalBody: { paddingBottom: 10 },
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 12, marginBottom: 8, marginLeft: 4, fontFamily: 'Inter_500Medium' },
  input: { borderRadius: 12, padding: 16, fontSize: 16, fontFamily: 'Inter_500Medium', borderWidth: 1, textAlign: 'center' },
  rowInputs: { flexDirection: 'row', marginBottom: 25 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1 },
  genderBtnActive: { backgroundColor: 'rgba(10, 132, 255, 0.15)', borderColor: '#0A84FF' },
  genderText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  genderTextActive: { color: '#0A84FF' },
  saveButton: { backgroundColor: '#0A84FF', padding: 16, borderRadius: 16, alignItems: 'center' },
  saveButtonText: { color: 'white', fontSize: 16, fontFamily: 'Inter_700Bold' },

  // LANG MODAL
  langRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  langText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
