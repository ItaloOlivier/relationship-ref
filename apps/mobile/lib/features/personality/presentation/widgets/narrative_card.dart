import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

/// A card displaying AI-generated narrative insights
class NarrativeCard extends StatelessWidget {
  final String title;
  final String? narrative;
  final IconData icon;
  final Color color;

  const NarrativeCard({
    super.key,
    required this.title,
    this.narrative,
    required this.icon,
    required this.color,
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
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, size: 20, color: color),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              narrative ?? 'Not enough data to generate insights. Import more conversations to build your profile.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: narrative != null
                        ? AppColors.textPrimary
                        : AppColors.textSecondary,
                    height: 1.5,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Strengths narrative card
class StrengthsNarrativeCard extends StatelessWidget {
  final String? narrative;

  const StrengthsNarrativeCard({super.key, this.narrative});

  @override
  Widget build(BuildContext context) {
    return NarrativeCard(
      title: 'Your Strengths',
      narrative: narrative,
      icon: Icons.star,
      color: AppColors.greenCard,
    );
  }
}

/// Growth areas narrative card
class GrowthAreasNarrativeCard extends StatelessWidget {
  final String? narrative;

  const GrowthAreasNarrativeCard({super.key, this.narrative});

  @override
  Widget build(BuildContext context) {
    return NarrativeCard(
      title: 'Growth Opportunities',
      narrative: narrative,
      icon: Icons.trending_up,
      color: AppColors.primary,
    );
  }
}

/// Communication narrative card
class CommunicationNarrativeCard extends StatelessWidget {
  final String? narrative;

  const CommunicationNarrativeCard({super.key, this.narrative});

  @override
  Widget build(BuildContext context) {
    return NarrativeCard(
      title: 'Communication Insights',
      narrative: narrative,
      icon: Icons.chat_bubble_outline,
      color: AppColors.info,
    );
  }
}
