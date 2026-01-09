import 'package:flutter_test/flutter_test.dart';
import 'package:relationship_referee/features/gamification/domain/gamification_model.dart';

void main() {
  group('QuestType', () {
    test('fromString converts correctly', () {
      expect(QuestType.fromString('DAILY'), QuestType.daily);
      expect(QuestType.fromString('WEEKLY'), QuestType.weekly);
      expect(QuestType.fromString('SPECIAL'), QuestType.special);
      expect(QuestType.fromString('invalid'), QuestType.daily);
    });
  });

  group('QuestStatus', () {
    test('fromString converts correctly', () {
      expect(QuestStatus.fromString('ACTIVE'), QuestStatus.active);
      expect(QuestStatus.fromString('COMPLETED'), QuestStatus.completed);
      expect(QuestStatus.fromString('EXPIRED'), QuestStatus.expired);
      expect(QuestStatus.fromString('invalid'), QuestStatus.active);
    });
  });

  group('Quest', () {
    test('fromJson parses correctly', () {
      final json = {
        'id': 'quest-123',
        'coupleId': 'couple-456',
        'type': 'DAILY',
        'title': 'Daily Check-in',
        'description': 'Complete one session',
        'targetValue': 1,
        'rewardPoints': 10,
        'status': 'ACTIVE',
        'expiresAt': '2025-01-09T23:59:59Z',
        'userProgress': 0,
      };

      final quest = Quest.fromJson(json);

      expect(quest.id, 'quest-123');
      expect(quest.type, QuestType.daily);
      expect(quest.title, 'Daily Check-in');
      expect(quest.targetValue, 1);
      expect(quest.rewardPoints, 10);
      expect(quest.status, QuestStatus.active);
      expect(quest.userProgress, 0);
    });

    test('progressPercent calculates correctly', () {
      final quest = Quest(
        id: 'test',
        coupleId: 'couple',
        type: QuestType.weekly,
        title: 'Test Quest',
        description: 'Test',
        targetValue: 10,
        rewardPoints: 50,
        status: QuestStatus.active,
        userProgress: 5,
      );

      expect(quest.progressPercent, 0.5);
    });

    test('progressPercent handles zero target', () {
      final quest = Quest(
        id: 'test',
        coupleId: 'couple',
        type: QuestType.daily,
        title: 'Test Quest',
        description: 'Test',
        targetValue: 0,
        rewardPoints: 10,
        status: QuestStatus.active,
        userProgress: 0,
      );

      expect(quest.progressPercent, 0.0);
    });

    test('isCompleted returns correct value', () {
      final activeQuest = Quest(
        id: 'test',
        coupleId: 'couple',
        type: QuestType.daily,
        title: 'Test',
        description: 'Test',
        targetValue: 1,
        rewardPoints: 10,
        status: QuestStatus.active,
      );

      final completedQuest = Quest(
        id: 'test',
        coupleId: 'couple',
        type: QuestType.daily,
        title: 'Test',
        description: 'Test',
        targetValue: 1,
        rewardPoints: 10,
        status: QuestStatus.completed,
      );

      expect(activeQuest.isCompleted, false);
      expect(completedQuest.isCompleted, true);
    });
  });

  group('GamificationDashboard', () {
    test('fromJson parses correctly', () {
      final json = {
        'streak': 5,
        'longestStreak': 14,
        'activeQuests': [
          {
            'id': 'quest-1',
            'coupleId': 'couple-1',
            'type': 'DAILY',
            'title': 'Daily Check-in',
            'description': 'Complete one session',
            'targetValue': 1,
            'rewardPoints': 10,
            'status': 'ACTIVE',
            'userProgress': 0,
          },
        ],
        'completedQuestsCount': 42,
        'emotionalBankBalance': 150,
      };

      final dashboard = GamificationDashboard.fromJson(json);

      expect(dashboard.streak, 5);
      expect(dashboard.longestStreak, 14);
      expect(dashboard.activeQuests.length, 1);
      expect(dashboard.activeQuests.first.title, 'Daily Check-in');
      expect(dashboard.completedQuestsCount, 42);
      expect(dashboard.emotionalBankBalance, 150);
    });

    test('fromJson handles null values', () {
      final json = <String, dynamic>{};

      final dashboard = GamificationDashboard.fromJson(json);

      expect(dashboard.streak, 0);
      expect(dashboard.longestStreak, 0);
      expect(dashboard.activeQuests, isEmpty);
      expect(dashboard.completedQuestsCount, 0);
      expect(dashboard.emotionalBankBalance, 0);
    });
  });

  group('Streak', () {
    test('fromJson parses correctly', () {
      final json = {
        'userId': 'user-123',
        'currentStreak': 7,
        'longestStreak': 21,
        'lastActivityDate': '2025-01-08T12:00:00Z',
      };

      final streak = Streak.fromJson(json);

      expect(streak.userId, 'user-123');
      expect(streak.currentStreak, 7);
      expect(streak.longestStreak, 21);
      expect(streak.lastActivityDate, isNotNull);
    });

    test('isActiveToday returns true for today', () {
      final now = DateTime.now();
      final streak = Streak(
        userId: 'test',
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: now,
      );

      expect(streak.isActiveToday, true);
    });

    test('isActiveToday returns false for yesterday', () {
      final yesterday = DateTime.now().subtract(const Duration(days: 1));
      final streak = Streak(
        userId: 'test',
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: yesterday,
      );

      expect(streak.isActiveToday, false);
    });

    test('isActiveToday returns false when null', () {
      const streak = Streak(
        userId: 'test',
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
      );

      expect(streak.isActiveToday, false);
    });
  });
}
