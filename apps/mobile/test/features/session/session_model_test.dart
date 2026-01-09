import 'package:flutter_test/flutter_test.dart';
import 'package:relationship_referee/features/session/domain/session_model.dart';

void main() {
  group('SessionStatus', () {
    test('fromString converts correctly', () {
      expect(SessionStatus.fromString('RECORDING'), SessionStatus.recording);
      expect(SessionStatus.fromString('COMPLETED'), SessionStatus.completed);
      expect(SessionStatus.fromString('ANALYZING'), SessionStatus.analyzing);
      expect(SessionStatus.fromString('invalid'), SessionStatus.recording);
    });
  });

  group('CardType', () {
    test('fromString converts correctly', () {
      expect(CardType.fromString('GREEN'), CardType.green);
      expect(CardType.fromString('YELLOW'), CardType.yellow);
      expect(CardType.fromString('RED'), CardType.red);
    });
  });

  group('Session', () {
    test('fromJson parses correctly', () {
      final json = {
        'id': 'session-123',
        'coupleId': 'couple-456',
        'initiatorId': 'user-789',
        'status': 'COMPLETED',
        'durationSecs': 300,
        'retainAudio': false,
        'transcript': 'Hello there',
        'createdAt': '2025-01-08T12:00:00Z',
      };

      final session = Session.fromJson(json);

      expect(session.id, 'session-123');
      expect(session.status, SessionStatus.completed);
      expect(session.durationSecs, 300);
      expect(session.transcript, 'Hello there');
    });

    test('fromJson handles null analysisResult', () {
      final json = {
        'id': 'session-123',
        'coupleId': 'couple-456',
        'initiatorId': 'user-789',
        'status': 'RECORDING',
        'retainAudio': false,
        'createdAt': '2025-01-08T12:00:00Z',
      };

      final session = Session.fromJson(json);

      expect(session.analysisResult, isNull);
    });
  });

  group('AnalysisResult', () {
    test('fromJson parses correctly', () {
      final json = {
        'id': 'analysis-123',
        'sessionId': 'session-456',
        'overallScore': 75,
        'greenCardCount': 5,
        'yellowCardCount': 2,
        'redCardCount': 1,
        'bankChange': 12,
        'cards': [
          {
            'type': 'GREEN',
            'reason': 'appreciation',
            'quote': 'Thank you',
            'category': 'appreciation',
          },
        ],
        'topicTags': ['communication', 'work'],
        'whatWentWell': 'Great listening',
        'tryNextTime': 'Use I statements',
        'repairSuggestion': 'Let\'s start over',
        'safetyFlagTriggered': false,
      };

      final result = AnalysisResult.fromJson(json);

      expect(result.overallScore, 75);
      expect(result.greenCardCount, 5);
      expect(result.bankChange, 12);
      expect(result.cards.length, 1);
      expect(result.cards.first.type, CardType.green);
      expect(result.topicTags, contains('communication'));
      expect(result.safetyFlagTriggered, false);
    });
  });

  group('Card', () {
    test('fromJson parses correctly', () {
      final json = {
        'type': 'RED',
        'reason': 'contempt detected',
        'quote': 'You\'re pathetic',
        'category': 'contempt',
      };

      final card = Card.fromJson(json);

      expect(card.type, CardType.red);
      expect(card.reason, 'contempt detected');
      expect(card.category, 'contempt');
    });
  });

  group('SessionsResponse', () {
    test('fromJson parses correctly', () {
      final json = {
        'sessions': [
          {
            'id': 'session-1',
            'coupleId': 'couple-1',
            'initiatorId': 'user-1',
            'status': 'COMPLETED',
            'retainAudio': false,
            'createdAt': '2025-01-08T12:00:00Z',
          },
          {
            'id': 'session-2',
            'coupleId': 'couple-1',
            'initiatorId': 'user-1',
            'status': 'RECORDING',
            'retainAudio': false,
            'createdAt': '2025-01-07T12:00:00Z',
          },
        ],
        'total': 10,
        'page': 1,
        'limit': 20,
      };

      final response = SessionsResponse.fromJson(json);

      expect(response.sessions.length, 2);
      expect(response.total, 10);
      expect(response.page, 1);
    });
  });

  group('EmotionalBankInfo', () {
    test('fromJson parses correctly', () {
      final json = {
        'currentBalance': 42,
        'sessionChange': 12,
      };

      final info = EmotionalBankInfo.fromJson(json);

      expect(info.currentBalance, 42);
      expect(info.sessionChange, 12);
    });
  });

  group('SafetyResources', () {
    test('fromJson parses correctly', () {
      final json = {
        'message': 'We noticed concerning patterns',
        'resources': [
          {
            'name': 'Hotline',
            'phone': '1-800-123-4567',
          },
        ],
      };

      final resources = SafetyResources.fromJson(json);

      expect(resources.message, contains('concerning'));
      expect(resources.resources.length, 1);
      expect(resources.resources.first.phone, '1-800-123-4567');
    });
  });
}
