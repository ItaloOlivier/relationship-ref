'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Session, AnalysisResult, Card as SessionCard } from '@/types';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [report, setReport] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'cards' | 'coaching' | 'scorecards'>('overview');

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const [sessionData, reportData] = await Promise.all([
        api.getSession(sessionId),
        api.getSessionReport(sessionId),
      ]);

      setSession(sessionData);
      setReport(reportData);
    } catch (error) {
      console.error('Failed to load session:', error);
      alert('Failed to load session');
      router.push('/dashboard/sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const getCardColor = (type: string) => {
    switch (type) {
      case 'GREEN': return 'bg-success/10 text-success border-success/20';
      case 'YELLOW': return 'bg-warning/10 text-warning border-warning/20';
      case 'RED': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || !report) {
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
        <Link href="/dashboard/sessions" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Sessions
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-3xl font-bold">Session Report</h1>
            <p className="text-muted-foreground">
              {session.source === 'AUDIO' ? '🎙️ Audio Session' : '💬 WhatsApp Chat'} •{' '}
              {new Date(session.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Button variant="outline">Share Report</Button>
        </div>
      </div>

      {/* Overall Score Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Overall Score</h2>
              <p className={`text-5xl font-bold ${getScoreColor(report.overallScore)}`}>
                {report.overallScore}
                <span className="text-2xl text-muted-foreground">/100</span>
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-sm font-medium text-muted-foreground">Emotional Bank</h2>
              <p className={`text-3xl font-bold ${report.bankChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                {report.bankChange >= 0 ? '+' : ''}{report.bankChange}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {['overview', 'cards', 'coaching', 'scorecards'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 px-1 border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-primary text-foreground font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Card Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Card Summary</CardTitle>
              <CardDescription>Breakdown of communication behaviors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-success/10">
                  <p className="text-3xl font-bold text-success">
                    {report.cards.filter((c) => c.type === 'GREEN').length}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Green Cards</p>
                  <p className="text-xs text-muted-foreground">Positive behaviors</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-warning/10">
                  <p className="text-3xl font-bold text-warning">
                    {report.cards.filter((c) => c.type === 'YELLOW').length}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Yellow Cards</p>
                  <p className="text-xs text-muted-foreground">Caution behaviors</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-destructive/10">
                  <p className="text-3xl font-bold text-destructive">
                    {report.cards.filter((c) => c.type === 'RED').length}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Red Cards</p>
                  <p className="text-xs text-muted-foreground">Concerning behaviors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Highlights */}
          {report.highlights && report.highlights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.highlights.map((highlight, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Four Horsemen */}
          {report.horsemenDetected && report.horsemenDetected.length > 0 && (
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Four Horsemen Detected</CardTitle>
                <CardDescription>Relationship warning signs identified</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.horsemenDetected.map((horseman, i) => (
                    <div key={i} className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-destructive">{horseman.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          horseman.severity === 'HIGH' ? 'bg-destructive text-destructive-foreground' :
                          horseman.severity === 'MEDIUM' ? 'bg-warning text-warning-foreground' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {horseman.severity}
                        </span>
                      </div>
                      <p className="text-sm italic text-muted-foreground">&ldquo;{horseman.quote}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>AI Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{report.feedback}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'cards' && (
        <Card>
          <CardHeader>
            <CardTitle>All Cards ({report.cards.length})</CardTitle>
            <CardDescription>Detailed breakdown of each communication behavior</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.cards.map((card, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${getCardColor(card.type)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold">{card.category}</span>
                    <span className="text-xs font-medium px-2 py-1 rounded">
                      {card.type}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{card.reason}</p>
                  {card.quote && (
                    <p className="text-sm italic opacity-75 border-l-2 pl-2">
                      &ldquo;{card.quote}&rdquo;
                    </p>
                  )}
                  {card.speaker && (
                    <p className="text-xs mt-2 text-muted-foreground">
                      Speaker: {card.speaker}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'coaching' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Coaching Tips</CardTitle>
              <CardDescription>Personalized suggestions for improvement</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {report.coachingTips.map((tip, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-primary font-bold">{i + 1}.</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {report.repairAttempts && report.repairAttempts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-success">Repair Attempts ({report.repairAttempts.length})</CardTitle>
                <CardDescription>Positive efforts to improve the conversation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.repairAttempts.map((repair, i) => (
                    <div key={i} className="p-3 rounded-lg bg-success/5 border border-success/10">
                      <p className="font-medium text-success mb-1">{repair.category}</p>
                      <p className="text-sm italic">&ldquo;{repair.quote}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'scorecards' && (
        <Card>
          <CardHeader>
            <CardTitle>Individual Scorecards</CardTitle>
            <CardDescription>Per-person performance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {report.individualScores && report.individualScores.length > 0 ? (
              <div className="space-y-4">
                {report.individualScores.map((score, i) => (
                  <div key={i} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{score.speaker}</h3>
                        <p className="text-sm text-muted-foreground">Personal Score</p>
                      </div>
                      <p className={`text-3xl font-bold ${getScoreColor(score.personalScore)}`}>
                        {score.personalScore}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-2 rounded bg-success/10">
                        <p className="text-xl font-bold text-success">{score.greenCardCount}</p>
                        <p className="text-xs">Green</p>
                      </div>
                      <div className="text-center p-2 rounded bg-warning/10">
                        <p className="text-xl font-bold text-warning">{score.yellowCardCount}</p>
                        <p className="text-xs">Yellow</p>
                      </div>
                      <div className="text-center p-2 rounded bg-destructive/10">
                        <p className="text-xl font-bold text-destructive">{score.redCardCount}</p>
                        <p className="text-xs">Red</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank Contribution:</span>
                        <span className={score.bankContribution >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>
                          {score.bankContribution >= 0 ? '+' : ''}{score.bankContribution}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Repair Attempts:</span>
                        <span className="font-medium">{score.repairAttemptCount}</span>
                      </div>
                      {score.horsemenUsed.length > 0 && (
                        <div className="mt-2">
                          <span className="text-muted-foreground text-xs">Horsemen Used:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {score.horsemenUsed.map((h, j) => (
                              <span key={j} className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive">
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Individual scorecards not available for this session
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
