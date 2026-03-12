import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Lock, Fingerprint, Clock, Shield, Trash2, Key, Eye } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import colors from '../constants/colors';
import SettingItem from '../components/SettingItem';

const BIOMETRIC_KEY = 'fittrack_biometric_enabled';
const PIN_KEY = 'fittrack_pin_code';
const SESSION_TIMEOUT_KEY = 'fittrack_session_timeout';
const ENCRYPTION_KEY = 'fittrack_encryption_enabled';

export default function SecurityScreen({ navigation }) {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('5');
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [timeoutModalVisible, setTimeoutModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState('input'); // 'input' или 'confirm'

  // Загрузка сохранённых настроек при монтировании
  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const biometric = await AsyncStorage.getItem(BIOMETRIC_KEY);
      const encryption = await AsyncStorage.getItem(ENCRYPTION_KEY);
      const timeout = await AsyncStorage.getItem(SESSION_TIMEOUT_KEY);

      if (biometric === 'true') setBiometricEnabled(true);
      if (encryption === 'false') setEncryptionEnabled(false);
      if (timeout) setSessionTimeout(timeout);
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    }
  };

  // === БИОМЕТРИЯ ===
  const handleBiometricToggle = async (value) => {
    try {
      setBiometricEnabled(value);
      await AsyncStorage.setItem(BIOMETRIC_KEY, String(value));
      const status = value ? 'включена' : 'отключена';
      Alert.alert('Успешно', `Биометрия ${status}`);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить настройку');
    }
  };

  // === PIN-КОД ===
  const handlePinSetup = () => {
    setPinStep('input');
    setPinInput('');
    setConfirmPin('');
    setPinModalVisible(true);
  };

  const handlePinConfirm = async () => {
    if (pinStep === 'input') {
      if (pinInput.length < 4) {
        Alert.alert('Ошибка', 'PIN-код должен быть минимум 4 символа');
        return;
      }
      setPinStep('confirm');
      setConfirmPin('');
    } else {
      if (pinInput !== confirmPin) {
        Alert.alert('Ошибка', 'PIN-коды не совпадают');
        setConfirmPin('');
        return;
      }
      try {
        await AsyncStorage.setItem(PIN_KEY, pinInput);
        Alert.alert('Успешно', 'PIN-код установлен');
        setPinModalVisible(false);
        setPinStep('input');
        setPinInput('');
        setConfirmPin('');
      } catch (error) {
        Alert.alert('Ошибка', 'Не удалось сохранить PIN-код');
      }
    }
  };

  const handlePinRemove = async () => {
    Alert.alert(
      'Удалить PIN-код',
      'Вы уверены?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(PIN_KEY);
              Alert.alert('Успешно', 'PIN-код удалён');
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить PIN-код');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  // === ТАЙМАУТ СЕАНСА ===
  const handleTimeoutChange = async (value) => {
    setSessionTimeout(value);
    await AsyncStorage.setItem(SESSION_TIMEOUT_KEY, value);
    setTimeoutModalVisible(false);
    Alert.alert('Успешно', `Таймаут установлен на ${value} минут`);
  };

  // === ШИФРОВАНИЕ ===
  const handleEncryptionToggle = async (value) => {
    try {
      setEncryptionEnabled(value);
      await AsyncStorage.setItem(ENCRYPTION_KEY, String(value));
      const status = value ? 'включено' : 'отключено';
      Alert.alert('Успешно', `Шифрование ${status}`);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить настройку');
    }
  };

  // === ИСТОРИЯ ВХОДОВ ===
  const handleActivityLog = () => {
    Alert.alert(
      'История входов',
      'Последний вход: Сегодня 14:32\n' +
      'Предыдущий: 11 марта 2026 09:15\n' +
      'Ещё: 10 марта 2026 18:45\n\n' +
      'Функция полной истории в разработке',
      [{ text: 'Закрыть' }]
    );
  };

  // === ИЗМЕНЕНИЕ ПАРОЛЯ ===
  const handleChangePassword = () => {
    Alert.alert(
      'Изменить пароль',
      'Эта функция доступна при облачной синхронизации',
      [{ text: 'ОК' }]
    );
  };

  // === УДАЛЕНИЕ ДАННЫХ ===
  const handleDeleteData = () => {
    Alert.alert(
      'Удалить все данные?',
      'Это действие необратимо. Все тренировки, статистика и настройки будут удалены.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          onPress: async () => {
            try {
              // Очистить все данные
              await AsyncStorage.clear();
              Alert.alert('Успешно', 'Все данные удалены. Приложение перезагрузится.');
              // В реальном приложении здесь был бы перезапуск или переход на стартовый экран
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить данные');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Безопасность</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ОСНОВНЫЕ ПАРАМЕТРЫ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ОСНОВНОЕ</Text>

          <View style={styles.itemContainer}>
            <SettingItem
              icon={Fingerprint}
              title="Биометрия"
              type="switch"
              value={biometricEnabled}
              onToggle={handleBiometricToggle}
              color="#007AFF"
            />
          </View>

          <View style={styles.itemContainer}>
            <SettingItem
              icon={Lock}
              title="PIN-код"
              type="link"
              color="#32d74b"
              onPress={handlePinSetup}
            />
            <TouchableOpacity
              style={styles.subAction}
              onPress={handlePinRemove}
            >
              <Text style={styles.subActionText}>Удалить</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.itemContainer}>
            <SettingItem
              icon={Clock}
              title="Таймаут сеанса"
              type="value"
              value={`${sessionTimeout} мин`}
              color="#FF9F0A"
              onPress={() => setTimeoutModalVisible(true)}
            />
          </View>
        </View>

        {/* ДАННЫЕ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ДАННЫЕ</Text>

          <View style={styles.itemContainer}>
            <SettingItem
              icon={Shield}
              title="Шифрование данных"
              type="switch"
              value={encryptionEnabled}
              onToggle={handleEncryptionToggle}
              color="#5856D6"
            />
            <Text style={styles.subText}>Локальное шифрование хранимых данных</Text>
          </View>
        </View>

        {/* АККАУНТ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>АККАУНТ</Text>

          <View style={styles.itemContainer}>
            <SettingItem
              icon={Eye}
              title="История входов"
              type="link"
              color="#8E8E93"
              onPress={handleActivityLog}
            />
          </View>

          <View style={styles.itemContainer}>
            <SettingItem
              icon={Key}
              title="Изменить пароль"
              type="link"
              color="#0A84FF"
              onPress={handleChangePassword}
            />
          </View>
        </View>

        {/* ОПАСНАЯ ЗОНА */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ОПАСНАЯ ЗОНА</Text>

          <View style={styles.itemContainer}>
            <SettingItem
              icon={Trash2}
              title="Удалить все данные"
              type="link"
              color="#FF3B30"
              onPress={handleDeleteData}
            />
            <Text style={[styles.subText, { color: '#FF3B30' }]}>
              Это действие необратимо
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* МОДАЛЬ PIN-КОДА */}
      <Modal visible={pinModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {pinStep === 'input' ? 'Установить PIN-код' : 'Подтвердить PIN-код'}
            </Text>

            <TextInput
              style={styles.pinInput}
              placeholder={pinStep === 'input' ? 'Введите PIN (4+ цифр)' : 'Подтвердите PIN'}
              secureTextEntry
              keyboardType="numeric"
              value={pinStep === 'input' ? pinInput : confirmPin}
              onChangeText={pinStep === 'input' ? setPinInput : setConfirmPin}
              placeholderTextColor="#555"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPinModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handlePinConfirm}
              >
                <Text style={styles.confirmButtonText}>
                  {pinStep === 'input' ? 'Далее' : 'Готово'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* МОДАЛЬ ТАЙМАУТА */}
      <Modal visible={timeoutModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выбери время сеанса</Text>

            {['1', '5', '15', '30'].map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeoutOption,
                  sessionTimeout === time && styles.timeoutOptionActive,
                ]}
                onPress={() => handleTimeoutChange(time)}
              >
                <Text
                  style={[
                    styles.timeoutOptionText,
                    sessionTimeout === time && styles.timeoutOptionTextActive,
                  ]}
                >
                  {time} минут
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setTimeoutModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  backButton: {
    padding: 8,
    backgroundColor: colors.cardBg,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  section: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  itemContainer: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  subAction: {
    marginTop: 8,
    paddingVertical: 6,
  },
  subActionText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#FF3B30',
  },
  subText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  pinInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: 'Inter_500Medium',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#2C2C2E',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textSecondary,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: 'white',
  },
  timeoutOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  timeoutOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeoutOptionText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  timeoutOptionTextActive: {
    color: 'white',
  },
});
