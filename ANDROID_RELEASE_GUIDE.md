# Android Release Guide for Play Store

## Prerequisites ✅
- [x] Keystore generated: `android/app/thinkplan-key.keystore`
- [x] Capacitor configured with keystore settings
- [x] Android Studio opened with the project

## Steps to Build Release APK/AAB in Android Studio

### 1. Wait for Project Setup
- Let Android Studio finish loading and syncing the project
- Install any missing SDK components if prompted
- Wait for Gradle sync to complete

### 2. Configure Signing (Already Done)
Your keystore is already configured in `capacitor.config.ts`:
```
keystorePath: 'app/thinkplan-key.keystore'
keystorePassword: 'thinkplan123'
keystoreAlias: 'thinkplan'
keystoreAliasPassword: 'thinkplan123'
```

### 3. Build Release Version
**Option A: Build AAB (Recommended for Play Store)**
1. In Android Studio menu: `Build > Generate Signed Bundle / APK`
2. Select `Android App Bundle`
3. Click `Next`
4. Choose existing keystore: Browse to `app/thinkplan-key.keystore`
5. Enter keystore password: `thinkplan123`
6. Enter key alias: `thinkplan`
7. Enter key password: `thinkplan123`
8. Click `Next`
9. Select `release` build variant
10. Check `V1` and `V2` signature versions
11. Click `Finish`

**Option B: Using Terminal (if Gradle works)**
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
cd android
./gradlew bundleRelease
```

### 4. Find Your Built Files
- **AAB file**: `android/app/build/outputs/bundle/release/app-release.aab`
- **APK file**: `android/app/build/outputs/apk/release/app-release.apk`

## Play Store Submission Requirements

### 1. App Information
- **App Name**: ThinkPlan
- **Package Name**: com.thinkplan.app
- **Version Code**: Update in `android/app/build.gradle`
- **Version Name**: Update in `android/app/build.gradle`

### 2. Required Assets for Play Store
You'll need to create:
- **App Icon**: 512x512 PNG (already configured in your app)
- **Feature Graphic**: 1024x500 PNG
- **Screenshots**: At least 2 phone screenshots (1080x1920 or 1080x2340)
- **Short Description**: Max 80 characters
- **Full Description**: Max 4000 characters
- **Privacy Policy URL**: Required

### 3. Content Rating
- Complete the content rating questionnaire in Play Console
- Your app appears to be suitable for all audiences

### 4. Release Information
- **Target API Level**: 34 (Android 14) - required for new apps
- **App Bundle**: Use AAB format (preferred by Google)

## Important Notes

### Version Management
Update version in `android/app/build.gradle`:
```gradle
android {
    ...
    defaultConfig {
        versionCode 1  // Increment for each release
        versionName "1.0"  // User-facing version
        ...
    }
}
```

### Testing Before Release
1. Test the release build on a physical device
2. Test all critical app flows
3. Verify that Supabase connections work in release mode
4. Test push notifications if implemented

### Production Environment
Make sure your app is configured for production:
- Supabase project URLs point to production
- Remove any debug logs
- Ensure all API keys are production-ready

## Next Steps After Build
1. Test the release build thoroughly
2. Create Play Store listing
3. Upload AAB file
4. Fill in store listing details
5. Submit for review

## Troubleshooting

### If Gradle Build Fails
1. Make sure Android SDK is up to date
2. Check that JAVA_HOME is set correctly
3. Try cleaning: `./gradlew clean`
4. Restart Android Studio

### If App Won't Start
1. Check Capacitor configuration
2. Verify web assets are properly bundled
3. Check Android logs: `adb logcat`

---

**Remember**: Keep your keystore file safe and backed up! You'll need it for all future updates to your app. 