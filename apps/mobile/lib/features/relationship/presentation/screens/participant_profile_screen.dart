import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/api/api_service.dart';

/// Model for participant profile in relationship context
class ParticipantProfile {
  final UserInfo user;
  final RelationshipContext relationshipContext;
  final ParticipantMetrics metrics;

  ParticipantProfile({
    required this.user,
    required this.relationshipContext,
    required this.metrics,
  });

  factory ParticipantProfile.fromJson(Map<String, dynamic> json) {
    return ParticipantProfile(
      user: UserInfo.fromJson(json['user'] as Map<String, dynamic>),
      relationshipContext: RelationshipContext.fromJson(
          json['relationshipContext'] as Map<String, dynamic>),
      metrics:
          ParticipantMetrics.fromJson(json['metrics'] as Map<String, dynamic>),
    );
  }
}

class UserInfo {
  final String id;
  final String? name;
  final String email;
  final String? avatarUrl;

  UserInfo({
    required this.id,
    this.name,
    required this.email,
    this.avatarUrl,
  });

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(
      id: json['id'] as String,
      name: json['name'] as String?,
      email: json['email'] as String,
      avatarUrl: json['avatarUrl'] as String?,
    );
  }
}

class RelationshipContext {
  final String relationshipId;
  final String relationshipType;
  final String? relationshipName;

  RelationshipContext({
    required this.relationshipId,
    required this.relationshipType,
    this.relationshipName,
  });

  factory RelationshipContext.fromJson(Map<String, dynamic> json) {
    return RelationshipContext(
      relationshipId: json['relationshipId'] as String,
      relationshipType: json['relationshipType'] as String,
      relationshipName: json['relationshipName'] as String?,
    );
  }
}

class ParticipantMetrics {
  final int sessionsCount;
  final int? avgPersonalScore;
  final int totalGreenCards;
  final int totalYellowCards;
  final int totalRedCards;
  final List<String> horsemenUsed;
  final int totalRepairAttempts;

  ParticipantMetrics({
    required this.sessionsCount,
    this.avgPersonalScore,
    required this.totalGreenCards,
    required this.totalYellowCards,
    required this.totalRedCards,
    required this.horsemenUsed,
    required this.totalRepairAttempts,
  });

  factory ParticipantMetrics.fromJson(Map<String, dynamic> json) {
    return ParticipantMetrics(
      sessionsCount: json['sessionsCount'] as int,
      avgPersonalScore: json['avgPersonalScore'] as int?,
      totalGreenCards: json['totalGreenCards'] as int,
      totalYellowCards: json['totalYellowCards'] as int,
      totalRedCards: json['totalRedCards'] as int,
      horsemenUsed: (json['horsemenUsed'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      totalRepairAttempts: json['totalRepairAttempts'] as int,
    );
  }

  int get totalCards => totalGreenCards + totalYellowCards + totalRedCards;

  double get greenCardRatio =>
      totalCards > 0 ? (totalGreenCards / totalCards) * 100 : 0;
}

/// Provider for participant profile in relationship context
final participantProfileProvider = FutureProvider.family
    .autoDispose<ParticipantProfile, ({String userId, String relationshipId})>(
  (ref, params) async {
    final usersApi = ref.watch(usersApiProvider);
    final data = await usersApi.getUserProfileInRelationship(
      params.userId,
      params.relationshipId,
    );
    return ParticipantProfile.fromJson(data);
  },
);

/// Screen showing participant's metrics in a specific relationship
class ParticipantProfileScreen extends ConsumerWidget {
  final String userId;
  final String relationshipId;

  const ParticipantProfileScreen({
    super.key,
    required this.userId,
    required this.relationshipId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(
      participantProfileProvider((userId: userId, relationshipId: relationshipId)),
    );

    return Scaffold(
      appBar: AppBar(
        title: profileAsync.when(
          data: (profile) =>
              Text(profile.user.name ?? profile.user.email.split('@')[0]),
          loading: () => const Text('Loading...'),
          error: (_, __) => const Text('Profile'),
        ),
      ),
      body: profileAsync.when(
        data: (profile) => _buildContent(context, profile),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline, size: 64, color: AppColors.error),
                const SizedBox(height: 16),
                Text(
                  'Failed to load profile',
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
                  onPressed: () => ref.refresh(participantProfileProvider(
                      (userId: userId, relationshipId: relationshipId))),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, ParticipantProfile profile) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User Header
          _UserHeader(user: profile.user),
          const SizedBox(height: 16),

          // Relationship Context Badge
          _RelationshipContextBadge(context: profile.relationshipContext),
          const SizedBox(height: 24),

          // Personal Score Card
          if (profile.metrics.avgPersonalScore != null)
            _PersonalScoreCard(score: profile.metrics.avgPersonalScore!),
          const SizedBox(height: 16),

          // Card Distribution
          _CardDistributionCard(metrics: profile.metrics),
          const SizedBox(height: 16),

          // Communication Patterns
          _CommunicationPatternsCard(metrics: profile.metrics),
          const SizedBox(height: 16),

          // Session Summary
          _SessionSummaryCard(sessionsCount: profile.metrics.sessionsCount),
        ],
      ),
    );
  }
}

class _UserHeader extends StatelessWidget {
  final UserInfo user;

  const _UserHeader({required this.user});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          radius: 40,
          backgroundColor: AppColors.primary.withValues(alpha: 0.2),
          child: Text(
            user.name?.isNotEmpty == true
                ? user.name![0].toUpperCase()
                : user.email[0].toUpperCase(),
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                user.name ?? user.email.split('@')[0],
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 4),
              Text(
                user.email,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _RelationshipContextBadge extends StatelessWidget {
  final RelationshipContext context;

  const _RelationshipContextBadge({required this.context});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.people, size: 18, color: AppColors.primary),
          const SizedBox(width: 8),
          Text(
            'Metrics from: ${this.context.relationshipName ?? 'This Relationship'}',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}

class _PersonalScoreCard extends StatelessWidget {
  final int score;

  const _PersonalScoreCard({required this.score});

  Color _getScoreColor() {
    if (score >= 80) return AppColors.greenCard;
    if (score >= 60) return AppColors.yellowCard;
    return AppColors.redCard;
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(
              'Average Personal Score',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: _getScoreColor(),
                  width: 6,
                ),
              ),
              child: Center(
                child: Text(
                  '$score',
                  style: Theme.of(context).textTheme.displayLarge?.copyWith(
                        color: _getScoreColor(),
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              _getScoreLabel(),
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: _getScoreColor(),
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  String _getScoreLabel() {
    if (score >= 80) return 'Excellent Communication';
    if (score >= 60) return 'Good Communication';
    return 'Needs Improvement';
  }
}

class _CardDistributionCard extends StatelessWidget {
  final ParticipantMetrics metrics;

  const _CardDistributionCard({required this.metrics});

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
                Icon(Icons.insights, color: AppColors.primary, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Card Distribution',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: _CardStatColumn(
                    count: metrics.totalGreenCards,
                    label: 'Green',
                    color: AppColors.greenCard,
                    icon: Icons.check_circle,
                  ),
                ),
                Expanded(
                  child: _CardStatColumn(
                    count: metrics.totalYellowCards,
                    label: 'Yellow',
                    color: AppColors.yellowCard,
                    icon: Icons.warning_rounded,
                  ),
                ),
                Expanded(
                  child: _CardStatColumn(
                    count: metrics.totalRedCards,
                    label: 'Red',
                    color: AppColors.redCard,
                    icon: Icons.error,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Green card ratio bar
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Positive Ratio',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    Text(
                      '${metrics.greenCardRatio.toStringAsFixed(1)}%',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.greenCard,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: metrics.greenCardRatio / 100,
                    backgroundColor: Colors.grey[300],
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.greenCard),
                    minHeight: 8,
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

class _CardStatColumn extends StatelessWidget {
  final int count;
  final String label;
  final Color color;
  final IconData icon;

  const _CardStatColumn({
    required this.count,
    required this.label,
    required this.color,
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
            color: color.withValues(alpha: 0.15),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Icon(icon, color: color, size: 28),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '$count',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
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

class _CommunicationPatternsCard extends StatelessWidget {
  final ParticipantMetrics metrics;

  const _CommunicationPatternsCard({required this.metrics});

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
                Icon(Icons.psychology, color: AppColors.primary, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Communication Patterns',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Repair Attempts
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.healing_rounded, color: AppColors.primary),
              ),
              title: const Text('Repair Attempts'),
              trailing: Text(
                '${metrics.totalRepairAttempts}',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
              ),
            ),

            // Horsemen (if any)
            if (metrics.horsemenUsed.isNotEmpty) ...[
              const Divider(),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.warning_amber_rounded,
                      size: 18, color: AppColors.redCard),
                  const SizedBox(width: 6),
                  Text(
                    'Four Horsemen Detected',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.redCard,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: metrics.horsemenUsed.map((horseman) {
                  return Chip(
                    label: Text(
                      horseman,
                      style: const TextStyle(fontSize: 12),
                    ),
                    backgroundColor: AppColors.redCard.withValues(alpha: 0.1),
                    side: BorderSide(
                        color: AppColors.redCard.withValues(alpha: 0.3)),
                  );
                }).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SessionSummaryCard extends StatelessWidget {
  final int sessionsCount;

  const _SessionSummaryCard({required this.sessionsCount});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppColors.primary.withValues(alpha: 0.05),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.chat_bubble_outline, color: AppColors.primary),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Sessions Analyzed',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$sessionsCount session${sessionsCount != 1 ? 's' : ''}',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
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
