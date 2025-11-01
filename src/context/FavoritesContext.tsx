"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { ApiEndpoint } from "@/utils/types";

interface FavoritesContextType {
  favorites: Set<string>; // Set of endpoint IDs
  addFavorite: (endpointId: string) => void;
  removeFavorite: (endpointId: string) => void;
  toggleFavorite: (endpointId: string) => void;
  isFavorite: (endpointId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

const STORAGE_KEY = "api-viewer-favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load favorites from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const favoriteArray = JSON.parse(stored) as string[];
          setFavorites(new Set(favoriteArray));
        }
      } catch (err) {
        console.error("Error loading favorites:", err);
      }
    }
  }, []);

  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(Array.from(favorites))
        );
      } catch (err) {
        console.error("Error saving favorites:", err);
      }
    }
  }, [favorites]);

  const addFavorite = (endpointId: string) => {
    setFavorites((prev) => new Set([...prev, endpointId]));
  };

  const removeFavorite = (endpointId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.delete(endpointId);
      return next;
    });
  };

  const toggleFavorite = (endpointId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(endpointId)) {
        next.delete(endpointId);
      } else {
        next.add(endpointId);
      }
      return next;
    });
  };

  const isFavorite = (endpointId: string) => {
    return favorites.has(endpointId);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
