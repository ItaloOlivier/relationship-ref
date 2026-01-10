# Celebration Animations

This directory contains Lottie animation files for celebration moments in the app.

## Current Status

The files in this directory are **placeholder animations** with minimal structure. They will display but won't have visual content.

## Recommended Sources for Production Animations

Replace these placeholder files with production-quality Lottie animations from:

### Free Sources
1. **LottieFiles** (https://lottiefiles.com/)
   - confetti.json → Search "confetti celebration"
   - fire_burst.json → Search "fire burst" or "flame explosion"
   - trophy.json → Search "trophy win"
   - crown_fireworks.json → Search "crown" + "fireworks"
   - checkmark_pulse.json → Search "checkmark success"
   - thumbs_up_stars.json → Search "thumbs up stars"

2. **Lordicon** (https://lordicon.com/) - Premium quality, some free

### Custom Animation
For brand-specific animations, consider:
- **Lottie Creator** (https://lottiefiles.com/creator) - Web-based editor
- **Adobe After Effects** with Bodymovin plugin
- Hiring a motion designer on Fiverr/Upwork

## Animation Requirements

Each animation should:
- Be **300x300px** or larger (scalable)
- Run at **60fps** for smooth playback
- Complete in the specified duration:
  - Quest completed: 2 seconds
  - Streak milestone: 3 seconds
  - Streak major (30-day): 3 seconds
  - Streak legendary (100-day): 5 seconds
  - Session completed: 1.5 seconds
  - High score: 2 seconds
- Use **brand colors** where applicable:
  - Primary: #6366F1 (light) / #8B92FF (dark)
  - Green: #22C55E
  - Yellow: #FACC15
  - Red: #EF4444
- Work on both **light and dark backgrounds**

## Integration

Animations are loaded in `lib/core/ui/celebration_animations.dart` and triggered via:

```dart
CelebrationService.celebrate(
  context,
  CelebrationType.questCompleted,
  message: 'Quest Complete!',
);
```

## Testing

After replacing placeholder files:
1. Run `flutter pub get`
2. Hot reload the app
3. Trigger celebrations from:
   - Gamification screen (quest completion)
   - Home screen (streak milestones)
   - Report screen (high scores)
