'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import type { Session } from '@/types';

interface QAMessage {
  id: string;
  sessionId: string;
  question: string;
  answer: string;
  askedAt: string;
}

export default function SessionQAPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [qaHistory, setQaHistory] = useState<QAMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const suggestedQuestions = [
    "Why did the fight start?",
    "When did things escalate?",
    "Show me examples of contempt",
    "What could we have done differently?",
    "What repair attempts did we make?",
    "What were the main topics discussed?",
    "How did the conversation end?",
    "What patterns do you see?",
  ];

  useEffect(() => {
    loadData();
  }, [sessionId]);

  const loadData = async () => {
    try {
      const [sessionData, qaData] = await Promise.all([
        api.getSession(sessionId),
        api.getSessionQuestions(sessionId),
      ]);

      setSession(sessionData);
      // Transform API response to match QAMessage interface
      const transformedQA = qaData.map((q: any) => ({
        id: q.id || '',
        sessionId: q.sessionId || sessionId,
        question: q.question,
        answer: q.answer,
        askedAt: q.askedAt || q.createdAt,
      }));
      setQaHistory(transformedQA);
    } catch (error) {
      console.error('Failed to load Q&A data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async (question: string) => {
    if (!question.trim()) return;

    setIsAsking(true);
    try {
      const response = await api.askSessionQuestion(sessionId, question);

      // Add to history
      setQaHistory([response, ...qaHistory]);
      setCurrentQuestion('');
    } catch (error: any) {
      alert(error.message || 'Failed to get answer');
    } finally {
      setIsAsking(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAskQuestion(currentQuestion);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Session not found</p>
        <Link href="/dashboard/sessions">
          <Button className="mt-4">Back to Sessions</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/sessions/${sessionId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Session Report
        </Link>
        <h1 className="text-3xl font-bold mt-2">Ask Questions About This Session</h1>
        <p className="text-muted-foreground">
          Powered by Claude Sonnet 4 with full session context
        </p>
      </div>

      {/* Question Input */}
      <Card>
        <CardHeader>
          <CardTitle>Ask a Question</CardTitle>
          <CardDescription>Get AI-powered insights about your conversation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              placeholder="e.g., Why did the fight start?"
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              disabled={isAsking}
              className="flex-1"
            />
            <Button type="submit" disabled={!currentQuestion.trim() || isAsking} isLoading={isAsking}>
              {isAsking ? 'Asking...' : 'Ask'}
            </Button>
          </form>

          {/* Suggested Questions */}
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleAskQuestion(q)}
                  disabled={isAsking}
                  className="px-3 py-1.5 text-sm rounded-full border border-border hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Q&A History */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Q&A History ({qaHistory.length})
        </h2>

        {qaHistory.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                No questions asked yet. Try asking one of the suggested questions above!
              </p>
            </CardContent>
          </Card>
        ) : (
          qaHistory.map((qa) => (
            <Card key={qa.id}>
              <CardContent className="p-6">
                {/* Question */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium">Q</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-lg">{qa.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Asked {new Date(qa.askedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Answer */}
                <div className="flex items-start gap-3 bg-muted/50 rounded-lg p-4">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium">A</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{qa.answer}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Rate Limiting Info */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            💡 Rate limit: 5 questions per session per hour
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
