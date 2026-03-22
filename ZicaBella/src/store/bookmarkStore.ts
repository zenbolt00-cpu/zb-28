import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlatProduct } from '../api/types';

interface BookmarkStore {
  bookmarks: FlatProduct[];
  addBookmark: (product: FlatProduct) => void;
  removeBookmark: (productId: string) => void;
  isBookmarked: (productId: string) => boolean;
  clearBookmarks: () => void;
}

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set, get) => ({
      bookmarks: [],

      addBookmark: (product) => {
        set((state) => {
          if (state.bookmarks.find((b) => b.id === product.id)) return state;
          return { bookmarks: [...state.bookmarks, product] };
        });
      },

      removeBookmark: (productId) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== productId),
        })),

      isBookmarked: (productId) =>
        get().bookmarks.some((b) => b.id === productId),

      clearBookmarks: () => set({ bookmarks: [] }),
    }),
    {
      name: 'zicabella-bookmarks',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
