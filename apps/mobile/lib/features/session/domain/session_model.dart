import 'package:equatable/equatable.dart';

enum SessionStatus {
  recording,
  uploaded,
  transcribing,
  analyzing,
  completed,
  failed;

  static SessionStatus fromString(String value) {
    return SessionStatus.values.firstWhere(
      (e) => e.name.toUpperCase() == value.toUpperCase(),
      orElse: () => SessionStatus.recording,
    );
  }
}

class Session extends Equatable {
  final String id;
  final String coupleId;
  final String initiatorId;
  final SessionStatus status;
  final int? durationSecs;
  final String? audioUrl;
  final bool retainAudio;
  final String? transcript;
  final DateTime createdAt;
  final AnalysisResult? analysisResult;

  const Session({
    required this.id,
    required this.coupleId,
    required this.initiatorId,
    required this.status,
    this.durationSecs,
    this.audioUrl,
    required this.retainAudio,
    this.transcript,
    required this.createdAt,
    this.analysisResult,
  });

  factory Session.fromJson(Map<String, dynamic> json) {
    return Session(
      id: json['id'] as String,
      coupleId: json['coupleId'] as String,
      initiatorId: json['initiatorId'] as String,
      status: SessionStatus.fromString(json['status'] as String),
      durationSecs: json['durationSecs'] as int?,
      audioUrl: json['audioUrl'] as String?,
      retainAudio: json['retainAudio'] as bool? ?? false,
      transcript: json['transcript'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      analysisResult: json['analysisResult'] != null
          ? AnalysisResult.fromJson(json['analysisResult'] as Map<String, dynamic>)
          : null,
    );
  }

  @override
  List<Object?> get props => [id, status, createdAt];
}

class SessionsResponse {
  final List<Session> sessions;
  final int total;
  final int page;
  final int limit;

  SessionsResponse({
    required this.sessions,
    required this.total,
    required this.page,
    required this.limit,
  });

  factory SessionsResponse.fromJson(Map<String, dynamic> json) {
    return SessionsResponse(
      sessions: (json['sessions'] as List<dynamic>)
          .map((e) => Session.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int,
      page: json['page'] as int,
      limit: json['limit'] as int,
    );
  }
}

class TranscriptResult {
  final String transcript;
  final String? message;

  TranscriptResult({
    required this.transcript,
    this.message,
  });

  factory TranscriptResult.fromJson(Map<String, dynamic> json) {
    return TranscriptResult(
      transcript: json['transcript'] as String,
      message: json['message'] as String?,
    );
  }
}

enum CardType {
  green,
  yellow,
  red;

  static CardType fromString(String value) {
    return CardType.values.firstWhere(
      (e) => e.name.toUpperCase() == value.toUpperCase(),
      orElse: () => CardType.yellow,
    );
  }
}

class Card {
  final CardType type;
  final String reason;
  final String? quote;
  final String category;

  Card({
    required this.type,
    required this.reason,
    this.quote,
    required this.category,
  });

  factory Card.fromJson(Map<String, dynamic> json) {
    return Card(
      type: CardType.fromString(json['type'] as String),
      reason: json['reason'] as String,
      quote: json['quote'] as String?,
      category: json['category'] as String,
    );
  }
}

class AnalysisResult extends Equatable {
  final String id;
  final String sessionId;
  final int overallScore;
  final int greenCardCount;
  final int yellowCardCount;
  final int redCardCount;
  final int bankChange;
  final List<Card> cards;
  final List<String> topicTags;
  final String? whatWentWell;
  final String? tryNextTime;
  final String? repairSuggestion;
  final bool safetyFlagTriggered;

  const AnalysisResult({
    required this.id,
    required this.sessionId,
    required this.overallScore,
    required this.greenCardCount,
    required this.yellowCardCount,
    required this.redCardCount,
    required this.bankChange,
    required this.cards,
    required this.topicTags,
    this.whatWentWell,
    this.tryNextTime,
    this.repairSuggestion,
    required this.safetyFlagTriggered,
  });

  factory AnalysisResult.fromJson(Map<String, dynamic> json) {
    return AnalysisResult(
      id: json['id'] as String,
      sessionId: json['sessionId'] as String,
      overallScore: json['overallScore'] as int,
      greenCardCount: json['greenCardCount'] as int,
      yellowCardCount: json['yellowCardCount'] as int,
      redCardCount: json['redCardCount'] as int,
      bankChange: json['bankChange'] as int,
      cards: (json['cards'] as List<dynamic>)
          .map((e) => Card.fromJson(e as Map<String, dynamic>))
          .toList(),
      topicTags: (json['topicTags'] as List<dynamic>).cast<String>(),
      whatWentWell: json['whatWentWell'] as String?,
      tryNextTime: json['tryNextTime'] as String?,
      repairSuggestion: json['repairSuggestion'] as String?,
      safetyFlagTriggered: json['safetyFlagTriggered'] as bool? ?? false,
    );
  }

  @override
  List<Object?> get props => [id, overallScore, bankChange];
}

class SessionReport {
  final SessionInfo session;
  final AnalysisResult analysis;
  final EmotionalBankInfo emotionalBank;
  final SafetyResources? safetyResources;

  SessionReport({
    required this.session,
    required this.analysis,
    required this.emotionalBank,
    this.safetyResources,
  });

  factory SessionReport.fromJson(Map<String, dynamic> json) {
    return SessionReport(
      session: SessionInfo.fromJson(json['session'] as Map<String, dynamic>),
      analysis: AnalysisResult.fromJson(json['analysis'] as Map<String, dynamic>),
      emotionalBank: EmotionalBankInfo.fromJson(json['emotionalBank'] as Map<String, dynamic>),
      safetyResources: json['safetyResources'] != null
          ? SafetyResources.fromJson(json['safetyResources'] as Map<String, dynamic>)
          : null,
    );
  }
}

class SessionInfo {
  final String id;
  final DateTime createdAt;
  final int? durationSecs;

  SessionInfo({
    required this.id,
    required this.createdAt,
    this.durationSecs,
  });

  factory SessionInfo.fromJson(Map<String, dynamic> json) {
    return SessionInfo(
      id: json['id'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      durationSecs: json['durationSecs'] as int?,
    );
  }
}

class EmotionalBankInfo {
  final int currentBalance;
  final int sessionChange;

  EmotionalBankInfo({
    required this.currentBalance,
    required this.sessionChange,
  });

  factory EmotionalBankInfo.fromJson(Map<String, dynamic> json) {
    return EmotionalBankInfo(
      currentBalance: json['currentBalance'] as int,
      sessionChange: json['sessionChange'] as int,
    );
  }
}

class SafetyResources {
  final String message;
  final List<SafetyResource> resources;

  SafetyResources({
    required this.message,
    required this.resources,
  });

  factory SafetyResources.fromJson(Map<String, dynamic> json) {
    return SafetyResources(
      message: json['message'] as String,
      resources: (json['resources'] as List<dynamic>)
          .map((e) => SafetyResource.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class SafetyResource {
  final String name;
  final String? phone;
  final String? text;

  SafetyResource({
    required this.name,
    this.phone,
    this.text,
  });

  factory SafetyResource.fromJson(Map<String, dynamic> json) {
    return SafetyResource(
      name: json['name'] as String,
      phone: json['phone'] as String?,
      text: json['text'] as String?,
    );
  }
}
