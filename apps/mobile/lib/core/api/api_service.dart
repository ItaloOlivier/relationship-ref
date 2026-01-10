import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';

// Auth API
class AuthApi {
  final ApiClient _client;
  AuthApi(this._client);

  Future<Map<String, dynamic>> requestMagicLink(String email) async {
    final response = await _client.post('/auth/magic-link', data: {'email': email});
    return response.data;
  }

  Future<Map<String, dynamic>> verifyMagicLink(String token) async {
    final response = await _client.get('/auth/verify?token=$token');
    return response.data;
  }
}

// Users API
class UsersApi {
  final ApiClient _client;
  UsersApi(this._client);

  Future<Map<String, dynamic>> getMe() async {
    final response = await _client.get('/users/me');
    return response.data;
  }

  Future<Map<String, dynamic>> updateMe(Map<String, dynamic> data) async {
    final response = await _client.patch('/users/me', data: data);
    return response.data;
  }

  Future<void> deleteMe() async {
    await _client.delete('/users/me');
  }

  Future<Map<String, dynamic>?> getMyCouple() async {
    final response = await _client.get('/users/me/couple');
    return response.data;
  }

  Future<Map<String, dynamic>> getUserProfileInRelationship(
    String userId,
    String relationshipId,
  ) async {
    final response = await _client.get(
      '/users/$userId/profile-in-relationship/$relationshipId',
    );
    return response.data;
  }
}

// Couples API
class CouplesApi {
  final ApiClient _client;
  CouplesApi(this._client);

  Future<Map<String, dynamic>> createCouple({String? name}) async {
    final response = await _client.post('/couples', data: {'name': name});
    return response.data;
  }

  Future<Map<String, dynamic>> joinCouple(String inviteCode) async {
    final response = await _client.post('/couples/join', data: {'inviteCode': inviteCode});
    return response.data;
  }

  Future<Map<String, dynamic>?> getMyCouple() async {
    final response = await _client.get('/couples/me');
    return response.data;
  }

  Future<void> leaveCouple() async {
    await _client.delete('/couples/leave');
  }
}

// Sessions API
class SessionsApi {
  final ApiClient _client;
  SessionsApi(this._client);

  Future<Map<String, dynamic>> createSession({bool retainAudio = false}) async {
    final response = await _client.post('/sessions', data: {'retainAudio': retainAudio});
    return response.data;
  }

  Future<Map<String, dynamic>> getSession(String id) async {
    final response = await _client.get('/sessions/$id');
    return response.data;
  }

  Future<Map<String, dynamic>> getSessions({int page = 1, int limit = 20}) async {
    final response = await _client.get('/sessions', queryParameters: {
      'page': page.toString(),
      'limit': limit.toString(),
    });
    return response.data;
  }

  Future<Map<String, dynamic>> transcribeSession(String id, {String? audioUrl}) async {
    final response = await _client.post('/sessions/$id/transcribe', data: {
      if (audioUrl != null) 'audioUrl': audioUrl,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> analyzeSession(String id) async {
    final response = await _client.post('/sessions/$id/analyze');
    return response.data;
  }

  Future<Map<String, dynamic>> getReport(String id) async {
    final response = await _client.get('/sessions/$id/report');
    return response.data;
  }

  Future<void> deleteSession(String id) async {
    await _client.delete('/sessions/$id');
  }

  /// Import a WhatsApp chat export for analysis
  Future<Map<String, dynamic>> importWhatsAppChat({
    required String chatContent,
    String? fileName,
  }) async {
    final response = await _client.post('/sessions/import-whatsapp', data: {
      'chatContent': chatContent,
      if (fileName != null) 'fileName': fileName,
    });
    return response.data;
  }

  /// Create a shareable link for a session report
  Future<Map<String, dynamic>> createShareLink(
    String sessionId, {
    int expiryDays = 7,
    bool anonymize = false,
  }) async {
    final response = await _client.post('/sessions/$sessionId/share', data: {
      'expiryDays': expiryDays,
      'anonymize': anonymize,
    });
    return response.data;
  }

  /// Revoke a share link (disable sharing)
  Future<void> revokeShareLink(String sessionId) async {
    await _client.delete('/sessions/$sessionId/share');
  }
}

// Gamification API
class GamificationApi {
  final ApiClient _client;
  GamificationApi(this._client);

  Future<Map<String, dynamic>> getDashboard() async {
    final response = await _client.get('/gamification/dashboard');
    return response.data;
  }

  Future<List<dynamic>> getQuests() async {
    final response = await _client.get('/gamification/quests');
    return response.data;
  }
}

// Personality API
class PersonalityApi {
  final ApiClient _client;
  PersonalityApi(this._client);

  /// Get current user's personality profile
  Future<Map<String, dynamic>> getMyProfile() async {
    final response = await _client.get('/personality/me');
    return response.data;
  }

  /// Get another user's personality profile (must be in same couple)
  Future<Map<String, dynamic>> getUserProfile(String userId) async {
    final response = await _client.get('/personality/user/$userId');
    return response.data;
  }

  /// Get personality evolution over time for current user
  Future<List<dynamic>> getMyEvolution() async {
    final response = await _client.get('/personality/evolution');
    return response.data;
  }

  /// Get relationship dynamics for current couple
  Future<Map<String, dynamic>> getCoupleAnalysis() async {
    final response = await _client.get('/personality/couple');
    return response.data;
  }

  /// Get side-by-side personality comparison for couple
  Future<Map<String, dynamic>> getCoupleComparison() async {
    final response = await _client.get('/personality/couple/comparison');
    return response.data;
  }

  /// Analyze a specific session for personality insights
  Future<Map<String, dynamic>> analyzeSession(String sessionId) async {
    final response = await _client.post('/personality/analyze/$sessionId');
    return response.data;
  }

  /// Create a shareable link for a personality profile
  Future<Map<String, dynamic>> createShareLink({
    int expiryDays = 7,
    bool anonymize = false,
  }) async {
    final response = await _client.post('/personality/share', data: {
      'expiryDays': expiryDays,
      'anonymize': anonymize,
    });
    return response.data;
  }

  /// Revoke a profile share link (disable sharing)
  Future<void> revokeShareLink() async {
    await _client.delete('/personality/share');
  }
}

// Providers
final authApiProvider = Provider<AuthApi>((ref) {
  return AuthApi(ref.watch(apiClientProvider));
});

final usersApiProvider = Provider<UsersApi>((ref) {
  return UsersApi(ref.watch(apiClientProvider));
});

final couplesApiProvider = Provider<CouplesApi>((ref) {
  return CouplesApi(ref.watch(apiClientProvider));
});

final sessionsApiProvider = Provider<SessionsApi>((ref) {
  return SessionsApi(ref.watch(apiClientProvider));
});

final gamificationApiProvider = Provider<GamificationApi>((ref) {
  return GamificationApi(ref.watch(apiClientProvider));
});

final personalityApiProvider = Provider<PersonalityApi>((ref) {
  return PersonalityApi(ref.watch(apiClientProvider));
});

// Relationships API
class RelationshipsApi {
  final ApiClient _client;
  RelationshipsApi(this._client);

  Future<List<dynamic>> getRelationships({bool includeEnded = false}) async {
    final queryParams = includeEnded ? {'includeEnded': 'true'} : null;
    final response = await _client.get('/relationships', queryParameters: queryParams);
    return response.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> getRelationshipById(String id) async {
    final response = await _client.get('/relationships/$id');
    return response.data;
  }

  Future<Map<String, dynamic>> createRelationship({
    required String type,
    String? name,
  }) async {
    final response = await _client.post('/relationships', data: {
      'type': type,
      if (name != null) 'name': name,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> joinRelationship({
    required String inviteCode,
    String? role,
  }) async {
    final response = await _client.post('/relationships/join', data: {
      'inviteCode': inviteCode,
      if (role != null) 'role': role,
    });
    return response.data;
  }

  Future<void> leaveRelationship(String id, {String? reason}) async {
    await _client.post('/relationships/$id/leave', data: {
      if (reason != null) 'reason': reason,
    });
  }

  Future<Map<String, dynamic>> updateRelationshipStatus(
    String id, {
    required String status,
    String? reason,
  }) async {
    final response = await _client.patch('/relationships/$id/status', data: {
      'status': status,
      if (reason != null) 'reason': reason,
    });
    return response.data;
  }

  Future<List<dynamic>> getRelationshipMembers(String id) async {
    final response = await _client.get('/relationships/$id/members');
    return response.data as List<dynamic>;
  }

  Future<List<dynamic>> getRelationshipSessions(String id) async {
    final response = await _client.get('/relationships/$id/sessions');
    return response.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> getRelationshipHealth(String id) async {
    final response = await _client.get('/relationships/$id/health');
    return response.data;
  }
}

final relationshipsApiProvider = Provider<RelationshipsApi>((ref) {
  return RelationshipsApi(ref.watch(apiClientProvider));
});
