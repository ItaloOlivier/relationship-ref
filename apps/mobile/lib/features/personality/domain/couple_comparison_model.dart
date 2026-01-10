import 'package:equatable/equatable.dart';
import 'personality_profile_model.dart';
import 'relationship_dynamic_model.dart';

/// Partner info with profile
class PartnerProfile extends Equatable {
  final String userId;
  final String name;
  final PersonalityProfile? profile;

  const PartnerProfile({
    required this.userId,
    required this.name,
    this.profile,
  });

  factory PartnerProfile.fromJson(Map<String, dynamic> json) {
    return PartnerProfile(
      userId: json['userId'] as String,
      name: json['name'] as String? ?? 'Partner',
      profile: json['profile'] != null
          ? PersonalityProfile.fromJson(json['profile'] as Map<String, dynamic>)
          : null,
    );
  }

  @override
  List<Object?> get props => [userId, name, profile];
}

/// Side-by-side couple comparison
class CoupleComparison extends Equatable {
  final PartnerProfile partner1;
  final PartnerProfile partner2;
  final RelationshipDynamic? dynamics;
  final List<String> insights;

  const CoupleComparison({
    required this.partner1,
    required this.partner2,
    this.dynamics,
    this.insights = const [],
  });

  factory CoupleComparison.fromJson(Map<String, dynamic> json) {
    return CoupleComparison(
      partner1: PartnerProfile.fromJson(json['partner1'] as Map<String, dynamic>),
      partner2: PartnerProfile.fromJson(json['partner2'] as Map<String, dynamic>),
      dynamics: json['dynamics'] != null
          ? RelationshipDynamic.fromJson(json['dynamics'] as Map<String, dynamic>)
          : null,
      insights: (json['insights'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }

  /// Check if both partners have profiles
  bool get hasBothProfiles =>
      partner1.profile != null && partner2.profile != null;

  /// Get average confidence across both profiles
  double get averageConfidence {
    final scores = <double>[];
    if (partner1.profile != null) {
      scores.add(partner1.profile!.confidenceScore);
    }
    if (partner2.profile != null) {
      scores.add(partner2.profile!.confidenceScore);
    }
    if (scores.isEmpty) return 0;
    return scores.reduce((a, b) => a + b) / scores.length;
  }

  @override
  List<Object?> get props => [partner1, partner2, dynamics, insights];
}

/// Profile evolution data point
class ProfileEvolutionPoint extends Equatable {
  final DateTime date;
  final double confidence;
  final Map<String, double> traits;

  const ProfileEvolutionPoint({
    required this.date,
    required this.confidence,
    required this.traits,
  });

  factory ProfileEvolutionPoint.fromJson(Map<String, dynamic> json) {
    return ProfileEvolutionPoint(
      date: DateTime.parse(json['date'] as String),
      confidence: (json['confidence'] as num).toDouble(),
      traits: (json['traits'] as Map<String, dynamic>).map(
        (k, v) => MapEntry(k, (v as num).toDouble()),
      ),
    );
  }

  @override
  List<Object?> get props => [date, confidence, traits];
}

/// Profile evolution over time
class ProfileEvolution extends Equatable {
  final List<ProfileEvolutionPoint> points;

  const ProfileEvolution({
    this.points = const [],
  });

  factory ProfileEvolution.fromJson(List<dynamic> json) {
    return ProfileEvolution(
      points: json
          .map((e) => ProfileEvolutionPoint.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  bool get hasData => points.isNotEmpty;

  @override
  List<Object?> get props => [points];
}
