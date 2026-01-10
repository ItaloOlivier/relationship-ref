import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import '../../../core/api/api_service.dart';

/// State for the chat import process
enum ChatImportState {
  idle,
  pickingFile,
  parsing,
  uploading,
  analyzing,
  complete,
  error,
}

/// Status of the chat import operation
class ChatImportStatus {
  final ChatImportState state;
  final String? fileName;
  final String? fileContent;
  final List<String>? participants;
  final int? messageCount;
  final String? sessionId;
  final String? error;
  final DateTime? startDate;
  final DateTime? endDate;

  const ChatImportStatus({
    this.state = ChatImportState.idle,
    this.fileName,
    this.fileContent,
    this.participants,
    this.messageCount,
    this.sessionId,
    this.error,
    this.startDate,
    this.endDate,
  });

  ChatImportStatus copyWith({
    ChatImportState? state,
    String? fileName,
    String? fileContent,
    List<String>? participants,
    int? messageCount,
    String? sessionId,
    String? error,
    DateTime? startDate,
    DateTime? endDate,
  }) {
    return ChatImportStatus(
      state: state ?? this.state,
      fileName: fileName ?? this.fileName,
      fileContent: fileContent ?? this.fileContent,
      participants: participants ?? this.participants,
      messageCount: messageCount ?? this.messageCount,
      sessionId: sessionId ?? this.sessionId,
      error: error ?? this.error,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
    );
  }
}

/// Provider for managing chat import state
class ChatImportNotifier extends StateNotifier<ChatImportStatus> {
  final SessionsApi _sessionsApi;

  ChatImportNotifier(this._sessionsApi) : super(const ChatImportStatus());

  /// Pick a file from the device
  Future<void> pickFile() async {
    state = state.copyWith(state: ChatImportState.pickingFile, error: null);

    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['txt', 'zip'],
        withData: true,
      );

      if (result == null || result.files.isEmpty) {
        // User cancelled
        state = state.copyWith(state: ChatImportState.idle);
        return;
      }

      final file = result.files.first;

      // Handle zip files by extracting txt
      String? content;
      String fileName = file.name;

      if (file.extension == 'zip') {
        // For simplicity, we'll require txt files for now
        // TODO: Add zip extraction support
        state = state.copyWith(
          state: ChatImportState.error,
          error: 'Please export "Without media" to get a .txt file',
        );
        return;
      }

      // Read file content
      if (file.bytes != null) {
        content = String.fromCharCodes(file.bytes!);
      } else if (file.path != null) {
        content = await File(file.path!).readAsString();
      }

      if (content == null || content.isEmpty) {
        state = state.copyWith(
          state: ChatImportState.error,
          error: 'Could not read file content',
        );
        return;
      }

      // Basic validation
      if (content.length < 50) {
        state = state.copyWith(
          state: ChatImportState.error,
          error: 'Chat file is too short. Please export a longer conversation.',
        );
        return;
      }

      // Quick parse to extract preview info
      state = state.copyWith(
        state: ChatImportState.parsing,
        fileName: fileName,
        fileContent: content,
      );

      // Try to detect participants from the content (simple regex check)
      final participants = _extractParticipants(content);
      final messageCount = _countMessages(content);

      if (participants.length < 2) {
        state = state.copyWith(
          state: ChatImportState.error,
          error: 'Could not find at least 2 participants in the chat. Make sure this is a valid WhatsApp export.',
        );
        return;
      }

      state = state.copyWith(
        state: ChatImportState.idle, // Ready to upload
        participants: participants,
        messageCount: messageCount,
      );
    } catch (e) {
      state = state.copyWith(
        state: ChatImportState.error,
        error: 'Error reading file: ${e.toString()}',
      );
    }
  }

  /// Upload and process the chat
  Future<void> uploadAndAnalyze() async {
    if (state.fileContent == null) {
      state = state.copyWith(
        state: ChatImportState.error,
        error: 'No file selected',
      );
      return;
    }

    state = state.copyWith(state: ChatImportState.uploading);

    try {
      // Import the chat
      final response = await _sessionsApi.importWhatsAppChat(
        chatContent: state.fileContent!,
        fileName: state.fileName,
      );

      final sessionId = response['session']['id'] as String;
      final participants = (response['participants'] as List).cast<String>();
      final messageCount = response['messageCount'] as int;

      state = state.copyWith(
        state: ChatImportState.analyzing,
        sessionId: sessionId,
        participants: participants,
        messageCount: messageCount,
      );

      // Now analyze the session
      await _sessionsApi.analyzeSession(sessionId);

      state = state.copyWith(state: ChatImportState.complete);
    } catch (e) {
      String errorMessage = 'Failed to import chat';
      final errorStr = e.toString();

      if (errorStr.contains('participant')) {
        errorMessage = 'Could not find 2 participants in the chat. Make sure this is a valid WhatsApp export between you and your partner.';
      } else if (errorStr.contains('couple')) {
        errorMessage = 'You must be in a couple to import chats. Connect with your partner first.';
      } else if (errorStr.contains('parse')) {
        errorMessage = 'Could not parse the chat file. Make sure this is a valid WhatsApp export (.txt file).';
      } else {
        // Show actual error for debugging
        errorMessage = 'Import failed: $errorStr';
      }

      state = state.copyWith(
        state: ChatImportState.error,
        error: errorMessage,
      );
    }
  }

  /// Reset the state
  void reset() {
    state = const ChatImportStatus();
  }

  /// Extract participant names from WhatsApp export content
  List<String> _extractParticipants(String content) {
    final participants = <String>{};

    // Pattern for iOS: [date, time] Name: message
    final iosPattern = RegExp(r'\[[\d\/\., :APMapm]+\]\s+([^:]+):');
    // Pattern for Android: date, time - Name: message
    final androidPattern = RegExp(r'[\d\/\.\-, :APMapm]+\s*[-–]\s*([^:]+):');

    for (final match in iosPattern.allMatches(content)) {
      final name = match.group(1)?.trim();
      if (name != null && name.isNotEmpty && !_isSystemMessage(name)) {
        participants.add(name);
      }
    }

    for (final match in androidPattern.allMatches(content)) {
      final name = match.group(1)?.trim();
      if (name != null && name.isNotEmpty && !_isSystemMessage(name)) {
        participants.add(name);
      }
    }

    return participants.toList();
  }

  /// Count messages in the chat
  int _countMessages(String content) {
    // Count lines that match message patterns
    final iosPattern = RegExp(r'\[[\d\/\., :APMapm]+\]\s+[^:]+:');
    final androidPattern = RegExp(r'[\d\/\.\-, :APMapm]+\s*[-–]\s*[^:]+:');

    final iosMatches = iosPattern.allMatches(content).length;
    final androidMatches = androidPattern.allMatches(content).length;

    return iosMatches > androidMatches ? iosMatches : androidMatches;
  }

  /// Check if a name is likely a system message
  bool _isSystemMessage(String name) {
    final systemPatterns = [
      'messages and calls are end-to-end encrypted',
      'created group',
      'added you',
      'left',
      'changed',
    ];

    final lowerName = name.toLowerCase();
    return systemPatterns.any((p) => lowerName.contains(p));
  }
}

/// Provider for chat import state
final chatImportProvider =
    StateNotifierProvider<ChatImportNotifier, ChatImportStatus>((ref) {
  return ChatImportNotifier(ref.watch(sessionsApiProvider));
});
