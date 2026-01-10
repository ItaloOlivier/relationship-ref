import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_service.dart';
import '../domain/gamification_model.dart';

class GamificationRepository {
  final GamificationApi _gamificationApi;

  GamificationRepository(this._gamificationApi);

  Future<GamificationDashboard> getDashboard({String? relationshipId}) async {
    final data = await _gamificationApi.getDashboard(relationshipId: relationshipId);
    return GamificationDashboard.fromJson(data);
  }

  Future<List<Quest>> getActiveQuests({String? relationshipId}) async {
    final List<dynamic> data = await _gamificationApi.getQuests(relationshipId: relationshipId);
    return data
        .map((e) => Quest.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

final gamificationRepositoryProvider = Provider<GamificationRepository>((ref) {
  return GamificationRepository(ref.watch(gamificationApiProvider));
});

/// Provider for the gamification dashboard (optionally filtered by relationship)
/// Pass relationshipId to get data for specific relationship, or null for all relationships
final dashboardProvider = FutureProvider.family<GamificationDashboard, String?>((ref, relationshipId) async {
  final repository = ref.watch(gamificationRepositoryProvider);
  return repository.getDashboard(relationshipId: relationshipId);
});

/// Provider for active quests (optionally filtered by relationship)
/// Pass relationshipId to get quests for specific relationship, or null for all relationships
final questsProvider = FutureProvider.family<List<Quest>, String?>((ref, relationshipId) async {
  final repository = ref.watch(gamificationRepositoryProvider);
  return repository.getActiveQuests(relationshipId: relationshipId);
});
