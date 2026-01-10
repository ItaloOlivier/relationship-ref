'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import type { Relationship, Session } from '@/types';

interface RelationshipMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface RelationshipHealth {
  healthScore: number;
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  emotionalBankBalance: number;
  greenCardRatio: number;
}

export default function RelationshipDetailPage() {
  const router = useRouter();
  const params = useParams();
  const relationshipId = params?.id as string;

  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [members, setMembers] = useState<RelationshipMember[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [health, setHealth] = useState<RelationshipHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [relationshipId]);

  const loadData = async () => {
    try {
      const [relData, membersData, sessionsData, healthData] = await Promise.all([
        api.getRelationship(relationshipId),
        api.getRelationshipMembers(relationshipId),
        api.getRelationshipSessions(relationshipId),
        api.getRelationshipHealth(relationshipId),
      ]);

      setRelationship(relData);
      setMembers(membersData);
      setSessions(sessionsData.slice(0, 10)); // Latest 10 sessions
      setHealth(healthData);
    } catch (error) {
      console.error('Failed to load relationship data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (relationship?.inviteCode) {
      navigator.clipboard.writeText(relationship.inviteCode);
      alert('Invite code copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!relationship) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Relationship not found</p>
        <Link href="/dashboard/relationships">
          <Button className="mt-4">Back to Relationships</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/relationships" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Relationships
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-3xl font-bold">{relationship.name}</h1>
            <p className="text-muted-foreground">{relationship.type.split('_').join(' ')}</p>
          </div>
          <div className="flex gap-2">
            {relationship.status === 'ACTIVE' && (
              <>
                <Button variant="outline">Pause</Button>
                <Button variant="outline" className="text-destructive">Leave</Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Health Score Card */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle>Relationship Health</CardTitle>
            <CardDescription>Based on your last 30 days of sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="text-center">
                <p className={`text-4xl font-bold ${
                  health.healthScore >= 80 ? 'text-success' :
                  health.healthScore >= 60 ? 'text-warning' :
                  'text-destructive'
                }`}>
                  {health.healthScore}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Health Score</p>
              </div>

              <div className="text-center">
                <p className={`text-2xl font-bold ${
                  health.trend === 'IMPROVING' ? 'text-success' :
                  health.trend === 'DECLINING' ? 'text-destructive' :
                  'text-muted-foreground'
                }`}>
                  {health.trend === 'IMPROVING' ? '📈' :
                   health.trend === 'DECLINING' ? '📉' :
                   '➡️'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {health.trend === 'IMPROVING' ? 'Improving' :
                   health.trend === 'DECLINING' ? 'Declining' :
                   'Stable'}
                </p>
              </div>

              <div className="text-center">
                <p className={`text-3xl font-bold ${
                  health.emotionalBankBalance > 0 ? 'text-success' :
                  health.emotionalBankBalance < 0 ? 'text-destructive' :
                  'text-muted-foreground'
                }`}>
                  {health.emotionalBankBalance > 0 ? '+' : ''}{health.emotionalBankBalance}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Emotional Bank</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden w-24">
                    <div
                      className="h-full bg-success"
                      style={{ width: `${health.greenCardRatio * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round(health.greenCardRatio * 100)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Green Card Ratio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Members ({members.length})</CardTitle>
              <CardDescription>People in this relationship</CardDescription>
            </div>
            {relationship.status === 'ACTIVE' && (
              <Button variant="outline" size="sm">Invite Someone</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-medium">{member.user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium">{member.user.name}</p>
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted">
                    {member.role}
                  </span>
                  <Link href={`/dashboard/relationships/${relationshipId}/members/${member.userId}`}>
                    <Button variant="ghost" size="sm">View Profile</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Sessions ({sessions.length})</CardTitle>
              <CardDescription>Latest coaching sessions for this relationship</CardDescription>
            </div>
            <Link href="/dashboard/sessions/new">
              <Button size="sm">+ New Session</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No sessions yet. Start your first coaching session to build insights.
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Link key={session.id} href={`/dashboard/sessions/${session.id}`}>
                  <div className="p-4 rounded-lg border hover:border-primary transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {session.source === 'AUDIO' ? '🎙️' : '💬'}
                        </span>
                        <div>
                          <p className="font-medium">
                            {session.source === 'AUDIO' ? 'Audio Session' : 'WhatsApp Chat'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {session.analysisResult && (
                          <>
                            <span className={`text-2xl font-bold ${
                              session.analysisResult.overallScore >= 80 ? 'text-success' :
                              session.analysisResult.overallScore >= 60 ? 'text-warning' :
                              'text-destructive'
                            }`}>
                              {session.analysisResult.overallScore}
                            </span>
                            <div className="flex gap-1">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                                {session.analysisResult.cards.filter(c => c.type === 'GREEN').length}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                                {session.analysisResult.cards.filter(c => c.type === 'YELLOW').length}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                                {session.analysisResult.cards.filter(c => c.type === 'RED').length}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Code (for active relationships) */}
      {relationship.status === 'ACTIVE' && relationship.inviteCode && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Code</CardTitle>
            <CardDescription>Share this code to invite others to join</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <code className="flex-1 p-3 bg-muted rounded-md font-mono text-lg">
                {relationship.inviteCode}
              </code>
              <Button onClick={copyInviteCode}>Copy</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
