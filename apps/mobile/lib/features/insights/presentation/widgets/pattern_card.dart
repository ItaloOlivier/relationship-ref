import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/pattern_insight_model.dart';

/// A card displaying a pattern insight with swipe actions
class PatternCard extends StatelessWidget {
  final PatternInsight pattern;
  final VoidCallback? onAcknowledge;
  final VoidCallback? onDismiss;
  final VoidCallback? onTap;

  const PatternCard({
    super.key,
    required this.pattern,
    this.onAcknowledge,
    this.onDismiss,
    this.onTap,
  });

  Color _getImpactColor() {
    switch (pattern.impact) {
      case PatternImpact.critical:
        return AppColors.redCard;
      case PatternImpact.high:
        return Colors.orange;
      case PatternImpact.medium:
        return AppColors.yellowCard;
      case PatternImpact.low:
        return AppColors.greenCard;
    }
  }

  IconData _getPatternIcon() {
    switch (pattern.patternType) {
      case PatternType.topicTrigger:
        return Icons.trending_down;
      case PatternType.timePattern:
        return Icons.schedule;
      case PatternType.behaviorTrend:
        return Icons.show_chart;
      case PatternType.horsemanTrend:
        return Icons.warning_amber;
      case PatternType.communicationStyle:
        return Icons.chat_bubble_outline;
      case PatternType.positivePattern:
        return Icons.thumb_up;
    }
  }

  bool get isPositive => pattern.patternType == PatternType.positivePattern;

  @override
  Widget build(BuildContext context) {
    final card = Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: _getImpactColor().withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      _getPatternIcon(),
                      color: _getImpactColor(),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          pattern.title,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            _ImpactBadge(impact: pattern.impact),
                            const SizedBox(width: 8),
                            Text(
                              '${pattern.sessionsCount} sessions',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  // Confidence indicator
                  _ConfidenceIndicator(confidence: pattern.confidence),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                pattern.description,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ),
    );

    // Wrap with Dismissible for swipe actions
    if (onAcknowledge != null || onDismiss != null) {
      return Dismissible(
        key: Key(pattern.id),
        background: _buildSwipeBackground(
          color: AppColors.greenCard,
          icon: Icons.check,
          alignment: Alignment.centerLeft,
        ),
        secondaryBackground: _buildSwipeBackground(
          color: AppColors.textSecondary,
          icon: Icons.visibility_off,
          alignment: Alignment.centerRight,
        ),
        confirmDismiss: (direction) async {
          if (direction == DismissDirection.startToEnd) {
            onAcknowledge?.call();
          } else {
            onDismiss?.call();
          }
          return true;
        },
        child: card,
      );
    }

    return card;
  }

  Widget _buildSwipeBackground({
    required Color color,
    required IconData icon,
    required Alignment alignment,
  }) {
    return Container(
      alignment: alignment,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(icon, color: Colors.white),
    );
  }
}

class _ImpactBadge extends StatelessWidget {
  final PatternImpact impact;

  const _ImpactBadge({required this.impact});

  Color _getColor() {
    switch (impact) {
      case PatternImpact.critical:
        return AppColors.redCard;
      case PatternImpact.high:
        return Colors.orange;
      case PatternImpact.medium:
        return AppColors.yellowCard;
      case PatternImpact.low:
        return AppColors.greenCard;
    }
  }

  String _getLabel() {
    switch (impact) {
      case PatternImpact.critical:
        return 'Critical';
      case PatternImpact.high:
        return 'High';
      case PatternImpact.medium:
        return 'Medium';
      case PatternImpact.low:
        return 'Low';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: _getColor().withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        _getLabel(),
        style: TextStyle(
          color: _getColor(),
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _ConfidenceIndicator extends StatelessWidget {
  final double confidence;

  const _ConfidenceIndicator({required this.confidence});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: 32,
          height: 32,
          child: CircularProgressIndicator(
            value: confidence,
            strokeWidth: 3,
            backgroundColor: AppColors.border,
            valueColor: AlwaysStoppedAnimation(
              confidence > 0.7 ? AppColors.greenCard : AppColors.yellowCard,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '${(confidence * 100).round()}%',
          style: TextStyle(
            fontSize: 10,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}
