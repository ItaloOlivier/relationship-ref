import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static const String appName = 'Relationship Referee';
  static const String appVersion = '0.1.0';

  static String get apiBaseUrl =>
      dotenv.env['API_BASE_URL'] ?? 'http://localhost:3000';

  static const Duration sessionTimeout = Duration(minutes: 30);
  static const Duration magicLinkExpiry = Duration(minutes: 15);

  // Feature flags
  static const bool enableAudioRetention = false;
  static const bool enablePushNotifications = false;
}
