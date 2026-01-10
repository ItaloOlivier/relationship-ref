import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_service.dart';
import '../domain/personality_profile_model.dart';
import '../domain/relationship_dynamic_model.dart';
import '../domain/couple_comparison_model.dart';

/// Repository for Personality operations
class PersonalityRepository {
  final PersonalityApi _api;

  PersonalityRepository(this._api);

  /// Get current user's personality profile
  Future<PersonalityProfile> getMyProfile() async {
    final data = await _api.getMyProfile();
    return PersonalityProfile.fromJson(data);
  }

  /// Get another user's personality profile (must be in same couple)
  Future<PersonalityProfile> getUserProfile(String userId) async {
    final data = await _api.getUserProfile(userId);
    return PersonalityProfile.fromJson(data);
  }

  /// Get personality evolution over time
  Future<ProfileEvolution> getMyEvolution() async {
    final data = await _api.getMyEvolution();
    return ProfileEvolution.fromJson(data);
  }

  /// Get relationship dynamics for current couple
  Future<RelationshipDynamic> getCoupleAnalysis() async {
    final data = await _api.getCoupleAnalysis();
    return RelationshipDynamic.fromJson(data);
  }

  /// Get side-by-side personality comparison
  Future<CoupleComparison> getCoupleComparison() async {
    final data = await _api.getCoupleComparison();
    return CoupleComparison.fromJson(data);
  }

  /// Analyze a specific session for personality insights
  Future<Map<String, dynamic>> analyzeSession(String sessionId) async {
    return await _api.analyzeSession(sessionId);
  }
}

/// Provider for PersonalityRepository
final personalityRepositoryProvider = Provider<PersonalityRepository>((ref) {
  return PersonalityRepository(ref.watch(personalityApiProvider));
});

/// Provider for current user's personality profile
final myPersonalityProfileProvider =
    FutureProvider<PersonalityProfile?>((ref) async {
  final repository = ref.watch(personalityRepositoryProvider);
  try {
    return await repository.getMyProfile();
  } catch (e) {
    // Return null if profile not found (404)
    if (e.toString().contains('404') || e.toString().contains('not found')) {
      return null;
    }
    rethrow;
  }
});

/// Provider for profile evolution
final profileEvolutionProvider = FutureProvider<ProfileEvolution>((ref) async {
  final repository = ref.watch(personalityRepositoryProvider);
  return repository.getMyEvolution();
});

/// Provider for relationship dynamics
final relationshipDynamicProvider =
    FutureProvider<RelationshipDynamic?>((ref) async {
  final repository = ref.watch(personalityRepositoryProvider);
  try {
    return await repository.getCoupleAnalysis();
  } catch (e) {
    // Return null if not found (404)
    if (e.toString().contains('404') || e.toString().contains('not found')) {
      return null;
    }
    rethrow;
  }
});

/// Provider for couple comparison
final coupleComparisonProvider = FutureProvider<CoupleComparison?>((ref) async {
  final repository = ref.watch(personalityRepositoryProvider);
  try {
    return await repository.getCoupleComparison();
  } catch (e) {
    // Return null if not found (404)
    if (e.toString().contains('404') || e.toString().contains('not found')) {
      return null;
    }
    rethrow;
  }
});

/// State for personality actions
class PersonalityActionsState {
  final bool isLoading;
  final bool isAnalyzing;
  final String? error;

  const PersonalityActionsState({
    this.isLoading = false,
    this.isAnalyzing = false,
    this.error,
  });

  PersonalityActionsState copyWith({
    bool? isLoading,
    bool? isAnalyzing,
    String? error,
  }) {
    return PersonalityActionsState(
      isLoading: isLoading ?? this.isLoading,
      isAnalyzing: isAnalyzing ?? this.isAnalyzing,
      error: error,
    );
  }
}

/// Notifier for personality actions
class PersonalityActionsNotifier extends StateNotifier<PersonalityActionsState> {
  final PersonalityRepository _repository;
  final Ref _ref;

  PersonalityActionsNotifier(this._repository, this._ref)
      : super(const PersonalityActionsState());

  /// Analyze a session for personality insights
  Future<void> analyzeSession(String sessionId) async {
    state = state.copyWith(isAnalyzing: true, error: null);
    try {
      await _repository.analyzeSession(sessionId);
      // Invalidate profile to refetch with new data
      _ref.invalidate(myPersonalityProfileProvider);
      _ref.invalidate(relationshipDynamicProvider);
      _ref.invalidate(coupleComparisonProvider);
      _ref.invalidate(profileEvolutionProvider);
      state = state.copyWith(isAnalyzing: false);
    } catch (e) {
      state = state.copyWith(isAnalyzing: false, error: e.toString());
    }
  }

  /// Refresh all personality data
  Future<void> refreshAll() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      _ref.invalidate(myPersonalityProfileProvider);
      _ref.invalidate(relationshipDynamicProvider);
      _ref.invalidate(coupleComparisonProvider);
      _ref.invalidate(profileEvolutionProvider);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

/// Provider for personality actions
final personalityActionsProvider =
    StateNotifierProvider<PersonalityActionsNotifier, PersonalityActionsState>(
        (ref) {
  return PersonalityActionsNotifier(
    ref.watch(personalityRepositoryProvider),
    ref,
  );
});
