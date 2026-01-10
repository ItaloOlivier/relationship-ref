'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import type { Relationship } from '@/types';

export default function RelationshipsPage() {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRelationships();
  }, []);

  const loadRelationships = async () => {
    try {
      const data = await api.getRelationships();
      setRelationships(data);
    } catch (error) {
      console.error('Failed to load relationships:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ROMANTIC_COUPLE': return '❤️';
      case 'ROMANTIC_POLYAMOROUS': return '💕';
      case 'FRIENDSHIP_PAIR': return '👥';
      case 'FRIENDSHIP_GROUP': return '👫';
      case 'FAMILY_PARENT_CHILD': return '👨‍👩‍👧';
      case 'FAMILY_SIBLINGS': return '👨‍👩‍👧‍👦';
      case 'FAMILY_EXTENDED': return '👪';
      case 'BUSINESS_PARTNERSHIP': return '🤝';
      case 'PROFESSIONAL_MENTORSHIP': return '👨‍🏫';
      case 'PROFESSIONAL_TEAM': return '💼';
      case 'COMMUNITY_GROUP': return '🏘️';
      default: return '🔗';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-success/10 text-success';
      case 'PAUSED': return 'bg-warning/10 text-warning';
      case 'ENDED_MUTUAL':
      case 'ENDED_UNILATERAL': return 'bg-muted text-muted-foreground';
      case 'ARCHIVED': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const groupedRelationships = relationships.reduce((acc, rel) => {
    const category = rel.type.split('_')[0]; // ROMANTIC, FRIENDSHIP, FAMILY, etc.
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(rel);
    return acc;
  }, {} as Record<string, Relationship[]>);

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
          <h1 className="text-3xl font-bold">Relationships</h1>
          <p className="text-muted-foreground">Manage all your relationships in one place</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Join Relationship</Button>
          <Button>+ Create New</Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{relationships.length}</p>
              <p className="text-sm text-muted-foreground">Total Relationships</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-success">
                {relationships.filter(r => r.status === 'ACTIVE').length}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-warning">
                {relationships.filter(r => r.status === 'PAUSED').length}
              </p>
              <p className="text-sm text-muted-foreground">Paused</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-muted-foreground">
                {relationships.filter(r => r.status.startsWith('ENDED')).length}
              </p>
              <p className="text-sm text-muted-foreground">Ended</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relationships List Grouped by Type */}
      {relationships.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No relationships yet</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline">Join via Invite Code</Button>
              <Button>Create First Relationship</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedRelationships).map(([category, rels]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold mb-4 capitalize">
                {category.toLowerCase()} ({rels.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rels.map((relationship) => (
                  <Link key={relationship.id} href={`/dashboard/relationships/${relationship.id}`}>
                    <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{getTypeIcon(relationship.type)}</span>
                            <div>
                              <h3 className="font-semibold">{relationship.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                {getTypeLabel(relationship.type)}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(relationship.status)}`}>
                            {relationship.status === 'ACTIVE' ? 'Active' :
                             relationship.status === 'PAUSED' ? 'Paused' :
                             'Ended'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {/* Member count */}
                          <div className="flex items-center gap-2 text-sm">
                            <span>👤</span>
                            <span className="text-muted-foreground">
                              {relationship.members?.length || 0} members
                            </span>
                          </div>

                          {/* Session count (if available) */}
                          {relationship.sessionCount !== undefined && (
                            <div className="flex items-center gap-2 text-sm">
                              <span>💬</span>
                              <span className="text-muted-foreground">
                                {relationship.sessionCount} sessions
                              </span>
                            </div>
                          )}

                          {/* Health score (if available) */}
                          {relationship.healthScore !== undefined && (
                            <div className="flex items-center gap-2 text-sm">
                              <span>❤️</span>
                              <span className={`font-medium ${
                                relationship.healthScore >= 80 ? 'text-success' :
                                relationship.healthScore >= 60 ? 'text-warning' :
                                'text-destructive'
                              }`}>
                                Health: {relationship.healthScore}/100
                              </span>
                            </div>
                          )}

                          {/* Invite code (for active relationships) */}
                          {relationship.status === 'ACTIVE' && relationship.inviteCode && (
                            <div className="flex items-center gap-2 text-sm pt-2 border-t border-border">
                              <span>🔑</span>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {relationship.inviteCode}
                              </code>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
