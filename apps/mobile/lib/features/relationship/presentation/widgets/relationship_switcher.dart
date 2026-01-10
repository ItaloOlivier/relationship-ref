import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/relationship_model.dart';
import '../providers/selected_relationship_provider.dart';

/// A dropdown selector for switching between relationships
class RelationshipSwitcher extends ConsumerWidget {
  const RelationshipSwitcher({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeRelationshipsAsync = ref.watch(activeRelationshipsProvider);
    final selectedId = ref.watch(selectedRelationshipIdProvider);

    return activeRelationshipsAsync.when(
      data: (relationships) {
        if (relationships.isEmpty) {
          return _EmptyState(
            onCreateTap: () => context.push('/settings/relationships'),
          );
        }

        // Auto-select first relationship if none selected
        if (selectedId == null && relationships.isNotEmpty) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            ref
                .read(selectedRelationshipIdProvider.notifier)
                .selectRelationship(relationships.first.id);
          });
        }

        final selectedRelationship =
            relationships.firstWhere((r) => r.id == selectedId, orElse: () => relationships.first);

        return Card(
          margin: EdgeInsets.zero,
          child: InkWell(
            onTap: () => _showRelationshipPicker(context, ref, relationships),
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  _RelationshipIcon(type: selectedRelationship.type),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          selectedRelationship.displayName,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${selectedRelationship.activeMembers.length} ${selectedRelationship.activeMembers.length == 1 ? 'member' : 'members'}',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                      ],
                    ),
                  ),
                  if (relationships.length > 1) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${relationships.length}',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ),
                    const Icon(Icons.swap_vert_rounded, size: 20),
                  ],
                ],
              ),
            ),
          ),
        );
      },
      loading: () => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: AppColors.border,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 120,
                      height: 16,
                      decoration: BoxDecoration(
                        color: AppColors.border,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      width: 80,
                      height: 12,
                      decoration: BoxDecoration(
                        color: AppColors.border,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      error: (_, __) => _EmptyState(
        onCreateTap: () => context.push('/settings/relationships'),
      ),
    );
  }

  void _showRelationshipPicker(BuildContext context, WidgetRef ref, List<Relationship> relationships) {
    showModalBottomSheet(
      context: context,
      builder: (context) => _RelationshipPickerSheet(relationships: relationships),
    );
  }
}

class _RelationshipIcon extends StatelessWidget {
  final RelationshipType type;

  const _RelationshipIcon({required this.type});

  @override
  Widget build(BuildContext context) {
    IconData icon;
    Color color;

    switch (type) {
      case RelationshipType.romanticCouple:
        icon = Icons.favorite_rounded;
        color = Colors.red;
        break;
      case RelationshipType.friendship:
        icon = Icons.people_rounded;
        color = Colors.blue;
        break;
      case RelationshipType.familyParentChild:
        icon = Icons.child_care_rounded;
        color = Colors.pink;
        break;
      case RelationshipType.familySiblings:
        icon = Icons.groups_rounded;
        color = Colors.indigo;
        break;
      case RelationshipType.familyExtended:
        icon = Icons.family_restroom_rounded;
        color = Colors.purple;
        break;
      case RelationshipType.businessPartners:
        icon = Icons.business_center_rounded;
        color = Colors.orange;
        break;
      case RelationshipType.coworkers:
        icon = Icons.badge_rounded;
        color = Colors.cyan;
        break;
      case RelationshipType.mentorMentee:
        icon = Icons.school_rounded;
        color = Colors.green;
        break;
      case RelationshipType.roommates:
        icon = Icons.home_rounded;
        color = Colors.brown;
        break;
      case RelationshipType.neighbors:
        icon = Icons.location_city_rounded;
        color = Colors.teal;
        break;
      case RelationshipType.groupChat:
        icon = Icons.forum_rounded;
        color = Colors.deepPurple;
        break;
    }

    return CircleAvatar(
      radius: 20,
      backgroundColor: color.withValues(alpha: 0.1),
      child: Icon(icon, color: color, size: 20),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final VoidCallback onCreateTap;

  const _EmptyState({required this.onCreateTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        onTap: onCreateTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(Icons.group_add_rounded, color: AppColors.textSecondary),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'No active relationships',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ),
              Icon(Icons.chevron_right, color: AppColors.textSecondary),
            ],
          ),
        ),
      ),
    );
  }
}

class _RelationshipPickerSheet extends ConsumerWidget {
  final List<Relationship> relationships;

  const _RelationshipPickerSheet({required this.relationships});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedId = ref.watch(selectedRelationshipIdProvider);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Text(
                  'Switch Relationship',
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
          const Divider(),
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: relationships.length,
              itemBuilder: (context, index) {
                final relationship = relationships[index];
                final isSelected = relationship.id == selectedId;

                return ListTile(
                  leading: _RelationshipIcon(type: relationship.type),
                  title: Text(
                    relationship.displayName,
                    style: TextStyle(
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  subtitle: Text('${relationship.activeMembers.length} members'),
                  trailing: isSelected
                      ? Icon(Icons.check_circle, color: AppColors.primary)
                      : null,
                  selected: isSelected,
                  onTap: () {
                    ref
                        .read(selectedRelationshipIdProvider.notifier)
                        .selectRelationship(relationship.id);
                    Navigator.pop(context);
                  },
                );
              },
            ),
          ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  context.push('/settings/relationships');
                },
                icon: const Icon(Icons.add),
                label: const Text('Manage Relationships'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
