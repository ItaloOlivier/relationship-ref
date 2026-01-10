import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/insights_summary_model.dart';

/// A card showing a summary of insights for the home screen
class InsightsSummaryCard extends StatelessWidget {
  final InsightsSummary summary;
  final VoidCallback? onTap;

  const InsightsSummaryCard({
    super.key,
    required this.summary,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
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
                  Icon(Icons.insights, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Text(
                    'Your Insights',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  Icon(
                    Icons.chevron_right,
                    color: AppColors.textSecondary,
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Stats row
              Row(
                children: [
                  Expanded(
                    child: _StatItem(
                      label: 'Sessions',
                      value: summary.totalSessions.toString(),
                      icon: Icons.chat_bubble_outline,
                    ),
                  ),
                  Expanded(
                    child: _StatItem(
                      label: 'Avg Score',
                      value: summary.averageScore.toStringAsFixed(0),
                      icon: Icons.star_outline,
                      valueColor: _getScoreColor(summary.averageScore),
                    ),
                  ),
                  Expanded(
                    child: _StatItem(
                      label: 'Patterns',
                      value: summary.activePatternCount.toString(),
                      icon: Icons.pattern,
                    ),
                  ),
                ],
              ),

              // Trend indicator
              if (summary.totalSessions >= 4) ...[
                const SizedBox(height: 16),
                _TrendIndicator(trend: summary.scoreTrend),
              ],

              // Highest impact pattern
              if (summary.highestImpactPattern != null) ...[
                const SizedBox(height: 12),
                const Divider(height: 1),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(
                      Icons.lightbulb_outline,
                      size: 18,
                      color: Colors.orange,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        summary.highestImpactPattern!.title,
                        style: Theme.of(context).textTheme.bodySmall,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Color _getScoreColor(double score) {
    if (score >= 70) return AppColors.greenCard;
    if (score >= 50) return AppColors.yellowCard;
    return AppColors.redCard;
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color? valueColor;

  const _StatItem({
    required this.label,
    required this.value,
    required this.icon,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: 20, color: AppColors.textSecondary),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: valueColor,
          ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}

class _TrendIndicator extends StatelessWidget {
  final ScoreTrend trend;

  const _TrendIndicator({required this.trend});

  @override
  Widget build(BuildContext context) {
    IconData icon;
    Color color;
    String text;

    switch (trend) {
      case ScoreTrend.improving:
        icon = Icons.trending_up;
        color = AppColors.greenCard;
        text = 'Your communication is improving!';
        break;
      case ScoreTrend.declining:
        icon = Icons.trending_down;
        color = AppColors.redCard;
        text = 'Your scores have been declining';
        break;
      case ScoreTrend.stable:
        icon = Icons.trending_flat;
        color = AppColors.textSecondary;
        text = 'Your communication is stable';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              text,
              style: TextStyle(
                color: color,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
