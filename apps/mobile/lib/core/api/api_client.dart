import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../auth/auth_provider.dart';
import 'api_error.dart';

class ApiClient {
  final Dio _dio;
  final Ref? _ref;

  ApiClient({Ref? ref}) : _dio = Dio(), _ref = ref {
    _dio.options.baseUrl = AppConfig.apiBaseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 30);
    _dio.options.receiveTimeout = const Duration(seconds: 30);
    _dio.options.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add auth interceptor to inject token
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        // Inject auth token if available
        if (_ref != null) {
          final authState = _ref.read(authStateProvider);
          if (authState.accessToken != null) {
            options.headers['Authorization'] = 'Bearer ${authState.accessToken}';
          }
        }
        return handler.next(options);
      },
      onError: (error, handler) {
        // Transform DioException to ApiError
        return handler.reject(error);
      },
    ));

    // Add logging interceptor for debug
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      error: true,
    ));
  }

  void setAuthToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  void clearAuthToken() {
    _dio.options.headers.remove('Authorization');
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.get(path, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw ApiError.fromDioException(e);
    }
  }

  Future<Response> post(String path, {dynamic data}) async {
    try {
      return await _dio.post(path, data: data);
    } on DioException catch (e) {
      throw ApiError.fromDioException(e);
    }
  }

  Future<Response> patch(String path, {dynamic data}) async {
    try {
      return await _dio.patch(path, data: data);
    } on DioException catch (e) {
      throw ApiError.fromDioException(e);
    }
  }

  Future<Response> delete(String path) async {
    try {
      return await _dio.delete(path);
    } on DioException catch (e) {
      throw ApiError.fromDioException(e);
    }
  }

  Future<Response> uploadFile(String path, String filePath, {Map<String, dynamic>? data}) async {
    try {
      final formData = FormData.fromMap({
        ...?data,
        'file': await MultipartFile.fromFile(filePath),
      });
      return await _dio.post(path, data: formData);
    } on DioException catch (e) {
      throw ApiError.fromDioException(e);
    }
  }
}

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref: ref);
});
