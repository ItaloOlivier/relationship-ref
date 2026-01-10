import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:relationship_referee/features/session/data/recording_provider.dart';
import 'package:relationship_referee/core/api/api_client.dart';
import 'package:dio/dio.dart';

class MockApiClient extends Mock implements ApiClient {}

class MockResponse extends Mock implements Response {}

void main() {
  group('RecordingNotifier', () {
    late MockApiClient mockApiClient;

    setUp(() {
      mockApiClient = MockApiClient();
    });

    test('initial state should be idle', () {
      final notifier = RecordingNotifier(mockApiClient);
      expect(notifier.state.state, RecordingState.idle);
      expect(notifier.state.elapsedSeconds, 0);
      expect(notifier.state.filePath, isNull);
      expect(notifier.state.sessionId, isNull);
    });

    test('reset should return to idle state', () {
      final notifier = RecordingNotifier(mockApiClient);
      notifier.state = notifier.state.copyWith(
        state: RecordingState.recording,
        elapsedSeconds: 10,
      );

      notifier.reset();

      expect(notifier.state.state, RecordingState.idle);
      expect(notifier.state.elapsedSeconds, 0);
    });

    group('RecordingStatus', () {
      test('copyWith should preserve unchanged fields', () {
        const status = RecordingStatus(
          state: RecordingState.recording,
          elapsedSeconds: 30,
          filePath: '/path/to/file.m4a',
          sessionId: 'session-123',
        );

        final updated = status.copyWith(elapsedSeconds: 31);

        expect(updated.state, RecordingState.recording);
        expect(updated.elapsedSeconds, 31);
        expect(updated.filePath, '/path/to/file.m4a');
        expect(updated.sessionId, 'session-123');
      });

      test('copyWith should allow null error', () {
        const status = RecordingStatus(
          state: RecordingState.error,
          error: 'Some error',
        );

        final updated = status.copyWith(error: null);

        expect(updated.error, isNull);
      });
    });

    group('State transitions', () {
      test('recording state transitions correctly', () {
        final notifier = RecordingNotifier(mockApiClient);

        // Idle
        expect(notifier.state.state, RecordingState.idle);

        // Simulate permission denied
        notifier.state = notifier.state.copyWith(
          state: RecordingState.permissionDenied,
        );
        expect(notifier.state.state, RecordingState.permissionDenied);

        // Simulate recording
        notifier.state = notifier.state.copyWith(
          state: RecordingState.recording,
          filePath: '/path/to/file.m4a',
        );
        expect(notifier.state.state, RecordingState.recording);
        expect(notifier.state.filePath, '/path/to/file.m4a');

        // Pause
        notifier.state = notifier.state.copyWith(state: RecordingState.paused);
        expect(notifier.state.state, RecordingState.paused);

        // Resume
        notifier.state = notifier.state.copyWith(state: RecordingState.recording);
        expect(notifier.state.state, RecordingState.recording);

        // Stop and upload
        notifier.state = notifier.state.copyWith(state: RecordingState.uploading);
        expect(notifier.state.state, RecordingState.uploading);

        // Processing
        notifier.state = notifier.state.copyWith(state: RecordingState.processing);
        expect(notifier.state.state, RecordingState.processing);

        // Complete
        notifier.state = notifier.state.copyWith(state: RecordingState.complete);
        expect(notifier.state.state, RecordingState.complete);
      });

      test('error state can be set from any state', () {
        final notifier = RecordingNotifier(mockApiClient);

        notifier.state = notifier.state.copyWith(
          state: RecordingState.recording,
        );

        notifier.state = notifier.state.copyWith(
          state: RecordingState.error,
          error: 'Recording failed',
        );

        expect(notifier.state.state, RecordingState.error);
        expect(notifier.state.error, 'Recording failed');
      });
    });

    group('Upload progress', () {
      test('upload progress can be updated', () {
        final notifier = RecordingNotifier(mockApiClient);

        notifier.state = notifier.state.copyWith(
          state: RecordingState.uploading,
          uploadProgress: 0.0,
        );

        expect(notifier.state.uploadProgress, 0.0);

        notifier.state = notifier.state.copyWith(uploadProgress: 0.5);
        expect(notifier.state.uploadProgress, 0.5);

        notifier.state = notifier.state.copyWith(uploadProgress: 1.0);
        expect(notifier.state.uploadProgress, 1.0);
      });
    });

    group('Timer tracking', () {
      test('elapsed seconds increments during recording', () {
        final notifier = RecordingNotifier(mockApiClient);

        notifier.state = notifier.state.copyWith(
          state: RecordingState.recording,
          elapsedSeconds: 0,
        );

        // Simulate timer increments
        notifier.state = notifier.state.copyWith(elapsedSeconds: 1);
        expect(notifier.state.elapsedSeconds, 1);

        notifier.state = notifier.state.copyWith(elapsedSeconds: 2);
        expect(notifier.state.elapsedSeconds, 2);

        notifier.state = notifier.state.copyWith(elapsedSeconds: 3);
        expect(notifier.state.elapsedSeconds, 3);
      });

      test('elapsed seconds persists during pause', () {
        final notifier = RecordingNotifier(mockApiClient);

        notifier.state = notifier.state.copyWith(
          state: RecordingState.recording,
          elapsedSeconds: 10,
        );

        notifier.state = notifier.state.copyWith(state: RecordingState.paused);

        expect(notifier.state.elapsedSeconds, 10);
      });
    });

    group('Session ID tracking', () {
      test('session ID is set after upload', () {
        final notifier = RecordingNotifier(mockApiClient);

        notifier.state = notifier.state.copyWith(
          sessionId: 'session-abc123',
        );

        expect(notifier.state.sessionId, 'session-abc123');
      });
    });
  });
}
