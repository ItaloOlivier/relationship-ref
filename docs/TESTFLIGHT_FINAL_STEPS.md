# TestFlight - Final Steps Required

## Current Status ✅

- **Bundle ID**: `com.relationshipreferee.app` (configured)
- **Team ID**: `7KAPD72RT6` (configured)
- **Version**: `0.1.0+3` (ready)
- **iOS Build**: Successfully built

## Blocking Issue ⚠️

Apple requires **at least one device** to be registered in your Developer account before you can create any provisioning profiles, even for App Store distribution.

**Error message**: "Your team has no devices from which to generate a provisioning profile"

## Solution: Register a Device

You must register at least one device (iPhone, iPad, or Mac) to proceed.

### Option 1: Register Your iPhone (Recommended)

#### Step 1: Get Your iPhone's UDID

**Method A - Using Finder (macOS Catalina+):**
1. Connect your iPhone to your Mac via USB cable
2. Open **Finder**
3. Click on your **iPhone** in the sidebar
4. Click on the **text below your iPhone name** (shows model, serial number, etc.)
5. Keep clicking until you see **"UDID:"**
6. Right-click the UDID → **Copy**

**Method B - Using Xcode:**
1. Connect your iPhone via USB
2. Open Xcode
3. Go to **Window → Devices and Simulators** (or Shift+Cmd+2)
4. Select your iPhone
5. The UDID is shown under **Identifier** - click to copy

#### Step 2: Register Device in Apple Developer Portal

1. Go to [developer.apple.com/account](https://developer.apple.com/account)
2. Sign in with your Apple ID
3. Go to **Certificates, Identifiers & Profiles**
4. Click **Devices** in the left sidebar
5. Click the **+** button (or **Register a Device**)
6. Select **iOS/iPadOS**
7. Fill in:
   - **Device Name**: My iPhone (or whatever you want)
   - **Device ID (UDID)**: Paste the UDID you copied
8. Click **Continue**
9. Click **Register**

### Option 2: Let Xcode Register Your Device Automatically

1. Connect your iPhone via USB cable to your Mac
2. Open Xcode:
   ```bash
   cd /Users/user/relationship-ref-1/apps/mobile
   open ios/Runner.xcworkspace
   ```
3. Go to **Window → Devices and Simulators**
4. Select your iPhone from the list
5. If not registered, Xcode will show a button to register it
6. Click the button and follow prompts

## After Registering a Device

Once you have at least one device registered (takes ~1 minute), you can create the archive:

### Method 1: Using Xcode (Recommended)

1. **Open Xcode**:
   ```bash
   cd /Users/user/relationship-ref-1/apps/mobile
   open ios/Runner.xcworkspace
   ```

2. **Select Target Device**:
   - In the top toolbar, click the device dropdown
   - Select **"Any iOS Device (arm64)"**
   - ⚠️ Do NOT select a simulator or specific device

3. **Verify Signing**:
   - Click **Runner** in left sidebar
   - Select **Runner** target
   - Go to **Signing & Capabilities** tab
   - Ensure **"Automatically manage signing"** is checked
   - Ensure your Team (7KAPD72RT6) is selected

4. **Create Archive**:
   - Go to **Product → Archive**
   - Wait 3-5 minutes for archive to complete
   - Xcode Organizer will open automatically

5. **Upload to App Store Connect**:
   - In Organizer, select your new archive
   - Click **"Distribute App"**
   - Select **"App Store Connect"** → **Next**
   - Select **"Upload"** → **Next**
   - Accept defaults → **Upload**
   - Wait for upload to complete

### Method 2: Using Command Line

```bash
cd /Users/user/relationship-ref-1/apps/mobile/ios

# Create the archive
xcodebuild -workspace Runner.xcworkspace \
  -scheme Runner \
  -configuration Release \
  -archivePath build/Runner.xcarchive \
  -allowProvisioningUpdates \
  archive

# Export for App Store
xcodebuild -exportArchive \
  -archivePath build/Runner.xcarchive \
  -exportPath build/ \
  -exportOptionsPlist ExportOptions.plist \
  -allowProvisioningUpdates
```

The IPA will be at: `build/Runner.ipa`

Then upload using Transporter app or:

```bash
# Upload (requires app-specific password)
xcrun altool --upload-app \
  --type ios \
  --file build/Runner.ipa \
  --username YOUR_APPLE_ID_EMAIL \
  --password YOUR_APP_SPECIFIC_PASSWORD
```

## Create App in App Store Connect

**Do this BEFORE uploading the archive (recommended) or after:**

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Sign in with your Apple ID
3. Click **"My Apps"** → **"+"** → **"New App"**
4. Fill in:
   - **Platform**: iOS
   - **Name**: Relationship Referee
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: Select `com.relationshipreferee.app` from dropdown
   - **SKU**: `relationship-referee-001`
   - **User Access**: Full Access
5. Click **"Create"**

## Configure TestFlight

After the build processes (10-60 minutes):

1. Go to your app in App Store Connect
2. Click **TestFlight** tab
3. Wait for build to change from **Processing** to **Ready to Submit**
4. Click on the build number
5. Fill in **Test Information**:
   - **What to Test**: "Initial TestFlight build for internal testing"
   - **Privacy Policy URL**: Your privacy policy URL (required)
   - **Sign-In Required**: Yes/No
   - **Test Credentials** (if sign-in required): Provide demo account
6. Click **Save**

### Add Internal Testers

1. Go to **Internal Testing** section
2. Click **"+"** next to Testers
3. Add team members by email
4. They'll receive email invitations immediately

### Add External Testers (Optional - Requires Review)

1. Go to **External Testing** section
2. Create a new test group
3. Add testers by email
4. Submit for **Beta App Review** (takes 1-2 days)

## Summary Checklist

- [ ] Register at least one device in Apple Developer portal
- [ ] Open Xcode workspace
- [ ] Select "Any iOS Device (arm64)"
- [ ] Verify signing is configured
- [ ] Product → Archive
- [ ] Distribute App → App Store Connect → Upload
- [ ] Create app in App Store Connect (if not done)
- [ ] Wait for build to process
- [ ] Configure TestFlight settings
- [ ] Add testers
- [ ] Testers install TestFlight app and accept invitation

## Troubleshooting

### Still getting "no devices" error after registering?

1. Close Xcode completely
2. Delete derived data:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData/
   ```
3. Reopen Xcode
4. Try archiving again

### "Archive" option is grayed out?

Make sure you selected "Any iOS Device (arm64)" not a simulator.

### Can't find "Any iOS Device (arm64)"?

1. Close any running simulators
2. Disconnect any physical devices
3. Restart Xcode
4. It should appear in the device dropdown

## Support

- **Apple Developer Support**: [developer.apple.com/contact](https://developer.apple.com/contact)
- **TestFlight Guide**: [developer.apple.com/testflight](https://developer.apple.com/testflight)
- **Full Documentation**: See [testflight-deployment.md](testflight-deployment.md)
