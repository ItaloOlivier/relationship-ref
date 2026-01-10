import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../session/domain/session_model.dart';

/// Displays individual scorecards for each participant in a session.
/// Shows per-speaker metrics including card counts, personal score, horsemen, and repair attempts.
class IndividualScorecardSection extends StatelessWidget {
  final List<IndividualScore> scores;

  const IndividualScorecardSection({
    super.key,
    required this.scores,
  });

  @override
  Widget build(BuildContext context) {
    if (scores.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Individual Scorecards',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        Text(
          'How each person contributed to the conversation',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[600],
              ),
        ),
        const SizedBox(height: 16),
        ...scores.map((score) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _IndividualScorecardCard(score: score),
            )),
      ],
    );
  }
}

class _IndividualScorecardCard extends StatelessWidget {
  final IndividualScore score;

  const _IndividualScorecardCard({required this.score});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: Name + Personal Score
            Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  child: Text(
                    score.speaker.isNotEmpty
                        ? score.speaker[0].toUpperCase()
                        : '?',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        score.speaker,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Personal Score',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey[600],
                            ),
                      ),
                    ],
                  ),
                ),
                _PersonalScoreGauge(score: score.personalScore),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 16),

            // Card Counts
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _CardCountBadge(
                  count: score.greenCardCount,
                  color: AppColors.greenCard,
                  label: 'Green',
                  icon: Icons.check_circle,
                ),
                _CardCountBadge(
                  count: score.yellowCardCount,
                  color: AppColors.yellowCard,
                  label: 'Yellow',
                  icon: Icons.warning_rounded,
                ),
                _CardCountBadge(
                  count: score.redCardCount,
                  color: AppColors.redCard,
                  label: 'Red',
                  icon: Icons.error,
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Bank Contribution
            _BankContributionRow(contribution: score.bankContribution),
            const SizedBox(height: 12),

            // Repair Attempts
            if (score.repairAttemptCount > 0) ...[
              _RepairAttemptsRow(count: score.repairAttemptCount),
              const SizedBox(height: 12),
            ],

            // Horsemen Used
            if (score.horsemenUsed.isNotEmpty) ...[
              const SizedBox(height: 8),
              _HorsemenSection(horsemen: score.horsemenUsed),
            ],
          ],
        ),
      ),
    );
  }
}

class _PersonalScoreGauge extends StatelessWidget {
  final int score;

  const _PersonalScoreGauge({required this.score});

  Color _getScoreColor() {
    if (score >= 80) return AppColors.greenCard;
    if (score >= 60) return AppColors.yellowCard;
    return AppColors.redCard;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: _getScoreColor(),
          width: 4,
        ),
      ),
      child: Center(
        child: Text(
          '$score',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: _getScoreColor(),
                fontWeight: FontWeight.bold,
              ),
        ),
      ),
    );
  }
}

class _CardCountBadge extends StatelessWidget {
  final int count;
  final Color color;
  final String label;
  final IconData icon;

  const _CardCountBadge({
    required this.count,
    required this.color,
    required this.label,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Icon(
              icon,
              color: color,
              size: 28,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '$count',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[600],
              ),
        ),
      ],
    );
  }
}

class _BankContributionRow extends StatelessWidget {
  final int contribution;

  const _BankContributionRow({required this.contribution});

  @override
  Widget build(BuildContext context) {
    final isPositive = contribution >= 0;
    final color = isPositive ? AppColors.greenCard : AppColors.redCard;
    final icon = isPositive ? Icons.trending_up : Icons.trending_down;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 8),
          Text(
            'Emotional Bank',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const Spacer(),
          Text(
            '${isPositive ? '+' : ''}$contribution pts',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: color,
                  fontWeight: FontWeight.bold,
                ),
          ),
        ],
      ),
    );
  }
}

class _RepairAttemptsRow extends StatelessWidget {
  final int count;

  const _RepairAttemptsRow({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          const Icon(Icons.healing_rounded, color: AppColors.primary, size: 20),
          const SizedBox(width: 8),
          Text(
            'Repair Attempts',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const Spacer(),
          Text(
            '$count',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                ),
          ),
        ],
      ),
    );
  }
}

class _HorsemenSection extends StatelessWidget {
  final List<String> horsemen;

  const _HorsemenSection({required this.horsemen});

  IconData _getHorsemanIcon(String horseman) {
    switch (horseman.toLowerCase()) {
      case 'criticism':
        return Icons.chat_bubble_outline;
      case 'contempt':
        return Icons.sentiment_very_dissatisfied;
      case 'defensiveness':
        return Icons.shield_outlined;
      case 'stonewalling':
        return Icons.block;
      default:
        return Icons.warning_amber_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.warning_amber_rounded, size: 18, color: AppColors.redCard),
            const SizedBox(width: 6),
            Text(
              'Four Horsemen Detected',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.redCard,
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: horsemen.map((horseman) {
            return Chip(
              avatar: Icon(
                _getHorsemanIcon(horseman),
                size: 16,
                color: AppColors.redCard,
              ),
              label: Text(
                horseman,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
              backgroundColor: AppColors.redCard.withValues(alpha: 0.1),
              side: BorderSide(color: AppColors.redCard.withValues(alpha: 0.3)),
            );
          }).toList(),
        ),
      ],
    );
  }
}
