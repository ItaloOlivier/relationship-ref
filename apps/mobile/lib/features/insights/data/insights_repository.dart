import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../domain/pattern_insight_model.dart';
import '../domain/insights_summary_model.dart';

/// Repository for Insights operations
class InsightsRepository {
  final ApiClient _apiClient;

  InsightsRepository(this._apiClient);

  /// Get insights summary
  Future<InsightsSummary> getSummary() async {
    final response = await _apiClient.get('/insights/summary');
    return InsightsSummary.fromJson(response.data as Map<String, dynamic>);
  }

  /// Get pattern insights
  Future<List<PatternInsight>> getPatterns({
    bool includeAcknowledged = false,
    bool includeDismissed = false,
  }) async {
    final response = await _apiClient.get(
      '/insights/patterns',
      queryParameters: {
        'includeAcknowledged': includeAcknowledged.toString(),
        'includeDismissed': includeDismissed.toString(),
      },
    );
    final patterns = response.data as List;
    return patterns
        .map((p) => PatternInsight.fromJson(p as Map<String, dynamic>))
        .toList();
  }

  /// Acknowledge a pattern
  Future<void> acknowledgePattern(String patternId) async {
    await _apiClient.post('/insights/patterns/$patternId/acknowledge');
  }

  /// Dismiss a pattern
  Future<void> dismissPattern(String patternId) async {
    await _apiClient.post('/insights/patterns/$patternId/dismiss');
  }

  /// Trigger pattern analysis
  Future<void> analyzePatterns() async {
    await _apiClient.post('/insights/patterns/analyze');
  }
}

/// Provider for InsightsRepository
final insightsRepositoryProvider = Provider<InsightsRepository>((ref) {
  return InsightsRepository(ref.watch(apiClientProvider));
});

/// Provider for insights summary
final insightsSummaryProvider = FutureProvider<InsightsSummary>((ref) async {
  final repository = ref.watch(insightsRepositoryProvider);
  return repository.getSummary();
});

/// Provider for pattern insights
final patternInsightsProvider = FutureProvider<List<PatternInsight>>((ref) async {
  final repository = ref.watch(insightsRepositoryProvider);
  return repository.getPatterns();
});

/// State for pattern actions
class PatternActionsState {
  final bool isLoading;
  final String? error;

  const PatternActionsState({this.isLoading = false, this.error});

  PatternActionsState copyWith({bool? isLoading, String? error}) {
    return PatternActionsState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Notifier for pattern actions
class PatternActionsNotifier extends StateNotifier<PatternActionsState> {
  final InsightsRepository _repository;
  final Ref _ref;

  PatternActionsNotifier(this._repository, this._ref)
      : super(const PatternActionsState());

  Future<void> acknowledgePattern(String patternId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repository.acknowledgePattern(patternId);
      _ref.invalidate(patternInsightsProvider);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> dismissPattern(String patternId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repository.dismissPattern(patternId);
      _ref.invalidate(patternInsightsProvider);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

/// Provider for pattern actions
final patternActionsProvider =
    StateNotifierProvider<PatternActionsNotifier, PatternActionsState>((ref) {
  return PatternActionsNotifier(
    ref.watch(insightsRepositoryProvider),
    ref,
  );
});
