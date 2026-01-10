#!/bin/bash
set -e

echo "🚀 Starting iOS TestFlight deployment..."
echo ""

# Navigate to mobile app
cd "$(dirname "$0")/../apps/mobile"

# Check Flutter installation
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter not found. Please install Flutter first."
    exit 1
fi

echo "📋 Current configuration:"
CURRENT_VERSION=$(grep -E "^version:" pubspec.yaml | sed 's/version: //')
echo "  Version: $CURRENT_VERSION"
echo "  Bundle ID: com.relationshipreferee.app"
echo "  Team ID: 7KAPD72RT6"
echo ""

# 1. Clean and get dependencies
echo "📦 Cleaning and getting dependencies..."
flutter clean
flutter pub get
echo "✅ Dependencies ready"
echo ""

# 2. Increment build number automatically
echo "📝 Incrementing build number..."
BUILD_NUMBER=$(grep -E "^version:" pubspec.yaml | sed 's/.*+//')
NEW_BUILD=$((BUILD_NUMBER + 1))
sed -i '' "s/version: \(.*\)+${BUILD_NUMBER}/version: \1+${NEW_BUILD}/" pubspec.yaml
NEW_VERSION=$(grep -E "^version:" pubspec.yaml | sed 's/version: //')
echo "✅ Version updated: $CURRENT_VERSION → $NEW_VERSION"
echo ""

# 3. Run tests (optional - comment out if you want to skip)
# echo "🧪 Running tests..."
# flutter test
# echo "✅ Tests passed"
# echo ""

# 4. Build iOS framework and archive
echo "🔨 Building iOS release..."
echo "   This may take 5-10 minutes..."
echo ""
echo "⚠️  IMPORTANT: You need to complete the build in Xcode"
echo "   Flutter CLI cannot create App Store archives without a registered device."
echo ""

# Build the iOS app (creates framework)
flutter build ios --release --no-codesign

echo ""
echo "✅ iOS framework built successfully"

# 5. Display results
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ BUILD READY FOR XCODE ARCHIVE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Build Info:"
echo "   Version: $NEW_VERSION"
echo "   Bundle ID: com.relationshipreferee.app"
echo "   Team ID: 7KAPD72RT6"
echo ""
echo "📤 NEXT STEPS (Complete in Xcode):"
echo ""
echo "1️⃣  Open Xcode workspace:"
echo "   cd $(pwd)"
echo "   open ios/Runner.xcworkspace"
echo ""
echo "2️⃣  In Xcode:"
echo "   • Select 'Any iOS Device (arm64)' from device dropdown (NOT simulator)"
echo "   • Go to Product → Archive"
echo "   • Wait for archive to complete (3-5 minutes)"
echo ""
echo "3️⃣  In Xcode Organizer (opens automatically):"
echo "   • Select the new archive"
echo "   • Click 'Distribute App'"
echo "   • Select 'App Store Connect'"
echo "   • Click 'Upload'"
echo "   • Follow prompts and upload"
echo ""
echo "4️⃣  Create App in App Store Connect:"
echo "   • Go to: https://appstoreconnect.apple.com"
echo "   • My Apps → + → New App"
echo "   • Bundle ID: com.relationshipreferee.app"
echo "   • Complete app details and submit for TestFlight"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 TIP: If you haven't created the app in App Store Connect yet,"
echo "   do that FIRST before uploading the archive."
echo ""
echo "📚 Full Guide: See docs/testflight-deployment.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
