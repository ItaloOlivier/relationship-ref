# TestFlight Quick Start

## Current Configuration

- **Bundle ID**: `com.relationshipreferee.app`
- **Team ID**: `7KAPD72RT6`
- **Version**: `0.1.0+3`

## Steps to Upload to TestFlight

### 1. Prepare the Build

```bash
cd /Users/user/relationship-ref-1
./scripts/deploy-ios.sh
```

This will:
- Clean the project
- Update dependencies
- Increment build number
- Build the iOS framework

### 2. Create Archive in Xcode

```bash
cd apps/mobile
open ios/Runner.xcworkspace
```

In Xcode:
1. **Select device**: Choose "Any iOS Device (arm64)" from the device dropdown
   - ⚠️ Do NOT select a simulator or specific device
2. **Create archive**: Product → Archive
3. Wait 3-5 minutes for the archive to complete

### 3. Upload to App Store Connect

When the Organizer window opens:
1. Select your new archive
2. Click **Distribute App**
3. Choose **App Store Connect**
4. Click **Upload**
5. Follow the prompts (accept defaults)
6. Wait for upload to complete

### 4. Create App in App Store Connect (First Time Only)

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Sign in with your Apple ID
3. Click **My Apps** → **+** → **New App**
4. Fill in:
   - **Platform**: iOS
   - **Name**: Relationship Referee
   - **Primary Language**: English
   - **Bundle ID**: `com.relationshipreferee.app`
   - **SKU**: `relationship-referee-001`
5. Click **Create**

### 5. Configure TestFlight

Once the build is uploaded (takes 10-60 minutes to process):

1. Go to your app in App Store Connect
2. Click **TestFlight** tab
3. Wait for build status: Processing → Ready to Submit
4. Click on the build number
5. Fill in **Test Information**:
   - What to Test: Brief description
   - Privacy Policy URL: Your privacy policy
   - Test Account: Demo credentials if needed
6. Click **Save**

### 6. Add Testers

**Internal Testers** (instant access):
1. TestFlight → Internal Testing
2. Click **+** next to Testers
3. Add team members by email

**External Testers** (requires review):
1. TestFlight → External Testing
2. Create a new group
3. Add testers
4. Submit for Beta App Review (1-2 days)

### 7. Testers Install

Testers will receive an email with:
- Link to install TestFlight app
- Invitation to join
- Instructions

## Troubleshooting

### "No signing certificate found"

1. Xcode → Settings → Accounts
2. Select your team
3. Manage Certificates → + → Apple Distribution

### "No provisioning profile found"

1. In Xcode, select Runner target
2. Signing & Capabilities tab
3. Enable "Automatically manage signing"
4. Select your Team

### "Archive option is grayed out"

Make sure you selected "Any iOS Device (arm64)" not a simulator.

### Build stuck in "Processing"

Wait up to 60 minutes. Check email for rejection notices.

## For Next Build

Just run:
```bash
./scripts/deploy-ios.sh
```

Then repeat steps 2-3 (Archive in Xcode → Upload).

## Important Files

- Build script: `scripts/deploy-ios.sh`
- Full guide: `docs/testflight-deployment.md`
- Signing help: `docs/ios-signing-setup.md`

## Bundle ID Change History

- Original: `com.outsourcedcto.relationshipreferee` (unavailable)
- Current: `com.relationshipreferee.app` (active)
