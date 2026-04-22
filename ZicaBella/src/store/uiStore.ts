import { create } from 'zustand';

interface UIStore {
  isLoading: boolean;
  isOffline: boolean;
  isTabBarVisible: boolean;
  isCartOpen: boolean;
  isBookmarkOpen: boolean;
  isMenuOpen: boolean;
  setLoading: (loading: boolean) => void;
  setOffline: (offline: boolean) => void;
  setTabBarVisible: (visible: boolean) => void;
  setCartOpen: (open: boolean) => void;
  setBookmarkOpen: (open: boolean) => void;
  setMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isLoading: false,
  isOffline: false,
  isTabBarVisible: true,
  isCartOpen: false,
  isBookmarkOpen: false,
  isMenuOpen: false,
  setLoading: (loading) => set({ isLoading: loading }),
  setOffline: (offline) => set({ isOffline: offline }),
  setTabBarVisible: (visible) => set({ isTabBarVisible: visible }),
  setCartOpen: (open) => set({ isCartOpen: open }),
  setBookmarkOpen: (open) => set({ isBookmarkOpen: open }),
  setMenuOpen: (open) => set({ isMenuOpen: open }),
}));
