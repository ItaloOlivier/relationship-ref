import 'package:equatable/equatable.dart';

/// A quote referenced in a Q&A answer
class ReferencedQuote extends Equatable {
  final String text;
  final String? speaker;
  final String? context;

  const ReferencedQuote({
    required this.text,
    this.speaker,
    this.context,
  });

  factory ReferencedQuote.fromJson(Map<String, dynamic> json) {
    return ReferencedQuote(
      text: json['text'] as String,
      speaker: json['speaker'] as String?,
      context: json['context'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'text': text,
    'speaker': speaker,
    'context': context,
  };

  @override
  List<Object?> get props => [text, speaker, context];
}

/// A question and answer about a session
class SessionQuestion extends Equatable {
  final String id;
  final String sessionId;
  final String question;
  final String answer;
  final List<ReferencedQuote> referencedQuotes;
  final String? keyInsight;
  final DateTime createdAt;

  const SessionQuestion({
    required this.id,
    required this.sessionId,
    required this.question,
    required this.answer,
    this.referencedQuotes = const [],
    this.keyInsight,
    required this.createdAt,
  });

  factory SessionQuestion.fromJson(Map<String, dynamic> json) {
    return SessionQuestion(
      id: json['id'] as String,
      sessionId: json['sessionId'] as String,
      question: json['question'] as String,
      answer: json['answer'] as String,
      referencedQuotes: json['referencedQuotes'] != null
          ? (json['referencedQuotes'] as List)
              .map((q) => ReferencedQuote.fromJson(q as Map<String, dynamic>))
              .toList()
          : [],
      keyInsight: json['keyInsight'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'sessionId': sessionId,
    'question': question,
    'answer': answer,
    'referencedQuotes': referencedQuotes.map((q) => q.toJson()).toList(),
    'keyInsight': keyInsight,
    'createdAt': createdAt.toIso8601String(),
  };

  @override
  List<Object?> get props => [id, sessionId, question, answer, referencedQuotes, keyInsight, createdAt];
}

/// State for session Q&A
class SessionQAState extends Equatable {
  final List<SessionQuestion> questions;
  final bool isLoading;
  final bool isAskingQuestion;
  final String? error;

  const SessionQAState({
    this.questions = const [],
    this.isLoading = false,
    this.isAskingQuestion = false,
    this.error,
  });

  SessionQAState copyWith({
    List<SessionQuestion>? questions,
    bool? isLoading,
    bool? isAskingQuestion,
    String? error,
  }) {
    return SessionQAState(
      questions: questions ?? this.questions,
      isLoading: isLoading ?? this.isLoading,
      isAskingQuestion: isAskingQuestion ?? this.isAskingQuestion,
      error: error,
    );
  }

  @override
  List<Object?> get props => [questions, isLoading, isAskingQuestion, error];
}
