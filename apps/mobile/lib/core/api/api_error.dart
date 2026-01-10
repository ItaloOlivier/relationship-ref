import 'package:dio/dio.dart';

/// Custom API error class for better error handling
class ApiError implements Exception {
  final String message;
  final int? statusCode;
  final String? code;
  final dynamic data;

  ApiError({
    required this.message,
    this.statusCode,
    this.code,
    this.data,
  });

  factory ApiError.fromDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiError(
          message: 'Connection timeout. Please check your internet connection.',
          statusCode: null,
          code: 'TIMEOUT',
        );

      case DioExceptionType.badResponse:
        final response = e.response;
        final statusCode = response?.statusCode;
        final data = response?.data;

        String message = 'An error occurred';
        String? code;

        if (data is Map<String, dynamic>) {
          message = data['message'] as String? ?? message;
          code = data['code'] as String?;
        }

        return ApiError(
          message: message,
          statusCode: statusCode,
          code: code,
          data: data,
        );

      case DioExceptionType.cancel:
        return ApiError(
          message: 'Request was cancelled',
          code: 'CANCELLED',
        );

      case DioExceptionType.connectionError:
        return ApiError(
          message: 'No internet connection. Please check your network.',
          code: 'NO_CONNECTION',
        );

      case DioExceptionType.badCertificate:
        return ApiError(
          message: 'Security certificate error',
          code: 'BAD_CERTIFICATE',
        );

      case DioExceptionType.unknown:
      default:
        return ApiError(
          message: e.message ?? 'An unexpected error occurred',
          code: 'UNKNOWN',
        );
    }
  }

  bool get isUnauthorized => statusCode == 401;
  bool get isNotFound => statusCode == 404;
  bool get isServerError => statusCode != null && statusCode! >= 500;
  bool get isNetworkError => code == 'NO_CONNECTION' || code == 'TIMEOUT';

  @override
  String toString() => message;
}
