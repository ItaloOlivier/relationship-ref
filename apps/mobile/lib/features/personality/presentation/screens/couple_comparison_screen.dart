import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/personality_repository.dart';
import '../../domain/couple_comparison_model.dart';
import '../../domain/personality_profile_model.dart';

class CoupleComparisonScreen extends ConsumerWidget {
  const CoupleComparisonScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Couple Comparison'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Overview'),
              Tab(text: 'Traits'),
              Tab(text: 'Insights'),
            ],
          ),
        ),
        body: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(coupleComparisonProvider);
          },
          child: const TabBarView(
            children: [
              _OverviewTab(),
              _TraitsComparisonTab(),
              _InsightsTab(),
            ],
          ),
        ),
      ),
    );
  }
}

class _OverviewTab extends ConsumerWidget {
  const _OverviewTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final comparisonAsync = ref.watch(coupleComparisonProvider);

    return comparisonAsync.when(
      data: (comparison) {
        if (comparison == null) {
          return _buildEmptyState(context);
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildPartnerCards(context, comparison),
              const SizedBox(height: 20),
              if (comparison.dynamics != null) ...[
                _buildDynamicsCard(context, comparison),
                const SizedBox(height: 16),
                _buildGottmanCard(context, comparison),
              ],
            ],
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => _buildErrorState(context, error),
    );
  }

  Widget _buildPartnerCards(BuildContext context, CoupleComparison comparison) {
    return Row(
      children: [
        Expanded(
          child: _PartnerSummaryCard(
            name: comparison.partner1.name,
            profile: comparison.partner1.profile,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _PartnerSummaryCard(
            name: comparison.partner2.name,
            profile: comparison.partner2.profile,
            color: AppColors.greenCard,
          ),
        ),
      ],
    );
  }

  Widget _buildDynamicsCard(BuildContext context, CoupleComparison comparison) {
    final dynamics = comparison.dynamics!;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Relationship Dynamics',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            if (dynamics.pursuerWithdrawer == true) ...[
              _buildDynamicItem(
                context,
                'Pursuer-Withdrawer Pattern',
                'One partner tends to pursue while the other withdraws',
                Icons.swap_horiz,
                AppColors.warning,
              ),
              const SizedBox(height: 12),
            ],
            _buildScoreRow(
              context,
              'Emotional Reciprocity',
              dynamics.emotionalReciprocity,
            ),
            _buildScoreRow(
              context,
              'Validation Balance',
              dynamics.validationBalance,
            ),
            _buildScoreRow(
              context,
              'Support Balance',
              dynamics.supportBalance,
            ),
            const Divider(height: 24),
            _buildScoreRow(
              context,
              'De-escalation Skill',
              dynamics.deescalationSkill,
            ),
            _buildScoreRow(
              context,
              'Resolution Rate',
              dynamics.resolutionRate,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDynamicItem(
    BuildContext context,
    String title,
    String description,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                Text(
                  description,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScoreRow(BuildContext context, String label, double? score) {
    final color = score != null
        ? (score >= 70
            ? AppColors.greenCard
            : score >= 50
                ? AppColors.yellowCard
                : AppColors.redCard)
        : AppColors.textSecondary;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium,
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
    );
  }

  Widget _buildGottmanCard(BuildContext context, CoupleComparison comparison) {
    final dynamics = comparison.dynamics!;
    final ratio = dynamics.positiveToNegativeRatio;
    final isHealthy = ratio != null && ratio >= 5.0;

    return Card(
      color: isHealthy
          ? AppColors.greenCard.withValues(alpha: 0.1)
          : AppColors.warning.withValues(alpha: 0.1),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isHealthy ? Icons.favorite : Icons.warning_amber,
                  color: isHealthy ? AppColors.greenCard : AppColors.warning,
                ),
                const SizedBox(width: 8),
                Text(
                  'Gottman Ratio',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              ratio != null
                  ? '${ratio.toStringAsFixed(1)}:1'
                  : 'Not enough data',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: isHealthy ? AppColors.greenCard : AppColors.warning,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              isHealthy
                  ? 'Your positive-to-negative ratio is healthy! Research suggests 5:1 is optimal.'
                  : 'Aim for more positive interactions. The healthy target is 5:1.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TraitsComparisonTab extends ConsumerWidget {
  const _TraitsComparisonTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final comparisonAsync = ref.watch(coupleComparisonProvider);

    return comparisonAsync.when(
      data: (comparison) {
        if (comparison == null || !comparison.hasBothProfiles) {
          return _buildEmptyState(context);
        }

        final p1 = comparison.partner1.profile!;
        final p2 = comparison.partner2.profile!;

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildLegend(context, comparison),
              const SizedBox(height: 16),
              Text(
                'Big Five Traits',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              _buildTraitComparison(context, 'Openness', p1.openness, p2.openness),
              _buildTraitComparison(
                  context, 'Conscientiousness', p1.conscientiousness, p2.conscientiousness),
              _buildTraitComparison(
                  context, 'Extraversion', p1.extraversion, p2.extraversion),
              _buildTraitComparison(
                  context, 'Agreeableness', p1.agreeableness, p2.agreeableness),
              _buildTraitComparison(
                  context, 'Neuroticism', p1.neuroticism, p2.neuroticism),
              const SizedBox(height: 24),
              Text(
                'Attachment Styles',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              _buildAttachmentComparison(context, comparison),
              const SizedBox(height: 24),
              Text(
                'Emotional Intelligence',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              _buildTraitComparison(context, 'Awareness',
                  p1.emotionalAwareness, p2.emotionalAwareness),
              _buildTraitComparison(
                  context, 'Empathy', p1.empathyScore, p2.empathyScore),
              _buildTraitComparison(context, 'Regulation',
                  p1.emotionalRegulation, p2.emotionalRegulation),
            ],
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => _buildErrorState(context, error),
    );
  }

  Widget _buildLegend(BuildContext context, CoupleComparison comparison) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildLegendItem(
                context, comparison.partner1.name, AppColors.primary),
            const SizedBox(width: 24),
            _buildLegendItem(
                context, comparison.partner2.name, AppColors.greenCard),
          ],
        ),
      ),
    );
  }

  Widget _buildLegendItem(BuildContext context, String name, Color color) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          name,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
      ],
    );
  }

  Widget _buildTraitComparison(
    BuildContext context,
    String label,
    double? value1,
    double? value2,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
              ),
              Row(
                children: [
                  Text(
                    value1 != null ? '${value1.toInt()}' : '—',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const Text(' / '),
                  Text(
                    value2 != null ? '${value2.toInt()}' : '—',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.greenCard,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 4),
          SizedBox(
            height: 8,
            child: Stack(
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                if (value1 != null)
                  FractionallySizedBox(
                    widthFactor: value1 / 100,
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                if (value2 != null)
                  FractionallySizedBox(
                    widthFactor: value2 / 100,
                    child: Container(
                      height: 4,
                      margin: const EdgeInsets.only(top: 4),
                      decoration: BoxDecoration(
                        color: AppColors.greenCard,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttachmentComparison(
      BuildContext context, CoupleComparison comparison) {
    final p1 = comparison.partner1.profile!;
    final p2 = comparison.partner2.profile!;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: Column(
                children: [
                  Text(
                    comparison.partner1.name,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      p1.attachmentStyle.displayName,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.compare_arrows, color: AppColors.textSecondary),
            Expanded(
              child: Column(
                children: [
                  Text(
                    comparison.partner2.name,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.greenCard.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      p2.attachmentStyle.displayName,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.greenCard,
                          ),
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

class _InsightsTab extends ConsumerWidget {
  const _InsightsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final comparisonAsync = ref.watch(coupleComparisonProvider);

    return comparisonAsync.when(
      data: (comparison) {
        if (comparison == null) {
          return _buildEmptyState(context);
        }

        if (comparison.insights.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lightbulb_outline,
                      size: 64, color: AppColors.textSecondary),
                  const SizedBox(height: 16),
                  Text(
                    'No Insights Yet',
                    style: Theme.of(context).textTheme.titleLarge,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Import more conversations to generate relationship insights.',
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

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: comparison.insights.length +
              (comparison.dynamics?.coachingFocus != null ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == comparison.insights.length &&
                comparison.dynamics?.coachingFocus != null) {
              return _buildCoachingFocusCard(
                  context, comparison.dynamics!.coachingFocus!);
            }

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _buildInsightCard(context, comparison.insights[index]),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => _buildErrorState(context, error),
    );
  }

  Widget _buildInsightCard(BuildContext context, String insight) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.lightbulb, color: AppColors.yellowCard, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                insight,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      height: 1.5,
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCoachingFocusCard(BuildContext context, String focus) {
    return Card(
      color: AppColors.primary.withValues(alpha: 0.1),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.school, color: AppColors.primary),
                const SizedBox(width: 8),
                Text(
                  'Coaching Focus',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              focus,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    height: 1.5,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PartnerSummaryCard extends StatelessWidget {
  final String name;
  final PersonalityProfile? profile;
  final Color color;

  const _PartnerSummaryCard({
    required this.name,
    this.profile,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            CircleAvatar(
              backgroundColor: color.withValues(alpha: 0.2),
              radius: 24,
              child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : '?',
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.bold,
                  fontSize: 20,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              name,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            if (profile != null) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  profile!.attachmentStyle.displayName,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: color,
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${profile!.sessionsAnalyzed} sessions',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
            ] else
              Text(
                'No profile',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
          ],
        ),
      ),
    );
  }
}

Widget _buildEmptyState(BuildContext context) {
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people_outline, size: 64, color: AppColors.textSecondary),
          const SizedBox(height: 16),
          Text(
            'No Comparison Available',
            style: Theme.of(context).textTheme.titleLarge,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Both partners need to have personality profiles to see a comparison. Import conversations to build your profiles.',
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
            'Failed to load comparison',
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
