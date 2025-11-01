"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { ApiEndpoint, GroupedEndpoints } from "@/utils/types";
import { parseOpenAPI, groupByTag } from "@/utils/parseApiJson";
import type { OpenAPISpec } from "@/utils/types";

interface ApiContextType {
  endpoints: ApiEndpoint[];
  groupedEndpoints: GroupedEndpoints;
  selectedEndpoint: ApiEndpoint | null;
  setSelectedEndpoint: (endpoint: ApiEndpoint | null) => void;
  isLoading: boolean;
  error: string | null;
  apiInfo: {
    title: string;
    description?: string;
    version: string;
  } | null;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [groupedEndpoints, setGroupedEndpoints] = useState<GroupedEndpoints>(
    {}
  );
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiInfo, setApiInfo] = useState<{
    title: string;
    description?: string;
    version: string;
  } | null>(null);

  useEffect(() => {
    async function loadApi() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/demo-api.json");
        if (!response.ok) {
          throw new Error("Không thể tải file API JSON");
        }

        const spec: OpenAPISpec = await response.json();

        // Lưu API info
        setApiInfo({
          title: spec.info.title,
          description: spec.info.description,
          version: spec.info.version,
        });

        // Parse và group endpoints
        const parsedEndpoints = parseOpenAPI(spec);
        const grouped = groupByTag(parsedEndpoints);

        setEndpoints(parsedEndpoints);
        setGroupedEndpoints(grouped);

        // Auto-select endpoint đầu tiên nếu có
        if (parsedEndpoints.length > 0 && !selectedEndpoint) {
          setSelectedEndpoint(parsedEndpoints[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
        console.error("Error loading API:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadApi();
  }, []);

  return (
    <ApiContext.Provider
      value={{
        endpoints,
        groupedEndpoints,
        selectedEndpoint,
        setSelectedEndpoint,
        isLoading,
        error,
        apiInfo,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
}
