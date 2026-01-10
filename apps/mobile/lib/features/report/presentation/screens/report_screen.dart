import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/ui/skeleton_loading.dart';
import '../../../../core/ui/celebration_animations.dart';
import '../../../../core/widgets/share_dialog.dart';
import '../../../session/domain/session_model.dart';
import '../../../session/data/session_repository.dart';
import '../../../session/presentation/widgets/qa_chat_section.dart';
import '../widgets/individual_scorecard_section.dart';

class ReportScreen extends ConsumerStatefulWidget {
  final String sessionId;

  const ReportScreen({super.key, required this.sessionId});

  @override
  ConsumerState<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends ConsumerState<ReportScreen> {
  bool _hasShownCelebration = false;

  void _checkForCelebration(BuildContext context, Session session) {
    if (_hasShownCelebration) return;

    final score = session.analysisResult?.overallScore;
    if (score == null) return;

    // Celebrate high scores (80+)
    if (score >= 80) {
      _hasShownCelebration = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          CelebrationService.celebrate(
            context,
            CelebrationType.highScore,
            message: 'Amazing Score! 🌟\nYou scored $score/100',
          );
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final sessionAsync = ref.watch(sessionProvider(widget.sessionId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Match Report'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => ShareDialog.session(sessionId: widget.sessionId),
              );
            },
          ),
        ],
      ),
      body: sessionAsync.when(
        data: (session) {
          _checkForCelebration(context, session);
          return _buildReport(context, session);
        },
        loading: () => const ReportSkeleton(),
        error: (error, stack) => _buildError(context, error),
      ),
    );
  }

  Widget _buildError(BuildContext context, Object error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: AppColors.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Failed to load report',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              error.toString(),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/home'),
              child: const Text('Return Home'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReport(BuildContext context, Session session) {
    final result = session.analysisResult;

    if (result == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(
              'Analysis in progress...',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Overall Score
          _OverallScoreCard(score: result.overallScore),
          const SizedBox(height: 16),

          // Cards Summary
          _CardsSummaryCard(
            green: result.greenCardCount,
            yellow: result.yellowCardCount,
            red: result.redCardCount,
          ),
          const SizedBox(height: 16),

          // Emotional Bank Change
          _BankChangeCard(change: result.bankChange),
          const SizedBox(height: 24),

          // Individual Scorecards
          if (result.individualScores.isNotEmpty) ...[
            IndividualScorecardSection(scores: result.individualScores),
            const SizedBox(height: 24),
          ],

          // Topic Tags
          if (result.topicTags.isNotEmpty) ...[
            Text(
              'Topics Discussed',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: result.topicTags.map((tag) {
                return Chip(
                  label: Text(tag),
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
          ],

          // Coaching Feedback
          Text(
            'Coaching Feedback',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),

          if (result.whatWentWell != null && result.whatWentWell!.isNotEmpty)
            _FeedbackCard(
              icon: Icons.thumb_up_rounded,
              title: 'What You Did Well',
              content: result.whatWentWell!,
              color: AppColors.greenCard,
            ),
          const SizedBox(height: 12),

          if (result.tryNextTime != null && result.tryNextTime!.isNotEmpty)
            _FeedbackCard(
              icon: Icons.lightbulb_rounded,
              title: 'Try This Next Time',
              content: result.tryNextTime!,
              color: AppColors.yellowCard,
            ),
          const SizedBox(height: 12),

          if (result.repairSuggestion != null && result.repairSuggestion!.isNotEmpty)
            _FeedbackCard(
              icon: Icons.healing_rounded,
              title: 'Repair Suggestion',
              content: result.repairSuggestion!,
              color: AppColors.primary,
            ),
          const SizedBox(height: 24),

          // Card Details
          if (result.cards.isNotEmpty) ...[
            Text(
              'Card Details',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            ...result.cards.map((card) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _CardDetailItem(card: card),
            )),
            const SizedBox(height: 12),
          ],

          // Safety Resources (only shown if flagged)
          if (result.safetyFlagTriggered) ...[
            _SafetyResourcesCard(resources: result.safetyResources),
            const SizedBox(height: 24),
          ],

          // Q&A Section
          QAChatSection(sessionId: session.id),
          const SizedBox(height: 24),

          // Actions
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    // Show transcript modal
                    _showTranscriptModal(context, session.transcript);
                  },
                  icon: const Icon(Icons.article),
                  label: const Text('Transcript'),
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
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  void _showTranscriptModal(BuildContext context, String? transcript) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Text(
                    'Transcript',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: SingleChildScrollView(
                controller: scrollController,
                padding: const EdgeInsets.all(16),
                child: Text(
                  transcript ?? 'No transcript available',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    height: 1.6,
                  ),
                ),
              ),
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
                    .withValues(alpha: 0.1),
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

class _CardDetailItem extends StatelessWidget {
  final SessionCard card;

  const _CardDetailItem({required this.card});

  Color _getCardColor() {
    switch (card.type) {
      case CardType.green:
        return AppColors.greenCard;
      case CardType.yellow:
        return AppColors.yellowCard;
      case CardType.red:
        return AppColors.redCard;
    }
  }

  IconData _getCardIcon() {
    switch (card.type) {
      case CardType.green:
        return Icons.check_circle;
      case CardType.yellow:
        return Icons.warning;
      case CardType.red:
        return Icons.cancel;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          left: BorderSide(
            color: _getCardColor(),
            width: 4,
          ),
        ),
        color: _getCardColor().withValues(alpha: 0.05),
        borderRadius: const BorderRadius.only(
          topRight: Radius.circular(8),
          bottomRight: Radius.circular(8),
        ),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(_getCardIcon(), color: _getCardColor(), size: 18),
              const SizedBox(width: 8),
              Text(
                card.category,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: _getCardColor(),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            card.reason,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          if (card.quote != null && card.quote!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                '"${card.quote}"',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _SafetyResourcesCard extends StatelessWidget {
  final SafetyResources? resources;

  const _SafetyResourcesCard({this.resources});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppColors.warning.withValues(alpha: 0.1),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.support_rounded, color: AppColors.warning),
                const SizedBox(width: 8),
                Text(
                  'Support Resources',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.warning,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              resources?.message ??
                'We noticed some concerning patterns in your conversation. '
                'If you or your partner need support, these resources may help.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (resources != null && resources!.resources.isNotEmpty) ...[
              const SizedBox(height: 16),
              ...resources!.resources.map((resource) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    const Icon(Icons.phone, size: 16),
                    const SizedBox(width: 8),
                    Text(resource.name),
                    const Spacer(),
                    Text(
                      resource.phone ?? '',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              )),
            ],
          ],
        ),
      ),
    );
  }
}
