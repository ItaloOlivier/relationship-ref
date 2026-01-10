import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/relationship_model.dart';
import '../../data/relationship_repository.dart';

/// Screen displaying all relationships for the current user
class RelationshipListScreen extends ConsumerWidget {
  const RelationshipListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final relationshipsAsync = ref.watch(relationshipsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Relationships'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showCreateDialog(context, ref),
            tooltip: 'Create Relationship',
          ),
          IconButton(
            icon: const Icon(Icons.group_add),
            onPressed: () => _showJoinDialog(context, ref),
            tooltip: 'Join Relationship',
          ),
        ],
      ),
      body: relationshipsAsync.when(
        data: (relationships) {
          if (relationships.isEmpty) {
            return _buildEmptyState(context);
          }

          // Group by type
          final grouped = <RelationshipType, List<Relationship>>{};
          for (final rel in relationships) {
            grouped.putIfAbsent(rel.type, () => []).add(rel);
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: grouped.length,
            itemBuilder: (context, index) {
              final type = grouped.keys.elementAt(index);
              final rels = grouped[type]!;
              return _RelationshipTypeSection(
                type: type,
                relationships: rels,
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: AppColors.error),
              const SizedBox(height: 16),
              Text(
                'Failed to load relationships',
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
                onPressed: () => ref.refresh(relationshipsProvider),
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.people_outline,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 24),
            Text(
              'No Relationships Yet',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 12),
            Text(
              'Create a new relationship or join an existing one to get started',
              style: Theme.of(context).textTheme.bodyLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton.icon(
                  onPressed: () => _showCreateDialog(context, null),
                  icon: const Icon(Icons.add),
                  label: const Text('Create'),
                ),
                const SizedBox(width: 16),
                OutlinedButton.icon(
                  onPressed: () => _showJoinDialog(context, null),
                  icon: const Icon(Icons.group_add),
                  label: const Text('Join'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showCreateDialog(BuildContext context, WidgetRef? ref) {
    // TODO: Implement create relationship dialog
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Create relationship - Coming soon')),
    );
  }

  void _showJoinDialog(BuildContext context, WidgetRef? ref) {
    // TODO: Implement join relationship dialog
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Join relationship - Coming soon')),
    );
  }
}

class _RelationshipTypeSection extends StatelessWidget {
  final RelationshipType type;
  final List<Relationship> relationships;

  const _RelationshipTypeSection({
    required this.type,
    required this.relationships,
  });

  String _getTypeLabel() {
    switch (type) {
      case RelationshipType.romanticCouple:
        return 'Romantic';
      case RelationshipType.friendship:
        return 'Friendships';
      case RelationshipType.familyParentChild:
      case RelationshipType.familySiblings:
      case RelationshipType.familyExtended:
        return 'Family';
      case RelationshipType.businessPartners:
      case RelationshipType.coworkers:
        return 'Professional';
      case RelationshipType.mentorMentee:
        return 'Mentorship';
      case RelationshipType.roommates:
        return 'Roommates';
      case RelationshipType.neighbors:
        return 'Neighbors';
      case RelationshipType.groupChat:
        return 'Group Chats';
    }
  }

  IconData _getTypeIcon() {
    switch (type) {
      case RelationshipType.romanticCouple:
        return Icons.favorite;
      case RelationshipType.friendship:
        return Icons.people;
      case RelationshipType.familyParentChild:
      case RelationshipType.familySiblings:
      case RelationshipType.familyExtended:
        return Icons.family_restroom;
      case RelationshipType.businessPartners:
      case RelationshipType.coworkers:
        return Icons.business;
      case RelationshipType.mentorMentee:
        return Icons.school;
      case RelationshipType.roommates:
        return Icons.home;
      case RelationshipType.neighbors:
        return Icons.location_city;
      case RelationshipType.groupChat:
        return Icons.groups;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 12),
          child: Row(
            children: [
              Icon(_getTypeIcon(), size: 20, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                _getTypeLabel(),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ],
          ),
        ),
        ...relationships.map(
          (rel) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _RelationshipCard(relationship: rel),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _RelationshipCard extends ConsumerWidget {
  final Relationship relationship;

  const _RelationshipCard({required this.relationship});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      child: InkWell(
        onTap: () => context.push('/relationships/${relationship.id}'),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Name + Status
              Row(
                children: [
                  Expanded(
                    child: Text(
                      relationship.displayName,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  _StatusBadge(status: relationship.status),
                ],
              ),
              const SizedBox(height: 12),

              // Members
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: relationship.activeMembers.map((member) {
                  return Chip(
                    avatar: CircleAvatar(
                      backgroundColor: AppColors.primary.withValues(alpha: 0.2),
                      child: Text(
                        member.user.name?.isNotEmpty == true
                            ? member.user.name![0].toUpperCase()
                            : member.user.email[0].toUpperCase(),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    label: Text(
                      member.user.name ?? member.user.email.split('@')[0],
                      style: const TextStyle(fontSize: 13),
                    ),
                    backgroundColor: AppColors.surface,
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),

              // Footer: Sessions count + Invite code
              Row(
                children: [
                  Icon(Icons.chat_bubble_outline, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    '${relationship.sessionsCount} session${relationship.sessionsCount != 1 ? 's' : ''}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const Spacer(),
                  if (relationship.status == RelationshipStatus.active) ...[
                    Icon(Icons.code, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      relationship.inviteCode,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final RelationshipStatus status;

  const _StatusBadge({required this.status});

  Color _getStatusColor() {
    switch (status) {
      case RelationshipStatus.active:
        return AppColors.greenCard;
      case RelationshipStatus.paused:
        return AppColors.yellowCard;
      case RelationshipStatus.endedMutual:
      case RelationshipStatus.endedUnilateral:
      case RelationshipStatus.archived:
        return AppColors.redCard;
    }
  }

  String _getStatusLabel() {
    switch (status) {
      case RelationshipStatus.active:
        return 'Active';
      case RelationshipStatus.paused:
        return 'Paused';
      case RelationshipStatus.endedMutual:
        return 'Ended';
      case RelationshipStatus.endedUnilateral:
        return 'Ended';
      case RelationshipStatus.archived:
        return 'Archived';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _getStatusColor().withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _getStatusColor().withValues(alpha: 0.3),
        ),
      ),
      child: Text(
        _getStatusLabel(),
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: _getStatusColor(),
        ),
      ),
    );
  }
}
