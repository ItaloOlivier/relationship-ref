import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RelationshipState {
  activeRelationshipId: string | null;
  setActiveRelationship: (id: string | null) => void;
  clearActiveRelationship: () => void;
}

export const useRelationshipStore = create<RelationshipState>()(
  persist(
    (set) => ({
      activeRelationshipId: null,
      setActiveRelationship: (id) => set({ activeRelationshipId: id }),
      clearActiveRelationship: () => set({ activeRelationshipId: null }),
    }),
    {
      name: 'relationship-context',
    }
  )
);
