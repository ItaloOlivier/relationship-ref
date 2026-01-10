# App Icon Generation Instructions

## Issue: SVG Not Supported

The `flutter_launcher_icons` package cannot process SVG files directly. You need a 1024x1024 PNG file.

## Quick Solution: Online Converter

### Option 1: CloudConvert (Recommended - Free, No Registration)
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `app_icon.svg`
3. Set output size to 1024x1024 pixels
4. Click "Convert"
5. Download the PNG file
6. Save as `apps/mobile/assets/icon/app_icon.png`
7. Run `flutter pub run flutter_launcher_icons` again

### Option 2: SVG2PNG (Free Online Tool)
1. Go to https://svgtopng.com/
2. Upload `app_icon.svg`
3. Set width and height to 1024
4. Download PNG
5. Save as `apps/mobile/assets/icon/app_icon.png`
6. Run `flutter pub run flutter_launcher_icons` again

### Option 3: Figma/Sketch/Adobe XD (If Available)
1. Open `app_icon.svg` in your design tool
2. Export as PNG at 1024x1024
3. Save as `app_icon.png`
4. Run `flutter pub run flutter_launcher_icons` again

## After Converting to PNG

Update `pubspec.yaml` to point to the PNG file:

```yaml
flutter_launcher_icons:
  android: true
  ios: true
  image_path: "assets/icon/app_icon.png"  # Changed from .svg to .png
  adaptive_icon_background: "#6366F1"
  adaptive_icon_foreground: "assets/icon/app_icon.png"  # Changed from .svg to .png
  remove_alpha_ios: true
```

Then run:
```bash
flutter pub get
flutter pub run flutter_launcher_icons
```

## Alternative: Manual Icon Generation (Advanced)

If you have ImageMagick installed:
```bash
brew install imagemagick

# Convert SVG to PNG
magick assets/icon/app_icon.svg -resize 1024x1024 assets/icon/app_icon.png

# Then run flutter_launcher_icons
flutter pub run flutter_launcher_icons
```

## Verification

After successful generation, you should see:
- iOS icons in `ios/Runner/Assets.xcassets/AppIcon.appiconset/`
- Android icons in `android/app/src/main/res/mipmap-*/`

Test by running the app:
```bash
flutter run
```

Check the app icon on:
- Home screen
- App switcher
- Settings
- Notifications

## Need Help?

If conversion fails, you can also use:
- https://www.appicon.co/ - Upload SVG, downloads complete icon sets
- https://makeappicon.com/ - Generates all sizes automatically
- https://icon.kitchen/ - Material Design icon generator
