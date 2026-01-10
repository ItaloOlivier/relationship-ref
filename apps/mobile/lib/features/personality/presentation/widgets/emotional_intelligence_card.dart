import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/personality_profile_model.dart';

/// A card displaying emotional intelligence scores
class EmotionalIntelligenceCard extends StatelessWidget {
  final EmotionalIntelligence eq;

  const EmotionalIntelligenceCard({
    super.key,
    required this.eq,
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
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.psychology_alt,
                    color: AppColors.primary,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Emotional Intelligence',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      Text(
                        'Your EQ scores',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                    ],
                  ),
                ),
                _buildAverageScore(context),
              ],
            ),
            const SizedBox(height: 20),
            _buildEQItem(
              context,
              'Awareness',
              eq.emotionalAwareness,
              'Recognition of your own emotions',
              Icons.visibility,
            ),
            const SizedBox(height: 12),
            _buildEQItem(
              context,
              'Empathy',
              eq.empathyScore,
              'Understanding your partner\'s feelings',
              Icons.favorite,
            ),
            const SizedBox(height: 12),
            _buildEQItem(
              context,
              'Regulation',
              eq.emotionalRegulation,
              'Managing emotional responses',
              Icons.tune,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAverageScore(BuildContext context) {
    final avg = eq.averageScore;
    final color = _getColorForScore(avg);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        avg > 0 ? '${avg.toInt()}' : '—',
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
            ),
      ),
    );
  }

  Widget _buildEQItem(
    BuildContext context,
    String label,
    double? score,
    String description,
    IconData icon,
  ) {
    final color = score != null ? _getColorForScore(score) : AppColors.textSecondary;

    return Row(
      children: [
        Icon(icon, size: 20, color: color),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    label,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  Text(
                    score != null ? '${score.toInt()}/100' : '—',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: color,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              ClipRRect(
                borderRadius: BorderRadius.circular(2),
                child: LinearProgressIndicator(
                  value: score != null ? score / 100 : 0,
                  minHeight: 4,
                  backgroundColor: AppColors.border,
                  valueColor: AlwaysStoppedAnimation(color),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                description,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                      fontSize: 11,
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Color _getColorForScore(double score) {
    if (score >= 70) return AppColors.greenCard;
    if (score >= 50) return AppColors.yellowCard;
    return AppColors.redCard;
  }
}
