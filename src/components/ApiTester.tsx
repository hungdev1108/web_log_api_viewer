"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Play,
  Loader2,
  Copy,
  Check,
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Share2,
} from "lucide-react";
import type { ApiEndpoint, OpenAPISpec } from "@/utils/types";
import { JsonViewer } from "./JsonViewer";
import { useAuth } from "@/context/AuthContext";
import {
  parseQueryParams,
  createShareableUrl,
  type ApiTesterParams,
} from "@/utils/urlUtils";

interface ApiTesterProps {
  endpoint: ApiEndpoint;
  openApiSpec: OpenAPISpec | null;
}

interface ParameterValue {
  name: string;
  value: string;
  enabled: boolean;
}

interface HeaderValue {
  name: string;
  value: string;
  enabled: boolean;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  responseTime: number;
  error?: string;
}

type AuthType = "none" | "bearer" | "apiKey";
type ApiKeyLocation = "header" | "query";

export function ApiTester({ endpoint, openApiSpec }: ApiTesterProps) {
  const { bearerTokens, apiKeys } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);

  // Selected credentials từ dropdown
  const [selectedBearerTokenId, setSelectedBearerTokenId] =
    useState<string>("");
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string>("");

  // Parameters state
  const [pathParams, setPathParams] = useState<ParameterValue[]>([]);
  const [queryParams, setQueryParams] = useState<ParameterValue[]>([]);
  const [headerParams, setHeaderParams] = useState<ParameterValue[]>([]);

  // Custom headers
  const [customHeaders, setCustomHeaders] = useState<HeaderValue[]>([]);

  // Request body
  const [requestBody, setRequestBody] = useState<string>("");
  const [bodyError, setBodyError] = useState<string>("");

  // Authentication
  const [authType, setAuthType] = useState<AuthType>("none");
  const [bearerToken, setBearerToken] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [apiKeyName, setApiKeyName] = useState<string>("X-API-Key");
  const [apiKeyLocation, setApiKeyLocation] =
    useState<ApiKeyLocation>("header");

  // Base URL
  const [baseUrl, setBaseUrl] = useState<string>("");

  // Collapse/Expand states
  const [isQueryParamsExpanded, setIsQueryParamsExpanded] = useState(false);
  const [isCustomHeadersExpanded, setIsCustomHeadersExpanded] = useState(false);

  // Share state
  const [copied, setCopied] = useState(false);

  // Khởi tạo base URL từ OpenAPI spec
  useEffect(() => {
    if (openApiSpec?.servers && openApiSpec.servers.length > 0) {
      setBaseUrl(openApiSpec.servers[0].url);
    } else {
      // Fallback: lấy từ swagger.ts hoặc sử dụng origin
      const defaultBaseUrl = "https://demo-master-app.v-hoadon.com";
      setBaseUrl(defaultBaseUrl);
    }
  }, [openApiSpec]);

  // Load query params từ URL sau khi params đã được khởi tạo từ endpoint
  useEffect(() => {
    // Chờ cho params được khởi tạo từ endpoint (tối đa 1 giây)
    const timeout = setTimeout(() => {
      const urlParams = parseQueryParams();

      // Chỉ load nếu có params trong URL
      if (Object.keys(urlParams).length === 0) return;

      // Load base URL
      if (urlParams.baseUrl) {
        setBaseUrl(urlParams.baseUrl);
      }

      // Load path parameters (chỉ khi đã có pathParams)
      if (urlParams.pathParams && pathParams.length > 0) {
        setPathParams((prev) =>
          prev.map((param) => {
            if (urlParams.pathParams![param.name] !== undefined) {
              return {
                ...param,
                value: urlParams.pathParams![param.name],
                enabled: true,
              };
            }
            return param;
          })
        );
      }

      // Load query parameters (chỉ khi đã có queryParams)
      if (urlParams.queryParams && queryParams.length > 0) {
        setQueryParams((prev) =>
          prev.map((param) => {
            if (urlParams.queryParams![param.name] !== undefined) {
              return {
                ...param,
                value: urlParams.queryParams![param.name],
                enabled: true,
              };
            }
            return param;
          })
        );
      }

      // Load header parameters (chỉ khi đã có headerParams)
      if (urlParams.headerParams && headerParams.length > 0) {
        setHeaderParams((prev) =>
          prev.map((param) => {
            if (urlParams.headerParams![param.name] !== undefined) {
              return {
                ...param,
                value: urlParams.headerParams![param.name],
                enabled: true,
              };
            }
            return param;
          })
        );
      }

      // Load custom headers
      if (urlParams.customHeaders) {
        const customHeadersArray: HeaderValue[] = Object.entries(
          urlParams.customHeaders
        ).map(([name, value]) => ({
          name,
          value,
          enabled: true,
        }));
        setCustomHeaders(customHeadersArray);
      }

      // Load authentication
      if (urlParams.authType) {
        setAuthType(urlParams.authType);
        if (urlParams.authType === "bearer" && urlParams.bearerToken) {
          setBearerToken(urlParams.bearerToken);
        }
        if (urlParams.authType === "apiKey") {
          if (urlParams.apiKey) setApiKey(urlParams.apiKey);
          if (urlParams.apiKeyName) setApiKeyName(urlParams.apiKeyName);
          if (urlParams.apiKeyLocation)
            setApiKeyLocation(urlParams.apiKeyLocation);
        }
      }

      // Load request body
      if (urlParams.requestBody) {
        setRequestBody(urlParams.requestBody);
      }
    }, 100); // Delay 100ms để đảm bảo params đã được khởi tạo

    return () => clearTimeout(timeout);
  }, [endpoint.id, pathParams.length, queryParams.length, headerParams.length]); // Load khi endpoint hoặc params được khởi tạo

  // Tự động điền Bearer Token khi chọn từ dropdown
  useEffect(() => {
    if (selectedBearerTokenId && authType === "bearer") {
      const token = bearerTokens.find((t) => t.id === selectedBearerTokenId);
      if (token) {
        setBearerToken(token.token);
      }
    }
  }, [selectedBearerTokenId, authType, bearerTokens]);

  // Tự động điền API Key khi chọn từ dropdown
  useEffect(() => {
    if (selectedApiKeyId && authType === "apiKey") {
      const key = apiKeys.find((k) => k.id === selectedApiKeyId);
      if (key) {
        setApiKey(key.key);
        setApiKeyName(key.keyName);
        setApiKeyLocation(key.location);
      }
    }
  }, [selectedApiKeyId, authType, apiKeys]);

  // Reset selected credentials khi đổi auth type
  useEffect(() => {
    if (authType === "none") {
      setSelectedBearerTokenId("");
      setSelectedApiKeyId("");
      setBearerToken("");
      setApiKey("");
    } else if (authType === "bearer") {
      setSelectedApiKeyId("");
      setApiKey("");
    } else if (authType === "apiKey") {
      setSelectedBearerTokenId("");
      setBearerToken("");
    }
  }, [authType]);

  // Khởi tạo parameters từ endpoint
  useEffect(() => {
    if (!endpoint.parameters) {
      setPathParams([]);
      setQueryParams([]);
      setHeaderParams([]);
      return;
    }

    const path: ParameterValue[] = [];
    const query: ParameterValue[] = [];
    const header: ParameterValue[] = [];

    endpoint.parameters.forEach((param) => {
      const paramValue: ParameterValue = {
        name: param.name,
        value: param.schema?.default?.toString() || "",
        enabled: param.required || false,
      };

      if (param.in === "path") {
        path.push(paramValue);
      } else if (param.in === "query") {
        query.push(paramValue);
      } else if (param.in === "header") {
        header.push(paramValue);
      }
    });

    setPathParams(path);
    setQueryParams(query);
    setHeaderParams(header);
  }, [endpoint]);

  // Khởi tạo request body từ endpoint
  useEffect(() => {
    if (!endpoint.requestBody?.content) {
      setRequestBody("");
      return;
    }

    const jsonContent =
      endpoint.requestBody.content["application/json"] ||
      endpoint.requestBody.content["application/json-patch+json"] ||
      Object.values(endpoint.requestBody.content)[0];

    if (jsonContent?.example) {
      setRequestBody(JSON.stringify(jsonContent.example, null, 2));
    } else if (jsonContent?.schema) {
      // Generate example từ schema (đơn giản hóa)
      const example = generateSimpleExample(jsonContent.schema);
      if (example) {
        setRequestBody(JSON.stringify(example, null, 2));
      }
    }
  }, [endpoint]);

  // Validate và format JSON body
  useEffect(() => {
    if (!requestBody.trim()) {
      setBodyError("");
      return;
    }

    try {
      JSON.parse(requestBody);
      setBodyError("");
    } catch (e) {
      setBodyError("JSON không hợp lệ");
    }
  }, [requestBody]);

  // Build URL với path parameters
  const buildUrl = (): string => {
    let url = baseUrl + endpoint.path;

    // Replace path parameters
    pathParams.forEach((param) => {
      if (param.enabled && param.value) {
        url = url.replace(`{${param.name}}`, encodeURIComponent(param.value));
      }
    });

    // Add query parameters
    const enabledQueryParams = queryParams.filter(
      (p) => p.enabled && p.value.trim()
    );
    if (enabledQueryParams.length > 0) {
      const queryString = enabledQueryParams
        .map(
          (p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`
        )
        .join("&");
      url += `?${queryString}`;
    }

    // Add API key to query nếu cần
    if (authType === "apiKey" && apiKeyLocation === "query" && apiKey) {
      const separator = url.includes("?") ? "&" : "?";
      url += `${separator}${encodeURIComponent(
        apiKeyName
      )}=${encodeURIComponent(apiKey)}`;
    }

    return url;
  };

  // Build headers
  const buildHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};

    // Headers từ parameters
    headerParams.forEach((param) => {
      if (param.enabled && param.value) {
        headers[param.name] = param.value;
      }
    });

    // Custom headers
    customHeaders.forEach((header) => {
      if (header.enabled && header.name && header.value) {
        headers[header.name] = header.value;
      }
    });

    // Authentication headers
    if (authType === "bearer" && bearerToken) {
      headers["Authorization"] = `Bearer ${bearerToken}`;
    }

    if (authType === "apiKey" && apiKeyLocation === "header" && apiKey) {
      headers[apiKeyName] = apiKey;
    }

    // Content-Type cho request body
    if (
      requestBody.trim() &&
      ["POST", "PUT", "PATCH"].includes(endpoint.method)
    ) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  };

  // Validate required parameters
  const validateRequest = (): string | null => {
    // Kiểm tra path parameters bắt buộc
    const requiredPathParams = pathParams.filter((p) =>
      endpoint.parameters?.find(
        (param) =>
          param.name === p.name && param.required && param.in === "path"
      )
    );
    for (const param of requiredPathParams) {
      if (!param.enabled || !param.value.trim()) {
        return `Path parameter "${param.name}" là bắt buộc`;
      }
    }

    // Kiểm tra request body cho POST/PUT/PATCH
    if (
      ["POST", "PUT", "PATCH"].includes(endpoint.method) &&
      endpoint.requestBody?.required
    ) {
      if (!requestBody.trim()) {
        return "Request body là bắt buộc";
      }
      try {
        JSON.parse(requestBody);
      } catch (e) {
        return "Request body không phải JSON hợp lệ";
      }
    }

    // Kiểm tra base URL
    if (!baseUrl.trim()) {
      return "Base URL không được để trống";
    }

    return null;
  };

  // Gửi request
  const handleSendRequest = async () => {
    // Validate trước khi gửi
    const validationError = validateRequest();
    if (validationError) {
      setResponse({
        status: 0,
        statusText: "Validation Error",
        headers: {},
        body: null,
        responseTime: 0,
        error: validationError,
      });
      return;
    }

    setIsLoading(true);
    setResponse(null);

    const startTime = Date.now();

    try {
      const url = buildUrl();
      const headers = buildHeaders();

      let body: string | undefined;
      if (
        requestBody.trim() &&
        ["POST", "PUT", "PATCH"].includes(endpoint.method)
      ) {
        // Validate JSON
        try {
          JSON.parse(requestBody);
          body = requestBody;
        } catch (e) {
          setResponse({
            status: 0,
            statusText: "Invalid JSON",
            headers: {},
            body: null,
            responseTime: 0,
            error: "Request body không phải JSON hợp lệ",
          });
          setIsLoading(false);
          return;
        }
      }

      const fetchOptions: RequestInit = {
        method: endpoint.method,
        headers,
        mode: "cors",
      };

      if (body) {
        fetchOptions.body = body;
      }

      const response = await fetch(url, fetchOptions);
      const responseTime = Date.now() - startTime;

      // Parse response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Parse response body
      let responseBody: any;
      const contentType = response.headers.get("content-type");
      try {
        if (contentType?.includes("application/json")) {
          responseBody = await response.json();
        } else {
          responseBody = await response.text();
        }
      } catch (e) {
        responseBody = null;
      }

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        responseTime,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setResponse({
        status: 0,
        statusText: "Error",
        headers: {},
        body: null,
        responseTime,
        error:
          error instanceof Error
            ? error.message
            : "Không thể gửi request. Có thể do CORS hoặc lỗi mạng.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const addCustomHeader = () => {
    setCustomHeaders([
      ...customHeaders,
      { name: "", value: "", enabled: true },
    ]);
  };

  const removeCustomHeader = (index: number) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== index));
  };

  const updateCustomHeader = (
    index: number,
    field: "name" | "value" | "enabled",
    value: string | boolean
  ) => {
    const updated = [...customHeaders];
    updated[index] = { ...updated[index], [field]: value };
    setCustomHeaders(updated);
  };

  const updateParameter = (
    type: "path" | "query" | "header",
    index: number,
    field: "value" | "enabled",
    value: string | boolean
  ) => {
    if (type === "path") {
      const updated = [...pathParams];
      updated[index] = { ...updated[index], [field]: value };
      setPathParams(updated);
    } else if (type === "query") {
      const updated = [...queryParams];
      updated[index] = { ...updated[index], [field]: value };
      setQueryParams(updated);
    } else if (type === "header") {
      const updated = [...headerParams];
      updated[index] = { ...updated[index], [field]: value };
      setHeaderParams(updated);
    }
  };

  // Tạo ApiTesterParams từ state hiện tại
  const createApiTesterParams = (): ApiTesterParams => {
    const params: ApiTesterParams = {};

    // Base URL
    if (baseUrl) {
      params.baseUrl = baseUrl;
    }

    // Path parameters (chỉ lấy enabled và có value)
    const enabledPathParams = pathParams
      .filter((p) => p.enabled && p.value.trim())
      .reduce((acc, p) => {
        acc[p.name] = p.value;
        return acc;
      }, {} as Record<string, string>);
    if (Object.keys(enabledPathParams).length > 0) {
      params.pathParams = enabledPathParams;
    }

    // Query parameters
    const enabledQueryParams = queryParams
      .filter((p) => p.enabled && p.value.trim())
      .reduce((acc, p) => {
        acc[p.name] = p.value;
        return acc;
      }, {} as Record<string, string>);
    if (Object.keys(enabledQueryParams).length > 0) {
      params.queryParams = enabledQueryParams;
    }

    // Header parameters
    const enabledHeaderParams = headerParams
      .filter((p) => p.enabled && p.value.trim())
      .reduce((acc, p) => {
        acc[p.name] = p.value;
        return acc;
      }, {} as Record<string, string>);
    if (Object.keys(enabledHeaderParams).length > 0) {
      params.headerParams = enabledHeaderParams;
    }

    // Custom headers
    const enabledCustomHeaders = customHeaders
      .filter((h) => h.enabled && h.name && h.value)
      .reduce((acc, h) => {
        acc[h.name] = h.value;
        return acc;
      }, {} as Record<string, string>);
    if (Object.keys(enabledCustomHeaders).length > 0) {
      params.customHeaders = enabledCustomHeaders;
    }

    // Authentication
    if (authType !== "none") {
      params.authType = authType;
      if (authType === "bearer" && bearerToken) {
        params.bearerToken = bearerToken;
      }
      if (authType === "apiKey") {
        if (apiKey) params.apiKey = apiKey;
        if (apiKeyName) params.apiKeyName = apiKeyName;
        if (apiKeyLocation) params.apiKeyLocation = apiKeyLocation;
      }
    }

    // Request body
    if (requestBody.trim()) {
      params.requestBody = requestBody;
    }

    return params;
  };

  // Handle share với params
  const handleShareWithParams = async () => {
    const params = createApiTesterParams();
    const url = createShareableUrl(endpoint.id, params);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="border border-border rounded-lg bg-card">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-xl font-semibold">Try it out</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-accent rounded transition-colors"
        >
          {isExpanded ? (
            <X className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium mb-2">Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://api.example.com"
            />
          </div>

          {/* Path Parameters */}
          {pathParams.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Path Parameters</h3>
              <div className="space-y-2">
                {pathParams.map((param, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={param.enabled}
                      onChange={(e) =>
                        updateParameter(
                          "path",
                          idx,
                          "enabled",
                          e.target.checked
                        )
                      }
                      className="w-4 h-4"
                    />
                    <label className="text-sm font-mono min-w-[120px]">
                      {param.name}
                    </label>
                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) =>
                        updateParameter("path", idx, "value", e.target.value)
                      }
                      disabled={!param.enabled}
                      className="flex-1 px-3 py-1.5 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                      placeholder="value"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Query Parameters */}
          {queryParams.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() =>
                    setIsQueryParamsExpanded(!isQueryParamsExpanded)
                  }
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <h3 className="text-sm font-semibold">
                    Query Parameters
                    {queryParams.length > 0 && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({queryParams.length})
                      </span>
                    )}
                  </h3>
                  {isQueryParamsExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
              {isQueryParamsExpanded && (
                <div className="space-y-2">
                  {queryParams.map((param, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={param.enabled}
                        onChange={(e) =>
                          updateParameter(
                            "query",
                            idx,
                            "enabled",
                            e.target.checked
                          )
                        }
                        className="w-4 h-4"
                      />
                      <label className="text-sm font-mono min-w-[120px]">
                        {param.name}
                      </label>
                      <input
                        type="text"
                        value={param.value}
                        onChange={(e) =>
                          updateParameter("query", idx, "value", e.target.value)
                        }
                        disabled={!param.enabled}
                        className="flex-1 px-3 py-1.5 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        placeholder="value"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Header Parameters */}
          {headerParams.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Header Parameters</h3>
              <div className="space-y-2">
                {headerParams.map((param, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={param.enabled}
                      onChange={(e) =>
                        updateParameter(
                          "header",
                          idx,
                          "enabled",
                          e.target.checked
                        )
                      }
                      className="w-4 h-4"
                    />
                    <label className="text-sm font-mono min-w-[120px]">
                      {param.name}
                    </label>
                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) =>
                        updateParameter("header", idx, "value", e.target.value)
                      }
                      disabled={!param.enabled}
                      className="flex-1 px-3 py-1.5 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                      placeholder="value"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Headers */}
          <div>
            <div className="flex items-center mb-2">
              <button
                onClick={() =>
                  setIsCustomHeadersExpanded(!isCustomHeadersExpanded)
                }
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <h3 className="text-sm font-semibold">
                  Custom Headers
                  {customHeaders.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({customHeaders.length})
                    </span>
                  )}
                </h3>
                {isCustomHeadersExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
            {isCustomHeadersExpanded && (
              <div className="space-y-2">
                <div className="flex items-center justify-end mb-2">
                  <button
                    onClick={addCustomHeader}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-secondary hover:bg-accent rounded transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Thêm header
                  </button>
                </div>
                {customHeaders.map((header, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={header.enabled}
                      onChange={(e) =>
                        updateCustomHeader(idx, "enabled", e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                    <input
                      type="text"
                      value={header.name}
                      onChange={(e) =>
                        updateCustomHeader(idx, "name", e.target.value)
                      }
                      disabled={!header.enabled}
                      placeholder="Header name"
                      className="w-32 px-3 py-1.5 border border-border rounded bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) =>
                        updateCustomHeader(idx, "value", e.target.value)
                      }
                      disabled={!header.enabled}
                      placeholder="Header value"
                      className="flex-1 px-3 py-1.5 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                    <button
                      onClick={() => removeCustomHeader(idx)}
                      className="p-1.5 hover:bg-destructive/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ))}
                {customHeaders.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Chưa có custom headers. Nhấn &quot;Thêm header&quot; để
                    thêm.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Authentication */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Authentication</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="authType"
                    value="none"
                    checked={authType === "none"}
                    onChange={() => setAuthType("none")}
                  />
                  <span className="text-sm">Không có</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="authType"
                    value="bearer"
                    checked={authType === "bearer"}
                    onChange={() => setAuthType("bearer")}
                  />
                  <span className="text-sm">Bearer Token</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="authType"
                    value="apiKey"
                    checked={authType === "apiKey"}
                    onChange={() => setAuthType("apiKey")}
                  />
                  <span className="text-sm">API Key</span>
                </label>
              </div>

              {authType === "bearer" && (
                <div className="space-y-2">
                  {bearerTokens.length > 0 && (
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Chọn Bearer Token đã lưu
                      </label>
                      <select
                        value={selectedBearerTokenId}
                        onChange={(e) => {
                          setSelectedBearerTokenId(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">-- Chọn từ danh sách --</option>
                        {bearerTokens.map((token) => (
                          <option key={token.id} value={token.id}>
                            {token.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Bearer Token
                      {selectedBearerTokenId && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (hoặc nhập mới)
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={bearerToken}
                      onChange={(e) => {
                        setBearerToken(e.target.value);
                        setSelectedBearerTokenId(""); // Clear selection khi nhập thủ công
                      }}
                      placeholder="Nhập bearer token"
                      className="w-full px-3 py-2 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {authType === "apiKey" && (
                <div className="space-y-2">
                  {apiKeys.length > 0 && (
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Chọn API Key đã lưu
                      </label>
                      <select
                        value={selectedApiKeyId}
                        onChange={(e) => {
                          setSelectedApiKeyId(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">-- Chọn từ danh sách --</option>
                        {apiKeys.map((key) => (
                          <option key={key.id} value={key.id}>
                            {key.name} ({key.keyName})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      API Key Name
                      {selectedApiKeyId && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (hoặc nhập mới)
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={apiKeyName}
                      onChange={(e) => {
                        setApiKeyName(e.target.value);
                        setSelectedApiKeyId(""); // Clear selection khi nhập thủ công
                      }}
                      placeholder="X-API-Key"
                      className="w-full px-3 py-2 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      API Key Value
                    </label>
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        setSelectedApiKeyId(""); // Clear selection khi nhập thủ công
                      }}
                      placeholder="Nhập API key"
                      className="w-full px-3 py-2 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Location
                    </label>
                    <select
                      value={apiKeyLocation}
                      onChange={(e) => {
                        setApiKeyLocation(e.target.value as ApiKeyLocation);
                        setSelectedApiKeyId(""); // Clear selection khi thay đổi location
                      }}
                      className="w-full px-3 py-2 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="header">Header</option>
                      <option value="query">Query Parameter</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Request Body */}
          {["POST", "PUT", "PATCH"].includes(endpoint.method) &&
            endpoint.requestBody && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Request Body</h3>
                  {bodyError && (
                    <span className="text-xs text-destructive">
                      {bodyError}
                    </span>
                  )}
                </div>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  rows={10}
                  className={`w-full px-3 py-2 border rounded bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary ${
                    bodyError ? "border-destructive" : "border-border"
                  }`}
                  placeholder='{"key": "value"}'
                />
              </div>
            )}

          {/* Request URL Preview */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Request URL</h3>
            <div className="px-3 py-2 bg-muted rounded border border-border">
              <code className="text-xs font-mono break-all">{buildUrl()}</code>
            </div>
          </div>

          {/* Send Button và Share Button */}
          <div className="flex gap-2">
            <button
              onClick={handleSendRequest}
              disabled={isLoading || !!bodyError}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Gửi Request</span>
                </>
              )}
            </button>
            <button
              onClick={handleShareWithParams}
              className="px-4 py-2 border border-border rounded hover:bg-muted transition-colors flex items-center justify-center gap-2"
              title="Share link với params"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Đã copy!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm">Share</span>
                </>
              )}
            </button>
          </div>

          {/* Response */}
          {response && (
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold mb-3">Response</h3>

              {/* Status Code và Response Time */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      response.status >= 200 && response.status < 300
                        ? "bg-green-500 text-white"
                        : response.status >= 400
                        ? "bg-red-500 text-white"
                        : "bg-yellow-500 text-white"
                    }`}
                  >
                    {response.status} {response.statusText}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Response Time:
                  </span>
                  <span className="text-xs font-mono">
                    {response.responseTime}ms
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {response.error && (
                <div className="mb-3 p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
                  {response.error}
                </div>
              )}

              {/* Response Headers */}
              {Object.keys(response.headers).length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-semibold mb-2">Headers</h4>
                  <div className="border border-border rounded bg-muted/50 p-2 max-h-32 overflow-auto">
                    {Object.entries(response.headers).map(([key, value]) => (
                      <div
                        key={key}
                        className="text-xs font-mono py-1 border-b border-border last:border-0"
                      >
                        <span className="font-semibold">{key}:</span>{" "}
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Response Body */}
              {response.body !== null && (
                <div>
                  <h4 className="text-xs font-semibold mb-2">Body</h4>
                  <JsonViewer data={response.body} collapsed={false} />
                </div>
              )}

              {response.body === null && !response.error && (
                <div className="p-4 bg-muted rounded text-sm text-muted-foreground">
                  Response body trống
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function để generate simple example từ schema
function generateSimpleExample(schema: any): any {
  if (!schema) return null;

  if (schema.example !== undefined) {
    return schema.example;
  }

  if (schema.type === "object" && schema.properties) {
    const example: any = {};
    Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
      if (prop.type === "string") {
        example[key] = "string";
      } else if (prop.type === "number" || prop.type === "integer") {
        example[key] = 0;
      } else if (prop.type === "boolean") {
        example[key] = false;
      } else if (prop.type === "array") {
        example[key] = [];
      } else if (prop.type === "object") {
        example[key] = {};
      }
    });
    return example;
  }

  if (schema.type === "array") {
    return [];
  }

  return null;
}
