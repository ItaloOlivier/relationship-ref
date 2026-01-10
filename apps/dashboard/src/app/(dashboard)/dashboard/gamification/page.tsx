'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRelationshipStore } from '@/lib/relationship-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import type { GamificationStats, Quest } from '@/types';

export default function GamificationPage() {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activeRelationshipId } = useRelationshipStore();

  useEffect(() => {
    loadData();
  }, [activeRelationshipId]);

  const loadData = async () => {
    try {
      const [statsData, questsData] = await Promise.all([
        api.getGamificationStats(activeRelationshipId || undefined),
        api.getQuests(activeRelationshipId || undefined),
      ]);
      setStats(statsData);
      setQuests(questsData);
    } catch (error) {
      console.error('Failed to load gamification data:', error);
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

  const activeQuests = quests.filter((q) => !q.isCompleted);
  const completedQuests = quests.filter((q) => q.isCompleted);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gamification</h1>
        <p className="text-muted-foreground">Track your progress and complete quests</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <span className="text-3xl">🔥</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.currentStreak || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Longest: {stats?.longestStreak || 0} days
            </p>
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                style={{ width: `${Math.min((stats?.currentStreak || 0) / 30 * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <span className="text-3xl">💬</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalSessions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg Score: {stats?.averageScore?.toFixed(1) || 0}
            </p>
            <div className="mt-3 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-2 rounded-full ${
                    i < Math.floor((stats?.averageScore || 0) / 20) ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emotional Bank</CardTitle>
            <span className="text-3xl">🏦</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalBankBalance || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total deposits and withdrawals
            </p>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-success">+{stats?.totalGreenCards || 0}</span>
              <span className="text-destructive">-{(stats?.totalYellowCards || 0) + (stats?.totalRedCards || 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cards Earned</CardTitle>
            <span className="text-3xl">🎴</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(stats?.totalGreenCards || 0) + (stats?.totalYellowCards || 0) + (stats?.totalRedCards || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all sessions</p>
            <div className="mt-3 flex gap-2 text-sm">
              <span className="text-success font-medium">{stats?.totalGreenCards || 0}</span>
              <span className="text-warning font-medium">{stats?.totalYellowCards || 0}</span>
              <span className="text-destructive font-medium">{stats?.totalRedCards || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Quests */}
      <Card>
        <CardHeader>
          <CardTitle>Active Quests ({activeQuests.length})</CardTitle>
          <CardDescription>Complete these challenges to improve your relationship</CardDescription>
        </CardHeader>
        <CardContent>
          {activeQuests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No active quests. Check back later for new challenges!
            </p>
          ) : (
            <div className="space-y-4">
              {activeQuests.map((quest) => (
                <div key={quest.id} className="p-4 rounded-lg border hover:border-primary transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{quest.name}</h3>
                      <p className="text-sm text-muted-foreground">{quest.description}</p>
                    </div>
                    <span className="text-2xl">🎯</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {quest.currentValue} / {quest.targetValue}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min((quest.currentValue / quest.targetValue) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Quests */}
      {completedQuests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Quests ({completedQuests.length})</CardTitle>
            <CardDescription>Your achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedQuests.map((quest) => (
                <div key={quest.id} className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                  <span className="text-2xl">✅</span>
                  <div className="flex-1">
                    <h3 className="font-semibold">{quest.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Completed {quest.completedAt ? new Date(quest.completedAt).toLocaleDateString() : 'recently'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Badges & Achievements</CardTitle>
          <CardDescription>Unlock badges by reaching milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { icon: '🥉', name: 'First Session', unlocked: (stats?.totalSessions || 0) >= 1 },
              { icon: '🔥', name: '7-Day Streak', unlocked: (stats?.longestStreak || 0) >= 7 },
              { icon: '💚', name: '100 Green Cards', unlocked: (stats?.totalGreenCards || 0) >= 100 },
              { icon: '🎯', name: 'Quest Master', unlocked: completedQuests.length >= 5 },
              { icon: '⭐', name: 'High Scorer', unlocked: (stats?.averageScore || 0) >= 80 },
              { icon: '🏆', name: 'Champion', unlocked: (stats?.totalSessions || 0) >= 50 },
            ].map((badge, i) => (
              <div
                key={i}
                className={`text-center p-4 rounded-lg border ${
                  badge.unlocked ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 opacity-50'
                }`}
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <p className="text-xs font-medium">{badge.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
