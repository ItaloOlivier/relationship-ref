import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:relationship_referee/features/session/data/session_repository.dart';
import 'package:relationship_referee/features/session/domain/session_model.dart';
import 'package:relationship_referee/core/api/api_service.dart';
import 'package:relationship_referee/core/api/api_error.dart';

class MockSessionsApi extends Mock implements SessionsApi {}

void main() {
  group('SessionRepository', () {
    late SessionRepository repository;
    late MockSessionsApi mockApi;

    setUp(() {
      mockApi = MockSessionsApi();
      repository = SessionRepository(mockApi);
    });

    group('createSession', () {
      test('should create session successfully', () async {
        // Arrange
        final mockResponse = {
          'id': 'session-123',
          'coupleId': 'couple-456',
          'initiatorId': 'user-789',
          'status': 'RECORDING',
          'retainAudio': false,
          'createdAt': '2024-01-01T10:00:00.000Z',
        };

        when(() => mockApi.createSession(retainAudio: false))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await repository.createSession(retainAudio: false);

        // Assert
        expect(result.id, 'session-123');
        expect(result.status, SessionStatus.recording);
        expect(result.retainAudio, false);
        verify(() => mockApi.createSession(retainAudio: false)).called(1);
      });

      test('should create session with retainAudio=true', () async {
        // Arrange
        final mockResponse = {
          'id': 'session-123',
          'coupleId': 'couple-456',
          'initiatorId': 'user-789',
          'status': 'RECORDING',
          'retainAudio': true,
          'createdAt': '2024-01-01T10:00:00.000Z',
        };

        when(() => mockApi.createSession(retainAudio: true))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await repository.createSession(retainAudio: true);

        // Assert
        expect(result.retainAudio, true);
      });

      test('should throw ApiError on failure', () async {
        // Arrange
        when(() => mockApi.createSession(retainAudio: false))
            .thenThrow(ApiError(message: 'Network error', code: 'NO_CONNECTION'));

        // Act & Assert
        expect(
          () => repository.createSession(retainAudio: false),
          throwsA(isA<ApiError>()),
        );
      });
    });

    group('getSession', () {
      test('should fetch session by ID successfully', () async {
        // Arrange
        final mockResponse = {
          'id': 'session-123',
          'coupleId': 'couple-456',
          'initiatorId': 'user-789',
          'status': 'COMPLETED',
          'durationSecs': 300,
          'retainAudio': false,
          'transcript': 'This is a test transcript',
          'createdAt': '2024-01-01T10:00:00.000Z',
          'analysisResult': {
            'id': 'analysis-123',
            'sessionId': 'session-123',
            'overallScore': 75,
            'greenCardCount': 5,
            'yellowCardCount': 2,
            'redCardCount': 1,
            'bankChange': 10,
            'cards': [],
            'topicTags': ['communication', 'work'],
            'safetyFlagTriggered': false,
          },
        };

        when(() => mockApi.getSession('session-123'))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await repository.getSession('session-123');

        // Assert
        expect(result.id, 'session-123');
        expect(result.status, SessionStatus.completed);
        expect(result.durationSecs, 300);
        expect(result.transcript, 'This is a test transcript');
        expect(result.analysisResult, isNotNull);
        expect(result.analysisResult!.overallScore, 75);
      });

      test('should handle session without analysis result', () async {
        // Arrange
        final mockResponse = {
          'id': 'session-123',
          'coupleId': 'couple-456',
          'initiatorId': 'user-789',
          'status': 'RECORDING',
          'retainAudio': false,
          'createdAt': '2024-01-01T10:00:00.000Z',
        };

        when(() => mockApi.getSession('session-123'))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await repository.getSession('session-123');

        // Assert
        expect(result.analysisResult, isNull);
      });

      test('should throw ApiError when session not found', () async {
        // Arrange
        when(() => mockApi.getSession('invalid-id'))
            .thenThrow(ApiError(message: 'Session not found', statusCode: 404));

        // Act & Assert
        expect(
          () => repository.getSession('invalid-id'),
          throwsA(isA<ApiError>()),
        );
      });
    });

    group('getSessions', () {
      test('should fetch paginated sessions successfully', () async {
        // Arrange
        final mockResponse = {
          'sessions': [
            {
              'id': 'session-1',
              'coupleId': 'couple-456',
              'initiatorId': 'user-789',
              'status': 'COMPLETED',
              'retainAudio': false,
              'createdAt': '2024-01-01T10:00:00.000Z',
            },
            {
              'id': 'session-2',
              'coupleId': 'couple-456',
              'initiatorId': 'user-789',
              'status': 'COMPLETED',
              'retainAudio': false,
              'createdAt': '2024-01-02T10:00:00.000Z',
            },
          ],
          'total': 15,
          'page': 1,
          'limit': 20,
        };

        when(() => mockApi.getSessions(page: 1, limit: 20))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await repository.getSessions(page: 1, limit: 20);

        // Assert
        expect(result.sessions.length, 2);
        expect(result.total, 15);
        expect(result.page, 1);
        expect(result.limit, 20);
      });

      test('should handle empty session list', () async {
        // Arrange
        final mockResponse = {
          'sessions': [],
          'total': 0,
          'page': 1,
          'limit': 20,
        };

        when(() => mockApi.getSessions(page: 1, limit: 20))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await repository.getSessions(page: 1, limit: 20);

        // Assert
        expect(result.sessions, isEmpty);
        expect(result.total, 0);
      });
    });

    group('deleteSession', () {
      test('should delete session successfully', () async {
        // Arrange
        when(() => mockApi.deleteSession('session-123'))
            .thenAnswer((_) async => {});

        // Act
        await repository.deleteSession('session-123');

        // Assert
        verify(() => mockApi.deleteSession('session-123')).called(1);
      });

      test('should throw ApiError on delete failure', () async {
        // Arrange
        when(() => mockApi.deleteSession('session-123'))
            .thenThrow(ApiError(message: 'Cannot delete session', statusCode: 403));

        // Act & Assert
        expect(
          () => repository.deleteSession('session-123'),
          throwsA(isA<ApiError>()),
        );
      });
    });

    group('transcribeSession', () {
      test('should transcribe session successfully', () async {
        // Arrange
        final mockResponse = {
          'transcript': 'This is the transcribed text',
          'message': 'Transcription complete',
        };

        when(() => mockApi.transcribeSession('session-123', audioUrl: null))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await repository.transcribeSession('session-123');

        // Assert
        expect(result.transcript, 'This is the transcribed text');
        expect(result.message, 'Transcription complete');
      });
    });

    group('analyzeSession', () {
      test('should analyze session successfully', () async {
        // Arrange
        final mockResponse = {
          'id': 'analysis-123',
          'sessionId': 'session-123',
          'overallScore': 80,
          'greenCardCount': 6,
          'yellowCardCount': 1,
          'redCardCount': 0,
          'bankChange': 15,
          'cards': [
            {
              'type': 'GREEN',
              'reason': 'Showed appreciation',
              'quote': 'Thank you for listening',
              'category': 'Appreciation',
            },
          ],
          'topicTags': ['gratitude'],
          'whatWentWell': 'Great communication',
          'tryNextTime': 'Continue being supportive',
          'safetyFlagTriggered': false,
        };

        when(() => mockApi.analyzeSession('session-123'))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await repository.analyzeSession('session-123');

        // Assert
        expect(result.overallScore, 80);
        expect(result.greenCardCount, 6);
        expect(result.cards.length, 1);
        expect(result.cards.first.type, CardType.green);
      });
    });

    group('getReport', () {
      test('should fetch session report successfully', () async {
        // Arrange
        final mockResponse = {
          'session': {
            'id': 'session-123',
            'createdAt': '2024-01-01T10:00:00.000Z',
            'durationSecs': 300,
          },
          'analysis': {
            'id': 'analysis-123',
            'sessionId': 'session-123',
            'overallScore': 75,
            'greenCardCount': 5,
            'yellowCardCount': 2,
            'redCardCount': 1,
            'bankChange': 10,
            'cards': [],
            'topicTags': [],
            'safetyFlagTriggered': false,
          },
          'emotionalBank': {
            'currentBalance': 50,
            'sessionChange': 10,
          },
        };

        when(() => mockApi.getReport('session-123'))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await repository.getReport('session-123');

        // Assert
        expect(result.session.id, 'session-123');
        expect(result.analysis.overallScore, 75);
        expect(result.emotionalBank.currentBalance, 50);
        expect(result.emotionalBank.sessionChange, 10);
      });
    });
  });
}
