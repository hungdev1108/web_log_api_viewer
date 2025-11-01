"use client";

import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { EndpointCard } from "./EndpointCard";
import { SearchBar } from "./SearchBar";
import type { ApiEndpoint } from "@/utils/types";

interface SidebarProps {
  onEndpointSelect?: () => void;
}

export function Sidebar({ onEndpointSelect }: SidebarProps) {
  const { groupedEndpoints, selectedEndpoint, setSelectedEndpoint } = useApi();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => {
      // Mặc định expand tất cả groups
      const initial: Record<string, boolean> = {};
      Object.keys(groupedEndpoints).forEach((key) => {
        initial[key] = true;
      });
      return initial;
    }
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

  // Filter endpoints dựa trên search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedEndpoints;
    }

    const searchResults = fuse.search(searchQuery);
    const filteredEndpoints = searchResults.map((result) => result.item);

    // Group lại các filtered endpoints
    const filtered: Record<string, ApiEndpoint[]> = {};
    filteredEndpoints.forEach((endpoint) => {
      const tag = endpoint.tags?.[0] || "Other";
      if (!filtered[tag]) {
        filtered[tag] = [];
      }
      filtered[tag].push(endpoint);
    });

    return filtered;
  }, [searchQuery, fuse, groupedEndpoints]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

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
