'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRelationshipStore } from '@/lib/relationship-store';
import type { Relationship } from '@/types';

export function RelationshipSwitcher() {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activeRelationshipId, setActiveRelationship } = useRelationshipStore();

  useEffect(() => {
    loadRelationships();
  }, []);

  const loadRelationships = async () => {
    try {
      const data = await api.getRelationships();
      setRelationships(data);

      // If no active relationship is set, default to first one
      if (!activeRelationshipId && data.length > 0) {
        setActiveRelationship(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load relationships:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setActiveRelationship(value === 'all' ? null : value);
  };

  const activeRelationship = relationships.find(r => r.id === activeRelationshipId);

  if (isLoading) {
    return (
      <div className="w-48 h-10 bg-muted animate-pulse rounded-md"></div>
    );
  }

  if (relationships.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Viewing:</span>
      <select
        value={activeRelationshipId || 'all'}
        onChange={handleChange}
        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <option value="all">All Relationships</option>
        {relationships.map((rel) => (
          <option key={rel.id} value={rel.id}>
            {rel.name}
          </option>
        ))}
      </select>
      {activeRelationship && (
        <span className="text-xs text-muted-foreground">
          ({activeRelationship.type})
        </span>
      )}
    </div>
  );
}
