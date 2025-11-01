"use client";

import { Filter, X, Star, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import type { ApiEndpoint } from "@/utils/types";

export type SortOption = "name" | "method" | "path" | "none";
export type MethodFilter = "ALL" | "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface FilterBarProps {
  selectedMethods: Set<MethodFilter>;
  onMethodToggle: (method: MethodFilter) => void;
  selectedTags: Set<string>;
  onTagToggle: (tag: string) => void;
  availableTags: string[];
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  showFavoritesOnly: boolean;
  onFavoritesToggle: () => void;
  favoriteCount: number;
}

export function FilterBar({
  selectedMethods,
  onMethodToggle,
  selectedTags,
  onTagToggle,
  availableTags,
  sortBy,
  onSortChange,
  showFavoritesOnly,
  onFavoritesToggle,
  favoriteCount,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const methods: MethodFilter[] = [
    "ALL",
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
  ];
  const methodColors: Record<MethodFilter, string> = {
    ALL: "#6c757d",
    GET: "#61affe",
    POST: "#49cc90",
    PUT: "#fca130",
    DELETE: "#f93e3e",
    PATCH: "#50e3c2",
  };

  return (
    <div className="border-b border-border bg-card">
      {/* Filter Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters & Sort</span>
          {(selectedMethods.size > 1 ||
            selectedTags.size > 0 ||
            sortBy !== "none" ||
            showFavoritesOnly) && (
            <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
              Active
            </span>
          )}
        </div>
        {isExpanded ? (
          <X className="w-4 h-4" />
        ) : (
          <ArrowUpDown className="w-4 h-4" />
        )}
      </button>

      {/* Filter Content */}
      {isExpanded && (
        <div className="px-4 py-3 space-y-4 border-t border-border">
          {/* Favorites Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Show Only
            </label>
            <button
              onClick={onFavoritesToggle}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                showFavoritesOnly
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-accent"
              }`}
            >
              <Star
                className={`w-4 h-4 ${showFavoritesOnly ? "fill-current" : ""}`}
              />
              <span>Favorites ({favoriteCount})</span>
            </button>
          </div>

          {/* Method Filters */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              HTTP Methods
            </label>
            <div className="flex flex-wrap gap-2">
              {methods.map((method) => (
                <button
                  key={method}
                  onClick={() => onMethodToggle(method)}
                  style={{
                    backgroundColor: selectedMethods.has(method)
                      ? methodColors[method]
                      : undefined,
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                    selectedMethods.has(method)
                      ? "text-white"
                      : "bg-muted hover:bg-accent text-foreground"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Tag Filters */}
          {availableTags.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Categories / Tags
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onTagToggle(tag)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      selectedTags.has(tag)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-accent text-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sort Options */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="w-full px-3 py-1.5 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="none">Default</option>
              <option value="name">Name (Summary)</option>
              <option value="method">HTTP Method</option>
              <option value="path">Path</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
