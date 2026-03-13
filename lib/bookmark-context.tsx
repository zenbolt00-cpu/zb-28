"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ShopifyProduct } from "./shopify-admin";

interface BookmarkContextType {
  bookmarks: ShopifyProduct[];
  addBookmark: (product: ShopifyProduct) => void;
  removeBookmark: (productId: string) => void;
  isBookmarked: (productId: string) => boolean;
  toggleBookmark: (product: ShopifyProduct) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const BookmarkContext = createContext<BookmarkContextType | null>(null);

const STORAGE_KEY = "zb_bookmarks_v1";

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<ShopifyProduct[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse bookmarks", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  const addBookmark = useCallback((product: ShopifyProduct) => {
    setBookmarks((prev) => {
      if (prev.find((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });
  }, []);

  const removeBookmark = useCallback((productId: string) => {
    setBookmarks((prev) => prev.filter((p) => p.id.toString() !== productId.toString()));
  }, []);

  const isBookmarked = useCallback((productId: string) => {
    return bookmarks.some((p) => p.id.toString() === productId.toString());
  }, [bookmarks]);

  const toggleBookmark = useCallback((product: ShopifyProduct) => {
    setBookmarks((prev) => {
      if (prev.find((p) => p.id === product.id)) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  }, []);

  return (
    <BookmarkContext.Provider value={{ bookmarks, addBookmark, removeBookmark, isBookmarked, toggleBookmark, isOpen, setIsOpen }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error("useBookmarks must be used within a BookmarkProvider");
  }
  return context;
}
