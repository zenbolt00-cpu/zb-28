import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
  isCommunityMember?: boolean;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  biometricEnabled: boolean;

  login: (user: User) => void;
  logout: () => void;
  setBiometric: (enabled: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      biometricEnabled: false,

      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setBiometric: (enabled) => set({ biometricEnabled: enabled }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'zicabella-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
