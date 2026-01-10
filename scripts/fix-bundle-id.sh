#!/bin/bash

echo "🔧 Bundle ID Setup Helper"
echo ""
echo "Current Bundle ID: com.outsourcedcto.relationshipreferee"
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

# Backup original
cp Runner.xcodeproj/project.pbxproj Runner.xcodeproj/project.pbxproj.backup

# Replace Bundle ID in project file
sed -i '' "s/PRODUCT_BUNDLE_IDENTIFIER = com.outsourcedcto.relationshipreferee;/PRODUCT_BUNDLE_IDENTIFIER = $BUNDLE_ID;/g" Runner.xcodeproj/project.pbxproj

echo "✅ Updated Runner.xcodeproj"
echo "✅ Backup saved: Runner.xcodeproj/project.pbxproj.backup"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open Xcode:"
echo "   cd apps/mobile"
echo "   open ios/Runner.xcworkspace"
echo ""
echo "2. In Xcode:"
echo "   - Select Runner project → Runner target"
echo "   - Go to 'Signing & Capabilities' tab"
echo "   - Verify Bundle ID shows: $BUNDLE_ID"
echo "   - Enable 'Automatically manage signing'"
echo "   - Select your Team from dropdown"
echo ""
echo "3. Create App in App Store Connect:"
echo "   - Go to: https://appstoreconnect.apple.com"
echo "   - My Apps → + → New App"
echo "   - Use Bundle ID: $BUNDLE_ID"
echo ""
echo "4. Build for TestFlight:"
echo "   cd apps/mobile"
echo "   flutter build ipa --release"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
