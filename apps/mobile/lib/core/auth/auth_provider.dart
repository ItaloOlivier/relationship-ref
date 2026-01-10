import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../api/api_client.dart';

class AuthState {
  final bool isAuthenticated;
  final String? accessToken;
  final User? user;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.isAuthenticated = false,
    this.accessToken,
    this.user,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    String? accessToken,
    User? user,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      accessToken: accessToken ?? this.accessToken,
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class User {
  final String id;
  final String email;
  final String? name;

  const User({
    required this.id,
    required this.email,
    this.name,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String?,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final FlutterSecureStorage _storage;
  final ApiClient _apiClient;

  AuthNotifier(this._storage, this._apiClient) : super(const AuthState()) {
    _loadStoredAuth();
  }

  Future<void> _loadStoredAuth() async {
    state = state.copyWith(isLoading: true);

    try {
      final token = await _storage.read(key: 'access_token');
      if (token != null) {
        _apiClient.setAuthToken(token);
        // Verify token by fetching user profile
        final response = await _apiClient.get('/users/me');
        if (response.statusCode == 200) {
          final user = User.fromJson(response.data);
          state = AuthState(
            isAuthenticated: true,
            accessToken: token,
            user: user,
          );
        } else {
          await _storage.delete(key: 'access_token');
          state = const AuthState();
        }
      } else {
        state = const AuthState();
      }
    } catch (e) {
      state = const AuthState();
    }
  }

  Future<bool> register(String email, String password, {String? name}) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.post('/auth/register', data: {
        'email': email,
        'password': password,
        if (name != null) 'name': name,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final accessToken = response.data['accessToken'] as String;
        final user = User.fromJson(response.data['user']);

        await _storage.write(key: 'access_token', value: accessToken);
        _apiClient.setAuthToken(accessToken);

        state = AuthState(
          isAuthenticated: true,
          accessToken: accessToken,
          user: user,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: 'Registration failed. Please try again.',
        );
        return false;
      }
    } catch (e) {
      String errorMessage = 'Registration failed. Please try again.';
      if (e.toString().contains('409') || e.toString().contains('already')) {
        errorMessage = 'Email already registered. Please login instead.';
      }
      state = state.copyWith(
        isLoading: false,
        error: errorMessage,
      );
      return false;
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final accessToken = response.data['accessToken'] as String;
        final user = User.fromJson(response.data['user']);

        await _storage.write(key: 'access_token', value: accessToken);
        _apiClient.setAuthToken(accessToken);

        state = AuthState(
          isAuthenticated: true,
          accessToken: accessToken,
          user: user,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: 'Invalid email or password.',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Invalid email or password.',
      );
      return false;
    }
  }

  Future<void> logout() async {
    await _storage.delete(key: 'access_token');
    _apiClient.clearAuthToken();
    state = const AuthState();
  }
}

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final storage = ref.watch(secureStorageProvider);
  final apiClient = ref.watch(apiClientProvider);
  return AuthNotifier(storage, apiClient);
});
