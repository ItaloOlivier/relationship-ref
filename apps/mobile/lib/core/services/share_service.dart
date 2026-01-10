import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../api/api_service.dart';

/// Service for sharing session reports and personality profiles
class ShareService {
  final SessionsApi _sessionsApi;
  final PersonalityApi _personalityApi;

  ShareService(this._sessionsApi, this._personalityApi);

  /// Create a shareable link for a session report
  Future<ShareLinkResult> createSessionShareLink(
    String sessionId, {
    int expiryDays = 7,
    bool anonymize = false,
  }) async {
    final data = await _sessionsApi.createShareLink(
      sessionId,
      expiryDays: expiryDays,
      anonymize: anonymize,
    );
    return ShareLinkResult.fromJson(data);
  }

  /// Create a shareable link for a personality profile
  Future<ShareLinkResult> createProfileShareLink({
    int expiryDays = 7,
    bool anonymize = false,
  }) async {
    final data = await _personalityApi.createShareLink(
      expiryDays: expiryDays,
      anonymize: anonymize,
    );
    return ShareLinkResult.fromJson(data);
  }

  /// Revoke a session share link
  Future<void> revokeSessionShareLink(String sessionId) async {
    await _sessionsApi.revokeShareLink(sessionId);
  }

  /// Revoke a profile share link
  Future<void> revokeProfileShareLink() async {
    await _personalityApi.revokeShareLink();
  }

  /// Copy share link to clipboard
  Future<void> copyToClipboard(String url) async {
    await Clipboard.setData(ClipboardData(text: url));
  }

  /// Share via WhatsApp
  Future<bool> shareViaWhatsApp(String url, {String? message}) async {
    final text = message != null ? '$message\n\n$url' : url;
    final encodedText = Uri.encodeComponent(text);
    final whatsappUrl = Uri.parse('whatsapp://send?text=$encodedText');

    if (await canLaunchUrl(whatsappUrl)) {
      return await launchUrl(whatsappUrl, mode: LaunchMode.externalApplication);
    }
    return false;
  }

  /// Share via Email
  Future<bool> shareViaEmail(
    String url, {
    String? subject,
    String? body,
  }) async {
    final emailSubject = subject ?? 'Relationship Referee Report';
    final emailBody = body ?? 'Check out my Relationship Referee report:\n\n$url';
    final emailUrl = Uri.parse(
      'mailto:?subject=${Uri.encodeComponent(emailSubject)}&body=${Uri.encodeComponent(emailBody)}',
    );

    if (await canLaunchUrl(emailUrl)) {
      return await launchUrl(emailUrl);
    }
    return false;
  }

  /// Open share link in browser (for testing/preview)
  Future<bool> openInBrowser(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      return await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
    return false;
  }
}

/// Result from creating a share link
class ShareLinkResult {
  final String shareToken;
  final String shareUrl;
  final DateTime expiresAt;
  final bool anonymize;

  ShareLinkResult({
    required this.shareToken,
    required this.shareUrl,
    required this.expiresAt,
    required this.anonymize,
  });

  factory ShareLinkResult.fromJson(Map<String, dynamic> json) {
    return ShareLinkResult(
      shareToken: json['shareToken'] as String,
      shareUrl: json['shareUrl'] as String,
      expiresAt: DateTime.parse(json['expiresAt'] as String),
      anonymize: json['anonymize'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'shareToken': shareToken,
      'shareUrl': shareUrl,
      'expiresAt': expiresAt.toIso8601String(),
      'anonymize': anonymize,
    };
  }
}

// Provider
final shareServiceProvider = Provider<ShareService>((ref) {
  return ShareService(
    ref.watch(sessionsApiProvider),
    ref.watch(personalityApiProvider),
  );
});
