# Android配置和权限检查清单 (FitTrack)

## ✅ CURRENTLY IMPLEMENTED PERMISSIONS

### Location Services (GPS Tracking)
- ✅ ACCESS_FINE_LOCATION - High accuracy GPS
- ✅ ACCESS_COARSE_LOCATION - Network-based location
- ✅ ACCESS_BACKGROUND_LOCATION - Location in background (required for route recording)
- ✅ FOREGROUND_SERVICE - Run foreground service
- ✅ FOREGROUND_SERVICE_LOCATION - Foreground service for location tracking (Android 12+)

### Sensors & Activity Recognition
- ✅ ACTIVITY_RECOGNITION - Pedometer/step counting (Android 10+)

### File System
- ✅ READ_EXTERNAL_STORAGE - Read files (backup/import)
- ✅ WRITE_EXTERNAL_STORAGE - Write files (backup/export)

### Hardware & System
- ✅ VIBRATE - Haptic feedback
- ✅ INTERNET - API calls and notifications
- ✅ RECORD_AUDIO - Possible future feature
- ✅ SYSTEM_ALERT_WINDOW - System-level alerts

---

## ⚠️ POTENTIALLY MISSING PERMISSIONS (API LEVEL DEPENDENT)

### Notifications (Android 13+)
- ❌ **POST_NOTIFICATIONS** - Required for Android 13+ to send notifications
  - **Impact**: Workout reminders, timer notifications won't work on Android 13+
  - **Action**: ADD THIS PERMISSION
  - ```xml
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    ```

### Health Kit Integration (Future)
- ❌ **HEALTH_CONNECT_READ** - Read from Health Connect (Android 14+)
- ❌ **HEALTH_CONNECT_WRITE** - Write to Health Connect (Android 14+)

### Battery Management (Future)
- ❌ **SCHEDULE_EXACT_ALARM** - For workout reminders (Android 12+)
- ❌ **RECEIVE_BOOT_COMPLETED** - Start services on device boot

---

## 📋 RECOMMENDED ADDITIONS

### 1. Post Notifications (CRITICAL FOR ANDROID 13+)
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```
- **Why**: Without this, notifications won't appear on Android 13+ devices
- **Priority**: HIGH

### 2. Query Permissions (Required for app links)
```xml
<queries>
  <intent>
    <action android:name="android.intent.action.VIEW"/>
    <category android:name="android.intent.category.BROWSABLE"/>
    <data android:scheme="https"/>
  </intent>
</queries>
```
- ✅ Already implemented

### 3. Foreground Service Types Declaration (Android 12+)
```xml
<!-- In AndroidManifest.xml application tag -->
<service
  android:name=".LocationService"
  android:foregroundServiceType="location"/>
```
- **Why**: Explicitly declare what foreground services do
- **Priority**: MEDIUM (for Android 12+)

---

## 🔧 CONFIGURATION REQUIREMENTS

### Build Gradle (android/app/build.gradle)
```gradle
android {
  compileSdkVersion 34  // Target latest Android version
  targetSdkVersion 34
  minSdkVersion 21      // Minimum Android 5.0 (API 21)

  defaultConfig {
    applicationId "com.fittrack"
    minSdkVersion 21
    targetSdkVersion 34
    versionCode 1
    versionName "1.0.0"
  }
}
```

### Required Gradle Dependencies (check package.json for Expo equivalents)
- react-native-permissions (for permission handling)
- react-native-maps (already in package.json ✅)
- expo-notifications (already in package.json ✅)
- expo-location (already in package.json ✅)
- expo-sensors (already in package.json ✅)
- expo-task-manager (already in package.json ✅)

---

## ⚙️ RUNTIME PERMISSION HANDLING

The app currently uses Expo's permission system, which automatically handles runtime permission requests. Verify these are working:

### Location Permissions (useRouteTracker.js)
```javascript
const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
```
- ✅ Foreground location handling
- ✅ Background location handling

### Notification Permissions (notifications.js)
```javascript
const { status: existingStatus } = await Notifications.getPermissionsAsync();
const { status } = await Notifications.requestPermissionsAsync();
```
- ✅ Already implemented

### Activity Recognition (usePedometer.js)
```javascript
// Check if pedometer sensor is available
const isAvailable = await Pedometer.isAvailableAsync();
```
- ✅ Already implemented

---

## 📊 ANDROID VERSION COMPATIBILITY

| Feature | Min API | Target API | Status |
|---------|---------|-----------|---------|
| Location Tracking | 21 | 34 | ✅ OK |
| Foreground Service | 26 | 34 | ✅ OK |
| Foreground Service Type | 29 | 34 | ✅ OK |
| Background Location | 29 | 34 | ✅ OK |
| POST_NOTIFICATIONS | 31 (CRITICAL 33+) | 34 | ⚠️ MISSING |
| Activity Recognition | 29 | 34 | ✅ OK |
| HealthConnect APIs | 34+ | 34 | 🔮 Future |

---

## 🚨 CRITICAL ISSUES TO FIX

### 1. **Android 13+ Notification Permission** (MUST FIX)
- Currently missing `POST_NOTIFICATIONS` permission
- **Impact**: Notifications will fail silently on Android 13+
- **Solution**: Add permission to AndroidManifest.xml
- **Files to update**: `android/app/src/main/AndroidManifest.xml`

### 2. **Foreground Service Type** (RECOMMENDED)
- For Android 12+, should explicitly declare `foregroundServiceType="location"`
- **Impact**: Minor - app still works but may show warnings in logs
- **Solution**: Update AndroidManifest.xml service declaration

---

## ✨ OPTIONAL ENHANCEMENTS

### Haptic Feedback Enhancement
- Current: Basic vibration support ✅
- Suggested: Use `react-native-haptic-feedback` for more nuanced feedback patterns
- Can be added later if needed

### Health Integration
- Reserve permissions for future Google Fit / Samsung Health integration
- Add when ready: `HEALTH_CONNECT_READ`, `HEALTH_CONNECT_WRITE`

### App Shortcuts
- Consider adding app shortcuts for "Quick Workout" (requires Android 7.1+)
- Not critical now but good UX enhancement

---

## 📝 IMPLEMENTATION CHECKLIST

- [ ] Add `POST_NOTIFICATIONS` permission (Android 13+)
- [ ] Verify notification request handling in notifications.js
- [ ] Test on Android 13+ device
- [ ] Add foreground service type in production build
- [ ] Test background timer functionality
- [ ] Verify all permission requests work correctly
- [ ] Document permission handling in code
- [ ] Update app store listing with permission disclosures

---

## 🔗 USEFUL LINKS

- [Android Permissions Reference](https://developer.android.com/reference/android/Manifest.permission)
- [Expo Location Documentation](https://docs.expo.dev/versions/latest/sdk/location/)
- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Android 13+ Notification Changes](https://developer.android.com/about/versions/13/changes/notification-runtime-permission)

---

## SUMMARY

**Current Status**: 90% Complete ✅
**Missing**: Only `POST_NOTIFICATIONS` permission for Android 13+ support
**Recommended**: Add foreground service type declarations
**Timeline**: Add missing permission immediately before release
