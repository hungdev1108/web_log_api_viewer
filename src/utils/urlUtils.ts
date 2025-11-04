/**
 * Utilities để xử lý URL hash và query params cho Deep Linking
 */

export interface EndpointHash {
  endpointId: string; // Format: GET-/api/users
}

export interface ApiTesterParams {
  baseUrl?: string;
  pathParams?: Record<string, string>;
  queryParams?: Record<string, string>;
  headerParams?: Record<string, string>;
  customHeaders?: Record<string, string>;
  authType?: "none" | "bearer" | "apiKey";
  bearerToken?: string;
  apiKey?: string;
  apiKeyName?: string;
  apiKeyLocation?: "header" | "query";
  requestBody?: string;
}

/**
 * Normalize endpoint ID thành format URL-friendly
 * Format: PUT-/api/Attributes/{language} → PUT-api/Attributes/language
 */
function normalizeEndpointId(endpointId: string): string {
  // Tách method và path: PUT-/api/Attributes/{language}
  const match = endpointId.match(/^([A-Z]+)-(.+)$/);
  if (!match) return endpointId;

  const method = match[1]; // PUT
  let path = match[2]; // /api/Attributes/{language}

  // Loại bỏ dấu / đầu tiên
  path = path.replace(/^\/+/, "");

  // Thay {param} thành param
  path = path.replace(/\{([^}]+)\}/g, "$1");

  // Kết hợp: PUT-api/Attributes/language
  return `${method}-${path}`;
}

/**
 * Parse URL hash để lấy endpoint ID
 * Format: #/endpoints/PUT-api/Attributes/language
 *
 * @param endpoints - Danh sách endpoints để match chính xác path parameters
 */
export function parseEndpointHash(
  endpoints?: Array<{ id: string; path: string }>
): string | null {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash;
  if (!hash) return null;

  // Remove # or #/
  const cleanHash = hash.replace(/^#\/?/, "");

  // Format: endpoints/METHOD-path
  const match = cleanHash.match(/^endpoints\/(.+)$/);
  if (!match) return null;

  const normalized = match[1]; // PUT-api/Attributes/language

  // Parse method và path
  const normalizedMatch = normalized.match(/^([A-Z]+)-(.+)$/);
  if (!normalizedMatch) return null;

  const method = normalizedMatch[1]; // PUT
  const normalizedPath = normalizedMatch[2]; // api/Attributes/language

  // Nếu có endpoints list, tìm endpoint chính xác
  if (endpoints && endpoints.length > 0) {
    // Tìm endpoint có method và path tương ứng khi normalize
    // normalizedPath: api/Attributes/language
    // Cần match với path: /api/Attributes/{language}

    for (const endpoint of endpoints) {
      if (endpoint.id.startsWith(`${method}-`)) {
        // Normalize endpoint path để so sánh
        const endpointPath = endpoint.path.replace(/^\/+/, ""); // Loại bỏ / đầu
        const endpointPathNormalized = endpointPath.replace(
          /\{([^}]+)\}/g,
          "$1"
        );

        // So sánh path đã normalize
        if (endpointPathNormalized === normalizedPath) {
          return endpoint.id;
        }
      }
    }
  }

  // Fallback: tạo endpoint ID từ normalized
  // Giả định segment cuối là path parameter (thường đúng với REST API)
  // api/Attributes/language → /api/Attributes/{language}
  const pathSegments = normalizedPath.split("/");
  if (pathSegments.length > 0) {
    const lastSegment = pathSegments[pathSegments.length - 1];
    pathSegments[pathSegments.length - 1] = `{${lastSegment}}`;
    const pathWithParams = `/${pathSegments.join("/")}`;
    return `${method}-${pathWithParams}`;
  }

  return null;
}

/**
 * Tạo URL hash cho endpoint với format đơn giản
 * Format: PUT-/api/Attributes/{language} → #/endpoints/PUT-api/Attributes/language
 */
export function createEndpointHash(endpointId: string): string {
  const normalized = normalizeEndpointId(endpointId);
  return `#/endpoints/${normalized}`;
}

/**
 * Parse query params để lấy ApiTester params
 */
export function parseQueryParams(): ApiTesterParams {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const result: ApiTesterParams = {};

  // Base URL
  if (params.has("baseUrl")) {
    result.baseUrl = decodeURIComponent(params.get("baseUrl")!);
  }

  // Path parameters
  const pathParamsStr = params.get("pathParams");
  if (pathParamsStr) {
    try {
      result.pathParams = JSON.parse(decodeURIComponent(pathParamsStr));
    } catch (e) {
      console.warn("Failed to parse pathParams:", e);
    }
  }

  // Query parameters
  const queryParamsStr = params.get("queryParams");
  if (queryParamsStr) {
    try {
      result.queryParams = JSON.parse(decodeURIComponent(queryParamsStr));
    } catch (e) {
      console.warn("Failed to parse queryParams:", e);
    }
  }

  // Header parameters
  const headerParamsStr = params.get("headerParams");
  if (headerParamsStr) {
    try {
      result.headerParams = JSON.parse(decodeURIComponent(headerParamsStr));
    } catch (e) {
      console.warn("Failed to parse headerParams:", e);
    }
  }

  // Custom headers
  const customHeadersStr = params.get("customHeaders");
  if (customHeadersStr) {
    try {
      result.customHeaders = JSON.parse(decodeURIComponent(customHeadersStr));
    } catch (e) {
      console.warn("Failed to parse customHeaders:", e);
    }
  }

  // Auth type
  if (params.has("authType")) {
    const authType = params.get("authType");
    if (["none", "bearer", "apiKey"].includes(authType || "")) {
      result.authType = authType as ApiTesterParams["authType"];
    }
  }

  // Bearer token
  if (params.has("bearerToken")) {
    result.bearerToken = decodeURIComponent(params.get("bearerToken")!);
  }

  // API Key
  if (params.has("apiKey")) {
    result.apiKey = decodeURIComponent(params.get("apiKey")!);
  }

  // API Key Name
  if (params.has("apiKeyName")) {
    result.apiKeyName = decodeURIComponent(params.get("apiKeyName")!);
  }

  // API Key Location
  if (params.has("apiKeyLocation")) {
    const location = params.get("apiKeyLocation");
    if (["header", "query"].includes(location || "")) {
      result.apiKeyLocation = location as "header" | "query";
    }
  }

  // Request body
  if (params.has("requestBody")) {
    result.requestBody = decodeURIComponent(params.get("requestBody")!);
  }

  return result;
}

/**
 * Tạo query string từ ApiTester params
 */
export function createQueryString(params: ApiTesterParams): string {
  const searchParams = new URLSearchParams();

  if (params.baseUrl) {
    searchParams.set("baseUrl", encodeURIComponent(params.baseUrl));
  }

  if (params.pathParams && Object.keys(params.pathParams).length > 0) {
    searchParams.set(
      "pathParams",
      encodeURIComponent(JSON.stringify(params.pathParams))
    );
  }

  if (params.queryParams && Object.keys(params.queryParams).length > 0) {
    searchParams.set(
      "queryParams",
      encodeURIComponent(JSON.stringify(params.queryParams))
    );
  }

  if (params.headerParams && Object.keys(params.headerParams).length > 0) {
    searchParams.set(
      "headerParams",
      encodeURIComponent(JSON.stringify(params.headerParams))
    );
  }

  if (params.customHeaders && Object.keys(params.customHeaders).length > 0) {
    searchParams.set(
      "customHeaders",
      encodeURIComponent(JSON.stringify(params.customHeaders))
    );
  }

  if (params.authType && params.authType !== "none") {
    searchParams.set("authType", params.authType);
  }

  if (params.bearerToken) {
    searchParams.set("bearerToken", encodeURIComponent(params.bearerToken));
  }

  if (params.apiKey) {
    searchParams.set("apiKey", encodeURIComponent(params.apiKey));
  }

  if (params.apiKeyName) {
    searchParams.set("apiKeyName", encodeURIComponent(params.apiKeyName));
  }

  if (params.apiKeyLocation) {
    searchParams.set("apiKeyLocation", params.apiKeyLocation);
  }

  if (params.requestBody) {
    searchParams.set("requestBody", encodeURIComponent(params.requestBody));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Tạo shareable URL với endpoint và params
 */
export function createShareableUrl(
  endpointId: string,
  params?: ApiTesterParams
): string {
  const hash = createEndpointHash(endpointId);
  const queryString = params ? createQueryString(params) : "";
  return `${window.location.origin}${window.location.pathname}${queryString}${hash}`;
}
