"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import type { ApiEndpoint } from "@/utils/types";
import {
  getMethodBackgroundColor,
  getMethodTextColor,
  getMethodPastelColor,
} from "@/utils/methodColor";
import { useFavorites } from "@/context/FavoritesContext";

interface EndpointCardProps {
  endpoint: ApiEndpoint;
  isSelected: boolean;
  onClick: () => void;
}

export function EndpointCard({
  endpoint,
  isSelected,
  onClick,
}: EndpointCardProps) {
  const [isDark, setIsDark] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    // Kiểm tra theme sau khi mount
    const checkTheme = () => {
      if (typeof window !== "undefined") {
        setIsDark(document.documentElement.classList.contains("dark"));
      }
    };
    checkTheme();

    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    if (typeof window !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    return () => observer.disconnect();
  }, []);

  const pastelColor = getMethodPastelColor(endpoint.method, isSelected, isDark);
  const favorite = isFavorite(endpoint.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(endpoint.id);
  };

  return (
    <button
      onClick={onClick}
      style={pastelColor ? { backgroundColor: pastelColor } : undefined}
      className={`w-full text-left p-3 rounded-lg transition-all ${
        isSelected
          ? pastelColor
            ? "text-foreground shadow-md"
            : "bg-primary text-primary-foreground shadow-md"
          : "bg-card hover:bg-accent border border-border"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          style={{ backgroundColor: getMethodBackgroundColor(endpoint.method) }}
          className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${getMethodTextColor(
            endpoint.method
          )}`}
        >
          {endpoint.method}
        </span>
        <span
          className={`text-sm font-mono truncate flex-1 min-w-0 ${
            isSelected
              ? pastelColor
                ? "text-foreground"
                : "text-primary-foreground/90"
              : "text-muted-foreground"
          }`}
        >
          {endpoint.path}
        </span>
        <button
          onClick={handleFavoriteClick}
          className={`p-1 hover:bg-accent rounded transition-colors flex-shrink-0 ${
            favorite ? "text-yellow-500" : "text-muted-foreground"
          }`}
          title={favorite ? "Bỏ bookmark" : "Thêm bookmark"}
        >
          <Star className={`w-4 h-4 ${favorite ? "fill-current" : ""}`} />
        </button>
      </div>
      {endpoint.summary && (
        <p
          className={`text-xs mt-1 line-clamp-2 ${
            isSelected
              ? pastelColor
                ? "text-foreground/80"
                : "text-primary-foreground/80"
              : "text-muted-foreground"
          }`}
        >
          {endpoint.summary}
        </p>
      )}
    </button>
  );
}
