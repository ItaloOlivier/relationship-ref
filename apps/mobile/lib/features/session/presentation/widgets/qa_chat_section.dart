import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/session_qa_repository.dart';
import '../../domain/session_question_model.dart';

/// A chat-like Q&A section for session reports
class QAChatSection extends ConsumerStatefulWidget {
  final String sessionId;

  const QAChatSection({super.key, required this.sessionId});

  @override
  ConsumerState<QAChatSection> createState() => _QAChatSectionState();
}

class _QAChatSectionState extends ConsumerState<QAChatSection> {
  final _questionController = TextEditingController();
  final _focusNode = FocusNode();
  bool _isExpanded = false;

  @override
  void dispose() {
    _questionController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _askQuestion() {
    final question = _questionController.text.trim();
    if (question.isEmpty) return;

    ref.read(sessionQAProvider(widget.sessionId).notifier).askQuestion(question);
    _questionController.clear();
    _focusNode.unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final qaState = ref.watch(sessionQAProvider(widget.sessionId));
    final suggestedQuestionsAsync = ref.watch(suggestedQuestionsProvider);

    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          InkWell(
            onTap: () => setState(() => _isExpanded = !_isExpanded),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(
                    Icons.question_answer_rounded,
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Ask About This Session',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Get insights about your conversation',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    _isExpanded ? Icons.expand_less : Icons.expand_more,
                    color: AppColors.textSecondary,
                  ),
                ],
              ),
            ),
          ),

          if (_isExpanded) ...[
            const Divider(height: 1),

            // Suggested Questions
            suggestedQuestionsAsync.when(
              data: (suggestions) => _buildSuggestionChips(suggestions),
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),

            // Q&A History
            if (qaState.questions.isNotEmpty)
              _buildQuestionsList(qaState.questions),

            // Loading indicator
            if (qaState.isLoading)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Center(child: CircularProgressIndicator()),
              ),

            // Error message
            if (qaState.error != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline, color: AppColors.error, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          qaState.error!,
                          style: TextStyle(color: AppColors.error),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 18),
                        onPressed: () => ref
                            .read(sessionQAProvider(widget.sessionId).notifier)
                            .clearError(),
                      ),
                    ],
                  ),
                ),
              ),

            // Input Field
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _questionController,
                      focusNode: _focusNode,
                      enabled: !qaState.isAskingQuestion,
                      decoration: InputDecoration(
                        hintText: 'Ask a question...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                      ),
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _askQuestion(),
                      maxLines: 1,
                    ),
                  ),
                  const SizedBox(width: 8),
                  qaState.isAskingQuestion
                      ? const SizedBox(
                          width: 48,
                          height: 48,
                          child: Center(
                            child: SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          ),
                        )
                      : IconButton(
                          onPressed: _askQuestion,
                          icon: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.send_rounded,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                        ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSuggestionChips(List<String> suggestions) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: suggestions.map((suggestion) {
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ActionChip(
              label: Text(
                suggestion,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              onPressed: () {
                _questionController.text = suggestion;
                _askQuestion();
              },
              backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildQuestionsList(List<SessionQuestion> questions) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: questions.length,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        final qa = questions[index];
        return QAMessageBubble(question: qa);
      },
    );
  }
}

/// A bubble showing a Q&A exchange
class QAMessageBubble extends StatelessWidget {
  final SessionQuestion question;

  const QAMessageBubble({super.key, required this.question});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Question (user bubble - right aligned)
        Align(
          alignment: Alignment.centerRight,
          child: Container(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.75,
            ),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
                bottomLeft: Radius.circular(16),
                bottomRight: Radius.circular(4),
              ),
            ),
            child: Text(
              question.question,
              style: const TextStyle(color: Colors.white),
            ),
          ),
        ),
        const SizedBox(height: 8),

        // Answer (assistant bubble - left aligned)
        Align(
          alignment: Alignment.centerLeft,
          child: Container(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.85,
            ),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border.all(color: AppColors.border),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(4),
                topRight: Radius.circular(16),
                bottomLeft: Radius.circular(16),
                bottomRight: Radius.circular(16),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  question.answer,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    height: 1.5,
                  ),
                ),

                // Referenced quotes
                if (question.referencedQuotes.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const Divider(height: 1),
                  const SizedBox(height: 12),
                  Text(
                    'Referenced:',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...question.referencedQuotes.map((quote) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _QuoteChip(quote: quote),
                  )),
                ],

                // Key insight
                if (question.keyInsight != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.lightbulb_outline,
                          color: AppColors.primary,
                          size: 16,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            question.keyInsight!,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _QuoteChip extends StatelessWidget {
  final ReferencedQuote quote;

  const _QuoteChip({required this.quote});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '"${quote.text}"',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              fontStyle: FontStyle.italic,
            ),
          ),
          if (quote.speaker != null) ...[
            const SizedBox(height: 4),
            Text(
              '- ${quote.speaker}',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
