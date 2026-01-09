import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';

class ReportScreen extends ConsumerWidget {
  final String sessionId;

  const ReportScreen({super.key, required this.sessionId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // TODO: Load actual report data
    return Scaffold(
      appBar: AppBar(
        title: const Text('Match Report'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () {
              // TODO: Share report
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Overall Score
            _OverallScoreCard(score: 75),
            const SizedBox(height: 16),

            // Cards Summary
            _CardsSummaryCard(green: 5, yellow: 2, red: 1),
            const SizedBox(height: 16),

            // Emotional Bank Change
            _BankChangeCard(change: 12),
            const SizedBox(height: 24),

            // Coaching Feedback
            Text(
              'Coaching Feedback',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),

            _FeedbackCard(
              icon: Icons.thumb_up_rounded,
              title: 'What You Did Well',
              content: 'You showed great empathy when your partner shared their concerns. The phrase "I understand how you feel" was particularly effective.',
              color: AppColors.greenCard,
            ),
            const SizedBox(height: 12),

            _FeedbackCard(
              icon: Icons.lightbulb_rounded,
              title: 'Try This Next Time',
              content: 'Instead of saying "you always," try using "I" statements like "I feel..." to express your emotions without blame.',
              color: AppColors.yellowCard,
            ),
            const SizedBox(height: 12),

            _FeedbackCard(
              icon: Icons.healing_rounded,
              title: 'Repair Suggestion',
              content: '"I know we\'re both stressed right now. Let\'s take a breath and try to understand each other better. I want us to work through this together."',
              color: AppColors.primary,
            ),
            const SizedBox(height: 24),

            // Safety Resources (only shown if flagged)
            // _SafetyResourcesCard(),

            // Actions
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      // TODO: View detailed analysis
                    },
                    icon: const Icon(Icons.analytics),
                    label: const Text('Details'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => context.go('/home'),
                    icon: const Icon(Icons.home),
                    label: const Text('Done'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _OverallScoreCard extends StatelessWidget {
  final int score;

  const _OverallScoreCard({required this.score});

  Color _getScoreColor() {
    if (score >= 70) return AppColors.greenCard;
    if (score >= 50) return AppColors.yellowCard;
    return AppColors.redCard;
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Session Score',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 120,
                  height: 120,
                  child: CircularProgressIndicator(
                    value: score / 100,
                    strokeWidth: 12,
                    backgroundColor: AppColors.border,
                    valueColor: AlwaysStoppedAnimation(_getScoreColor()),
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '$score',
                      style: Theme.of(context).textTheme.displayLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: _getScoreColor(),
                      ),
                    ),
                    Text(
                      '/100',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CardsSummaryCard extends StatelessWidget {
  final int green;
  final int yellow;
  final int red;

  const _CardsSummaryCard({
    required this.green,
    required this.yellow,
    required this.red,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Cards Received',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _CardCount(
                    count: green,
                    color: AppColors.greenCard,
                    label: 'Green',
                  ),
                ),
                Expanded(
                  child: _CardCount(
                    count: yellow,
                    color: AppColors.yellowCard,
                    label: 'Yellow',
                  ),
                ),
                Expanded(
                  child: _CardCount(
                    count: red,
                    color: AppColors.redCard,
                    label: 'Red',
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CardCount extends StatelessWidget {
  final int count;
  final Color color;
  final String label;

  const _CardCount({
    required this.count,
    required this.color,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 48,
          height: 64,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Text(
              '$count',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ],
    );
  }
}

class _BankChangeCard extends StatelessWidget {
  final int change;

  const _BankChangeCard({required this.change});

  @override
  Widget build(BuildContext context) {
    final isPositive = change >= 0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: (isPositive ? AppColors.bankPositive : AppColors.bankNegative)
                    .withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                isPositive ? Icons.trending_up : Icons.trending_down,
                color: isPositive ? AppColors.bankPositive : AppColors.bankNegative,
              ),
            ),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Love Bank',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text(
                  '${isPositive ? '+' : ''}$change points',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: isPositive ? AppColors.bankPositive : AppColors.bankNegative,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _FeedbackCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String content;
  final Color color;

  const _FeedbackCard({
    required this.icon,
    required this.title,
    required this.content,
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
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: color,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              content,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
