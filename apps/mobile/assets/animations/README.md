# Celebration Animations - Production Assets

This directory contains production-quality Lottie animations used throughout the Relationship Referee app for celebration moments and user feedback.

---

## Animation Files

### 1. confetti.json (112KB)
**Usage:** Quest completion celebration
**Trigger:** When user completes a quest in gamification screen
**Duration:** ~2 seconds (60fps)
**Message:** "Quest Complete! 🎉\n+[points] points"
**Style:** Colorful confetti burst with vibrant colors (blues, purples, greens)

---

### 2. fire_burst.json (4.8KB)
**Usage:** 7-day streak milestone
**Trigger:** When user reaches 7-day consecutive login streak
**Duration:** 3 seconds (180 frames @ 60fps)
**Message:** "7-Day Streak! 🔥\nYou're on fire!"
**Style:** Animated fire burst with orange/yellow gradient flame and particle effects

---

### 3. trophy.json (64KB)
**Usage:** 30-day streak milestone
**Trigger:** When user reaches 30-day consecutive login streak
**Duration:** 3 seconds (60fps)
**Message:** "30-Day Streak! 🏆\nIncredible dedication!"
**Style:** Gold trophy animation with celebratory feel

---

### 4. crown_fireworks.json (6.1KB)
**Usage:** 100-day streak (legendary achievement)
**Trigger:** When user reaches 100-day consecutive login streak
**Duration:** 5 seconds (300 frames @ 60fps)
**Message:** "100-Day Streak! 👑\nYou're a legend!"
**Style:** Gold crown with sparkles and fireworks bursts
**Design:** Crown appears with gentle rotation, followed by sparkles and dual-colored fireworks (pink and blue)

---

### 5. checkmark_pulse.json (2.0KB)
**Usage:** Session completed
**Trigger:** When user completes a communication session
**Duration:** 1.5 seconds (90 frames @ 60fps)
**Message:** "Session Complete!"
**Style:** Green checkmark (#22C55E) with circular pulse animation
**Design:** Clean, satisfying completion feedback

---

### 6. thumbs_up_stars.json (5.5KB)
**Usage:** High score on report (80+)
**Trigger:** When user views match report with score ≥80
**Duration:** 2 seconds (120 frames @ 60fps)
**Message:** "Amazing Score! 🌟\nYou scored [score]/100"
**Style:** Blue thumbs up with yellow stars bursting outward
**Design:** Encouraging positive feedback with 3 animated stars

---

## Implementation

These animations are integrated via the `CelebrationService` in:
```dart
lib/core/ui/celebration_animations.dart
```

### Usage Example:
```dart
CelebrationService.celebrate(
  context,
  CelebrationType.questCompleted,
  message: 'Quest Complete! 🎉\n+50 points',
);
```

### Available Celebration Types:
- `CelebrationType.questCompleted` → confetti.json
- `CelebrationType.streak7Days` → fire_burst.json
- `CelebrationType.streak30Days` → trophy.json
- `CelebrationType.streak100Days` → crown_fireworks.json
- `CelebrationType.sessionComplete` → checkmark_pulse.json
- `CelebrationType.highScore` → thumbs_up_stars.json

---

## Technical Specifications

### Performance
- All animations optimized for mobile (largest: 112KB)
- Most animations <10KB for fast loading
- 60fps for smooth playback across devices
- No external dependencies or image assets

### Compatibility
- Lottie JSON format (v5.7.x)
- Compatible with `lottie` Flutter package
- Works on both iOS and Android
- Supports light and dark themes

### Quality Checklist
- ✅ **Duration:** All within 1.5s - 5s range
- ✅ **Frame Rate:** 60fps for smooth playback
- ✅ **File Size:** All <150KB (most <10KB)
- ✅ **Colors:** Coordinated with brand palette
- ✅ **Visibility:** Works on light and dark backgrounds
- ✅ **Loop:** Set to play once (no repeat)
- ✅ **License:** Free for commercial use

---

## Brand Color Integration

Animations use colors from the app's design system:
- **Primary:** #6366F1 (light), #8B92FF (dark)
- **Success Green:** #22C55E (checkmark)
- **Warning Yellow:** #FACC15 (stars)
- **Fire Orange:** #FF6B35, #FACC15 (fire burst)
- **Trophy Gold:** #FFD700 gradient (crown, trophy)

---

## Testing

After deploying animations, verify:
1. **Quest Completion:** Complete a quest in gamification screen
2. **7-Day Streak:** Mock streak data to 7 days
3. **30-Day Streak:** Mock streak data to 30 days
4. **100-Day Streak:** Mock streak data to 100 days
5. **Session Complete:** Complete a communication session
6. **High Score:** View report with score ≥80

**Expected Behavior:**
- Animation plays smoothly (60fps)
- Duration feels appropriate
- Colors visible on both light/dark themes
- Animation auto-dismisses after completion
- No performance issues on mid-range devices

---

## Future Enhancements

**Potential Additions:**
- Daily login reward animation
- Level up celebration
- Milestone achievements (10 sessions, 50 sessions, etc.)
- Relationship anniversary animations
- Badge unlock celebrations

**Optimization Opportunities:**
- Color customization via Lottie dynamic color
- Sound effects integration (optional haptic feedback)
- Particle count adjustment based on device performance
- A/B testing different animation styles

---

## Notes

- Animations created/replaced: 2026-01-10
- Source: Custom-built Lottie animations optimized for Relationship Referee brand
- Documentation: See [PRODUCTION_ASSETS.md](PRODUCTION_ASSETS.md) for original asset sourcing recommendations
- Maintained by: Design & Engineering Team

**Status:** ✅ Production-ready

All animations have been tested and optimized for production use. The placeholder files have been replaced with high-quality, brand-aligned celebration moments.
