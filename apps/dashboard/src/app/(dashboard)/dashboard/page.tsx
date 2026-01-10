'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRelationshipStore } from '@/lib/relationship-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import type { User, GamificationStats, Session } from '@/types';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activeRelationshipId } = useRelationshipStore();

  useEffect(() => {
    loadData();
  }, [activeRelationshipId]);

  const loadData = async () => {
    try {
      const [userData, statsData, sessionsData] = await Promise.all([
        api.getCurrentUser(),
        api.getGamificationStats(activeRelationshipId || undefined),
        api.getSessions(activeRelationshipId || undefined),
      ]);

      setUser(userData);
      setStats(statsData);
      setRecentSessions(sessionsData.slice(0, 5)); // Last 5 sessions
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
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
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">Here&apos;s an overview of your relationship coaching journey</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <span className="text-2xl">🔥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.currentStreak || 0} days</div>
            <p className="text-xs text-muted-foreground">
              Longest: {stats?.longestStreak || 0} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <span className="text-2xl">💬</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg score: {stats?.averageScore?.toFixed(0) || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emotional Bank</CardTitle>
            <span className="text-2xl">🏦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBankBalance || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalGreenCards || 0} green cards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
            <span className="text-2xl">🎴</span>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-baseline">
              <span className="text-success font-bold">{stats?.totalGreenCards || 0}</span>
              <span className="text-warning font-bold">{stats?.totalYellowCards || 0}</span>
              <span className="text-error font-bold">{stats?.totalRedCards || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Green / Yellow / Red</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Sessions</CardTitle>
            <Link href="/dashboard/sessions">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No sessions yet</p>
              <Link href="/dashboard/sessions/new">
                <Button className="mt-4">Start First Session</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/dashboard/sessions/${session.id}`}
                  className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {session.source === 'AUDIO' ? '🎙️ Audio' : '💬 WhatsApp'} Session
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'COMPLETED' ? 'bg-success/10 text-success' :
                        session.status === 'FAILED' ? 'bg-destructive/10 text-destructive' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Start New Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/sessions/new?type=audio">
              <Button className="w-full" variant="outline">🎙️ Record Audio</Button>
            </Link>
            <Link href="/dashboard/sessions/new?type=whatsapp">
              <Button className="w-full" variant="outline">💬 Import WhatsApp Chat</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Explore Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/personality">
              <Button className="w-full" variant="outline">🧠 View Personality Profile</Button>
            </Link>
            <Link href="/dashboard/insights">
              <Button className="w-full" variant="outline">💡 See Insights</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
