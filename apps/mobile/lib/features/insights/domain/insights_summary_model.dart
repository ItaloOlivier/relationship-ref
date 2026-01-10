import 'package:equatable/equatable.dart';

/// Topic metrics for insights
class TopicMetric extends Equatable {
  final String topic;
  final int count;
  final double averageScore;

  const TopicMetric({
    required this.topic,
    required this.count,
    required this.averageScore,
  });

  factory TopicMetric.fromJson(Map<String, dynamic> json) {
    return TopicMetric(
      topic: json['topic'] as String,
      count: json['count'] as int,
      averageScore: (json['averageScore'] as num).toDouble(),
    );
  }

  @override
  List<Object?> get props => [topic, count, averageScore];
}

/// Trend data point for charts
class TrendDataPoint extends Equatable {
  final String period;
  final double value;
  final int count;

  const TrendDataPoint({
    required this.period,
    required this.value,
    required this.count,
  });

  factory TrendDataPoint.fromJson(Map<String, dynamic> json) {
    return TrendDataPoint(
      period: json['period'] as String,
      value: (json['value'] as num).toDouble(),
      count: json['count'] as int,
    );
  }

  @override
  List<Object?> get props => [period, value, count];
}

/// Score trend direction
enum ScoreTrend {
  improving,
  stable,
  declining,
}

extension ScoreTrendX on ScoreTrend {
  static ScoreTrend fromString(String value) {
    switch (value) {
      case 'improving':
        return ScoreTrend.improving;
      case 'declining':
        return ScoreTrend.declining;
      default:
        return ScoreTrend.stable;
    }
  }
}

/// Highest impact pattern summary
class HighestImpactPatternSummary extends Equatable {
  final String id;
  final String title;
  final String impact;

  const HighestImpactPatternSummary({
    required this.id,
    required this.title,
    required this.impact,
  });

  factory HighestImpactPatternSummary.fromJson(Map<String, dynamic> json) {
    return HighestImpactPatternSummary(
      id: json['id'] as String,
      title: json['title'] as String,
      impact: json['impact'] as String,
    );
  }

  @override
  List<Object?> get props => [id, title, impact];
}

/// Summary of insights across all sessions
class InsightsSummary extends Equatable {
  final int totalSessions;
  final double averageScore;
  final ScoreTrend scoreTrend;
  final List<TopicMetric> topTopics;
  final List<TopicMetric> triggerTopics;
  final Map<String, int> horsemenFrequency;
  final double averageRepairAttempts;
  final double greenCardRatio;
  final List<TrendDataPoint> monthlyTrend;
  final int activePatternCount;
  final HighestImpactPatternSummary? highestImpactPattern;

  const InsightsSummary({
    required this.totalSessions,
    required this.averageScore,
    required this.scoreTrend,
    required this.topTopics,
    required this.triggerTopics,
    required this.horsemenFrequency,
    required this.averageRepairAttempts,
    required this.greenCardRatio,
    required this.monthlyTrend,
    required this.activePatternCount,
    this.highestImpactPattern,
  });

  factory InsightsSummary.fromJson(Map<String, dynamic> json) {
    return InsightsSummary(
      totalSessions: json['totalSessions'] as int,
      averageScore: (json['averageScore'] as num).toDouble(),
      scoreTrend: ScoreTrendX.fromString(json['scoreTrend'] as String),
      topTopics: (json['topTopics'] as List)
          .map((t) => TopicMetric.fromJson(t as Map<String, dynamic>))
          .toList(),
      triggerTopics: (json['triggerTopics'] as List)
          .map((t) => TopicMetric.fromJson(t as Map<String, dynamic>))
          .toList(),
      horsemenFrequency: (json['horsemenFrequency'] as Map<String, dynamic>)
          .map((k, v) => MapEntry(k, v as int)),
      averageRepairAttempts: (json['averageRepairAttempts'] as num).toDouble(),
      greenCardRatio: (json['greenCardRatio'] as num).toDouble(),
      monthlyTrend: (json['monthlyTrend'] as List)
          .map((t) => TrendDataPoint.fromJson(t as Map<String, dynamic>))
          .toList(),
      activePatternCount: json['activePatternCount'] as int,
      highestImpactPattern: json['highestImpactPattern'] != null
          ? HighestImpactPatternSummary.fromJson(
              json['highestImpactPattern'] as Map<String, dynamic>)
          : null,
    );
  }

  factory InsightsSummary.empty() {
    return const InsightsSummary(
      totalSessions: 0,
      averageScore: 0,
      scoreTrend: ScoreTrend.stable,
      topTopics: [],
      triggerTopics: [],
      horsemenFrequency: {},
      averageRepairAttempts: 0,
      greenCardRatio: 0,
      monthlyTrend: [],
      activePatternCount: 0,
    );
  }

  @override
  List<Object?> get props => [
        totalSessions,
        averageScore,
        scoreTrend,
        topTopics,
        triggerTopics,
        horsemenFrequency,
        averageRepairAttempts,
        greenCardRatio,
        monthlyTrend,
        activePatternCount,
        highestImpactPattern,
      ];
}
