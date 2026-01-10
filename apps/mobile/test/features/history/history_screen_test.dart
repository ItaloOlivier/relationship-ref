import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:relationship_referee/features/history/presentation/screens/history_screen.dart';
import 'package:relationship_referee/features/session/data/session_repository.dart';
import 'package:relationship_referee/features/session/domain/session_model.dart';

void main() {
  group('HistoryScreen', () {
    testWidgets('shows empty state when no sessions', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sessionsProvider((page: 1, limit: 50)).overrideWith(
              (ref) => Future.value(
                SessionsResponse(sessions: [], total: 0, page: 1, limit: 50),
              ),
            ),
          ],
          child: MaterialApp(
            home: HistoryScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('No sessions yet'), findsOneWidget);
      expect(find.text('Complete your first coach session to see your history here'),
          findsOneWidget);
      expect(find.byIcon(Icons.mic), findsOneWidget);
    });

    testWidgets('shows error state on failure', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sessionsProvider((page: 1, limit: 50)).overrideWith(
              (ref) => Future.error(Exception('Network error')),
            ),
          ],
          child: MaterialApp(
            home: HistoryScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Failed to load sessions'), findsOneWidget);
      expect(find.byIcon(Icons.refresh), findsOneWidget);
    });

    testWidgets('displays sessions list when data is available', (tester) async {
      final mockSessions = [
        Session(
          id: 'session-1',
          coupleId: 'couple-1',
          initiatorId: 'user-1',
          status: SessionStatus.completed,
          durationSecs: 600,
          retainAudio: false,
          createdAt: DateTime.now().subtract(const Duration(days: 1)),
          analysisResult: const AnalysisResult(
            id: 'analysis-1',
            sessionId: 'session-1',
            overallScore: 75,
            greenCardCount: 5,
            yellowCardCount: 2,
            redCardCount: 1,
            bankChange: 10,
            cards: [],
            topicTags: [],
            safetyFlagTriggered: false,
          ),
        ),
        Session(
          id: 'session-2',
          coupleId: 'couple-1',
          initiatorId: 'user-1',
          status: SessionStatus.completed,
          durationSecs: 300,
          retainAudio: false,
          createdAt: DateTime.now().subtract(const Duration(days: 3)),
          analysisResult: const AnalysisResult(
            id: 'analysis-2',
            sessionId: 'session-2',
            overallScore: 60,
            greenCardCount: 3,
            yellowCardCount: 3,
            redCardCount: 2,
            bankChange: -5,
            cards: [],
            topicTags: [],
            safetyFlagTriggered: false,
          ),
        ),
      ];

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sessionsProvider((page: 1, limit: 50)).overrideWith(
              (ref) => Future.value(
                SessionsResponse(
                  sessions: mockSessions,
                  total: 2,
                  page: 1,
                  limit: 50,
                ),
              ),
            ),
          ],
          child: MaterialApp(
            home: HistoryScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.byType(Card), findsNWidgets(2));
      expect(find.text('75'), findsOneWidget);
      expect(find.text('60'), findsOneWidget);
      expect(find.text('10 min session'), findsOneWidget);
      expect(find.text('5 min session'), findsOneWidget);
    });

    testWidgets('displays session status badges for non-completed sessions',
        (tester) async {
      final mockSessions = [
        Session(
          id: 'session-1',
          coupleId: 'couple-1',
          initiatorId: 'user-1',
          status: SessionStatus.transcribing,
          retainAudio: false,
          createdAt: DateTime.now(),
        ),
        Session(
          id: 'session-2',
          coupleId: 'couple-1',
          initiatorId: 'user-1',
          status: SessionStatus.failed,
          retainAudio: false,
          createdAt: DateTime.now(),
        ),
      ];

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sessionsProvider((page: 1, limit: 50)).overrideWith(
              (ref) => Future.value(
                SessionsResponse(
                  sessions: mockSessions,
                  total: 2,
                  page: 1,
                  limit: 50,
                ),
              ),
            ),
          ],
          child: MaterialApp(
            home: HistoryScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Processing'), findsOneWidget);
      expect(find.text('Failed'), findsOneWidget);
    });
  });
}
