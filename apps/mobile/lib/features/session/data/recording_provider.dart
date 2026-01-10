import 'dart:async';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:record/record.dart';

import '../../../core/api/api_client.dart';

enum RecordingState {
  idle,
  permissionDenied,
  recording,
  paused,
  uploading,
  processing,
  complete,
  error,
}

class RecordingStatus {
  final RecordingState state;
  final int elapsedSeconds;
  final String? filePath;
  final String? sessionId;
  final String? error;
  final double? uploadProgress;

  const RecordingStatus({
    this.state = RecordingState.idle,
    this.elapsedSeconds = 0,
    this.filePath,
    this.sessionId,
    this.error,
    this.uploadProgress,
  });

  RecordingStatus copyWith({
    RecordingState? state,
    int? elapsedSeconds,
    String? filePath,
    String? sessionId,
    String? error,
    double? uploadProgress,
  }) {
    return RecordingStatus(
      state: state ?? this.state,
      elapsedSeconds: elapsedSeconds ?? this.elapsedSeconds,
      filePath: filePath ?? this.filePath,
      sessionId: sessionId ?? this.sessionId,
      error: error,
      uploadProgress: uploadProgress,
    );
  }
}

class RecordingNotifier extends StateNotifier<RecordingStatus> {
  final AudioRecorder _recorder;
  final ApiClient _apiClient;
  Timer? _timer;

  RecordingNotifier(this._apiClient)
      : _recorder = AudioRecorder(),
        super(const RecordingStatus());

  Future<bool> requestPermission() async {
    final status = await Permission.microphone.request();
    if (status.isGranted) {
      return true;
    } else {
      state = state.copyWith(state: RecordingState.permissionDenied);
      return false;
    }
  }

  Future<void> startRecording() async {
    try {
      final hasPermission = await requestPermission();
      if (!hasPermission) return;

      final directory = await getApplicationDocumentsDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final filePath = '${directory.path}/session_$timestamp.m4a';

      await _recorder.start(
        const RecordConfig(
          encoder: AudioEncoder.aacLc,
          bitRate: 128000,
          sampleRate: 44100,
        ),
        path: filePath,
      );

      state = RecordingStatus(
        state: RecordingState.recording,
        filePath: filePath,
      );

      _startTimer();
    } catch (e) {
      state = state.copyWith(
        state: RecordingState.error,
        error: 'Failed to start recording: $e',
      );
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (state.state == RecordingState.recording) {
        state = state.copyWith(elapsedSeconds: state.elapsedSeconds + 1);
      }
    });
  }

  Future<void> pauseRecording() async {
    try {
      await _recorder.pause();
      state = state.copyWith(state: RecordingState.paused);
    } catch (e) {
      state = state.copyWith(
        state: RecordingState.error,
        error: 'Failed to pause recording: $e',
      );
    }
  }

  Future<void> resumeRecording() async {
    try {
      await _recorder.resume();
      state = state.copyWith(state: RecordingState.recording);
    } catch (e) {
      state = state.copyWith(
        state: RecordingState.error,
        error: 'Failed to resume recording: $e',
      );
    }
  }

  Future<void> stopRecording({
    bool retainAudio = false,
    String? relationshipId,
  }) async {
    try {
      _timer?.cancel();
      final path = await _recorder.stop();

      if (path == null || path.isEmpty) {
        state = state.copyWith(
          state: RecordingState.error,
          error: 'No recording file found',
        );
        return;
      }

      state = state.copyWith(
        state: RecordingState.uploading,
        filePath: path,
      );

      await _uploadAndProcess(path, retainAudio, relationshipId);
    } catch (e) {
      state = state.copyWith(
        state: RecordingState.error,
        error: 'Failed to stop recording: $e',
      );
    }
  }

  Future<void> _uploadAndProcess(
    String filePath,
    bool retainAudio,
    String? relationshipId,
  ) async {
    try {
      // Create session first
      final sessionData = <String, dynamic>{
        'retainAudio': retainAudio,
      };

      if (relationshipId != null) {
        sessionData['relationshipId'] = relationshipId;
      }

      final createResponse = await _apiClient.post('/sessions', data: sessionData);

      if (createResponse.statusCode != 201) {
        throw Exception('Failed to create session');
      }

      final sessionId = createResponse.data['id'] as String;
      state = state.copyWith(sessionId: sessionId);

      // Upload audio file
      final uploadResponse = await _apiClient.uploadFile(
        '/sessions/$sessionId/audio',
        filePath,
      );

      if (uploadResponse.statusCode != 200) {
        throw Exception('Failed to upload audio');
      }

      state = state.copyWith(state: RecordingState.processing);

      // Poll for completion
      await _pollForCompletion(sessionId);

      // Clean up local file if not retaining
      if (!retainAudio) {
        final file = File(filePath);
        if (await file.exists()) {
          await file.delete();
        }
      }
    } catch (e) {
      state = state.copyWith(
        state: RecordingState.error,
        error: 'Failed to process recording: $e',
      );
    }
  }

  Future<void> _pollForCompletion(String sessionId) async {
    const maxAttempts = 60; // 2 minutes max
    var attempts = 0;

    while (attempts < maxAttempts) {
      await Future.delayed(const Duration(seconds: 2));
      attempts++;

      try {
        final response = await _apiClient.get('/sessions/$sessionId');
        if (response.statusCode == 200) {
          final status = response.data['status'] as String;
          if (status == 'COMPLETED') {
            state = state.copyWith(state: RecordingState.complete);
            return;
          } else if (status == 'FAILED') {
            throw Exception('Session analysis failed');
          }
        }
      } catch (e) {
        // Continue polling on error
      }
    }

    throw Exception('Session processing timed out');
  }

  Future<void> cancelRecording() async {
    _timer?.cancel();
    await _recorder.cancel();

    // Clean up file if exists
    if (state.filePath != null) {
      final file = File(state.filePath!);
      if (await file.exists()) {
        await file.delete();
      }
    }

    state = const RecordingStatus();
  }

  void reset() {
    _timer?.cancel();
    state = const RecordingStatus();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _recorder.dispose();
    super.dispose();
  }
}

final recordingProvider =
    StateNotifierProvider<RecordingNotifier, RecordingStatus>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return RecordingNotifier(apiClient);
});
