# TestFlight Deployment Guide

## Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at [developer.apple.com](https://developer.apple.com)
   - Verify your account is active

2. **App Store Connect Access**
   - Create app record at [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Bundle ID must match: `com.outsourcedcto.relationshipreferee`

3. **macOS with Xcode** (Latest stable version recommended)
   ```bash
   xcode-select --install
   ```

4. **Flutter SDK** (Already installed)
   ```bash
   flutter doctor
   ```

5. **Signing Certificates**
   - Development certificate (for testing on device)
   - Distribution certificate (for TestFlight/App Store)

## Step-by-Step Deployment

### 1. Prepare the App

#### Update Version Number

Edit `apps/mobile/pubspec.yaml`:
```yaml
version: 1.0.0+1  # Format: version+buildNumber
```

- First number (`1.0.0`) = Version visible to users
- Second number (`1`) = Build number (increment for each upload)

#### Update App Display Name (if needed)

Edit `apps/mobile/ios/Runner/Info.plist`:
```xml
<key>CFBundleDisplayName</key>
<string>Relationship Referee</string>
```

### 2. Configure Signing in Xcode

```bash
cd apps/mobile
open ios/Runner.xcworkspace
```

In Xcode:
1. Select **Runner** project in navigator
2. Select **Runner** target
3. Go to **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. Select your **Team** (Development team: 7KAPD72RT6)
6. Verify Bundle Identifier: `com.outsourcedcto.relationshipreferee`

### 3. Create App Record in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: Relationship Referee
   - **Primary Language**: English
   - **Bundle ID**: `com.outsourcedcto.relationshipreferee`
   - **SKU**: `relationship-referee-001` (unique identifier)
   - **User Access**: Full Access

### 4. Build and Archive

#### Option A: Using Flutter Command (Recommended)

```bash
cd apps/mobile

# Clean previous builds
flutter clean
flutter pub get

# Build iOS app (creates .xcarchive)
flutter build ipa --release

# The .ipa file will be at: build/ios/ipa/relationship_referee.ipa
```

#### Option B: Using Xcode

```bash
cd apps/mobile
open ios/Runner.xcworkspace
```

In Xcode:
1. Select **Any iOS Device** (not simulator) in target dropdown
2. Go to **Product** → **Archive**
3. Wait for build to complete

### 5. Upload to App Store Connect

#### Option A: Using Xcode Organizer (After Archive)

1. Xcode Organizer window opens automatically
2. Select the archive
3. Click **Distribute App**
4. Select **App Store Connect**
5. Click **Upload**
6. Follow prompts and click **Upload**

#### Option B: Using Transporter App

1. Download [Transporter](https://apps.apple.com/app/transporter/id1450874784) from Mac App Store
2. Open Transporter
3. Sign in with Apple ID
4. Drag and drop `build/ios/ipa/relationship_referee.ipa`
5. Click **Deliver**

#### Option C: Using Command Line (xcrun altool - Deprecated)

**Note**: Apple is phasing out `altool`. Use Transporter instead.

```bash
# Legacy method (still works but deprecated)
xcrun altool --upload-app \
  --type ios \
  --file build/ios/ipa/relationship_referee.ipa \
  --username YOUR_APPLE_ID \
  --password YOUR_APP_SPECIFIC_PASSWORD
```

### 6. Configure TestFlight in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select **Relationship Referee** app
3. Go to **TestFlight** tab
4. Wait for build to process (10-60 minutes)
5. Build status will change from **Processing** → **Ready to Submit**

#### Add Test Information

1. Click on the build number
2. Fill in **Test Information**:
   - **What to Test**: Brief description of new features
   - **App Privacy Policy URL** (required): Your privacy policy URL
   - **Sign-In Required**: Yes/No
   - **Test Account** (if sign-in required): Provide demo credentials
3. Click **Save**

#### Add Internal Testers

1. Go to **Internal Testing** section
2. Click **+** next to **Testers**
3. Add team members by email
4. They'll receive an email invitation

#### Add External Testers (Requires Beta App Review)

1. Go to **External Testing** section
2. Click **+** to create a new group
3. Add testers by email
4. Click **Submit for Review**
5. Apple reviews external builds (1-2 days)

### 7. Testers Install the App

Testers receive an email with:
1. Link to install **TestFlight** app from App Store
2. Invitation code
3. Instructions

## Common Issues and Solutions

### Issue: "No valid code signing certificates found"

**Solution**:
1. Open Xcode
2. Go to **Xcode** → **Settings** → **Accounts**
3. Click **Manage Certificates**
4. Click **+** → **Apple Distribution**

### Issue: "Unable to find bundle identifier"

**Solution**:
1. Verify bundle ID in App Store Connect matches Xcode
2. Check `apps/mobile/ios/Runner.xcodeproj/project.pbxproj` for `PRODUCT_BUNDLE_IDENTIFIER`

### Issue: "Missing compliance documentation"

**Solution**:
After upload, answer export compliance questions in App Store Connect:
1. Does your app use encryption? → Usually **No** (unless you added custom encryption)
2. App Store Connect → App → Build → Export Compliance

### Issue: "Missing required icon sizes"

**Solution**:
Regenerate app icons:
```bash
cd apps/mobile
flutter pub run flutter_launcher_icons
```

### Issue: Build stuck in "Processing"

**Solution**:
- Wait up to 60 minutes
- Check email for any rejection notices
- Verify provisioning profile is valid

## Automated Deployment Script

Save this as `scripts/deploy-ios.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting iOS TestFlight deployment..."

# Navigate to mobile app
cd "$(dirname "$0")/../apps/mobile"

# 1. Clean and get dependencies
echo "📦 Cleaning and getting dependencies..."
flutter clean
flutter pub get

# 2. Increment build number automatically
echo "📝 Incrementing build number..."
BUILD_NUMBER=$(grep -E "^version:" pubspec.yaml | sed 's/.*+//')
NEW_BUILD=$((BUILD_NUMBER + 1))
sed -i '' "s/version: \(.*\)+${BUILD_NUMBER}/version: \1+${NEW_BUILD}/" pubspec.yaml
echo "✅ Build number: ${BUILD_NUMBER} → ${NEW_BUILD}"

# 3. Build IPA
echo "🔨 Building release IPA..."
flutter build ipa --release

# 4. Display results
echo "✅ Build complete!"
echo ""
echo "📦 IPA Location: build/ios/ipa/relationship_referee.ipa"
echo ""
echo "📤 Next steps:"
echo "  1. Open Transporter app"
echo "  2. Drag and drop the .ipa file above"
echo "  3. Click 'Deliver'"
echo ""
echo "🔗 Or open App Store Connect: https://appstoreconnect.apple.com"
```

Make it executable:
```bash
chmod +x scripts/deploy-ios.sh
```

Run it:
```bash
./scripts/deploy-ios.sh
```

## Version Management

### For Each New Build

1. **Bug fixes only** (patch):
   ```yaml
   version: 1.0.0+1 → 1.0.1+2
   ```

2. **Minor features** (minor):
   ```yaml
   version: 1.0.0+1 → 1.1.0+2
   ```

3. **Major update** (major):
   ```yaml
   version: 1.0.0+1 → 2.0.0+2
   ```

**Always increment the build number** (+1, +2, +3, etc.) even if version stays same.

## Release to App Store (After TestFlight)

Once testing is complete:

1. Go to **App Store** tab in App Store Connect
2. Click **+** next to **iOS App**
3. Select the TestFlight build
4. Fill in:
   - App name, subtitle, description
   - Screenshots (required: 6.5" iPhone, 12.9" iPad)
   - App icon (1024x1024 PNG)
   - Keywords, support URL, marketing URL
   - Age rating, privacy policy
5. Click **Submit for Review**
6. Wait 1-3 days for Apple review

## Testing Checklist

Before each TestFlight upload:

- [ ] All Flutter tests passing (`flutter test`)
- [ ] App runs without crashes on physical device
- [ ] API integration works with production backend
- [ ] Login/registration flows work
- [ ] Audio recording permissions granted
- [ ] Deep links working (if implemented)
- [ ] App icon displays correctly
- [ ] Version number updated in pubspec.yaml
- [ ] Build number incremented
- [ ] Privacy policy URL added to App Store Connect

## Resources

- [Flutter iOS Deployment Guide](https://docs.flutter.dev/deployment/ios)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [TestFlight Best Practices](https://developer.apple.com/testflight/)
- [Apple Developer Support](https://developer.apple.com/support/)

## Costs

- **Apple Developer Program**: $99/year
- **TestFlight**: Free (included)
- **App Store**: Free to submit (30% commission on paid apps/subscriptions)
