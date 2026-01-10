import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/insights_repository.dart';
import '../../domain/insights_summary_model.dart';
import '../../domain/pattern_insight_model.dart';
import '../widgets/pattern_card.dart';

class InsightsScreen extends ConsumerWidget {
  const InsightsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Insights'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Patterns'),
              Tab(text: 'Trends'),
              Tab(text: 'Summary'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            _PatternsTab(),
            _TrendsTab(),
            _SummaryTab(),
          ],
        ),
      ),
    );
  }
}

class _PatternsTab extends ConsumerWidget {
  const _PatternsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final patternsAsync = ref.watch(patternInsightsProvider);

    return patternsAsync.when(
      data: (patterns) {
        if (patterns.isEmpty) {
          return _buildEmptyState(
            context,
            icon: Icons.pattern,
            title: 'No Patterns Yet',
            description:
                'Complete more sessions to see patterns in your communication.',
          );
        }

        // Group patterns by type
        final positivePatterns =
            patterns.where((p) => p.patternType == PatternType.positivePattern).toList();
        final concernPatterns =
            patterns.where((p) => p.patternType != PatternType.positivePattern).toList();

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (concernPatterns.isNotEmpty) ...[
              _SectionHeader(
                title: 'Areas to Watch',
                count: concernPatterns.length,
              ),
              const SizedBox(height: 8),
              ...concernPatterns.map((pattern) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: PatternCard(
                  pattern: pattern,
                  onAcknowledge: () {
                    ref.read(patternActionsProvider.notifier).acknowledgePattern(pattern.id);
                  },
                  onDismiss: () {
                    ref.read(patternActionsProvider.notifier).dismissPattern(pattern.id);
                  },
                ),
              )),
            ],
            if (positivePatterns.isNotEmpty) ...[
              const SizedBox(height: 24),
              _SectionHeader(
                title: 'What You\'re Doing Well',
                count: positivePatterns.length,
                isPositive: true,
              ),
              const SizedBox(height: 8),
              ...positivePatterns.map((pattern) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: PatternCard(
                  pattern: pattern,
                  onAcknowledge: () {
                    ref.read(patternActionsProvider.notifier).acknowledgePattern(pattern.id);
                  },
                ),
              )),
            ],
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => _buildErrorState(context, error),
    );
  }
}

class _TrendsTab extends ConsumerWidget {
  const _TrendsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(insightsSummaryProvider);

    return summaryAsync.when(
      data: (summary) {
        if (summary.totalSessions < 3) {
          return _buildEmptyState(
            context,
            icon: Icons.show_chart,
            title: 'Not Enough Data',
            description:
                'Complete at least 3 sessions to see trends in your communication.',
          );
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Monthly trend chart placeholder
              _TrendCard(
                title: 'Score Trend',
                trend: summary.scoreTrend,
                monthlyData: summary.monthlyTrend,
              ),
              const SizedBox(height: 16),

              // Green card ratio
              _MetricCard(
                title: 'Green Card Ratio',
                value: '${(summary.greenCardRatio * 100).toStringAsFixed(0)}%',
                subtitle: 'of your interaction cards are positive',
                icon: Icons.thumb_up_alt_outlined,
                color: AppColors.greenCard,
              ),
              const SizedBox(height: 16),

              // Repair attempts
              _MetricCard(
                title: 'Repair Attempts',
                value: summary.averageRepairAttempts.toStringAsFixed(1),
                subtitle: 'average per session',
                icon: Icons.healing,
                color: AppColors.primary,
              ),
              const SizedBox(height: 16),

              // Four Horsemen
              if (summary.horsemenFrequency.isNotEmpty) ...[
                Text(
                  'Four Horsemen Detected',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                _HorsemenChart(frequency: summary.horsemenFrequency),
              ],
            ],
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => _buildErrorState(context, error),
    );
  }
}

class _SummaryTab extends ConsumerWidget {
  const _SummaryTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(insightsSummaryProvider);

    return summaryAsync.when(
      data: (summary) {
        if (summary.totalSessions == 0) {
          return _buildEmptyState(
            context,
            icon: Icons.summarize,
            title: 'No Sessions Yet',
            description: 'Start your first session to see insights.',
          );
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Overview card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Overview',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _SummaryStatItem(
                            label: 'Sessions',
                            value: summary.totalSessions.toString(),
                          ),
                          _SummaryStatItem(
                            label: 'Avg Score',
                            value: summary.averageScore.toStringAsFixed(0),
                          ),
                          _SummaryStatItem(
                            label: 'Patterns',
                            value: summary.activePatternCount.toString(),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Top topics
              if (summary.topTopics.isNotEmpty) ...[
                Text(
                  'Most Discussed Topics',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: summary.topTopics.map((topic) {
                    return Chip(
                      label: Text('${topic.topic} (${topic.count})'),
                      backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
              ],

              // Trigger topics
              if (summary.triggerTopics.isNotEmpty) ...[
                Text(
                  'Topics to Watch',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Card(
                  color: AppColors.warning.withValues(alpha: 0.1),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: summary.triggerTopics.map((topic) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              Icon(Icons.warning_amber,
                                  size: 16, color: AppColors.warning),
                              const SizedBox(width: 8),
                              Text(topic.topic),
                              const Spacer(),
                              Text(
                                'Avg: ${topic.averageScore.toStringAsFixed(0)}',
                                style: TextStyle(color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ],
            ],
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => _buildErrorState(context, error),
    );
  }
}

// Helper widgets

class _SectionHeader extends StatelessWidget {
  final String title;
  final int count;
  final bool isPositive;

  const _SectionHeader({
    required this.title,
    required this.count,
    this.isPositive = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: (isPositive ? AppColors.greenCard : AppColors.textSecondary)
                .withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            count.toString(),
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isPositive ? AppColors.greenCard : AppColors.textSecondary,
            ),
          ),
        ),
      ],
    );
  }
}

class _TrendCard extends StatelessWidget {
  final String title;
  final ScoreTrend trend;
  final List<TrendDataPoint> monthlyData;

  const _TrendCard({
    required this.title,
    required this.trend,
    required this.monthlyData,
  });

  @override
  Widget build(BuildContext context) {
    IconData trendIcon;
    Color trendColor;
    String trendText;

    switch (trend) {
      case ScoreTrend.improving:
        trendIcon = Icons.trending_up;
        trendColor = AppColors.greenCard;
        trendText = 'Improving';
        break;
      case ScoreTrend.declining:
        trendIcon = Icons.trending_down;
        trendColor = AppColors.redCard;
        trendText = 'Declining';
        break;
      case ScoreTrend.stable:
        trendIcon = Icons.trending_flat;
        trendColor = AppColors.textSecondary;
        trendText = 'Stable';
        break;
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: trendColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(trendIcon, size: 16, color: trendColor),
                      const SizedBox(width: 4),
                      Text(
                        trendText,
                        style: TextStyle(
                          color: trendColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Simple bar chart representation
            if (monthlyData.isNotEmpty)
              SizedBox(
                height: 100,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: monthlyData.map((point) {
                    final height = (point.value / 100) * 80;
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 2),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Container(
                              height: height.clamp(8.0, 80.0),
                              decoration: BoxDecoration(
                                color: _getBarColor(point.value),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              point.period.split('-').last,
                              style: const TextStyle(fontSize: 10),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Color _getBarColor(double value) {
    if (value >= 70) return AppColors.greenCard;
    if (value >= 50) return AppColors.yellowCard;
    return AppColors.redCard;
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color color;

  const _MetricCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  Text(
                    value,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HorsemenChart extends StatelessWidget {
  final Map<String, int> frequency;

  const _HorsemenChart({required this.frequency});

  @override
  Widget build(BuildContext context) {
    final horsemenLabels = {
      'criticism': 'Criticism',
      'contempt': 'Contempt',
      'defensiveness': 'Defensiveness',
      'stonewalling': 'Stonewalling',
    };

    final maxValue = frequency.values.fold(0, (a, b) => a > b ? a : b);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: horsemenLabels.entries.map((entry) {
            final count = frequency[entry.key] ?? 0;
            final percentage = maxValue > 0 ? count / maxValue : 0.0;

            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  SizedBox(
                    width: 100,
                    child: Text(
                      entry.value,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                  Expanded(
                    child: LinearProgressIndicator(
                      value: percentage,
                      backgroundColor: AppColors.border,
                      valueColor: AlwaysStoppedAnimation(
                        entry.key == 'contempt' ? AppColors.redCard : AppColors.yellowCard,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    count.toString(),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _SummaryStatItem extends StatelessWidget {
  final String label;
  final String value;

  const _SummaryStatItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
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

Widget _buildEmptyState(
  BuildContext context, {
  required IconData icon,
  required String title,
  required String description,
}) {
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: AppColors.textSecondary),
          const SizedBox(height: 16),
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ),
  );
}

Widget _buildErrorState(BuildContext context, Object error) {
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: AppColors.error),
          const SizedBox(height: 16),
          Text(
            'Failed to load insights',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            error.toString(),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ),
  );
}
