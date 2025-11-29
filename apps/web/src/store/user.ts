import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile, Persona, World } from '@parallel/database';

interface UserState {
  // User data
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Active selections
  activePersona: Persona | null;
  activeWorld: World | null;
  activeConversationId: string | null;

  // User's collections
  personas: Persona[];
  worlds: World[];

  // Credits and subscription
  credits: number;
  subscriptionTier: string;

  // Actions
  setUser: (user: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setActivePersona: (persona: Persona | null) => void;
  setActiveWorld: (world: World | null) => void;
  setActiveConversationId: (id: string | null) => void;
  setPersonas: (personas: Persona[]) => void;
  setWorlds: (worlds: World[]) => void;
  updateCredits: (credits: number) => void;
  deductCredits: (amount: number) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isLoading: true,
      isAuthenticated: false,
      activePersona: null,
      activeWorld: null,
      activeConversationId: null,
      personas: [],
      worlds: [],
      credits: 0,
      subscriptionTier: 'free',

      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          credits: user?.credits_balance ?? 0,
          subscriptionTier: user?.subscription_tier ?? 'free',
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setActivePersona: (activePersona) => set({ activePersona }),

      setActiveWorld: (activeWorld) => set({ activeWorld }),

      setActiveConversationId: (activeConversationId) => set({ activeConversationId }),

      setPersonas: (personas) => set({ personas }),

      setWorlds: (worlds) => set({ worlds }),

      updateCredits: (credits) => set({ credits }),

      deductCredits: (amount) =>
        set((state) => ({
          credits: Math.max(0, state.credits - amount),
        })),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          activePersona: null,
          activeWorld: null,
          activeConversationId: null,
          personas: [],
          worlds: [],
          credits: 0,
          subscriptionTier: 'free',
        }),
    }),
    {
      name: 'parallel-user-store',
      partialize: (state) => ({
        activePersona: state.activePersona,
        activeWorld: state.activeWorld,
      }),
    }
  )
);
