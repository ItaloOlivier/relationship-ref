import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_service.dart';
import '../domain/gamification_model.dart';

class GamificationRepository {
  final GamificationApi _gamificationApi;

  GamificationRepository(this._gamificationApi);

  Future<GamificationDashboard> getDashboard() async {
    final data = await _gamificationApi.getDashboard();
    return GamificationDashboard.fromJson(data);
  }

  Future<List<Quest>> getActiveQuests() async {
    final List<dynamic> data = await _gamificationApi.getQuests();
    return data
        .map((e) => Quest.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

final gamificationRepositoryProvider = Provider<GamificationRepository>((ref) {
  return GamificationRepository(ref.watch(gamificationApiProvider));
});

/// Provider for the gamification dashboard
final dashboardProvider = FutureProvider<GamificationDashboard>((ref) async {
  final repository = ref.watch(gamificationRepositoryProvider);
  return repository.getDashboard();
});

/// Provider for active quests
final questsProvider = FutureProvider<List<Quest>>((ref) async {
  final repository = ref.watch(gamificationRepositoryProvider);
  return repository.getActiveQuests();
});
