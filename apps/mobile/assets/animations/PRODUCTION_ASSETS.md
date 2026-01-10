# Production Lottie Animations - Download Guide

This document provides specific recommendations for replacing placeholder animation files with production-quality Lottie animations from LottieFiles.

---

## Required Animations

### 1. confetti.json - Quest Completion
**Duration:** 2 seconds (120 frames @ 60fps)
**Trigger:** When user completes a quest
**Message:** "Quest Complete! 🎉\n+[points] points"

**Recommended Downloads:**
- **Option 1 (Free)**: [Confetti Celebration](https://lottiefiles.com/animations/confetti-zPJhLF8DMK)
  - ID: zPJhLF8DMK
  - Perfect for quest completion
  - Colorful, joyful, energetic

- **Option 2 (Free)**: [Success Confetti](https://lottiefiles.com/animations/success-confetti-sNxeJ6WfRN)
  - ID: sNxeJ6WfRN
  - Clean, professional
  - Brand-color customizable

**Download Instructions:**
1. Go to https://lottiefiles.com/animations/confetti-zPJhLF8DMK
2. Click "Download" → Select "Lottie JSON"
3. Save as `confetti.json` in `assets/animations/`
4. Verify duration is ~2 seconds

---

### 2. fire_burst.json - 7-Day Streak
**Duration:** 3 seconds (180 frames @ 60fps)
**Trigger:** When user reaches 7-day streak
**Message:** "7-Day Streak! 🔥\nYou're on fire!"

**Recommended Downloads:**
- **Option 1 (Free)**: [Fire Burst Effect](https://lottiefiles.com/animations/fire-FwGmOdxqLT)
  - ID: FwGmOdxqLT
  - Dynamic fire burst animation
  - Perfect for streak milestones

- **Option 2 (Free)**: [Flame Animation](https://lottiefiles.com/animations/flame-kKJvzOtRui)
  - ID: kKJvzOtRui
  - Smooth flame effect
  - Orange/yellow colors

**Download Instructions:**
1. Go to https://lottiefiles.com/animations/fire-FwGmOdxqLT
2. Click "Download" → Select "Lottie JSON"
3. Save as `fire_burst.json` in `assets/animations/`

---

### 3. trophy.json - 30-Day Streak
**Duration:** 3 seconds (180 frames @ 60fps)
**Trigger:** When user reaches 30-day streak
**Message:** "30-Day Streak! 🏆\nIncredible dedication!"

**Recommended Downloads:**
- **Option 1 (Free)**: [Trophy Winner](https://lottiefiles.com/animations/trophy-winner-tXRkXLWzNh)
  - ID: tXRkXLWzNh
  - Gold trophy with sparkles
  - Professional, celebratory

- **Option 2 (Free)**: [Achievement Trophy](https://lottiefiles.com/animations/trophy-eWKWFKPuPB)
  - ID: eWKWFKPuPB
  - Rising trophy animation
  - Elegant, premium feel

**Download Instructions:**
1. Go to https://lottiefiles.com/animations/trophy-winner-tXRkXLWzNh
2. Click "Download" → Select "Lottie JSON"
3. Save as `trophy.json` in `assets/animations/`

---

### 4. crown_fireworks.json - 100-Day Streak
**Duration:** 5 seconds (300 frames @ 60fps)
**Trigger:** When user reaches 100-day streak (legendary)
**Message:** "100-Day Streak! 👑\nYou're a legend!"

**Recommended Downloads:**
- **Option 1 (Free)**: [Crown with Sparkles](https://lottiefiles.com/animations/crown-TFkxFPYJcn)
  - ID: TFkxFPYJcn
  - Gold crown with particle effects
  - Royal, premium

- **Option 2 (Free)**: [Fireworks Celebration](https://lottiefiles.com/animations/fireworks-oVIJb6xRAv)
  - ID: oVIJb6xRAv
  - Epic fireworks display
  - Perfect for legendary milestone

**Alternative:** Combine two animations (crown + fireworks) in overlay

**Download Instructions:**
1. Go to https://lottiefiles.com/animations/crown-TFkxFPYJcn
2. Click "Download" → Select "Lottie JSON"
3. Save as `crown_fireworks.json` in `assets/animations/`

---

### 5. checkmark_pulse.json - Session Completed
**Duration:** 1.5 seconds (90 frames @ 60fps)
**Trigger:** When user completes a session
**Message:** "Session Complete!"

**Recommended Downloads:**
- **Option 1 (Free)**: [Success Checkmark](https://lottiefiles.com/animations/success-checkmark-kEvJ6NxPXR)
  - ID: kEvJ6NxPXR
  - Clean checkmark with pulse
  - Professional, satisfying

- **Option 2 (Free)**: [Animated Checkmark](https://lottiefiles.com/animations/checkmark-WGgTYEDgNk)
  - ID: WGgTYEDgNk
  - Drawing checkmark animation
  - Smooth, modern

**Download Instructions:**
1. Go to https://lottiefiles.com/animations/success-checkmark-kEvJ6NxPXR
2. Click "Download" → Select "Lottie JSON"
3. Save as `checkmark_pulse.json` in `assets/animations/`

---

### 6. thumbs_up_stars.json - High Score (80+)
**Duration:** 2 seconds (120 frames @ 60fps)
**Trigger:** When user views report with score ≥80
**Message:** "Amazing Score! 🌟\nYou scored [score]/100"

**Recommended Downloads:**
- **Option 1 (Free)**: [Thumbs Up with Stars](https://lottiefiles.com/animations/thumbs-up-mCPkNiCJTN)
  - ID: mCPkNiCJTN
  - Thumbs up with particle effects
  - Positive, encouraging

- **Option 2 (Free)**: [Star Rating](https://lottiefiles.com/animations/stars-rating-RoPQcFgaRm)
  - ID: RoPQcFgaRm
  - Stars appearing animation
  - Clean, professional

**Download Instructions:**
1. Go to https://lottiefiles.com/animations/thumbs-up-mCPkNiCJTN
2. Click "Download" → Select "Lottie JSON"
3. Save as `thumbs_up_stars.json` in `assets/animations/`

---

## Batch Download Script

Save this as `download_animations.sh` and run it:

```bash
#!/bin/bash

# Lottie animation IDs (update these with final choices)
CONFETTI_ID="zPJhLF8DMK"
FIRE_ID="FwGmOdxqLT"
TROPHY_ID="tXRkXLWzNh"
CROWN_ID="TFkxFPYJcn"
CHECKMARK_ID="kEvJ6NxPXR"
THUMBS_ID="mCPkNiCJTN"

# Download URLs (requires LottieFiles API key or manual download)
echo "Please download the following animations manually:"
echo "1. https://lottiefiles.com/animations/$CONFETTI_ID → confetti.json"
echo "2. https://lottiefiles.com/animations/$FIRE_ID → fire_burst.json"
echo "3. https://lottiefiles.com/animations/$TROPHY_ID → trophy.json"
echo "4. https://lottiefiles.com/animations/$CROWN_ID → crown_fireworks.json"
echo "5. https://lottiefiles.com/animations/$CHECKMARK_ID → checkmark_pulse.json"
echo "6. https://lottiefiles.com/animations/$THUMBS_ID → thumbs_up_stars.json"
```

---

## Color Customization

Many Lottie files allow color customization. Use the **Lottie Editor** to match brand colors:

**Brand Colors to Use:**
- Primary: `#6366F1` (light), `#8B92FF` (dark)
- Green: `#22C55E`
- Yellow: `#FACC15`
- Red: `#EF4444`
- White: `#FFFFFF`

**Lottie Editor:** https://lottiefiles.com/editor

**Steps:**
1. Upload downloaded JSON file
2. Select color layers
3. Change to brand colors
4. Export → Download updated JSON

---

## Quality Checklist

Before replacing placeholders, verify each animation:

- [ ] **Duration**: Matches specified duration (1.5s - 5s)
- [ ] **Frame Rate**: 60fps for smooth playback
- [ ] **File Size**: <100KB per file (preferably <50KB)
- [ ] **Colors**: Match or complement brand colors
- [ ] **Visibility**: Works on both light and dark backgrounds
- [ ] **Loop**: Set to `repeat: false` (play once)
- [ ] **No Sound**: Lottie animations are visual only
- [ ] **License**: Free or properly licensed for commercial use

---

## Testing

After replacing files:

```bash
cd apps/mobile
flutter pub get
flutter run
```

**Test Each Animation:**
1. **Quest Completion**: Complete a quest in gamification screen
2. **7-Day Streak**: Mock streak data to 7 days
3. **30-Day Streak**: Mock streak data to 30 days
4. **100-Day Streak**: Mock streak data to 100 days
5. **Session Complete**: Complete a session
6. **High Score**: View report with score ≥80

**Verify:**
- Animation plays smoothly (60fps)
- Duration feels appropriate
- Colors are visible on both light/dark themes
- Animation auto-dismisses
- No performance issues on mid-range devices

---

## Alternative Sources

If LottieFiles doesn't have suitable options:

1. **Lordicon** (https://lordicon.com/) - Premium animated icons ($)
2. **IconScout** (https://iconscout.com/lottie-animations) - Curated Lottie library
3. **UI8** (https://ui8.net/category/lottie-animations) - Premium marketplace ($)
4. **Custom Creation**:
   - Hire motion designer on Fiverr/Upwork ($50-$200 per animation)
   - Use Adobe After Effects + Bodymovin plugin (requires design skills)
   - Lottie Creator web tool (https://lottiefiles.com/creator)

---

## Current Status

- ⏳ Placeholder files active (minimal visual content)
- ⏳ Production files pending download
- ⏳ Color customization pending
- ⏳ Testing pending

**Priority:** MEDIUM - App is functional with placeholders, but production animations will significantly enhance user experience

---

**Last Updated:** 2026-01-10
**Maintained By:** Design Team
