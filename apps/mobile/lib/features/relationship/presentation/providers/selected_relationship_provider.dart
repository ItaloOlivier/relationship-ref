import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/relationship_model.dart';
import '../../data/relationship_repository.dart';

/// State notifier for managing the currently selected relationship
class SelectedRelationshipNotifier extends StateNotifier<String?> {
  SelectedRelationshipNotifier() : super(null);

  void selectRelationship(String? relationshipId) {
    state = relationshipId;
  }

  void clearSelection() {
    state = null;
  }
}

/// Provider for the currently selected relationship ID
final selectedRelationshipIdProvider =
    StateNotifierProvider<SelectedRelationshipNotifier, String?>((ref) {
  return SelectedRelationshipNotifier();
});

/// Provider for the currently selected relationship (full object)
/// Returns null if no relationship is selected or if it doesn't exist
final selectedRelationshipProvider =
    FutureProvider<Relationship?>((ref) async {
  final selectedId = ref.watch(selectedRelationshipIdProvider);

  if (selectedId == null) {
    return null;
  }

  try {
    final repository = ref.watch(relationshipRepositoryProvider);
    return await repository.getRelationshipById(selectedId);
  } catch (e) {
    // If relationship doesn't exist, clear selection
    ref.read(selectedRelationshipIdProvider.notifier).clearSelection();
    return null;
  }
});

/// Provider for active relationships (excludes ended/archived)
final activeRelationshipsProvider = FutureProvider<List<Relationship>>((ref) async {
  final allRelationships = await ref.watch(relationshipsProvider.future);
  return allRelationships
      .where((r) => r.status == RelationshipStatus.active || r.status == RelationshipStatus.paused)
      .toList();
});
