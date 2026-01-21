import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (user, token) => set({ 
        user, 
        accessToken: token, 
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        user: null, 
        accessToken: null, 
        isAuthenticated: false,
      }),

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'lms-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
