import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/personality_profile_model.dart';

/// A card displaying attachment style with visual representation
class AttachmentStyleCard extends StatelessWidget {
  final AttachmentStyle style;
  final double? anxietyScore;
  final double? avoidanceScore;
  final String? description;

  const AttachmentStyleCard({
    super.key,
    required this.style,
    this.anxietyScore,
    this.avoidanceScore,
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
                        'Attachment Style',
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
            if (anxietyScore != null || avoidanceScore != null) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 12),
              _buildAttachmentGrid(context),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAttachmentGrid(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _buildScoreItem(
            context,
            'Anxiety',
            anxietyScore,
            'Fear of abandonment',
            Icons.favorite_border,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildScoreItem(
            context,
            'Avoidance',
            avoidanceScore,
            'Discomfort with closeness',
            Icons.shield_outlined,
          ),
        ),
      ],
    );
  }

  Widget _buildScoreItem(
    BuildContext context,
    String label,
    double? score,
    String subtitle,
    IconData icon,
  ) {
    final color = score != null
        ? (score < 40 ? AppColors.greenCard : AppColors.yellowCard)
        : AppColors.textSecondary;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 4),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          score != null ? '${score.toInt()}/100' : '—',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
        ),
        Text(
          subtitle,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondary,
                fontSize: 11,
              ),
        ),
      ],
    );
  }

  Color _getStyleColor() {
    switch (style) {
      case AttachmentStyle.secure:
        return AppColors.greenCard;
      case AttachmentStyle.anxiousPreoccupied:
        return AppColors.yellowCard;
      case AttachmentStyle.dismissiveAvoidant:
        return AppColors.info;
      case AttachmentStyle.fearfulAvoidant:
        return AppColors.redCard;
      case AttachmentStyle.undetermined:
        return AppColors.textSecondary;
    }
  }

  IconData _getStyleIcon() {
    switch (style) {
      case AttachmentStyle.secure:
        return Icons.favorite;
      case AttachmentStyle.anxiousPreoccupied:
        return Icons.heart_broken;
      case AttachmentStyle.dismissiveAvoidant:
        return Icons.shield;
      case AttachmentStyle.fearfulAvoidant:
        return Icons.warning_amber;
      case AttachmentStyle.undetermined:
        return Icons.help_outline;
    }
  }
}
