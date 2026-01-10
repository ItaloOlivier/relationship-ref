'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import type { Session } from '@/types';

type FilterStatus = 'ALL' | 'COMPLETED' | 'PENDING' | 'FAILED';
type FilterSource = 'ALL' | 'AUDIO' | 'WHATSAPP_CHAT';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [sourceFilter, setSourceFilter] = useState<FilterSource>('ALL');

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sessions, searchQuery, statusFilter, sourceFilter]);

  const loadSessions = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Source filter
    if (sourceFilter !== 'ALL') {
      filtered = filtered.filter((s) => s.source === sourceFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((s) =>
        s.id.toLowerCase().includes(query) ||
        s.transcript?.toLowerCase().includes(query)
      );
    }

    setFilteredSessions(filtered);
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      await api.deleteSession(sessionId);
      setSessions(sessions.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-success/10 text-success';
      case 'FAILED': return 'bg-destructive/10 text-destructive';
      case 'TRANSCRIBING':
      case 'ANALYZING': return 'bg-warning/10 text-warning';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-muted-foreground">View and manage your coaching sessions</p>
        </div>
        <Link href="/dashboard/sessions/new">
          <Button>+ New Session</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Source</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as FilterSource)}
              >
                <option value="ALL">All Sources</option>
                <option value="AUDIO">Audio</option>
                <option value="WHATSAPP_CHAT">WhatsApp Chat</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {sessions.length === 0 ? 'No sessions yet' : 'No sessions match your filters'}
            </p>
            {sessions.length === 0 && (
              <Link href="/dashboard/sessions/new">
                <Button>Create First Session</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">
                        {session.source === 'AUDIO' ? '🎙️' : '💬'}
                      </span>
                      <div>
                        <h3 className="font-semibold">
                          {session.source === 'AUDIO' ? 'Audio Session' : 'WhatsApp Chat'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>

                      {session.analysisResult && (
                        <span className="text-sm text-muted-foreground">
                          Score: {session.analysisResult.overallScore}/100
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {session.status === 'COMPLETED' && (
                      <Link href={`/dashboard/sessions/${session.id}`}>
                        <Button variant="outline" size="sm">View Report</Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(session.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {filteredSessions.length} of {sessions.length} sessions</span>
            <span>
              {sessions.filter((s) => s.status === 'COMPLETED').length} completed
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
