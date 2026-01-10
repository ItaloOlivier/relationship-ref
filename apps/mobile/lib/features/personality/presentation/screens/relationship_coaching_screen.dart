import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/personality_repository.dart';
import '../../domain/relationship_dynamic_model.dart';

class RelationshipCoachingScreen extends ConsumerWidget {
  const RelationshipCoachingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Relationship Coaching'),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(relationshipDynamicProvider);
          ref.invalidate(coupleComparisonProvider);
        },
        child: const _CoachingContent(),
      ),
    );
  }
}

class _CoachingContent extends ConsumerWidget {
  const _CoachingContent();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dynamicsAsync = ref.watch(relationshipDynamicProvider);

    return dynamicsAsync.when(
      data: (dynamics) {
        if (dynamics == null) {
          return _buildEmptyState(context);
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildOverviewCard(context, dynamics),
              const SizedBox(height: 20),
              if (dynamics.dynamicNarrative != null) ...[
                _buildNarrativeCard(context, dynamics),
                const SizedBox(height: 16),
              ],
              if (dynamics.coachingFocus != null) ...[
                _buildCoachingFocusCard(context, dynamics),
                const SizedBox(height: 16),
              ],
              if (dynamics.relationshipStrengths.isNotEmpty) ...[
                _buildStrengthsSection(context, dynamics),
                const SizedBox(height: 16),
              ],
              if (dynamics.growthOpportunities.isNotEmpty) ...[
                _buildGrowthSection(context, dynamics),
                const SizedBox(height: 16),
              ],
              _buildTipsSection(context, dynamics),
            ],
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => _buildErrorState(context, error),
    );
  }

  Widget _buildOverviewCard(BuildContext context, RelationshipDynamic dynamics) {
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
                    Icons.favorite,
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
                        'Relationship Health',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      Text(
                        'Based on ${dynamics.sessionsAnalyzed} conversations',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                    ],
                  ),
                ),
                _buildHealthBadge(context, dynamics),
              ],
            ),
            if (dynamics.positiveToNegativeRatio != null) ...[
              const SizedBox(height: 16),
              _buildGottmanIndicator(context, dynamics),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildHealthBadge(BuildContext context, RelationshipDynamic dynamics) {
    final ratio = dynamics.positiveToNegativeRatio ?? 0;
    final isHealthy = ratio >= 5.0;
    final color = isHealthy ? AppColors.greenCard : AppColors.yellowCard;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        isHealthy ? 'Healthy' : 'Growing',
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
      ),
    );
  }

  Widget _buildGottmanIndicator(
      BuildContext context, RelationshipDynamic dynamics) {
    final ratio = dynamics.positiveToNegativeRatio!;
    final target = 5.0;
    final progress = (ratio / target).clamp(0.0, 1.2);
    final isHealthy = ratio >= target;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Positive-to-Negative Ratio',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            Text(
              '${ratio.toStringAsFixed(1)}:1',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: isHealthy ? AppColors.greenCard : AppColors.yellowCard,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Stack(
          children: [
            Container(
              height: 8,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            FractionallySizedBox(
              widthFactor: progress.clamp(0.0, 1.0),
              child: Container(
                height: 8,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isHealthy
                        ? [AppColors.greenCard, AppColors.greenCard.withValues(alpha: 0.7)]
                        : [AppColors.yellowCard, AppColors.warning],
                  ),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
            Positioned(
              left: MediaQuery.of(context).size.width * 0.7 - 32,
              child: Container(
                width: 2,
                height: 8,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          isHealthy
              ? 'Great job! You\'re meeting the 5:1 Gottman target.'
              : 'Aim for 5:1 ratio - try more appreciation and affection.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondary,
                fontStyle: FontStyle.italic,
              ),
        ),
      ],
    );
  }

  Widget _buildNarrativeCard(
      BuildContext context, RelationshipDynamic dynamics) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.auto_stories, color: AppColors.primary),
                const SizedBox(width: 8),
                Text(
                  'Your Relationship Story',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              dynamics.dynamicNarrative!,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    height: 1.6,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCoachingFocusCard(
      BuildContext context, RelationshipDynamic dynamics) {
    return Card(
      color: AppColors.primary.withValues(alpha: 0.05),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.school, color: AppColors.primary, size: 20),
                ),
                const SizedBox(width: 12),
                Text(
                  'This Week\'s Focus',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              dynamics.coachingFocus!,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    height: 1.5,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStrengthsSection(
      BuildContext context, RelationshipDynamic dynamics) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.star, color: AppColors.greenCard),
            const SizedBox(width: 8),
            Text(
              'Your Strengths',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: dynamics.relationshipStrengths.map((strength) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.greenCard.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: AppColors.greenCard.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle,
                      size: 16, color: AppColors.greenCard),
                  const SizedBox(width: 6),
                  Text(
                    _formatStrengthName(strength),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.greenCard,
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
        if (dynamics.strengthDescriptions.isNotEmpty) ...[
          const SizedBox(height: 12),
          ...dynamics.strengthDescriptions.map((desc) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          desc.title,
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          desc.description,
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.textSecondary,
                                  ),
                        ),
                      ],
                    ),
                  ),
                ),
              )),
        ],
      ],
    );
  }

  Widget _buildGrowthSection(
      BuildContext context, RelationshipDynamic dynamics) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.trending_up, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(
              'Growth Opportunities',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: dynamics.growthOpportunities.map((opportunity) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.arrow_upward, size: 16, color: AppColors.primary),
                  const SizedBox(width: 6),
                  Text(
                    _formatStrengthName(opportunity),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
        if (dynamics.growthDescriptions.isNotEmpty) ...[
          const SizedBox(height: 12),
          ...dynamics.growthDescriptions.map((desc) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          desc.title,
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          desc.description,
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.textSecondary,
                                  ),
                        ),
                      ],
                    ),
                  ),
                ),
              )),
        ],
      ],
    );
  }

  Widget _buildTipsSection(BuildContext context, RelationshipDynamic dynamics) {
    final tips = _generateTips(dynamics);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.tips_and_updates, color: AppColors.yellowCard),
            const SizedBox(width: 8),
            Text(
              'Quick Tips',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...tips.map((tip) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(tip.icon, size: 20, color: tip.color),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              tip.title,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              tip.description,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    color: AppColors.textSecondary,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            )),
      ],
    );
  }

  List<_CoachingTip> _generateTips(RelationshipDynamic dynamics) {
    final tips = <_CoachingTip>[];

    // Gottman ratio tip
    if (dynamics.positiveToNegativeRatio != null &&
        dynamics.positiveToNegativeRatio! < 5.0) {
      tips.add(_CoachingTip(
        title: 'Increase Positive Interactions',
        description:
            'Try expressing appreciation, giving compliments, or planning enjoyable activities together.',
        icon: Icons.favorite,
        color: AppColors.redCard,
      ));
    }

    // Pursuer-withdrawer tip
    if (dynamics.pursuerWithdrawer == true) {
      tips.add(_CoachingTip(
        title: 'Break the Pursue-Withdraw Cycle',
        description:
            'The pursuer can try softening their approach; the withdrawer can practice staying engaged.',
        icon: Icons.swap_horiz,
        color: AppColors.warning,
      ));
    }

    // De-escalation tip
    if (dynamics.deescalationSkill != null &&
        dynamics.deescalationSkill! < 50) {
      tips.add(_CoachingTip(
        title: 'Practice De-escalation',
        description:
            'Take breaks when emotions run high. Use "I" statements instead of "you" accusations.',
        icon: Icons.air,
        color: AppColors.info,
      ));
    }

    // Validation tip
    if (dynamics.validationBalance != null &&
        dynamics.validationBalance! < 60) {
      tips.add(_CoachingTip(
        title: 'Validate Each Other\'s Feelings',
        description:
            'Before problem-solving, acknowledge your partner\'s emotions: "I can see why you feel that way."',
        icon: Icons.verified,
        color: AppColors.primary,
      ));
    }

    // Default tips if no specific ones
    if (tips.isEmpty) {
      tips.addAll([
        _CoachingTip(
          title: 'Express Gratitude Daily',
          description:
              'Share one thing you appreciate about your partner each day.',
          icon: Icons.favorite,
          color: AppColors.greenCard,
        ),
        _CoachingTip(
          title: 'Schedule Quality Time',
          description: 'Set aside distraction-free time to connect each week.',
          icon: Icons.schedule,
          color: AppColors.primary,
        ),
      ]);
    }

    return tips;
  }

  String _formatStrengthName(String name) {
    return name
        .split('_')
        .map((word) => word.isEmpty
            ? word
            : word[0].toUpperCase() + word.substring(1).toLowerCase())
        .join(' ');
  }
}

class _CoachingTip {
  final String title;
  final String description;
  final IconData icon;
  final Color color;

  _CoachingTip({
    required this.title,
    required this.description,
    required this.icon,
    required this.color,
  });
}

Widget _buildEmptyState(BuildContext context) {
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.school_outlined, size: 64, color: AppColors.textSecondary),
          const SizedBox(height: 16),
          Text(
            'No Coaching Data Yet',
            style: Theme.of(context).textTheme.titleLarge,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Import conversations to get personalized relationship coaching based on your communication patterns.',
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
            'Failed to load coaching',
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
