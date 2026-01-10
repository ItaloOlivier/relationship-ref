import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/auth/auth_provider.dart';
import '../../../../core/ui/skeleton_loading.dart';
import '../../../../core/ui/celebration_animations.dart';
import '../../../gamification/data/gamification_repository.dart';
import '../../../session/data/session_repository.dart';
import '../../../session/domain/session_model.dart';
import '../../../insights/data/insights_repository.dart';
import '../../../insights/presentation/widgets/insights_summary_card.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Relationship Referee'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: () => context.push('/history'),
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardProvider);
          ref.invalidate(sessionsProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome header
              Text(
                'Welcome back${user?.name != null ? ', ${user!.name}' : ''}!',
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              const SizedBox(height: 24),

              // Emotional Bank Card
              _EmotionalBankCard(),
              const SizedBox(height: 16),

              // Streak & Quests Row
              Row(
                children: [
                  Expanded(child: _StreakCard()),
                  const SizedBox(width: 16),
                  Expanded(child: _QuestsCard()),
                ],
              ),
              const SizedBox(height: 16),

              // Insights Summary Card
              _InsightsSummarySection(),
              const SizedBox(height: 24),

              // Start Session Button
              _StartSessionButton(),
              const SizedBox(height: 12),

              // Import WhatsApp Chat Button
              _ImportChatButton(),
              const SizedBox(height: 24),

              // Recent Sessions
              Text(
                'Recent Sessions',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              _RecentSessionsList(),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmotionalBankCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsync = ref.watch(dashboardProvider);

    return dashboardAsync.when(
      data: (dashboard) {
        final balance = dashboard.emotionalBankBalance;
        final isPositive = balance >= 0;

        return Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.account_balance_wallet_rounded,
                      color: AppColors.primary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Love Bank',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      isPositive ? '+$balance' : '$balance',
                      style: Theme.of(context).textTheme.displayMedium?.copyWith(
                            color: isPositive
                                ? AppColors.bankPositive
                                : AppColors.bankNegative,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(width: 8),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text(
                        'points',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: ((balance + 100) / 200).clamp(0.0, 1.0),
                  backgroundColor: AppColors.border,
                  valueColor: AlwaysStoppedAnimation(
                    isPositive ? AppColors.bankPositive : AppColors.bankNegative,
                  ),
                ),
              ],
            ),
          ),
        );
      },
      loading: () => const EmotionalBankSkeleton(),
      error: (_, __) => Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.account_balance_wallet_rounded, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Text('Love Bank', style: Theme.of(context).textTheme.titleMedium),
                ],
              ),
              const SizedBox(height: 16),
              Text('0 points', style: Theme.of(context).textTheme.displayMedium),
            ],
          ),
        ),
      ),
    );
  }
}

class _StreakCard extends ConsumerStatefulWidget {
  @override
  ConsumerState<_StreakCard> createState() => _StreakCardState();
}

class _StreakCardState extends ConsumerState<_StreakCard> {
  int? _previousStreak;

  void _checkStreakMilestone(BuildContext context, int currentStreak) {
    // Only celebrate if streak increased
    if (_previousStreak != null && currentStreak > _previousStreak!) {
      CelebrationType? celebrationType;
      String? message;

      if (currentStreak == 7) {
        celebrationType = CelebrationType.streakMilestone;
        message = '7-Day Streak! 🔥\nYou\'re on fire!';
      } else if (currentStreak == 30) {
        celebrationType = CelebrationType.streakMajor;
        message = '30-Day Streak! 🏆\nIncredible dedication!';
      } else if (currentStreak == 100) {
        celebrationType = CelebrationType.streakLegendary;
        message = '100-Day Streak! 👑\nYou\'re a legend!';
      }

      if (celebrationType != null && message != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            CelebrationService.celebrate(context, celebrationType!, message: message);
          }
        });
      }
    }

    _previousStreak = currentStreak;
  }

  @override
  Widget build(BuildContext context) {
    final dashboardAsync = ref.watch(dashboardProvider);

    return dashboardAsync.when(
      data: (dashboard) {
        final streak = dashboard.streak;
        _checkStreakMilestone(context, streak);

        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                const Icon(
                  Icons.local_fire_department_rounded,
                  color: Colors.orange,
                  size: 32,
                ),
                const SizedBox(height: 8),
                Text(
                  '$streak',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                Text(
                  'Day Streak',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        );
      },
      loading: () => const StatCardSkeleton(),
      error: (_, __) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              const Icon(Icons.local_fire_department_rounded, color: Colors.orange, size: 32),
              const SizedBox(height: 8),
              Text('0', style: Theme.of(context).textTheme.headlineLarge),
              Text('Day Streak', style: Theme.of(context).textTheme.bodyMedium),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuestsCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsync = ref.watch(dashboardProvider);

    return dashboardAsync.when(
      data: (dashboard) {
        final completed = dashboard.activeQuests.where((q) => q.isCompleted).length;
        final total = dashboard.activeQuests.length;

        return Card(
          child: InkWell(
            onTap: () => context.push('/gamification'),
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const Icon(
                    Icons.emoji_events_rounded,
                    color: AppColors.yellowCard,
                    size: 32,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    total > 0 ? '$completed/$total' : '0',
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  Text(
                    'Quests Today',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
          ),
        );
      },
      loading: () => const StatCardSkeleton(),
      error: (_, __) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              const Icon(Icons.emoji_events_rounded, color: AppColors.yellowCard, size: 32),
              const SizedBox(height: 8),
              Text('0', style: Theme.of(context).textTheme.headlineLarge),
              Text('Quests Today', style: Theme.of(context).textTheme.bodyMedium),
            ],
          ),
        ),
      ),
    );
  }
}

class _StartSessionButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 120,
      child: Card(
        color: AppColors.primary,
        child: InkWell(
          onTap: () => context.push('/home/session'),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.mic_rounded,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Start Coach Session',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Record and analyze a conversation',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.8),
                            ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: Colors.white,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ImportChatButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () => context.push('/home/import-chat'),
        icon: const Icon(Icons.chat_bubble_outline),
        label: const Text('Import WhatsApp Chat'),
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
    );
  }
}

class _RecentSessionsList extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionsAsync = ref.watch(sessionsProvider((page: 1, limit: 3)));

    return sessionsAsync.when(
      data: (response) {
        final sessions = response.sessions;

        if (sessions.isEmpty) {
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.chat_bubble_outline_rounded,
                      size: 48,
                      color: AppColors.textSecondary,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'No sessions yet',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Start your first coach session!',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        return Column(
          children: [
            ...sessions.take(3).map((session) => _SessionListItem(session: session)),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => context.push('/history'),
              child: const Text('View All Sessions'),
            ),
          ],
        );
      },
      loading: () => const RecentSessionsSkeleton(),
      error: (error, __) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text('Failed to load sessions'),
        ),
      ),
    );
  }
}

class _SessionListItem extends StatelessWidget {
  final Session session;

  const _SessionListItem({required this.session});

  @override
  Widget build(BuildContext context) {
    final score = session.analysisResult?.overallScore;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppColors.primary.withValues(alpha: 0.1),
          child: score != null
              ? Text(
                  '$score',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                )
              : Icon(Icons.mic, color: AppColors.primary),
        ),
        title: Text(_formatDate(session.createdAt)),
        subtitle: Text(
          session.status == SessionStatus.completed
              ? '${(session.durationSecs ?? 0) ~/ 60} min session'
              : 'Processing...',
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => context.push('/history/report/${session.id}'),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays == 0) {
      return 'Today ${DateFormat('h:mm a').format(date)}';
    } else if (diff.inDays == 1) {
      return 'Yesterday';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} days ago';
    } else {
      return DateFormat('MMM d').format(date);
    }
  }
}

class _InsightsSummarySection extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(insightsSummaryProvider);

    return summaryAsync.when(
      data: (summary) {
        // Only show if there are enough sessions for meaningful insights
        if (summary.totalSessions < 2) {
          return const SizedBox.shrink();
        }

        return InsightsSummaryCard(
          summary: summary,
          onTap: () => context.push('/home/insights'),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}
