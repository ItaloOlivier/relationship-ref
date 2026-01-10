import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/chat_import_provider.dart';

class ChatImportScreen extends ConsumerWidget {
  const ChatImportScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(chatImportProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(_getTitle(status)),
        leading: _shouldShowCloseButton(status)
            ? IconButton(
                icon: const Icon(Icons.close),
                onPressed: () {
                  ref.read(chatImportProvider.notifier).reset();
                  context.pop();
                },
              )
            : null,
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: _buildContent(context, ref, status),
        ),
      ),
    );
  }

  bool _shouldShowCloseButton(ChatImportStatus status) {
    return status.state != ChatImportState.uploading &&
        status.state != ChatImportState.analyzing;
  }

  String _getTitle(ChatImportStatus status) {
    switch (status.state) {
      case ChatImportState.idle:
        return status.fileContent != null ? 'Review Import' : 'Import Chat';
      case ChatImportState.pickingFile:
        return 'Select File';
      case ChatImportState.parsing:
        return 'Reading File';
      case ChatImportState.uploading:
        return 'Importing';
      case ChatImportState.analyzing:
        return 'Analyzing';
      case ChatImportState.complete:
        return 'Complete';
      case ChatImportState.error:
        return 'Error';
    }
  }

  Widget _buildContent(
      BuildContext context, WidgetRef ref, ChatImportStatus status) {
    switch (status.state) {
      case ChatImportState.idle:
        if (status.fileContent != null) {
          return _buildPreviewScreen(context, ref, status);
        }
        return _buildInstructionsScreen(context, ref);
      case ChatImportState.pickingFile:
      case ChatImportState.parsing:
        return _buildLoadingScreen(context, 'Reading file...');
      case ChatImportState.uploading:
        return _buildLoadingScreen(context, 'Uploading chat...');
      case ChatImportState.analyzing:
        return _buildLoadingScreen(context, 'Analyzing conversation...');
      case ChatImportState.complete:
        return _buildCompleteScreen(context, ref, status);
      case ChatImportState.error:
        return _buildErrorScreen(context, ref, status);
    }
  }

  Widget _buildInstructionsScreen(BuildContext context, WidgetRef ref) {
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
                    Icons.chat_bubble_outline,
                    size: 48,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Import WhatsApp Chat',
                  style: Theme.of(context).textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Text(
                  'Analyze your WhatsApp conversations to get relationship insights.',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                _InstructionStep(
                  number: 1,
                  title: 'Open WhatsApp',
                  description:
                      'Go to your chat with your partner',
                ),
                const SizedBox(height: 16),
                _InstructionStep(
                  number: 2,
                  title: 'Export Chat',
                  description:
                      'Tap ⋮ Menu → More → Export chat → Without media',
                ),
                const SizedBox(height: 16),
                _InstructionStep(
                  number: 3,
                  title: 'Save as File',
                  description: 'Save the .txt file to your device',
                ),
                const SizedBox(height: 16),
                _InstructionStep(
                  number: 4,
                  title: 'Import Here',
                  description: 'Select the exported file below',
                ),
                const SizedBox(height: 32),
                Card(
                  color: AppColors.warning.withValues(alpha: 0.1),
                  child: const Padding(
                    padding: EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, color: AppColors.warning),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Make sure both you and your partner are aware you\'re analyzing this conversation.',
                            style: TextStyle(color: AppColors.warning),
                          ),
                        ),
                      ],
                    ),
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
            onPressed: () {
              ref.read(chatImportProvider.notifier).pickFile();
            },
            icon: const Icon(Icons.upload_file),
            label: const Text('Select WhatsApp Export'),
          ),
        ),
      ],
    );
  }

  Widget _buildPreviewScreen(
      BuildContext context, WidgetRef ref, ChatImportStatus status) {
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
                    color: AppColors.success.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_circle_outline,
                    size: 48,
                    color: AppColors.success,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Chat Ready to Import',
                  style: Theme.of(context).textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                _InfoCard(
                  icon: Icons.insert_drive_file,
                  title: 'File',
                  value: status.fileName ?? 'Unknown',
                ),
                const SizedBox(height: 16),
                _InfoCard(
                  icon: Icons.people,
                  title: 'Participants',
                  value: status.participants?.join(', ') ?? 'Unknown',
                ),
                const SizedBox(height: 16),
                _InfoCard(
                  icon: Icons.message,
                  title: 'Messages',
                  value: '${status.messageCount ?? 0} messages found',
                ),
                const SizedBox(height: 32),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        const Icon(
                          Icons.analytics_outlined,
                          size: 32,
                          color: AppColors.primary,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'What You\'ll Get',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          '• Communication score (0-100)\n'
                          '• Green, Yellow, Red card breakdown\n'
                          '• Four Horsemen detection\n'
                          '• Personalized coaching tips\n'
                          '• Emotional bank impact',
                          textAlign: TextAlign.left,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  ref.read(chatImportProvider.notifier).reset();
                },
                child: const Text('Change File'),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              flex: 2,
              child: ElevatedButton.icon(
                onPressed: () {
                  ref.read(chatImportProvider.notifier).uploadAndAnalyze();
                },
                icon: const Icon(Icons.analytics),
                label: const Text('Analyze Chat'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildLoadingScreen(BuildContext context, String message) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const CircularProgressIndicator(),
        const SizedBox(height: 32),
        Text(
          message,
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        Text(
          'Please keep the app open',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
      ],
    );
  }

  Widget _buildCompleteScreen(
      BuildContext context, WidgetRef ref, ChatImportStatus status) {
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
              ref.read(chatImportProvider.notifier).reset();
              context.go('/history/report/$sessionId');
            },
            child: const Text('View Match Report'),
          ),
        ),
        const SizedBox(height: 16),
        TextButton(
          onPressed: () {
            ref.read(chatImportProvider.notifier).reset();
            context.go('/home');
          },
          child: const Text('Return Home'),
        ),
      ],
    );
  }

  Widget _buildErrorScreen(
      BuildContext context, WidgetRef ref, ChatImportStatus status) {
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
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            status.error ?? 'An unexpected error occurred',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textSecondary,
                ),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(height: 48),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              ref.read(chatImportProvider.notifier).reset();
            },
            child: const Text('Try Again'),
          ),
        ),
        const SizedBox(height: 16),
        TextButton(
          onPressed: () {
            ref.read(chatImportProvider.notifier).reset();
            context.go('/home');
          },
          child: const Text('Return Home'),
        ),
      ],
    );
  }
}

class _InstructionStep extends StatelessWidget {
  final int number;
  final String title;
  final String description;

  const _InstructionStep({
    required this.number,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppColors.primary,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              number.toString(),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.titleSmall,
              ),
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
    );
  }
}

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;

  const _InfoCard({
    required this.icon,
    required this.title,
    required this.value,
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
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  Text(
                    value,
                    style: Theme.of(context).textTheme.titleMedium,
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
