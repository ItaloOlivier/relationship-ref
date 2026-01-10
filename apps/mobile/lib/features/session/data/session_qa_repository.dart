import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../domain/session_question_model.dart';

/// Repository for Session Q&A operations
class SessionQARepository {
  final ApiClient _apiClient;

  SessionQARepository(this._apiClient);

  /// Ask a question about a session
  Future<SessionQuestion> askQuestion(String sessionId, String question) async {
    final response = await _apiClient.post(
      '/sessions/$sessionId/ask',
      data: {'question': question},
    );
    return SessionQuestion.fromJson(response.data as Map<String, dynamic>);
  }

  /// Get Q&A history for a session
  Future<List<SessionQuestion>> getQuestions(
    String sessionId, {
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _apiClient.get(
      '/sessions/$sessionId/questions',
      queryParameters: {'page': page.toString(), 'limit': limit.toString()},
    );
    final data = response.data as Map<String, dynamic>;
    final questions = data['questions'] as List;
    return questions
        .map((q) => SessionQuestion.fromJson(q as Map<String, dynamic>))
        .toList();
  }

  /// Get suggested questions
  Future<List<String>> getSuggestedQuestions() async {
    final response = await _apiClient.get('/sessions/qa/suggested-questions');
    return (response.data as List).cast<String>();
  }
}

/// Provider for SessionQARepository
final sessionQARepositoryProvider = Provider<SessionQARepository>((ref) {
  return SessionQARepository(ref.watch(apiClientProvider));
});

/// Notifier for session Q&A state
class SessionQANotifier extends StateNotifier<SessionQAState> {
  final SessionQARepository _repository;
  final String sessionId;

  SessionQANotifier(this._repository, this.sessionId)
      : super(const SessionQAState()) {
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final questions = await _repository.getQuestions(sessionId);
      state = state.copyWith(questions: questions, isLoading: false);
    } catch (e) {
      state = state.copyWith(error: e.toString(), isLoading: false);
    }
  }

  Future<void> askQuestion(String question) async {
    if (question.trim().isEmpty) return;

    state = state.copyWith(isAskingQuestion: true, error: null);
    try {
      final answer = await _repository.askQuestion(sessionId, question);
      state = state.copyWith(
        questions: [answer, ...state.questions],
        isAskingQuestion: false,
      );
    } catch (e) {
      state = state.copyWith(error: e.toString(), isAskingQuestion: false);
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Provider for session Q&A state
final sessionQAProvider = StateNotifierProvider.family<SessionQANotifier, SessionQAState, String>(
  (ref, sessionId) => SessionQANotifier(
    ref.watch(sessionQARepositoryProvider),
    sessionId,
  ),
);

/// Provider for suggested questions (cached)
final suggestedQuestionsProvider = FutureProvider<List<String>>((ref) async {
  final repository = ref.watch(sessionQARepositoryProvider);
  return repository.getSuggestedQuestions();
});
