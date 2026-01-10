import 'package:equatable/equatable.dart';

/// Attachment styles based on Bowlby/Ainsworth theory
enum AttachmentStyle {
  secure,
  anxiousPreoccupied,
  dismissiveAvoidant,
  fearfulAvoidant,
  undetermined,
}

/// Extension for converting AttachmentStyle from/to strings
extension AttachmentStyleX on AttachmentStyle {
  String get value {
    switch (this) {
      case AttachmentStyle.secure:
        return 'SECURE';
      case AttachmentStyle.anxiousPreoccupied:
        return 'ANXIOUS_PREOCCUPIED';
      case AttachmentStyle.dismissiveAvoidant:
        return 'DISMISSIVE_AVOIDANT';
      case AttachmentStyle.fearfulAvoidant:
        return 'FEARFUL_AVOIDANT';
      case AttachmentStyle.undetermined:
        return 'UNDETERMINED';
    }
  }

  static AttachmentStyle fromString(String value) {
    switch (value.toUpperCase()) {
      case 'SECURE':
        return AttachmentStyle.secure;
      case 'ANXIOUS_PREOCCUPIED':
        return AttachmentStyle.anxiousPreoccupied;
      case 'DISMISSIVE_AVOIDANT':
        return AttachmentStyle.dismissiveAvoidant;
      case 'FEARFUL_AVOIDANT':
        return AttachmentStyle.fearfulAvoidant;
      case 'UNDETERMINED':
      default:
        return AttachmentStyle.undetermined;
    }
  }

  String get displayName {
    switch (this) {
      case AttachmentStyle.secure:
        return 'Secure';
      case AttachmentStyle.anxiousPreoccupied:
        return 'Anxious';
      case AttachmentStyle.dismissiveAvoidant:
        return 'Avoidant';
      case AttachmentStyle.fearfulAvoidant:
        return 'Fearful-Avoidant';
      case AttachmentStyle.undetermined:
        return 'Not Yet Determined';
    }
  }
}

/// Communication styles based on Virginia Satir model
enum CommunicationStyle {
  placater,
  blamer,
  computer,
  distracter,
  leveler,
  mixed,
}

/// Extension for converting CommunicationStyle from/to strings
extension CommunicationStyleX on CommunicationStyle {
  String get value {
    switch (this) {
      case CommunicationStyle.placater:
        return 'PLACATER';
      case CommunicationStyle.blamer:
        return 'BLAMER';
      case CommunicationStyle.computer:
        return 'COMPUTER';
      case CommunicationStyle.distracter:
        return 'DISTRACTER';
      case CommunicationStyle.leveler:
        return 'LEVELER';
      case CommunicationStyle.mixed:
        return 'MIXED';
    }
  }

  static CommunicationStyle fromString(String value) {
    switch (value.toUpperCase()) {
      case 'PLACATER':
        return CommunicationStyle.placater;
      case 'BLAMER':
        return CommunicationStyle.blamer;
      case 'COMPUTER':
        return CommunicationStyle.computer;
      case 'DISTRACTER':
        return CommunicationStyle.distracter;
      case 'LEVELER':
        return CommunicationStyle.leveler;
      case 'MIXED':
      default:
        return CommunicationStyle.mixed;
    }
  }

  String get displayName {
    switch (this) {
      case CommunicationStyle.placater:
        return 'Placater';
      case CommunicationStyle.blamer:
        return 'Blamer';
      case CommunicationStyle.computer:
        return 'Computer';
      case CommunicationStyle.distracter:
        return 'Distracter';
      case CommunicationStyle.leveler:
        return 'Leveler';
      case CommunicationStyle.mixed:
        return 'Mixed';
    }
  }
}

/// Big Five (OCEAN) personality traits
class BigFiveTraits extends Equatable {
  final double? openness;
  final double? conscientiousness;
  final double? extraversion;
  final double? agreeableness;
  final double? neuroticism;

  const BigFiveTraits({
    this.openness,
    this.conscientiousness,
    this.extraversion,
    this.agreeableness,
    this.neuroticism,
  });

  factory BigFiveTraits.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const BigFiveTraits();
    return BigFiveTraits(
      openness: (json['openness'] as num?)?.toDouble(),
      conscientiousness: (json['conscientiousness'] as num?)?.toDouble(),
      extraversion: (json['extraversion'] as num?)?.toDouble(),
      agreeableness: (json['agreeableness'] as num?)?.toDouble(),
      neuroticism: (json['neuroticism'] as num?)?.toDouble(),
    );
  }

  @override
  List<Object?> get props => [
        openness,
        conscientiousness,
        extraversion,
        agreeableness,
        neuroticism,
      ];
}

/// Trait descriptions from the backend
class TraitDescriptions extends Equatable {
  final String? openness;
  final String? conscientiousness;
  final String? extraversion;
  final String? agreeableness;
  final String? neuroticism;

  const TraitDescriptions({
    this.openness,
    this.conscientiousness,
    this.extraversion,
    this.agreeableness,
    this.neuroticism,
  });

  factory TraitDescriptions.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const TraitDescriptions();
    return TraitDescriptions(
      openness: json['openness'] as String?,
      conscientiousness: json['conscientiousness'] as String?,
      extraversion: json['extraversion'] as String?,
      agreeableness: json['agreeableness'] as String?,
      neuroticism: json['neuroticism'] as String?,
    );
  }

  @override
  List<Object?> get props => [
        openness,
        conscientiousness,
        extraversion,
        agreeableness,
        neuroticism,
      ];
}

/// Emotional intelligence scores
class EmotionalIntelligence extends Equatable {
  final double? emotionalAwareness;
  final double? empathyScore;
  final double? emotionalRegulation;

  const EmotionalIntelligence({
    this.emotionalAwareness,
    this.empathyScore,
    this.emotionalRegulation,
  });

  factory EmotionalIntelligence.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const EmotionalIntelligence();
    return EmotionalIntelligence(
      emotionalAwareness: (json['emotionalAwareness'] as num?)?.toDouble(),
      empathyScore: (json['empathyScore'] as num?)?.toDouble(),
      emotionalRegulation: (json['emotionalRegulation'] as num?)?.toDouble(),
    );
  }

  double get averageScore {
    final scores = [emotionalAwareness, empathyScore, emotionalRegulation]
        .whereType<double>()
        .toList();
    if (scores.isEmpty) return 0;
    return scores.reduce((a, b) => a + b) / scores.length;
  }

  @override
  List<Object?> get props => [
        emotionalAwareness,
        empathyScore,
        emotionalRegulation,
      ];
}

/// Full personality profile from the backend
class PersonalityProfile extends Equatable {
  final String id;
  final String userId;

  // Big Five traits (0-100)
  final double? openness;
  final double? conscientiousness;
  final double? extraversion;
  final double? agreeableness;
  final double? neuroticism;

  // Attachment
  final AttachmentStyle attachmentStyle;
  final double? attachmentAnxiety;
  final double? attachmentAvoidance;

  // Communication style
  final CommunicationStyle communicationStyle;

  // Conflict style
  final String? conflictStyle;
  final double? repairInitiation;
  final double? repairReceptivity;

  // Emotional intelligence
  final double? emotionalAwareness;
  final double? empathyScore;
  final double? emotionalRegulation;

  // Confidence and sessions
  final double confidenceScore;
  final int sessionsAnalyzed;

  // AI-generated narratives
  final String? strengthsNarrative;
  final String? growthAreasNarrative;
  final String? communicationNarrative;

  // Descriptions from backend
  final String? attachmentDescription;
  final String? communicationDescription;
  final TraitDescriptions traitDescriptions;

  final DateTime? updatedAt;

  const PersonalityProfile({
    required this.id,
    required this.userId,
    this.openness,
    this.conscientiousness,
    this.extraversion,
    this.agreeableness,
    this.neuroticism,
    this.attachmentStyle = AttachmentStyle.undetermined,
    this.attachmentAnxiety,
    this.attachmentAvoidance,
    this.communicationStyle = CommunicationStyle.mixed,
    this.conflictStyle,
    this.repairInitiation,
    this.repairReceptivity,
    this.emotionalAwareness,
    this.empathyScore,
    this.emotionalRegulation,
    this.confidenceScore = 0,
    this.sessionsAnalyzed = 0,
    this.strengthsNarrative,
    this.growthAreasNarrative,
    this.communicationNarrative,
    this.attachmentDescription,
    this.communicationDescription,
    this.traitDescriptions = const TraitDescriptions(),
    this.updatedAt,
  });

  factory PersonalityProfile.fromJson(Map<String, dynamic> json) {
    return PersonalityProfile(
      id: json['id'] as String,
      userId: json['userId'] as String,
      openness: (json['openness'] as num?)?.toDouble(),
      conscientiousness: (json['conscientiousness'] as num?)?.toDouble(),
      extraversion: (json['extraversion'] as num?)?.toDouble(),
      agreeableness: (json['agreeableness'] as num?)?.toDouble(),
      neuroticism: (json['neuroticism'] as num?)?.toDouble(),
      attachmentStyle: AttachmentStyleX.fromString(
          json['attachmentStyle'] as String? ?? 'UNDETERMINED'),
      attachmentAnxiety: (json['attachmentAnxiety'] as num?)?.toDouble(),
      attachmentAvoidance: (json['attachmentAvoidance'] as num?)?.toDouble(),
      communicationStyle: CommunicationStyleX.fromString(
          json['communicationStyle'] as String? ?? 'MIXED'),
      conflictStyle: json['conflictStyle'] as String?,
      repairInitiation: (json['repairInitiation'] as num?)?.toDouble(),
      repairReceptivity: (json['repairReceptivity'] as num?)?.toDouble(),
      emotionalAwareness: (json['emotionalAwareness'] as num?)?.toDouble(),
      empathyScore: (json['empathyScore'] as num?)?.toDouble(),
      emotionalRegulation: (json['emotionalRegulation'] as num?)?.toDouble(),
      confidenceScore: (json['confidenceScore'] as num?)?.toDouble() ?? 0,
      sessionsAnalyzed: json['sessionsAnalyzed'] as int? ?? 0,
      strengthsNarrative: json['strengthsNarrative'] as String?,
      growthAreasNarrative: json['growthAreasNarrative'] as String?,
      communicationNarrative: json['communicationNarrative'] as String?,
      attachmentDescription: json['attachmentDescription'] as String?,
      communicationDescription: json['communicationDescription'] as String?,
      traitDescriptions: TraitDescriptions.fromJson(
          json['traitDescriptions'] as Map<String, dynamic>?),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
    );
  }

  BigFiveTraits get bigFive => BigFiveTraits(
        openness: openness,
        conscientiousness: conscientiousness,
        extraversion: extraversion,
        agreeableness: agreeableness,
        neuroticism: neuroticism,
      );

  EmotionalIntelligence get emotionalIntelligence => EmotionalIntelligence(
        emotionalAwareness: emotionalAwareness,
        empathyScore: empathyScore,
        emotionalRegulation: emotionalRegulation,
      );

  bool get hasEnoughData => sessionsAnalyzed >= 1;

  @override
  List<Object?> get props => [
        id,
        userId,
        openness,
        conscientiousness,
        extraversion,
        agreeableness,
        neuroticism,
        attachmentStyle,
        attachmentAnxiety,
        attachmentAvoidance,
        communicationStyle,
        conflictStyle,
        repairInitiation,
        repairReceptivity,
        emotionalAwareness,
        empathyScore,
        emotionalRegulation,
        confidenceScore,
        sessionsAnalyzed,
        strengthsNarrative,
        growthAreasNarrative,
        communicationNarrative,
        attachmentDescription,
        communicationDescription,
        traitDescriptions,
        updatedAt,
      ];
}
