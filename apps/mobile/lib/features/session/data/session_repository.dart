import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_service.dart';
import '../domain/session_model.dart';

class SessionRepository {
  final SessionsApi _sessionsApi;

  SessionRepository(this._sessionsApi);

  Future<Session> createSession({bool retainAudio = false}) async {
    final data = await _sessionsApi.createSession(retainAudio: retainAudio);
    return Session.fromJson(data);
  }

  Future<Session> getSession(String id) async {
    final data = await _sessionsApi.getSession(id);
    return Session.fromJson(data);
  }

  Future<SessionsResponse> getSessions({int page = 1, int limit = 20}) async {
    final data = await _sessionsApi.getSessions(page: page, limit: limit);
    return SessionsResponse.fromJson(data);
  }

  Future<TranscriptResult> transcribeSession(String id, {String? audioUrl}) async {
    final data = await _sessionsApi.transcribeSession(id, audioUrl: audioUrl);
    return TranscriptResult.fromJson(data);
  }

  Future<AnalysisResult> analyzeSession(String id) async {
    final data = await _sessionsApi.analyzeSession(id);
    return AnalysisResult.fromJson(data);
  }

  Future<SessionReport> getReport(String id) async {
    final data = await _sessionsApi.getReport(id);
    return SessionReport.fromJson(data);
  }

  Future<void> deleteSession(String id) async {
    await _sessionsApi.deleteSession(id);
  }
}

final sessionRepositoryProvider = Provider<SessionRepository>((ref) {
  return SessionRepository(ref.watch(sessionsApiProvider));
});
