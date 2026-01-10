import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

/// A card displaying a single personality trait with a progress gauge
class TraitGaugeCard extends StatelessWidget {
  final String label;
  final double? value; // 0-100 scale
  final String? description;
  final Color? color;
  final IconData? icon;

  const TraitGaugeCard({
    super.key,
    required this.label,
    this.value,
    this.description,
    this.color,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final displayValue = value ?? 0;
    final traitColor = color ?? _getColorForValue(displayValue);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (icon != null) ...[
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: traitColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(icon, size: 20, color: traitColor),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      if (description != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          description!,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
                Text(
                  value != null ? '${displayValue.toInt()}' : '—',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: value != null ? traitColor : AppColors.textSecondary,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: value != null ? displayValue / 100 : 0,
                minHeight: 8,
                backgroundColor: AppColors.border,
                valueColor: AlwaysStoppedAnimation(
                  value != null ? traitColor : AppColors.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getColorForValue(double value) {
    if (value >= 70) return AppColors.greenCard;
    if (value >= 40) return AppColors.yellowCard;
    return AppColors.redCard;
  }
}

/// A compact horizontal trait bar for use in comparison views
class TraitBar extends StatelessWidget {
  final String label;
  final double? value; // 0-100 scale
  final Color? color;
  final bool showLabel;

  const TraitBar({
    super.key,
    required this.label,
    this.value,
    this.color,
    this.showLabel = true,
  });

  @override
  Widget build(BuildContext context) {
    final displayValue = value ?? 0;
    final barColor = color ?? _getColorForValue(displayValue);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          if (showLabel)
            SizedBox(
              width: 100,
              child: Text(
                label,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: value != null ? displayValue / 100 : 0,
                minHeight: 8,
                backgroundColor: AppColors.border,
                valueColor: AlwaysStoppedAnimation(
                  value != null ? barColor : AppColors.textSecondary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 32,
            child: Text(
              value != null ? '${displayValue.toInt()}' : '—',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }

  Color _getColorForValue(double value) {
    if (value >= 70) return AppColors.greenCard;
    if (value >= 40) return AppColors.yellowCard;
    return AppColors.redCard;
  }
}
