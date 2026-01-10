import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/relationship_model.dart';
import '../../data/relationship_repository.dart';
import '../../../session/domain/session_model.dart';

/// Screen showing details for a specific relationship
class RelationshipDetailScreen extends ConsumerWidget {
  final String relationshipId;

  const RelationshipDetailScreen({
    super.key,
    required this.relationshipId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final relationshipAsync = ref.watch(relationshipProvider(relationshipId));

    return Scaffold(
      appBar: AppBar(
        title: relationshipAsync.when(
          data: (rel) => Text(rel.displayName),
          loading: () => const Text('Loading...'),
          error: (_, __) => const Text('Error'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () => _showOptionsMenu(context, ref),
          ),
        ],
      ),
      body: relationshipAsync.when(
        data: (relationship) => _buildContent(context, ref, relationship),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: AppColors.error),
              const SizedBox(height: 16),
              Text(
                'Failed to load relationship',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                error.toString(),
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref.refresh(relationshipProvider(relationshipId)),
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, Relationship relationship) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Health Card
          _HealthCard(relationshipId: relationshipId),
          const SizedBox(height: 16),

          // Members Section
          _MembersSection(relationship: relationship),
          const SizedBox(height: 16),

          // Sessions Section
          _SessionsSection(relationshipId: relationshipId),
          const SizedBox(height: 16),

          // Invite Code Card (only for active relationships)
          if (relationship.status == RelationshipStatus.active)
            _InviteCodeCard(inviteCode: relationship.inviteCode),
        ],
      ),
    );
  }

  void _showOptionsMenu(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.pause),
              title: const Text('Pause Relationship'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Implement pause
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Pause - Coming soon')),
                );
              },
            ),
            ListTile(
              leading: Icon(Icons.exit_to_app, color: AppColors.error),
              title: Text('Leave Relationship', style: TextStyle(color: AppColors.error)),
              onTap: () {
                Navigator.pop(context);
                // TODO: Implement leave
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Leave - Coming soon')),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _HealthCard extends ConsumerWidget {
  final String relationshipId;

  const _HealthCard({required this.relationshipId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final healthAsync = ref.watch(relationshipHealthProvider(relationshipId));

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: healthAsync.when(
          data: (health) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.favorite, color: AppColors.primary, size: 24),
                  const SizedBox(width: 8),
                  Text(
                    'Relationship Health',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Health Score
              if (health.healthScore != null) ...[
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Health Score',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Text(
                                '${health.healthScore}',
                                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                                      color: _getScoreColor(health.healthScore!),
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                              const SizedBox(width: 8),
                              if (health.trend != null)
                                _TrendIndicator(trend: health.trend!),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: _getScoreColor(health.healthScore!),
                          width: 4,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          '${health.greenCardRatio}%',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                color: _getScoreColor(health.healthScore!),
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],

              // Stats Row
              Row(
                children: [
                  Expanded(
                    child: _StatItem(
                      label: 'Sessions',
                      value: '${health.totalSessionCount}',
                      icon: Icons.chat_bubble_outline,
                    ),
                  ),
                  Expanded(
                    child: _StatItem(
                      label: 'Bank Balance',
                      value: '${health.emotionalBankBalance}',
                      icon: Icons.account_balance_wallet_outlined,
                      color: health.emotionalBankBalance >= 0
                          ? AppColors.greenCard
                          : AppColors.redCard,
                    ),
                  ),
                  Expanded(
                    child: _StatItem(
                      label: 'Recent',
                      value: '${health.recentSessionCount}',
                      icon: Icons.history,
                    ),
                  ),
                ],
              ),
            ],
          ),
          loading: () => const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: CircularProgressIndicator(),
            ),
          ),
          error: (_, __) => const Text('Failed to load health metrics'),
        ),
      ),
    );
  }

  Color _getScoreColor(int score) {
    if (score >= 80) return AppColors.greenCard;
    if (score >= 60) return AppColors.yellowCard;
    return AppColors.redCard;
  }
}

class _TrendIndicator extends StatelessWidget {
  final String trend;

  const _TrendIndicator({required this.trend});

  @override
  Widget build(BuildContext context) {
    IconData icon;
    Color color;

    switch (trend) {
      case 'improving':
        icon = Icons.trending_up;
        color = AppColors.greenCard;
        break;
      case 'declining':
        icon = Icons.trending_down;
        color = AppColors.redCard;
        break;
      case 'stable':
      default:
        icon = Icons.trending_flat;
        color = AppColors.yellowCard;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 4),
          Text(
            trend[0].toUpperCase() + trend.substring(1),
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color? color;

  const _StatItem({
    required this.label,
    required this.value,
    required this.icon,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: 20, color: color ?? Colors.grey[600]),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}

class _MembersSection extends StatelessWidget {
  final Relationship relationship;

  const _MembersSection({required this.relationship});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.people, color: AppColors.primary, size: 20),
            const SizedBox(width: 8),
            Text(
              'Members',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...relationship.activeMembers.map((member) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Card(
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: AppColors.primary.withValues(alpha: 0.2),
                    child: Text(
                      member.user.name?.isNotEmpty == true
                          ? member.user.name![0].toUpperCase()
                          : member.user.email[0].toUpperCase(),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                  title: Text(member.user.name ?? member.user.email.split('@')[0]),
                  subtitle: Text(member.user.email),
                  trailing: member.role != null
                      ? Chip(
                          label: Text(
                            member.role!.value,
                            style: const TextStyle(fontSize: 11),
                          ),
                          backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                        )
                      : null,
                  onTap: () {
                    // Navigate to participant profile
                    // context.push('/relationships/${relationship.id}/participants/${member.userId}');
                  },
                ),
              ),
            )),
      ],
    );
  }
}

class _SessionsSection extends ConsumerWidget {
  final String relationshipId;

  const _SessionsSection({required this.relationshipId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionsAsync = ref.watch(relationshipSessionsProvider(relationshipId));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.history, color: AppColors.primary, size: 20),
            const SizedBox(width: 8),
            Text(
              'Recent Sessions',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        sessionsAsync.when(
          data: (sessions) {
            if (sessions.isEmpty) {
              return const Card(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: Center(
                    child: Text('No sessions yet'),
                  ),
                ),
              );
            }

            // Show up to 5 most recent
            final recentSessions = sessions.take(5).toList();

            return Column(
              children: recentSessions.map((session) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _SessionCard(session: session),
                );
              }).toList(),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => const Text('Failed to load sessions'),
        ),
      ],
    );
  }
}

class _SessionCard extends StatelessWidget {
  final Session session;

  const _SessionCard({required this.session});

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM d, y');
    final timeFormat = DateFormat('h:mm a');

    return Card(
      child: InkWell(
        onTap: () => context.push('/sessions/${session.id}/report'),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              // Score indicator
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _getScoreColor(session.analysisResult?.overallScore)
                      .withValues(alpha: 0.1),
                ),
                child: Center(
                  child: Text(
                    '${session.analysisResult?.overallScore ?? '?'}',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: _getScoreColor(session.analysisResult?.overallScore),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Date and cards
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      dateFormat.format(session.createdAt),
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      timeFormat.format(session.createdAt),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),

              // Card counts
              if (session.analysisResult != null) ...[
                _CardCountChip(
                  count: session.analysisResult!.greenCardCount,
                  color: AppColors.greenCard,
                ),
                const SizedBox(width: 4),
                _CardCountChip(
                  count: session.analysisResult!.yellowCardCount,
                  color: AppColors.yellowCard,
                ),
                const SizedBox(width: 4),
                _CardCountChip(
                  count: session.analysisResult!.redCardCount,
                  color: AppColors.redCard,
                ),
              ],

              const SizedBox(width: 8),
              const Icon(Icons.chevron_right, size: 20),
            ],
          ),
        ),
      ),
    );
  }

  Color _getScoreColor(int? score) {
    if (score == null) return Colors.grey;
    if (score >= 80) return AppColors.greenCard;
    if (score >= 60) return AppColors.yellowCard;
    return AppColors.redCard;
  }
}

class _CardCountChip extends StatelessWidget {
  final int count;
  final Color color;

  const _CardCountChip({
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '$count',
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }
}

class _InviteCodeCard extends StatelessWidget {
  final String inviteCode;

  const _InviteCodeCard({required this.inviteCode});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppColors.primary.withValues(alpha: 0.05),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.group_add, color: AppColors.primary, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Invite Others',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Share this code to invite people to this relationship:',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Text(
                      inviteCode,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2,
                          ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.copy),
                  onPressed: () {
                    // TODO: Copy to clipboard
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Copied to clipboard')),
                    );
                  },
                  tooltip: 'Copy code',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
