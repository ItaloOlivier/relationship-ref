'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRelationshipStore } from '@/lib/relationship-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Pattern } from '@/types';

interface InsightsSummary {
  totalSessions: number;
  avgScore: number;
  topStrength: string;
  topChallenge: string;
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
}

export default function InsightsPage() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [summary, setSummary] = useState<InsightsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'patterns' | 'trends' | 'summary'>('patterns');
  const { activeRelationshipId } = useRelationshipStore();

  useEffect(() => {
    loadData();
  }, [activeRelationshipId]);

  const loadData = async () => {
    try {
      const [patternsData, summaryData] = await Promise.all([
        api.getPatterns(activeRelationshipId || undefined),
        api.getInsightsSummary(activeRelationshipId || undefined),
      ]);

      setPatterns(patternsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = async (patternId: string) => {
    try {
      await api.acknowledgePattern(patternId);
      setPatterns(patterns.map(p =>
        p.id === patternId ? { ...p, acknowledged: true } : p
      ));
    } catch (error) {
      console.error('Failed to acknowledge pattern:', error);
    }
  };

  const handleDismiss = async (patternId: string) => {
    try {
      await api.dismissPattern(patternId);
      setPatterns(patterns.filter(p => p.id !== patternId));
    } catch (error) {
      console.error('Failed to dismiss pattern:', error);
    }
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'TOPIC_TRIGGER': return '🎯';
      case 'TIME_PATTERN': return '⏰';
      case 'BEHAVIOR_TREND': return '📊';
      case 'HORSEMAN_TREND': return '🐴';
      case 'POSITIVE_PATTERN': return '✨';
      default: return '💡';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'WARNING': return 'bg-warning/10 text-warning border-warning/20';
      case 'INFO': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'POSITIVE': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Insights & Patterns</h1>
        <p className="text-muted-foreground">AI-detected patterns across your sessions</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {[
            { id: 'patterns', label: 'Detected Patterns', count: patterns.length },
            { id: 'trends', label: 'Trends Over Time' },
            { id: 'summary', label: 'Summary' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-muted text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Patterns Tab */}
      {activeTab === 'patterns' && (
        <div className="space-y-4">
          {patterns.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  No patterns detected yet. Complete at least 3 sessions to start seeing insights.
                </p>
              </CardContent>
            </Card>
          ) : (
            patterns.map((pattern) => (
              <Card key={pattern.id} className={`border-2 ${getSeverityColor(pattern.severity)}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <span className="text-4xl">{getPatternIcon(pattern.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{pattern.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(pattern.severity)}`}>
                            {pattern.severity}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {pattern.description}
                        </p>

                        {/* Suggested Action */}
                        {pattern.suggestedAction && (
                          <div className="bg-muted/50 rounded-lg p-3 mb-3">
                            <p className="text-sm">
                              <span className="font-medium">💡 Suggested Action:</span>{' '}
                              {pattern.suggestedAction}
                            </p>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Detected: {new Date(pattern.detectedAt).toLocaleDateString()}</span>
                          <span>Confidence: {Math.round(pattern.confidence * 100)}%</span>
                          {pattern.frequency && <span>Frequency: {pattern.frequency}x</span>}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {!pattern.acknowledged && !pattern.dismissed && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcknowledge(pattern.id)}
                        >
                          ✓ Got it
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismiss(pattern.id)}
                        >
                          ✕ Dismiss
                        </Button>
                      </div>
                    )}

                    {pattern.acknowledged && (
                      <span className="text-sm text-success ml-4">✓ Acknowledged</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && summary && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overall Trend</CardTitle>
              <CardDescription>How your relationship health is changing over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className={`text-6xl mb-4 ${
                    summary.trend === 'IMPROVING' ? 'text-success' :
                    summary.trend === 'DECLINING' ? 'text-destructive' :
                    'text-muted-foreground'
                  }`}>
                    {summary.trend === 'IMPROVING' ? '📈' :
                     summary.trend === 'DECLINING' ? '📉' :
                     '➡️'}
                  </p>
                  <p className="text-2xl font-bold mb-2">
                    {summary.trend === 'IMPROVING' ? 'Improving' :
                     summary.trend === 'DECLINING' ? 'Needs Attention' :
                     'Stable'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Based on {summary.totalSessions} sessions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specific Trends */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Strength</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium text-success">{summary.topStrength}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Area for Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium text-warning">{summary.topChallenge}</p>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder for future charts */}
          <Card>
            <CardHeader>
              <CardTitle>Session Scores Over Time</CardTitle>
              <CardDescription>Coming soon: Interactive chart showing your progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Chart visualization coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && summary && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Insights Summary</CardTitle>
              <CardDescription>Key takeaways from your communication patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center p-4">
                  <p className="text-4xl font-bold text-primary">{summary.totalSessions}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Sessions</p>
                </div>
                <div className="text-center p-4">
                  <p className={`text-4xl font-bold ${
                    summary.avgScore >= 80 ? 'text-success' :
                    summary.avgScore >= 60 ? 'text-warning' :
                    'text-destructive'
                  }`}>
                    {Math.round(summary.avgScore)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Average Score</p>
                </div>
                <div className="text-center p-4">
                  <p className={`text-4xl font-bold ${
                    summary.trend === 'IMPROVING' ? 'text-success' :
                    summary.trend === 'DECLINING' ? 'text-destructive' :
                    'text-muted-foreground'
                  }`}>
                    {summary.trend === 'IMPROVING' ? '↗' :
                     summary.trend === 'DECLINING' ? '↘' :
                     '→'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {summary.trend === 'IMPROVING' ? 'Improving' :
                     summary.trend === 'DECLINING' ? 'Declining' :
                     'Stable'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strengths and Challenges */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>✨ What&apos;s Working Well</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-success">✓</span>
                    <span className="text-sm">{summary.topStrength}</span>
                  </li>
                  {patterns
                    .filter(p => p.severity === 'POSITIVE')
                    .slice(0, 3)
                    .map(p => (
                      <li key={p.id} className="flex items-start gap-2">
                        <span className="text-success">✓</span>
                        <span className="text-sm">{p.title}</span>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>⚠️ Areas for Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-warning">!</span>
                    <span className="text-sm">{summary.topChallenge}</span>
                  </li>
                  {patterns
                    .filter(p => p.severity === 'WARNING' || p.severity === 'CRITICAL')
                    .slice(0, 3)
                    .map(p => (
                      <li key={p.id} className="flex items-start gap-2">
                        <span className="text-warning">!</span>
                        <span className="text-sm">{p.title}</span>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Action Items */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Recommended Next Steps</CardTitle>
              <CardDescription>Based on your detected patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {patterns
                  .filter(p => p.suggestedAction && !p.acknowledged)
                  .slice(0, 5)
                  .map((p, i) => (
                    <li key={p.id} className="flex items-start gap-3">
                      <span className="font-bold text-primary">{i + 1}.</span>
                      <div className="flex-1">
                        <p className="font-medium">{p.title}</p>
                        <p className="text-sm text-muted-foreground">{p.suggestedAction}</p>
                      </div>
                    </li>
                  ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
