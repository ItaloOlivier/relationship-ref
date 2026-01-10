import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import '../theme/design_tokens.dart';

/// Types of celebration animations
enum CelebrationType {
  questCompleted,      // Confetti animation
  streakMilestone,     // Fire burst animation
  streakMajor,         // Trophy animation
  streakLegendary,     // Crown/fireworks animation
  sessionCompleted,    // Success checkmark pulse
  highScore,           // Thumbs up + stars
}

/// Service for showing celebration animations
class CelebrationService {
  /// Show celebration animation overlay
  static void celebrate(
    BuildContext context,
    CelebrationType type, {
    String? message,
    VoidCallback? onComplete,
  }) {
    final overlay = Overlay.of(context);
    final overlayEntry = OverlayEntry(
      builder: (context) => _CelebrationOverlay(
        type: type,
        message: message,
        onComplete: () {
          onComplete?.call();
        },
      ),
    );

    overlay.insert(overlayEntry);

    // Auto-remove after duration
    final duration = _getDuration(type);
    Future.delayed(duration, () {
      overlayEntry.remove();
      onComplete?.call();
    });
  }

  static Duration _getDuration(CelebrationType type) {
    switch (type) {
      case CelebrationType.questCompleted:
        return const Duration(milliseconds: 2000);
      case CelebrationType.streakMilestone:
      case CelebrationType.streakMajor:
        return const Duration(milliseconds: 3000);
      case CelebrationType.streakLegendary:
        return const Duration(milliseconds: 5000);
      case CelebrationType.sessionCompleted:
        return const Duration(milliseconds: 1500);
      case CelebrationType.highScore:
        return const Duration(milliseconds: 2000);
    }
  }

  static String _getAnimationAsset(CelebrationType type) {
    switch (type) {
      case CelebrationType.questCompleted:
        return 'assets/animations/confetti.json';
      case CelebrationType.streakMilestone:
        return 'assets/animations/fire_burst.json';
      case CelebrationType.streakMajor:
        return 'assets/animations/trophy.json';
      case CelebrationType.streakLegendary:
        return 'assets/animations/crown_fireworks.json';
      case CelebrationType.sessionCompleted:
        return 'assets/animations/checkmark_pulse.json';
      case CelebrationType.highScore:
        return 'assets/animations/thumbs_up_stars.json';
    }
  }
}

/// Celebration overlay widget
class _CelebrationOverlay extends StatefulWidget {
  final CelebrationType type;
  final String? message;
  final VoidCallback onComplete;

  const _CelebrationOverlay({
    required this.type,
    this.message,
    required this.onComplete,
  });

  @override
  State<_CelebrationOverlay> createState() => _CelebrationOverlayState();
}

class _CelebrationOverlayState extends State<_CelebrationOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.3, curve: Curves.easeOut),
      ),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.5, curve: Curves.elasticOut),
      ),
    );

    _controller.forward();

    // Fade out before removal
    final duration = CelebrationService._getDuration(widget.type);
    Future.delayed(
      Duration(milliseconds: duration.inMilliseconds - 500),
      () {
        if (mounted) {
          _controller.reverse();
        }
      },
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Container(
        color: Colors.black.withValues(alpha: 0.3),
        child: Center(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: ScaleTransition(
              scale: _scaleAnimation,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Lottie animation
                  SizedBox(
                    width: 300,
                    height: 300,
                    child: Lottie.asset(
                      CelebrationService._getAnimationAsset(widget.type),
                      repeat: false,
                      animate: true,
                    ),
                  ),

                  // Optional message
                  if (widget.message != null) ...[
                    const SizedBox(height: DesignTokens.spaceLg),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: DesignTokens.spaceXl,
                        vertical: DesignTokens.spaceLg,
                      ),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        borderRadius: BorderRadius.circular(DesignTokens.radiusLg),
                      ),
                      child: Text(
                        widget.message!,
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Reusable celebration trigger widget
class CelebrationTrigger extends StatelessWidget {
  final Widget child;
  final CelebrationType type;
  final String? message;
  final bool shouldCelebrate;
  final VoidCallback? onCelebrationComplete;

  const CelebrationTrigger({
    super.key,
    required this.child,
    required this.type,
    this.message,
    required this.shouldCelebrate,
    this.onCelebrationComplete,
  });

  @override
  Widget build(BuildContext context) {
    // Trigger celebration when shouldCelebrate becomes true
    if (shouldCelebrate) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        CelebrationService.celebrate(
          context,
          type,
          message: message,
          onComplete: onCelebrationComplete,
        );
      });
    }

    return child;
  }
}
