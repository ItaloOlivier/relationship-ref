import 'package:equatable/equatable.dart';

/// Relationship types supported by the app
enum RelationshipType {
  romanticCouple('ROMANTIC_COUPLE'),
  friendship('FRIENDSHIP'),
  familyParentChild('FAMILY_PARENT_CHILD'),
  familySiblings('FAMILY_SIBLINGS'),
  familyExtended('FAMILY_EXTENDED'),
  businessPartners('BUSINESS_PARTNERS'),
  coworkers('COWORKERS'),
  mentorMentee('MENTOR_MENTEE'),
  roommates('ROOMMATES'),
  neighbors('NEIGHBORS'),
  groupChat('GROUP_CHAT');

  const RelationshipType(this.value);
  final String value;

  static RelationshipType fromString(String value) {
    return RelationshipType.values.firstWhere(
      (e) => e.value.toUpperCase() == value.toUpperCase(),
      orElse: () => RelationshipType.romanticCouple,
    );
  }
}

/// Relationship status lifecycle
enum RelationshipStatus {
  active('ACTIVE'),
  paused('PAUSED'),
  endedMutual('ENDED_MUTUAL'),
  endedUnilateral('ENDED_UNILATERAL'),
  archived('ARCHIVED');

  const RelationshipStatus(this.value);
  final String value;

  static RelationshipStatus fromString(String value) {
    return RelationshipStatus.values.firstWhere(
      (e) => e.value.toUpperCase() == value.toUpperCase(),
      orElse: () => RelationshipStatus.active,
    );
  }
}

/// Member role in a relationship
enum MemberRole {
  partner('PARTNER'),
  parent('PARENT'),
  child('CHILD'),
  sibling('SIBLING'),
  friend('FRIEND'),
  colleague('COLLEAGUE'),
  mentor('MENTOR'),
  mentee('MENTEE'),
  participant('PARTICIPANT');

  const MemberRole(this.value);
  final String value;

  static MemberRole fromString(String value) {
    return MemberRole.values.firstWhere(
      (e) => e.value.toUpperCase() == value.toUpperCase(),
      orElse: () => MemberRole.participant,
    );
  }
}

/// Relationship member with user details
class RelationshipMember extends Equatable {
  final String id;
  final String userId;
  final MemberRole? role;
  final DateTime joinedAt;
  final DateTime? leftAt;
  final UserInfo user;

  const RelationshipMember({
    required this.id,
    required this.userId,
    this.role,
    required this.joinedAt,
    this.leftAt,
    required this.user,
  });

  factory RelationshipMember.fromJson(Map<String, dynamic> json) {
    return RelationshipMember(
      id: json['id'] as String,
      userId: json['userId'] as String,
      role: json['role'] != null
          ? MemberRole.fromString(json['role'] as String)
          : null,
      joinedAt: DateTime.parse(json['joinedAt'] as String),
      leftAt: json['leftAt'] != null
          ? DateTime.parse(json['leftAt'] as String)
          : null,
      user: UserInfo.fromJson(json['user'] as Map<String, dynamic>),
    );
  }

  @override
  List<Object?> get props => [id, userId, joinedAt, leftAt];
}

/// Basic user information
class UserInfo extends Equatable {
  final String id;
  final String? name;
  final String email;
  final String? avatarUrl;

  const UserInfo({
    required this.id,
    this.name,
    required this.email,
    this.avatarUrl,
  });

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(
      id: json['id'] as String,
      name: json['name'] as String?,
      email: json['email'] as String,
      avatarUrl: json['avatarUrl'] as String?,
    );
  }

  @override
  List<Object?> get props => [id, email];
}

/// Relationship entity
class Relationship extends Equatable {
  final String id;
  final RelationshipType type;
  final String? name;
  final RelationshipStatus status;
  final String inviteCode;
  final DateTime createdAt;
  final DateTime? endedAt;
  final String? endReason;
  final List<RelationshipMember> members;
  final int sessionsCount;

  const Relationship({
    required this.id,
    required this.type,
    this.name,
    required this.status,
    required this.inviteCode,
    required this.createdAt,
    this.endedAt,
    this.endReason,
    this.members = const [],
    this.sessionsCount = 0,
  });

  factory Relationship.fromJson(Map<String, dynamic> json) {
    return Relationship(
      id: json['id'] as String,
      type: RelationshipType.fromString(json['type'] as String),
      name: json['name'] as String?,
      status: RelationshipStatus.fromString(json['status'] as String),
      inviteCode: json['inviteCode'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      endedAt: json['endedAt'] != null
          ? DateTime.parse(json['endedAt'] as String)
          : null,
      endReason: json['endReason'] as String?,
      members: (json['members'] as List<dynamic>?)
              ?.map((e) => RelationshipMember.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      sessionsCount: json['_count'] != null
          ? (json['_count'] as Map<String, dynamic>)['sessions'] as int? ?? 0
          : 0,
    );
  }

  /// Get display name for relationship
  String get displayName {
    if (name != null && name!.isNotEmpty) return name!;

    // Fallback to type-based name
    switch (type) {
      case RelationshipType.romanticCouple:
        return 'My Relationship';
      case RelationshipType.friendship:
        return 'Friendship';
      case RelationshipType.familyParentChild:
        return 'Parent-Child';
      case RelationshipType.familySiblings:
        return 'Siblings';
      case RelationshipType.familyExtended:
        return 'Family';
      case RelationshipType.businessPartners:
        return 'Business Partners';
      case RelationshipType.coworkers:
        return 'Work';
      case RelationshipType.mentorMentee:
        return 'Mentor-Mentee';
      case RelationshipType.roommates:
        return 'Roommates';
      case RelationshipType.neighbors:
        return 'Neighbors';
      case RelationshipType.groupChat:
        return 'Group Chat';
    }
  }

  /// Check if user is a member of this relationship
  bool isMember(String userId) {
    return members.any((m) => m.userId == userId && m.leftAt == null);
  }

  /// Get active members (not left)
  List<RelationshipMember> get activeMembers {
    return members.where((m) => m.leftAt == null).toList();
  }

  @override
  List<Object?> get props => [id, type, status, createdAt];
}

/// Relationship health metrics
class RelationshipHealth extends Equatable {
  final int? healthScore;
  final String? trend; // 'improving', 'declining', 'stable'
  final int emotionalBankBalance;
  final int recentSessionCount;
  final int greenCardRatio;
  final int totalSessionCount;
  final DateTime? lastSessionDate;

  const RelationshipHealth({
    this.healthScore,
    this.trend,
    required this.emotionalBankBalance,
    required this.recentSessionCount,
    required this.greenCardRatio,
    required this.totalSessionCount,
    this.lastSessionDate,
  });

  factory RelationshipHealth.fromJson(Map<String, dynamic> json) {
    return RelationshipHealth(
      healthScore: json['healthScore'] as int?,
      trend: json['trend'] as String?,
      emotionalBankBalance: json['emotionalBankBalance'] as int,
      recentSessionCount: json['recentSessionCount'] as int,
      greenCardRatio: json['greenCardRatio'] as int,
      totalSessionCount: json['totalSessionCount'] as int,
      lastSessionDate: json['lastSessionDate'] != null
          ? DateTime.parse(json['lastSessionDate'] as String)
          : null,
    );
  }

  @override
  List<Object?> get props => [
        healthScore,
        trend,
        emotionalBankBalance,
        totalSessionCount,
      ];
}
