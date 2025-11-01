import type { OpenAPISpec, ApiEndpoint, GroupedEndpoints } from "./types";

/**
 * Parse OpenAPI JSON và transform thành array các endpoints
 */
export function parseOpenAPI(spec: OpenAPISpec): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];

  Object.entries(spec.paths).forEach(([path, pathItem]) => {
    const methods = [
      "get",
      "post",
      "put",
      "patch",
      "delete",
      "options",
      "head",
    ] as const;

    methods.forEach((method) => {
      const operation = pathItem[method];
      if (!operation) return;

      endpoints.push({
        id: `${method.toUpperCase()}-${path}`,
        method: method.toUpperCase() as ApiEndpoint["method"],
        path,
        summary: operation.summary,
        description: operation.description,
        tags: operation.tags || ["Other"],
        parameters: operation.parameters,
        requestBody: operation.requestBody,
        responses: operation.responses,
      });
    });
  });

  return endpoints;
}

/**
 * Group endpoints theo tag
 */
export function groupByTag(endpoints: ApiEndpoint[]): GroupedEndpoints {
  const grouped: GroupedEndpoints = {};

  endpoints.forEach((endpoint) => {
    const tag = endpoint.tags?.[0] || "Other";
    if (!grouped[tag]) {
      grouped[tag] = [];
    }
    grouped[tag].push(endpoint);
  });

  // Sort endpoints trong mỗi group theo method và path
  Object.keys(grouped).forEach((tag) => {
    grouped[tag].sort((a, b) => {
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

  return grouped;
}
