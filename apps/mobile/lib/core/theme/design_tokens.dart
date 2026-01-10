/// Design tokens for consistent spacing, radius, and other design values
/// across the Relationship Referee app.
///
/// These tokens ensure visual consistency and make it easy to maintain
/// the design system.
class DesignTokens {
  DesignTokens._(); // Private constructor to prevent instantiation

  // ============================================================================
  // SPACING SYSTEM (8px base grid)
  // ============================================================================

  /// Extra small spacing: 4px
  static const double spaceXs = 4.0;

  /// Small spacing: 8px
  static const double spaceSm = 8.0;

  /// Medium spacing: 12px
  static const double spaceMd = 12.0;

  /// Large spacing (standard): 16px
  static const double spaceLg = 16.0;

  /// Extra large spacing: 24px
  static const double spaceXl = 24.0;

  /// 2X large spacing: 32px
  static const double space2xl = 32.0;

  /// 3X large spacing: 48px
  static const double space3xl = 48.0;

  /// 4X large spacing: 64px
  static const double space4xl = 64.0;

  // ============================================================================
  // BORDER RADIUS
  // ============================================================================

  /// Small radius: 8px
  static const double radiusSm = 8.0;

  /// Medium radius (standard): 12px
  static const double radiusMd = 12.0;

  /// Large radius (cards): 16px
  static const double radiusLg = 16.0;

  /// Extra large radius: 20px
  static const double radiusXl = 20.0;

  /// Pill radius: 999px (fully rounded)
  static const double radiusFull = 999.0;

  /// Circular radius (for containers)
  static const double radiusCircular = 100.0;

  // ============================================================================
  // ELEVATION & SHADOWS
  // ============================================================================

  /// No elevation (flat design)
  static const double elevationNone = 0.0;

  /// Subtle elevation: 1px
  static const double elevationSm = 1.0;

  /// Medium elevation: 2px
  static const double elevationMd = 2.0;

  /// Large elevation: 4px
  static const double elevationLg = 4.0;

  /// Extra large elevation: 8px
  static const double elevationXl = 8.0;

  // ============================================================================
  // ICON SIZES
  // ============================================================================

  /// Small icon: 16px
  static const double iconSm = 16.0;

  /// Medium icon (standard): 24px
  static const double iconMd = 24.0;

  /// Large icon: 32px
  static const double iconLg = 32.0;

  /// Extra large icon: 48px
  static const double iconXl = 48.0;

  /// 2X large icon: 64px
  static const double icon2xl = 64.0;

  /// 3X large icon: 96px
  static const double icon3xl = 96.0;

  /// 4X large icon (hero): 120px
  static const double icon4xl = 120.0;

  // ============================================================================
  // BUTTON DIMENSIONS
  // ============================================================================

  /// Minimum button height (accessibility)
  static const double buttonHeightMin = 48.0;

  /// Standard button height: 56px
  static const double buttonHeight = 56.0;

  /// Large button height: 64px
  static const double buttonHeightLg = 64.0;

  /// Button horizontal padding: 24px
  static const double buttonPaddingH = 24.0;

  /// Button vertical padding: 16px
  static const double buttonPaddingV = 16.0;

  // ============================================================================
  // OPACITY VALUES
  // ============================================================================

  /// Very subtle opacity: 0.05
  static const double opacitySubtle = 0.05;

  /// Light opacity (backgrounds): 0.1
  static const double opacityLight = 0.1;

  /// Medium opacity: 0.2
  static const double opacityMedium = 0.2;

  /// Semi-transparent: 0.5
  static const double opacitySemi = 0.5;

  /// Disabled state: 0.38
  static const double opacityDisabled = 0.38;

  // ============================================================================
  // ANIMATION DURATIONS
  // ============================================================================

  /// Fast animation: 150ms
  static const Duration durationFast = Duration(milliseconds: 150);

  /// Standard animation: 300ms
  static const Duration durationNormal = Duration(milliseconds: 300);

  /// Slow animation: 500ms
  static const Duration durationSlow = Duration(milliseconds: 500);

  /// Extra slow animation: 1000ms
  static const Duration durationXSlow = Duration(milliseconds: 1000);

  // ============================================================================
  // ANIMATION CURVES
  // ============================================================================

  /// Standard easing curve
  static const curveStandard = Curves.easeInOut;

  /// Emphasized easing (for important transitions)
  static const curveEmphasized = Curves.easeInOutCubic;

  /// Decelerate easing (for entering elements)
  static const curveDecelerate = Curves.easeOut;

  /// Accelerate easing (for exiting elements)
  static const curveAccelerate = Curves.easeIn;

  // ============================================================================
  // CARD DIMENSIONS
  // ============================================================================

  /// Card padding: 16px
  static const double cardPadding = 16.0;

  /// Large card padding: 24px
  static const double cardPaddingLg = 24.0;

  /// Card border width: 1px
  static const double cardBorderWidth = 1.0;

  // ============================================================================
  // BREAKPOINTS (Responsive Design)
  // ============================================================================

  /// Small phone breakpoint: 360px
  static const double breakpointSm = 360.0;

  /// Medium phone breakpoint: 480px
  static const double breakpointMd = 480.0;

  /// Large phone/small tablet: 600px
  static const double breakpointLg = 600.0;

  /// Tablet breakpoint: 768px
  static const double breakpointXl = 768.0;
}
