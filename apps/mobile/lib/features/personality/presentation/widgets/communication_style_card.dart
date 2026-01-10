import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/personality_profile_model.dart';

/// A card displaying communication style with description
class CommunicationStyleCard extends StatelessWidget {
  final CommunicationStyle style;
  final String? description;

  const CommunicationStyleCard({
    super.key,
    required this.style,
    this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: _getStyleColor().withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _getStyleIcon(),
                    color: _getStyleColor(),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Communication Style',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                      Text(
                        style.displayName,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: _getStyleColor(),
                            ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (description != null) ...[
              const SizedBox(height: 12),
              Text(
                description!,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
            ],
            const SizedBox(height: 16),
            _buildStyleExplanation(context),
          ],
        ),
      ),
    );
  }

  Widget _buildStyleExplanation(BuildContext context) {
    final explanation = _getStyleExplanation();

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _getStyleColor().withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: _getStyleColor().withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.lightbulb_outline,
            size: 16,
            color: _getStyleColor(),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              explanation,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textPrimary,
                  ),
            ),
          ),
        ],
      ),
    );
  }

  String _getStyleExplanation() {
    switch (style) {
      case CommunicationStyle.placater:
        return 'Tends to agree and apologize to keep peace. Growth opportunity: Express your own needs more directly.';
      case CommunicationStyle.blamer:
        return 'Tends to criticize and find fault. Growth opportunity: Use "I" statements instead of "you" accusations.';
      case CommunicationStyle.computer:
        return 'Tends to intellectualize and avoid emotions. Growth opportunity: Connect with and express feelings.';
      case CommunicationStyle.distracter:
        return 'Tends to deflect with humor or topic changes. Growth opportunity: Stay present with difficult topics.';
      case CommunicationStyle.leveler:
        return 'Communicates authentically and directly. This is the healthiest communication style.';
      case CommunicationStyle.mixed:
        return 'Shows a combination of styles. Continue building self-awareness about your patterns.';
    }
  }

  Color _getStyleColor() {
    switch (style) {
      case CommunicationStyle.leveler:
        return AppColors.greenCard;
      case CommunicationStyle.placater:
      case CommunicationStyle.distracter:
        return AppColors.yellowCard;
      case CommunicationStyle.blamer:
      case CommunicationStyle.computer:
        return AppColors.warning;
      case CommunicationStyle.mixed:
        return AppColors.primary;
    }
  }

  IconData _getStyleIcon() {
    switch (style) {
      case CommunicationStyle.placater:
        return Icons.handshake;
      case CommunicationStyle.blamer:
        return Icons.gavel;
      case CommunicationStyle.computer:
        return Icons.psychology;
      case CommunicationStyle.distracter:
        return Icons.shuffle;
      case CommunicationStyle.leveler:
        return Icons.balance;
      case CommunicationStyle.mixed:
        return Icons.layers;
    }
  }
}
