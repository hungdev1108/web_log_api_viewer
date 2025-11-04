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
import { parseEndpointHash, createEndpointHash } from "@/utils/urlUtils";

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
  openApiSpec: OpenAPISpec | null; // Lưu toàn bộ spec để resolve $ref
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
  const [openApiSpec, setOpenApiSpec] = useState<OpenAPISpec | null>(null);

  useEffect(() => {
    async function loadApi() {
      try {
        setIsLoading(true);
        setError(null);

        // Sử dụng API route proxy để tránh lỗi CORS
        const response = await fetch("/api/swagger");
        if (!response.ok) {
          throw new Error("Không thể tải API từ server");
        }

        const spec: OpenAPISpec = await response.json();

        // Lưu toàn bộ spec để resolve $ref
        setOpenApiSpec(spec);

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

        // Load endpoint từ URL hash nếu có
        const endpointIdFromHash = parseEndpointHash(
          parsedEndpoints.map((ep) => ({ id: ep.id, path: ep.path }))
        );
        if (endpointIdFromHash) {
          const endpointFromHash = parsedEndpoints.find(
            (ep) => ep.id === endpointIdFromHash
          );
          if (endpointFromHash) {
            setSelectedEndpoint(endpointFromHash);
          } else {
            // Nếu không tìm thấy endpoint từ hash, fallback về endpoint đầu tiên
            if (parsedEndpoints.length > 0) {
              setSelectedEndpoint(parsedEndpoints[0]);
            }
          }
        } else {
          // Auto-select endpoint đầu tiên nếu có
          if (parsedEndpoints.length > 0) {
            setSelectedEndpoint((prev) => prev || parsedEndpoints[0]);
          }
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

  // Sync URL hash khi selectedEndpoint thay đổi
  useEffect(() => {
    if (selectedEndpoint) {
      const hash = createEndpointHash(selectedEndpoint.id);
      // Chỉ update hash nếu khác với hash hiện tại để tránh loop
      if (window.location.hash !== hash) {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}${hash}`
        );
      }
    }
  }, [selectedEndpoint]);

  // Listen to hashchange để handle browser back/forward
  useEffect(() => {
    const handleHashChange = () => {
      const endpointIdFromHash = parseEndpointHash(
        endpoints.map((ep) => ({ id: ep.id, path: ep.path }))
      );
      if (endpointIdFromHash) {
        const endpointFromHash = endpoints.find(
          (ep) => ep.id === endpointIdFromHash
        );
        if (endpointFromHash && endpointFromHash.id !== selectedEndpoint?.id) {
          setSelectedEndpoint(endpointFromHash);
        }
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [endpoints, selectedEndpoint]);

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
        openApiSpec,
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
