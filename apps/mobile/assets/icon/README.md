# Relationship Referee App Icon

## Design Concept

The app icon features **stacked cards** (green, yellow, red) representing the relationship referee metaphor, with a **whistle icon** symbolizing coaching and guidance.

### Visual Elements:

1. **Gradient Background**: Primary brand colors (#6366F1 → #8B92FF)
2. **Three Stacked Cards**:
   - **Green Card** (front, rotated +8°): Positive behaviors (#22C55E)
   - **Yellow Card** (middle, straight): Caution behaviors (#FACC15)
   - **Red Card** (back, rotated -8°): Concerning behaviors (#EF4444)
3. **Whistle Icon**: White whistle on green card with sound waves
4. **Subtle Heart**: Background element (15% opacity) representing relationships

### Design Rationale:

- **Instantly Recognizable**: Cards are unique in app stores
- **Domain-Specific**: Referee metaphor is core to brand
- **Color Psychology**: Traffic light colors (universal understanding)
- **Professional**: Clean, modern, not childish
- **Scalable**: Works at all sizes (from 20x20 to 1024x1024)
- **OLED Friendly**: Vibrant colors on dark backgrounds

---

## Icon Sizes Required

### iOS (App Icon)
- 1024x1024 (App Store)
- 180x180 (iPhone 3x)
- 120x120 (iPhone 2x)
- 87x87 (iPad Pro)
- 80x80 (iPad, iPad mini 2x)
- 76x76 (iPad, iPad mini)
- 60x60 (iPhone)
- 58x58 (iPhone 2x)
- 40x40 (Spotlight 2x)
- 29x29 (Settings)
- 20x20 (Notification)

### Android (Launcher Icon)
- 192x192 (xxxhdpi)
- 144x144 (xxhdpi)
- 96x96 (xhdpi)
- 72x72 (hdpi)
- 48x48 (mdpi)

### Android Adaptive Icon (API 26+)
- **Foreground**: 432x432 (108dp safe zone, 72dp icon area)
- **Background**: 432x432 (solid color or simple gradient)

---

## Generation Instructions

### Option 1: Using flutter_launcher_icons package (Recommended)

**1. Add to `pubspec.yaml`:**
```yaml
dev_dependencies:
  flutter_launcher_icons: ^0.13.1

flutter_launcher_icons:
  android: true
  ios: true
  image_path: "assets/icon/app_icon_1024.png"
  adaptive_icon_background: "#6366F1"
  adaptive_icon_foreground: "assets/icon/app_icon_foreground.png"
```

**2. Generate icons:**
```bash
flutter pub get
flutter pub run flutter_launcher_icons
```

### Option 2: Using imagemagick (Manual)

**Convert SVG to PNG sizes:**
```bash
# Install imagemagick
brew install imagemagick

# iOS sizes
magick assets/icon/app_icon.svg -resize 1024x1024 ios/Runner/Assets.xcassets/AppIcon.appiconset/icon-1024.png
magick assets/icon/app_icon.svg -resize 180x180 ios/Runner/Assets.xcassets/AppIcon.appiconset/icon-180.png
# ... repeat for all sizes

# Android sizes
magick assets/icon/app_icon.svg -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
magick assets/icon/app_icon.svg -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
# ... repeat for all sizes
```

### Option 3: Online Tool

1. Go to https://www.appicon.co/
2. Upload `app_icon.svg` or `app_icon_1024.png`
3. Download iOS and Android icon sets
4. Extract to respective directories

---

## Current Status

- ✅ SVG design created (`app_icon.svg`)
- ⏳ PNG generation pending
- ⏳ iOS integration pending
- ⏳ Android integration pending

**Next Steps:**
1. Convert SVG to 1024x1024 PNG (master file)
2. Use flutter_launcher_icons to generate all sizes
3. Test on iOS simulator and Android emulator
4. Verify icon appearance in various contexts (home screen, settings, notifications)

---

## Design Files

- **Source**: `app_icon.svg` (1024x1024, vector)
- **Master PNG**: `app_icon_1024.png` (to be generated)
- **Foreground** (Adaptive): Cards + whistle only (transparent background)
- **Background** (Adaptive): Solid #6366F1 or gradient

---

## Brand Guidelines

**Colors Used:**
- Primary: #6366F1 (light mode), #8B92FF (dark mode)
- Green Card: #22C55E
- Yellow Card: #FACC15
- Red Card: #EF4444
- Whistle: #FFFFFF (white)

**Do Not:**
- Change card colors (brand identity)
- Remove whistle icon (key metaphor)
- Use complex gradients on cards (reduces scalability)
- Add text to icon (illegible at small sizes)

**Variations Allowed:**
- Adjust rotation angles slightly for visual balance
- Adjust shadow intensity for different backgrounds
- Create seasonal variants (e.g., holiday themes) as alternate icons
