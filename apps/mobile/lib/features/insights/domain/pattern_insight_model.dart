import 'package:equatable/equatable.dart';

/// Types of patterns detected across sessions
enum PatternType {
  topicTrigger,
  timePattern,
  behaviorTrend,
  horsemanTrend,
  communicationStyle,
  positivePattern,
}

/// Impact level of a pattern
enum PatternImpact {
  low,
  medium,
  high,
  critical,
}

/// Extension for converting PatternType from/to strings
extension PatternTypeX on PatternType {
  String get value {
    switch (this) {
      case PatternType.topicTrigger:
        return 'TOPIC_TRIGGER';
      case PatternType.timePattern:
        return 'TIME_PATTERN';
      case PatternType.behaviorTrend:
        return 'BEHAVIOR_TREND';
      case PatternType.horsemanTrend:
        return 'HORSEMAN_TREND';
      case PatternType.communicationStyle:
        return 'COMMUNICATION_STYLE';
      case PatternType.positivePattern:
        return 'POSITIVE_PATTERN';
    }
  }

  static PatternType fromString(String value) {
    switch (value) {
      case 'TOPIC_TRIGGER':
        return PatternType.topicTrigger;
      case 'TIME_PATTERN':
        return PatternType.timePattern;
      case 'BEHAVIOR_TREND':
        return PatternType.behaviorTrend;
      case 'HORSEMAN_TREND':
        return PatternType.horsemanTrend;
      case 'COMMUNICATION_STYLE':
        return PatternType.communicationStyle;
      case 'POSITIVE_PATTERN':
        return PatternType.positivePattern;
      default:
        return PatternType.behaviorTrend;
    }
  }
}

/// Extension for converting PatternImpact from/to strings
extension PatternImpactX on PatternImpact {
  String get value {
    switch (this) {
      case PatternImpact.low:
        return 'LOW';
      case PatternImpact.medium:
        return 'MEDIUM';
      case PatternImpact.high:
        return 'HIGH';
      case PatternImpact.critical:
        return 'CRITICAL';
    }
  }

  static PatternImpact fromString(String value) {
    switch (value) {
      case 'LOW':
        return PatternImpact.low;
      case 'MEDIUM':
        return PatternImpact.medium;
      case 'HIGH':
        return PatternImpact.high;
      case 'CRITICAL':
        return PatternImpact.critical;
      default:
        return PatternImpact.medium;
    }
  }
}

/// A detected pattern across sessions
class PatternInsight extends Equatable {
  final String id;
  final PatternType patternType;
  final String category;
  final String title;
  final String description;
  final double confidence;
  final PatternImpact impact;
  final int sessionsCount;
  final bool acknowledged;
  final bool dismissed;
  final DateTime? firstOccurrence;
  final DateTime? lastOccurrence;
  final DateTime createdAt;

  const PatternInsight({
    required this.id,
    required this.patternType,
    required this.category,
    required this.title,
    required this.description,
    required this.confidence,
    required this.impact,
    required this.sessionsCount,
    this.acknowledged = false,
    this.dismissed = false,
    this.firstOccurrence,
    this.lastOccurrence,
    required this.createdAt,
  });

  factory PatternInsight.fromJson(Map<String, dynamic> json) {
    return PatternInsight(
      id: json['id'] as String,
      patternType: PatternTypeX.fromString(json['patternType'] as String),
      category: json['category'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      confidence: (json['confidence'] as num).toDouble(),
      impact: PatternImpactX.fromString(json['impact'] as String),
      sessionsCount: json['sessionsCount'] as int,
      acknowledged: json['acknowledged'] as bool? ?? false,
      dismissed: json['dismissed'] as bool? ?? false,
      firstOccurrence: json['firstOccurrence'] != null
          ? DateTime.parse(json['firstOccurrence'] as String)
          : null,
      lastOccurrence: json['lastOccurrence'] != null
          ? DateTime.parse(json['lastOccurrence'] as String)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  @override
  List<Object?> get props => [
        id,
        patternType,
        category,
        title,
        description,
        confidence,
        impact,
        sessionsCount,
        acknowledged,
        dismissed,
        firstOccurrence,
        lastOccurrence,
        createdAt,
      ];
}
