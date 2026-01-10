import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/recording_provider.dart';
import '../../../relationship/presentation/providers/selected_relationship_provider.dart';

class SessionScreen extends ConsumerStatefulWidget {
  const SessionScreen({super.key});

  @override
  ConsumerState<SessionScreen> createState() => _SessionScreenState();
}

class _SessionScreenState extends ConsumerState<SessionScreen> {
  bool _consentGiven = false;
  bool _retainAudio = false;

  @override
  void dispose() {
    super.dispose();
  }

  void _startRecording() {
    setState(() => _consentGiven = true);
    ref.read(recordingProvider.notifier).startRecording();
  }

  void _togglePause() {
    final status = ref.read(recordingProvider);
    if (status.state == RecordingState.recording) {
      ref.read(recordingProvider.notifier).pauseRecording();
    } else if (status.state == RecordingState.paused) {
      ref.read(recordingProvider.notifier).resumeRecording();
    }
  }

  void _stopRecording() {
    final selectedRelationshipId = ref.read(selectedRelationshipIdProvider);
    ref.read(recordingProvider.notifier).stopRecording(
      retainAudio: _retainAudio,
      relationshipId: selectedRelationshipId,
    );
  }

  void _cancelRecording() {
    ref.read(recordingProvider.notifier).cancelRecording();
    context.pop();
  }

  String _formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final status = ref.watch(recordingProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(_getTitle(status)),
        leading: _shouldShowCloseButton(status)
            ? IconButton(
                icon: const Icon(Icons.close),
                onPressed: () {
                  if (status.state == RecordingState.recording ||
                      status.state == RecordingState.paused) {
                    _showCancelDialog();
                  } else {
                    ref.read(recordingProvider.notifier).reset();
                    context.pop();
                  }
                },
              )
            : null,
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: _buildContent(status),
        ),
      ),
    );
  }

  bool _shouldShowCloseButton(RecordingStatus status) {
    return status.state != RecordingState.uploading &&
        status.state != RecordingState.processing;
  }

  String _getTitle(RecordingStatus status) {
    if (!_consentGiven) return 'Start Session';
    switch (status.state) {
      case RecordingState.idle:
        return 'Start Session';
      case RecordingState.permissionDenied:
        return 'Permission Required';
      case RecordingState.recording:
        return 'Recording';
      case RecordingState.paused:
        return 'Paused';
      case RecordingState.uploading:
        return 'Uploading';
      case RecordingState.processing:
        return 'Analyzing';
      case RecordingState.complete:
        return 'Complete';
      case RecordingState.error:
        return 'Error';
    }
  }

  Widget _buildContent(RecordingStatus status) {
    if (!_consentGiven) {
      return _buildConsentScreen();
    }

    switch (status.state) {
      case RecordingState.idle:
        return _buildConsentScreen();
      case RecordingState.permissionDenied:
        return _buildPermissionDeniedScreen();
      case RecordingState.recording:
      case RecordingState.paused:
        return _buildRecordingScreen(status);
      case RecordingState.uploading:
        return _buildUploadingScreen(status);
      case RecordingState.processing:
        return _buildProcessingScreen();
      case RecordingState.complete:
        return _buildCompleteScreen(status);
      case RecordingState.error:
        return _buildErrorScreen(status);
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
                    color: AppColors.primary.withValues(alpha: 0.1),
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
                const SizedBox(height: 24),
                // Audio retention option
                Card(
                  child: CheckboxListTile(
                    value: _retainAudio,
                    onChanged: (value) {
                      setState(() => _retainAudio = value ?? false);
                    },
                    title: const Text('Keep audio recording'),
                    subtitle: const Text(
                      'Store the audio file for later review. By default, only the transcript is kept.',
                    ),
                    controlAffinity: ListTileControlAffinity.leading,
                  ),
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

  Widget _buildPermissionDeniedScreen() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            color: AppColors.warning.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.mic_off_rounded,
            size: 48,
            color: AppColors.warning,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Microphone Permission Required',
          style: Theme.of(context).textTheme.headlineMedium,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        Text(
          'To record your conversation, please grant microphone access in your device settings.',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: AppColors.textSecondary,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _startRecording,
            child: const Text('Try Again'),
          ),
        ),
        const SizedBox(height: 12),
        TextButton(
          onPressed: () => context.pop(),
          child: const Text('Cancel'),
        ),
      ],
    );
  }

  Widget _buildRecordingScreen(RecordingStatus status) {
    final isPaused = status.state == RecordingState.paused;

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
                color: AppColors.error.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
            ),
            Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.2),
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
                isPaused ? Icons.pause : Icons.mic,
                color: Colors.white,
                size: 48,
              ),
            ),
          ],
        ),
        const SizedBox(height: 32),
        Text(
          _formatDuration(status.elapsedSeconds),
          style: Theme.of(context).textTheme.displayLarge?.copyWith(
            fontWeight: FontWeight.bold,
            fontFeatures: [const FontFeature.tabularFigures()],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          isPaused ? 'Paused' : 'Recording...',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            color: isPaused ? AppColors.warning : AppColors.error,
          ),
        ),
        const Spacer(),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Pause button
            IconButton.filled(
              onPressed: _togglePause,
              icon: Icon(isPaused ? Icons.play_arrow : Icons.pause),
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

  Widget _buildUploadingScreen(RecordingStatus status) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const CircularProgressIndicator(),
        const SizedBox(height: 32),
        Text(
          'Uploading your recording...',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        Text(
          'Please keep the app open',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        if (status.uploadProgress != null) ...[
          const SizedBox(height: 24),
          LinearProgressIndicator(value: status.uploadProgress),
          const SizedBox(height: 8),
          Text('${(status.uploadProgress! * 100).toInt()}%'),
        ],
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

  Widget _buildCompleteScreen(RecordingStatus status) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            color: AppColors.success.withValues(alpha: 0.1),
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
              final sessionId = status.sessionId ?? 'session-unknown';
              ref.read(recordingProvider.notifier).reset();
              context.go('/history/report/$sessionId');
            },
            child: const Text('View Match Report'),
          ),
        ),
        const SizedBox(height: 16),
        TextButton(
          onPressed: () {
            ref.read(recordingProvider.notifier).reset();
            context.go('/home');
          },
          child: const Text('Return Home'),
        ),
      ],
    );
  }

  Widget _buildErrorScreen(RecordingStatus status) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            color: AppColors.error.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.error_outline_rounded,
            size: 64,
            color: AppColors.error,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Something went wrong',
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        const SizedBox(height: 8),
        Text(
          status.error ?? 'An unexpected error occurred',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: AppColors.textSecondary,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 48),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              ref.read(recordingProvider.notifier).reset();
              setState(() => _consentGiven = false);
            },
            child: const Text('Try Again'),
          ),
        ),
        const SizedBox(height: 16),
        TextButton(
          onPressed: () {
            ref.read(recordingProvider.notifier).reset();
            context.go('/home');
          },
          child: const Text('Return Home'),
        ),
      ],
    );
  }

  void _showCancelDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Recording?'),
        content: const Text(
          'Are you sure you want to cancel this recording? Your progress will be lost.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Continue Recording'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _cancelRecording();
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Cancel Recording'),
          ),
        ],
      ),
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
                color: AppColors.primary.withValues(alpha: 0.1),
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
