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
