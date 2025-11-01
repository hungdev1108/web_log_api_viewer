"use client";

import { useState, useMemo, useEffect } from "react";
import Fuse from "fuse.js";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { useFavorites } from "@/context/FavoritesContext";
import { EndpointCard } from "./EndpointCard";
import { SearchBar } from "./SearchBar";
import { FilterBar, type SortOption, type MethodFilter } from "./FilterBar";
import type { ApiEndpoint } from "@/utils/types";

interface SidebarProps {
  onEndpointSelect?: () => void;
}

export function Sidebar({ onEndpointSelect }: SidebarProps) {
  const { groupedEndpoints, selectedEndpoint, setSelectedEndpoint } = useApi();
  const { favorites } = useFavorites();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<Set<MethodFilter>>(
    new Set(["ALL"])
  );
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>("none");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

  // Tạo Fuse instance cho search
  const allEndpoints = useMemo(() => {
    return Object.values(groupedEndpoints).flat();
  }, [groupedEndpoints]);

  const fuse = useMemo(
    () =>
      new Fuse(allEndpoints, {
        keys: ["path", "summary", "description", "method"],
        threshold: 0.3,
        includeScore: true,
      }),
    [allEndpoints]
  );

  // Lấy danh sách tất cả tags
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    allEndpoints.forEach((endpoint) => {
      endpoint.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [allEndpoints]);

  // Filter và sort endpoints
  const filteredGroups = useMemo(() => {
    let filteredEndpoints = allEndpoints;

    // Filter theo search query
    if (searchQuery.trim()) {
      const searchResults = fuse.search(searchQuery);
      filteredEndpoints = searchResults.map((result) => result.item);
    }

    // Filter theo favorites
    if (showFavoritesOnly) {
      filteredEndpoints = filteredEndpoints.filter((endpoint) =>
        favorites.has(endpoint.id)
      );
    }

    // Filter theo methods
    if (!selectedMethods.has("ALL") && selectedMethods.size > 0) {
      filteredEndpoints = filteredEndpoints.filter((endpoint) =>
        selectedMethods.has(endpoint.method as MethodFilter)
      );
    }

    // Filter theo tags
    if (selectedTags.size > 0) {
      filteredEndpoints = filteredEndpoints.filter((endpoint) =>
        endpoint.tags?.some((tag) => selectedTags.has(tag))
      );
    }

    // Sort endpoints
    if (sortBy !== "none") {
      filteredEndpoints = [...filteredEndpoints].sort((a, b) => {
        switch (sortBy) {
          case "name":
            return (a.summary || a.path).localeCompare(b.summary || b.path);
          case "method": {
            const methodOrder: Record<string, number> = {
              GET: 1,
              POST: 2,
              PUT: 3,
              PATCH: 4,
              DELETE: 5,
            };
            const aOrder = methodOrder[a.method] || 99;
            const bOrder = methodOrder[b.method] || 99;
            return aOrder - bOrder;
          }
          case "path":
            return a.path.localeCompare(b.path);
          default:
            return 0;
        }
      });
    }

    // Group lại các filtered endpoints
    const filtered: Record<string, ApiEndpoint[]> = {};
    filteredEndpoints.forEach((endpoint) => {
      const tag = endpoint.tags?.[0] || "Other";
      if (!filtered[tag]) {
        filtered[tag] = [];
      }
      filtered[tag].push(endpoint);
    });

    // Sort endpoints trong mỗi group nếu sortBy = none
    if (sortBy === "none") {
      Object.keys(filtered).forEach((tag) => {
        filtered[tag].sort((a, b) => {
          const methodOrder: Record<string, number> = {
            GET: 1,
            POST: 2,
            PUT: 3,
            PATCH: 4,
            DELETE: 5,
          };
          const aOrder = methodOrder[a.method] || 99;
          const bOrder = methodOrder[b.method] || 99;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return a.path.localeCompare(b.path);
        });
      });
    }

    return filtered;
  }, [
    searchQuery,
    fuse,
    allEndpoints,
    selectedMethods,
    selectedTags,
    sortBy,
    showFavoritesOnly,
    favorites,
  ]);

  const handleMethodToggle = (method: MethodFilter) => {
    setSelectedMethods((prev) => {
      const next = new Set(prev);
      if (method === "ALL") {
        if (next.has("ALL")) {
          next.clear();
        } else {
          next.clear();
          next.add("ALL");
        }
      } else {
        next.delete("ALL");
        if (next.has(method)) {
          next.delete(method);
          if (next.size === 0) {
            next.add("ALL");
          }
        } else {
          next.add(method);
        }
      }
      return next;
    });
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  // Auto-expand groups khi filteredGroups thay đổi
  useEffect(() => {
    const newGroups = Object.keys(filteredGroups);
    setExpandedGroups((prev) => {
      const updated: Record<string, boolean> = {};
      newGroups.forEach((key) => {
        // Giữ trạng thái expand nếu group vẫn còn, ngược lại mặc định expand
        updated[key] = prev[key] !== undefined ? prev[key] : true;
      });
      return updated;
    });
  }, [filteredGroups]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Search Bar */}
      <div className="px-2 py-4 border-b border-border">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Filter Bar */}
      <FilterBar
        selectedMethods={selectedMethods}
        onMethodToggle={handleMethodToggle}
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
        availableTags={availableTags}
        sortBy={sortBy}
        onSortChange={setSortBy}
        showFavoritesOnly={showFavoritesOnly}
        onFavoritesToggle={() => setShowFavoritesOnly(!showFavoritesOnly)}
        favoriteCount={favorites.size}
      />

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(filteredGroups).length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Không tìm thấy API nào
          </div>
        ) : (
          Object.entries(filteredGroups).map(([groupName, endpoints]) => (
            <div key={groupName} className="border-b border-border">
              <button
                onClick={() => toggleGroup(groupName)}
                className="w-full px-4 py-3 bg-muted/50 hover:bg-muted flex items-center justify-between text-sm font-semibold"
              >
                <span>{groupName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded">
                    {endpoints.length}
                  </span>
                  {expandedGroups[groupName] ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              </button>

              {expandedGroups[groupName] && (
                <div className="p-2 space-y-2">
                  {endpoints.map((endpoint) => (
                    <EndpointCard
                      key={endpoint.id}
                      endpoint={endpoint}
                      isSelected={selectedEndpoint?.id === endpoint.id}
                      onClick={() => {
                        setSelectedEndpoint(endpoint);
                        onEndpointSelect?.();
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
