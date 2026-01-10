# iOS Code Signing Setup

## Current Issue

The bundle identifier `com.outsourcedcto.relationshipreferee` cannot be registered automatically. This happens when:

1. **Bundle ID already exists** in another Apple Developer account
2. **Team ID mismatch** - You're signed in with a different Apple ID
3. **Provisioning profile** needs manual creation

## Solution Options

### Option 1: Use Your Own Bundle Identifier (Recommended)

Change the bundle ID to something unique to you:

1. **Choose a new bundle ID**:
   ```
   Format: com.YOURCOMPANY.relationshipreferee
   Example: com.yourname.relationshipreferee
   ```

2. **Update in Xcode**:
   ```bash
   cd apps/mobile
   open ios/Runner.xcworkspace
   ```

   - Select **Runner** project
   - Select **Runner** target
   - Go to **Signing & Capabilities**
   - Change **Bundle Identifier** to your new ID
   - Verify **Team** is selected (should auto-fill)

3. **Verify automatic signing**:
   - Check **Automatically manage signing**
   - Xcode will create provisioning profiles automatically

### Option 2: Register Bundle ID Manually in Apple Developer Portal

If you own the Apple Developer account for team `7KAPD72RT6`:

1. Go to [developer.apple.com/account](https://developer.apple.com/account)
2. Sign in with your Apple ID
3. Go to **Certificates, Identifiers & Profiles**
4. Click **Identifiers** → **+** (Add)
5. Select **App IDs** → **Continue**
6. Configure:
   - **Description**: Relationship Referee
   - **Bundle ID**: Explicit → `com.outsourcedcto.relationshipreferee`
   - **Capabilities**: Enable required capabilities:
     - [ ] Push Notifications (if needed)
     - [ ] App Groups (if needed)
     - [ ] Associated Domains (for deep linking)
7. Click **Continue** → **Register**

Then retry the build.

### Option 3: Use Personal Team for Development

For testing without paid Apple Developer account:

1. Open Xcode: `open apps/mobile/ios/Runner.xcworkspace`
2. Select **Runner** project → **Runner** target
3. **Signing & Capabilities**:
   - Uncheck **Automatically manage signing**
   - Select **Team**: Your Personal Team (your name)
   - Change **Bundle Identifier** to include your Apple ID:
     ```
     com.YOURAPPLEID.relationshipreferee
     Example: com.johnsmith.relationshipreferee
     ```
   - Check **Automatically manage signing** again

**Note**: Personal Team can only deploy to your own devices, not TestFlight.

## Recommended Steps (Fresh Start)

### Step 1: Verify Apple Developer Account

```bash
# Check which Apple ID is signed in
open -a Xcode
# Xcode → Settings → Accounts
```

Make sure you're signed in with the correct Apple ID that has:
- Active Apple Developer Program membership ($99/year)
- Team ID: `7KAPD72RT6` (or your team)

### Step 2: Choose Your Bundle Identifier

Pick one of these formats:
- `com.yourcompany.relationshipreferee`
- `com.yourdomain.relationshipreferee`
- `app.relationshipreferee.ios` (if you own relationshipreferee.app)

### Step 3: Update Bundle ID in Xcode

```bash
cd apps/mobile
open ios/Runner.xcworkspace
```

1. Select **Runner** project in sidebar
2. Select **Runner** target
3. **General** tab:
   - **Bundle Identifier**: Change to your chosen ID
4. **Signing & Capabilities** tab:
   - Enable **Automatically manage signing**
   - Select your **Team**
   - Xcode will create provisioning profiles

### Step 4: Update Bundle ID in App Store Connect

When creating your app:
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **My Apps** → **+** → **New App**
3. Use the **same Bundle ID** you chose in Xcode

### Step 5: Rebuild

```bash
cd apps/mobile
flutter clean
flutter pub get
flutter build ipa --release
```

## Quick Fix Script

Save as `scripts/fix-bundle-id.sh`:

```bash
#!/bin/bash

echo "🔧 Bundle ID Setup Helper"
echo ""
read -p "Enter your new Bundle ID (e.g., com.yourcompany.relationshipreferee): " BUNDLE_ID

if [ -z "$BUNDLE_ID" ]; then
    echo "❌ Bundle ID cannot be empty"
    exit 1
fi

echo ""
echo "📝 Updating Bundle ID to: $BUNDLE_ID"
echo ""

# Update Xcode project
cd "$(dirname "$0")/../apps/mobile/ios"
sed -i '' "s/PRODUCT_BUNDLE_IDENTIFIER = .*/PRODUCT_BUNDLE_IDENTIFIER = $BUNDLE_ID;/g" Runner.xcodeproj/project.pbxproj

echo "✅ Updated Runner.xcodeproj"
echo ""
echo "📋 Next steps:"
echo "1. Open Xcode: open ios/Runner.xcworkspace"
echo "2. Verify Bundle ID: $BUNDLE_ID"
echo "3. Verify Team is selected in Signing & Capabilities"
echo "4. Run: flutter build ipa --release"
```

## Alternative: Build for Specific Device (Development)

If you just want to test on your iPhone (not TestFlight):

```bash
# Connect your iPhone via USB

# 1. Trust computer on iPhone (popup will appear)

# 2. Run on device
cd apps/mobile
flutter run --release
```

This bypasses TestFlight but requires:
- iPhone connected via USB
- Device registered in Apple Developer account
- Development provisioning profile (auto-created by Xcode)

## Common Errors

### "The app identifier ... cannot be registered"

**Cause**: Bundle ID taken or team mismatch

**Fix**: Choose a different Bundle ID

### "No signing certificate found"

**Cause**: Missing distribution certificate

**Fix**:
1. Xcode → Settings → Accounts
2. Select your team
3. **Manage Certificates** → **+** → **Apple Distribution**

### "Provisioning profile doesn't match"

**Cause**: Bundle ID mismatch between Xcode and provisioning profile

**Fix**: Delete derived data
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/
```

Then rebuild in Xcode.

## Verification Checklist

Before building for TestFlight:

- [ ] Apple Developer Program active ($99/year paid)
- [ ] Correct Apple ID signed in to Xcode
- [ ] Bundle ID registered (or auto-registerable by your team)
- [ ] Bundle ID matches between:
  - [ ] Xcode project
  - [ ] App Store Connect app record
  - [ ] Provisioning profiles
- [ ] Distribution certificate exists
- [ ] Team selected in Xcode Signing & Capabilities
- [ ] "Automatically manage signing" enabled

## Need Help?

If still stuck:

1. **Check Team Access**:
   - developer.apple.com/account → Membership
   - Verify role (Admin, App Manager, or Developer)

2. **Contact Apple Developer Support**:
   - developer.apple.com/contact
   - Phone: Available in your region

3. **Flutter iOS Deployment Docs**:
   - docs.flutter.dev/deployment/ios
