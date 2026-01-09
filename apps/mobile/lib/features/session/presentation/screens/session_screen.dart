import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';

enum SessionState { consent, recording, processing, complete }

class SessionScreen extends ConsumerStatefulWidget {
  const SessionScreen({super.key});

  @override
  ConsumerState<SessionScreen> createState() => _SessionScreenState();
}

class _SessionScreenState extends ConsumerState<SessionScreen> {
  SessionState _state = SessionState.consent;
  int _elapsedSeconds = 0;
  bool _isPaused = false;

  void _startRecording() {
    setState(() => _state = SessionState.recording);
    _startTimer();
    // TODO: Start actual audio recording
  }

  void _startTimer() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted || _state != SessionState.recording) return false;
      if (!_isPaused) {
        setState(() => _elapsedSeconds++);
      }
      return true;
    });
  }

  void _togglePause() {
    setState(() => _isPaused = !_isPaused);
  }

  void _stopRecording() {
    setState(() => _state = SessionState.processing);
    // TODO: Stop recording and upload
    _processSession();
  }

  Future<void> _processSession() async {
    // Simulate processing
    await Future.delayed(const Duration(seconds: 3));
    if (mounted) {
      setState(() => _state = SessionState.complete);
    }
  }

  String _formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_getTitle()),
        leading: _state == SessionState.recording
            ? null
            : IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => context.pop(),
              ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: _buildContent(),
        ),
      ),
    );
  }

  String _getTitle() {
    switch (_state) {
      case SessionState.consent:
        return 'Start Session';
      case SessionState.recording:
        return 'Recording';
      case SessionState.processing:
        return 'Analyzing';
      case SessionState.complete:
        return 'Complete';
    }
  }

  Widget _buildContent() {
    switch (_state) {
      case SessionState.consent:
        return _buildConsentScreen();
      case SessionState.recording:
        return _buildRecordingScreen();
      case SessionState.processing:
        return _buildProcessingScreen();
      case SessionState.complete:
        return _buildCompleteScreen();
    }
  }

  Widget _buildConsentScreen() {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.mic_rounded,
                    size: 48,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Ready to improve your communication?',
                  style: Theme.of(context).textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Text(
                  'This session will record your conversation and provide feedback to help you communicate better.',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                _ConsentCard(
                  icon: Icons.lock_outline,
                  title: 'Private & Secure',
                  description: 'Audio is processed and deleted immediately. Only the transcript and analysis are stored.',
                ),
                const SizedBox(height: 12),
                _ConsentCard(
                  icon: Icons.people_outline,
                  title: 'Both Partners Aware',
                  description: 'Make sure both of you know this conversation is being recorded for coaching purposes.',
                ),
                const SizedBox(height: 12),
                _ConsentCard(
                  icon: Icons.favorite_outline,
                  title: 'Coaching, Not Judgment',
                  description: 'Our analysis focuses on helping you grow together, not keeping score.',
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _startRecording,
            icon: const Icon(Icons.mic),
            label: const Text('I Understand, Start Recording'),
          ),
        ),
      ],
    );
  }

  Widget _buildRecordingScreen() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Spacer(),
        // Recording indicator
        Stack(
          alignment: Alignment.center,
          children: [
            Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
            ),
            Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
            ),
            Container(
              width: 100,
              height: 100,
              decoration: const BoxDecoration(
                color: AppColors.error,
                shape: BoxShape.circle,
              ),
              child: Icon(
                _isPaused ? Icons.pause : Icons.mic,
                color: Colors.white,
                size: 48,
              ),
            ),
          ],
        ),
        const SizedBox(height: 32),
        Text(
          _formatDuration(_elapsedSeconds),
          style: Theme.of(context).textTheme.displayLarge?.copyWith(
            fontWeight: FontWeight.bold,
            fontFeatures: [const FontFeature.tabularFigures()],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          _isPaused ? 'Paused' : 'Recording...',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            color: _isPaused ? AppColors.warning : AppColors.error,
          ),
        ),
        const Spacer(),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Pause button
            IconButton.filled(
              onPressed: _togglePause,
              icon: Icon(_isPaused ? Icons.play_arrow : Icons.pause),
              iconSize: 32,
              style: IconButton.styleFrom(
                backgroundColor: AppColors.textSecondary,
                foregroundColor: Colors.white,
                minimumSize: const Size(64, 64),
              ),
            ),
            const SizedBox(width: 24),
            // Stop button
            IconButton.filled(
              onPressed: _stopRecording,
              icon: const Icon(Icons.stop),
              iconSize: 32,
              style: IconButton.styleFrom(
                backgroundColor: AppColors.error,
                foregroundColor: Colors.white,
                minimumSize: const Size(80, 80),
              ),
            ),
          ],
        ),
        const SizedBox(height: 48),
      ],
    );
  }

  Widget _buildProcessingScreen() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const CircularProgressIndicator(),
        const SizedBox(height: 32),
        Text(
          'Analyzing your conversation...',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        Text(
          'This usually takes a few seconds',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildCompleteScreen() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            color: AppColors.success.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.check_circle_rounded,
            size: 64,
            color: AppColors.success,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Analysis Complete!',
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        const SizedBox(height: 8),
        Text(
          'Your Match Report is ready',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 48),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              // TODO: Navigate to actual session report
              context.go('/report/session-123');
            },
            child: const Text('View Match Report'),
          ),
        ),
        const SizedBox(height: 16),
        TextButton(
          onPressed: () => context.go('/home'),
          child: const Text('Return Home'),
        ),
      ],
    );
  }
}

class _ConsentCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _ConsentCard({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: AppColors.primary),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
