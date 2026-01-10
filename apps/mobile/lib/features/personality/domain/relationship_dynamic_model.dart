import 'package:equatable/equatable.dart';

/// Relationship dynamics analysis for a couple
class RelationshipDynamic extends Equatable {
  final String id;
  final String? coupleId;
  final String? relationshipId;

  // Interaction patterns
  final bool? pursuerWithdrawer;
  final String? pursuerId;

  // Power balance
  final Map<String, double>? conversationDominance;
  final Map<String, dynamic>? interruptionPattern;
  final Map<String, dynamic>? topicInitiation;

  // Emotional reciprocity (0-100)
  final double? emotionalReciprocity;
  final double? validationBalance;
  final double? supportBalance;

  // Conflict patterns (0-100)
  final double? escalationTendency;
  final double? deescalationSkill;
  final double? resolutionRate;

  // Gottman ratio
  final double? positiveToNegativeRatio;

  // Strengths and growth areas
  final List<String> relationshipStrengths;
  final List<String> growthOpportunities;

  // AI-generated insights
  final String? dynamicNarrative;
  final String? coachingFocus;

  // Human-readable descriptions
  final List<StrengthDescription> strengthDescriptions;
  final List<GrowthDescription> growthDescriptions;

  // Confidence and data
  final double confidenceScore;
  final int sessionsAnalyzed;

  final DateTime? updatedAt;

  const RelationshipDynamic({
    required this.id,
    this.coupleId,
    this.relationshipId,
    this.pursuerWithdrawer,
    this.pursuerId,
    this.conversationDominance,
    this.interruptionPattern,
    this.topicInitiation,
    this.emotionalReciprocity,
    this.validationBalance,
    this.supportBalance,
    this.escalationTendency,
    this.deescalationSkill,
    this.resolutionRate,
    this.positiveToNegativeRatio,
    this.relationshipStrengths = const [],
    this.growthOpportunities = const [],
    this.dynamicNarrative,
    this.coachingFocus,
    this.strengthDescriptions = const [],
    this.growthDescriptions = const [],
    this.confidenceScore = 0,
    this.sessionsAnalyzed = 0,
    this.updatedAt,
  });

  factory RelationshipDynamic.fromJson(Map<String, dynamic> json) {
    try {
      return RelationshipDynamic(
        id: json['id'] as String,
        coupleId: json['coupleId'] as String?,
        relationshipId: json['relationshipId'] as String?,
        pursuerWithdrawer: json['pursuerWithdrawer'] as bool?,
        pursuerId: json['pursuerId'] as String?,
        conversationDominance: json['conversationDominance'] != null &&
                json['conversationDominance'] is Map
            ? Map<String, double>.from(
                (json['conversationDominance'] as Map).map(
                  (k, v) => MapEntry(k as String, (v as num).toDouble()),
                ),
              )
            : null,
        interruptionPattern: json['interruptionPattern'] is Map<String, dynamic>
            ? json['interruptionPattern'] as Map<String, dynamic>
            : null,
        topicInitiation: json['topicInitiation'] is Map<String, dynamic>
            ? json['topicInitiation'] as Map<String, dynamic>
            : null,
        emotionalReciprocity:
            (json['emotionalReciprocity'] as num?)?.toDouble(),
        validationBalance: (json['validationBalance'] as num?)?.toDouble(),
        supportBalance: (json['supportBalance'] as num?)?.toDouble(),
        escalationTendency: (json['escalationTendency'] as num?)?.toDouble(),
        deescalationSkill: (json['deescalationSkill'] as num?)?.toDouble(),
        resolutionRate: (json['resolutionRate'] as num?)?.toDouble(),
        positiveToNegativeRatio:
            (json['positiveToNegativeRatio'] as num?)?.toDouble(),
        relationshipStrengths: (json['relationshipStrengths'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            [],
        growthOpportunities: (json['growthOpportunities'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            [],
        dynamicNarrative: json['dynamicNarrative'] as String?,
        coachingFocus: json['coachingFocus'] as String?,
        strengthDescriptions: (json['strengthDescriptions'] as List<dynamic>?)
                ?.where((e) => e is Map<String, dynamic>)
                .map((e) => StrengthDescription.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [],
        growthDescriptions: (json['growthDescriptions'] as List<dynamic>?)
                ?.where((e) => e is Map<String, dynamic>)
                .map((e) => GrowthDescription.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [],
        confidenceScore: (json['confidenceScore'] as num?)?.toDouble() ?? 0,
        sessionsAnalyzed: json['sessionsAnalyzed'] as int? ?? 0,
        updatedAt: json['updatedAt'] != null
            ? DateTime.parse(json['updatedAt'] as String)
            : null,
      );
    } catch (e, stackTrace) {
      print('ERROR in RelationshipDynamic.fromJson: $e');
      print('Stack trace: $stackTrace');
      print('JSON keys: ${json.keys}');
      rethrow;
    }
  }

  /// Whether the Gottman ratio is healthy (>= 5:1)
  bool get hasHealthyRatio =>
      positiveToNegativeRatio != null && positiveToNegativeRatio! >= 5.0;

  /// Get a human-readable description of the Gottman ratio
  String get ratioDescription {
    if (positiveToNegativeRatio == null) return 'Not enough data';
    if (positiveToNegativeRatio! >= 5.0) {
      return 'Healthy (${positiveToNegativeRatio!.toStringAsFixed(1)}:1)';
    }
    return 'Needs attention (${positiveToNegativeRatio!.toStringAsFixed(1)}:1)';
  }

  @override
  List<Object?> get props => [
        id,
        coupleId,
        relationshipId,
        pursuerWithdrawer,
        pursuerId,
        conversationDominance,
        interruptionPattern,
        topicInitiation,
        emotionalReciprocity,
        validationBalance,
        supportBalance,
        escalationTendency,
        deescalationSkill,
        resolutionRate,
        positiveToNegativeRatio,
        relationshipStrengths,
        growthOpportunities,
        dynamicNarrative,
        coachingFocus,
        strengthDescriptions,
        growthDescriptions,
        confidenceScore,
        sessionsAnalyzed,
        updatedAt,
      ];
}

/// Description of a relationship strength
class StrengthDescription extends Equatable {
  final String key;
  final String title;
  final String description;

  const StrengthDescription({
    required this.key,
    required this.title,
    required this.description,
  });

  factory StrengthDescription.fromJson(Map<String, dynamic> json) {
    return StrengthDescription(
      key: json['key'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [key, title, description];
}

/// Description of a growth opportunity
class GrowthDescription extends Equatable {
  final String key;
  final String title;
  final String description;

  const GrowthDescription({
    required this.key,
    required this.title,
    required this.description,
  });

  factory GrowthDescription.fromJson(Map<String, dynamic> json) {
    return GrowthDescription(
      key: json['key'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [key, title, description];
}
