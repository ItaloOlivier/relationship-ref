import 'package:equatable/equatable.dart';

/// Dashboard data returned by /gamification/dashboard
class GamificationDashboard extends Equatable {
  final int streak;
  final int longestStreak;
  final List<Quest> activeQuests;
  final int completedQuestsCount;
  final int emotionalBankBalance;

  const GamificationDashboard({
    required this.streak,
    required this.longestStreak,
    required this.activeQuests,
    required this.completedQuestsCount,
    required this.emotionalBankBalance,
  });

  factory GamificationDashboard.fromJson(Map<String, dynamic> json) {
    return GamificationDashboard(
      streak: json['streak'] as int? ?? 0,
      longestStreak: json['longestStreak'] as int? ?? 0,
      activeQuests: (json['activeQuests'] as List<dynamic>?)
              ?.map((e) => Quest.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      completedQuestsCount: json['completedQuestsCount'] as int? ?? 0,
      emotionalBankBalance: json['emotionalBankBalance'] as int? ?? 0,
    );
  }

  @override
  List<Object?> get props => [streak, longestStreak, completedQuestsCount, emotionalBankBalance];
}

enum QuestType {
  daily,
  weekly,
  special;

  static QuestType fromString(String value) {
    return QuestType.values.firstWhere(
      (e) => e.name.toUpperCase() == value.toUpperCase(),
      orElse: () => QuestType.daily,
    );
  }
}

enum QuestStatus {
  active,
  completed,
  expired;

  static QuestStatus fromString(String value) {
    return QuestStatus.values.firstWhere(
      (e) => e.name.toUpperCase() == value.toUpperCase(),
      orElse: () => QuestStatus.active,
    );
  }
}

class Quest extends Equatable {
  final String id;
  final String coupleId;
  final QuestType type;
  final String title;
  final String description;
  final int targetValue;
  final int rewardPoints;
  final QuestStatus status;
  final DateTime? expiresAt;
  final DateTime? completedAt;
  final int userProgress;

  const Quest({
    required this.id,
    required this.coupleId,
    required this.type,
    required this.title,
    required this.description,
    required this.targetValue,
    required this.rewardPoints,
    required this.status,
    this.expiresAt,
    this.completedAt,
    this.userProgress = 0,
  });

  factory Quest.fromJson(Map<String, dynamic> json) {
    return Quest(
      id: json['id'] as String,
      coupleId: json['coupleId'] as String,
      type: QuestType.fromString(json['type'] as String),
      title: json['title'] as String,
      description: json['description'] as String,
      targetValue: json['targetValue'] as int,
      rewardPoints: json['rewardPoints'] as int,
      status: QuestStatus.fromString(json['status'] as String),
      expiresAt: json['expiresAt'] != null
          ? DateTime.parse(json['expiresAt'] as String)
          : null,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
      userProgress: json['userProgress'] as int? ?? 0,
    );
  }

  double get progressPercent => targetValue > 0
      ? (userProgress / targetValue).clamp(0.0, 1.0)
      : 0.0;

  bool get isCompleted => status == QuestStatus.completed;
  bool get isExpired => status == QuestStatus.expired;

  String get timeRemaining {
    if (expiresAt == null) return '';
    final now = DateTime.now();
    final diff = expiresAt!.difference(now);

    if (diff.isNegative) return 'Expired';
    if (diff.inDays > 0) return '${diff.inDays}d left';
    if (diff.inHours > 0) return '${diff.inHours}h left';
    if (diff.inMinutes > 0) return '${diff.inMinutes}m left';
    return 'Expiring soon';
  }

  @override
  List<Object?> get props => [id, status, userProgress];
}

class Streak extends Equatable {
  final String userId;
  final int currentStreak;
  final int longestStreak;
  final DateTime? lastActivityDate;

  const Streak({
    required this.userId,
    required this.currentStreak,
    required this.longestStreak,
    this.lastActivityDate,
  });

  factory Streak.fromJson(Map<String, dynamic> json) {
    return Streak(
      userId: json['userId'] as String,
      currentStreak: json['currentStreak'] as int? ?? 0,
      longestStreak: json['longestStreak'] as int? ?? 0,
      lastActivityDate: json['lastActivityDate'] != null
          ? DateTime.parse(json['lastActivityDate'] as String)
          : null,
    );
  }

  bool get isActiveToday {
    if (lastActivityDate == null) return false;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final lastActivity = DateTime(
      lastActivityDate!.year,
      lastActivityDate!.month,
      lastActivityDate!.day,
    );
    return lastActivity == today;
  }

  @override
  List<Object?> get props => [userId, currentStreak, longestStreak];
}
