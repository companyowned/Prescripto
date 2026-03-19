# Android APK Build Guide

## Option 1: Build with EAS (Easiest)

### Prerequisites
- Expo account (free at https://expo.dev)
- EAS CLI installed: `npm install -g eas-cli`

### Steps

1. **Login to Expo:**
   ```bash
   eas login
   ```

2. **Update API endpoint for production:**
   Edit `mobile/.env.production`:
   ```
   EXPO_PUBLIC_API_URL=https://your-vercel-project.vercel.app/api/v1
   ```

3. **Build APK:**
   ```bash
   cd mobile
   eas build --platform android --type apk
   ```

4. **Monitor build:**
   - Watch in terminal or visit https://expo.dev/builds

5. **Download APK:**
   - Once complete, download from Expo dashboard
   - Share with others or install on Android device

### Installation on Android Device

```bash
# Via USB cable (requires adb)
adb install path/to/prescripto.apk

# Or email/download the APK file and open on device
```

---

## Option 2: Local Build with EAS (More Control)

```bash
cd mobile

# Install dependencies
npm install

# Ensure Android SDK is set up
export ANDROID_HOME=$HOME/Library/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# Build APK locally
eas build --platform android --local
```

---

## Option 3: Manual Build with Graddle

### Prerequisites
- Android SDK (API level 24+)
- Java JDK 11+
- Android SDK tools configured

### Setup

```bash
cd mobile

# Install Expo dependencies
npm install

# Generate native Android files
expo prebuild --clean --platform android
```

### Build with Gradle

```bash
cd android

# Create local.properties with SDK path
echo "sdk.dir=$ANDROID_HOME" > local.properties

# Build APK (debug)
./gradlew assembleDebug

# Build APK (release)
./gradlew assembleRelease

# Find APK in:
# android/app/build/outputs/apk/
```

---

## Signing Release APK

For production releases to Google Play Store:

### 1. Create Signing Key

```bash
keytool -genkey -v -keystore prescripto-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias prescripto-key \
  -storepass mypassword \
  -keypass mypassword \
  -dname "CN=Prescripto,O=MyOrg,L=City,ST=State,C=US"
```

### 2. Configure Signing in `android/app/build.gradle`

```gradle
android {
    signingConfigs {
        release {
            storeFile file("../prescripto-release.keystore")
            storePassword "mypassword"
            keyAlias "prescripto-key"
            keyPassword "mypassword"
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### 3. Build Signed APK

```bash
cd android
./gradlew assembleRelease
```

---

## Configure EAS for Signing (Recommended)

Instead of managing keys locally, use EAS managed signing:

```bash
eas credentials

# Follow prompts to:
# 1. Generate or upload keystore
# 2. Configure signing

# Then build with EAS
eas build --platform android --type app-signed
```

---

## Device Installation

### Via adb (Android Device Bridge)

```bash
# Enable USB debugging on device
# Connect via USB cable

# Install APK
adb install prescripto.apk

# Or install and run
adb install -r prescripto.apk
adb shell am start -n com.prescripto.app/.MainActivity
```

### Via Email or Storage

1. Transfer APK file to Android device
2. Open file manager
3. Navigate to downloaded APK
4. Tap to install (grant permissions when prompted)

---

## Testing the APK

After installation:

1. **Check if app launches:**
   - Tap app icon in app drawer
   - Look for splash screen

2. **Verify API connection:**
   - Login with test credentials
   - Attempt to upload/scan prescription
   - Check network requests in browser dev tools

3. **Test key features:**
   - Camera permissions
   - Document upload
   - Prescription analysis
   - User profile

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails in EAS | Check logs in Expo dashboard, ensure Node.js 18+ |
| APK won't install | Ensure device Android version matches `minSdkVersion` in app.json (currently 24+) |
| App crashes on launch | Check Logcat: `adb logcat \| grep Prescripto` |
| API requests fail | Verify EXPO_PUBLIC_API_URL in .env.production |
| Camera doesn't work | Grant camera permission in app settings |

---

## Continuous Builds

### GitHub Actions Example

Create `.github/workflows/build-apk.yml`:

```yaml
name: Build Android APK

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd mobile && npm install
      
      - name: Build APK
        run: |
          npm install -g eas-cli
          cd mobile && eas build --platform android --type apk
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: prescripto.apk
          path: mobile/build/
```

---

## Distribution

### Google Play Store

1. Create Google Play Developer account ($25 one-time)
2. Create app listing
3. Upload signed APK
4. Fill in store details (description, screenshots, privacy policy)
5. Submit for review

### Internal Distribution

1. Use EAS internal distribution
2. Generate share link from Expo dashboard
3. Share link with testers
4. Users can install directly from link

### APK Direct Distribution

1. Host APK on your website
2. Generate QR code
3. Share QR with users
4. Users scan QR → download & install
