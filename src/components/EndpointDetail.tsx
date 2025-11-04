"use client";

import { useState, useEffect, useMemo } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { useApi } from "@/context/ApiContext";
import {
  getMethodBackgroundColor,
  getMethodTextColor,
} from "@/utils/methodColor";
import { JsonViewer } from "./JsonViewer";
import { ApiTester } from "./ApiTester";
import type { ApiEndpoint } from "@/utils/types";
import { createShareableUrl } from "@/utils/urlUtils";

// Component RequestBodySection với tabs
function RequestBodySection({
  requestBody,
  openApiSpec,
}: {
  requestBody: any;
  openApiSpec: any;
}) {
  const [activeTab, setActiveTab] = useState<"example" | "schema">("example");
  const [selectedContentType, setSelectedContentType] = useState<string>("");

  // Lấy danh sách content types
  const contentTypes = useMemo(() => {
    return requestBody?.content ? Object.keys(requestBody.content) : [];
  }, [requestBody?.content]);

  // Khởi tạo selectedContentType khi có content types
  useEffect(() => {
    if (contentTypes.length > 0 && !selectedContentType) {
      // Ưu tiên application/json, sau đó là application/json-patch+json
      const preferred =
        contentTypes.find((ct) => ct === "application/json") ||
        contentTypes.find((ct) => ct.includes("json")) ||
        contentTypes[0];
      setSelectedContentType(preferred);
    }
  }, [contentTypes, selectedContentType]);

  if (!requestBody?.content || contentTypes.length === 0) {
    return null;
  }

  // Nếu chưa có selectedContentType, sử dụng content type đầu tiên
  const currentContentType =
    selectedContentType ||
    contentTypes.find((ct) => ct.includes("json")) ||
    contentTypes[0];

  const currentContent = requestBody.content[currentContentType];

  // Lấy example value
  const getExampleValue = () => {
    if (currentContent?.example) {
      return currentContent.example;
    }
    // Nếu không có example, tạo example từ schema
    if (currentContent?.schema) {
      return generateExampleFromSchema(currentContent.schema, openApiSpec);
    }
    return null;
  };

  // Lấy schema
  const getSchema = () => {
    if (currentContent?.schema) {
      return currentContent.schema;
    }
    return null;
  };

  const exampleValue = getExampleValue();
  const schema = getSchema();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Request body</h2>
        <select
          value={selectedContentType || currentContentType}
          onChange={(e) => setSelectedContentType(e.target.value)}
          className="px-3 py-1.5 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {contentTypes.map((ct) => (
            <option key={ct} value={ct}>
              {ct}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setActiveTab("example")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "example"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Example Value
        </button>
        <button
          onClick={() => setActiveTab("schema")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "schema"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Schema
        </button>
      </div>

      {/* Content */}
      <div className="border border-border rounded-lg bg-card">
        {activeTab === "example" ? (
          <div>
            {exampleValue ? (
              <JsonViewer data={exampleValue} collapsed={false} />
            ) : (
              <div className="p-4 text-muted-foreground text-sm">
                Không có example value
              </div>
            )}
          </div>
        ) : (
          <div>
            {schema ? (
              <JsonViewer data={schema} collapsed={false} />
            ) : (
              <div className="p-4 text-muted-foreground text-sm">
                Không có schema
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function để resolve $ref từ OpenAPI spec
function resolveRef(ref: string, openApiSpec: any): any {
  if (!ref || !openApiSpec) return null;

  // $ref format: #/components/schemas/AttributeDto
  const parts = ref.split("/").filter((p) => p && p !== "#");
  let current: any = openApiSpec;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }

  return current;
}

// Helper function để resolve schema (có thể có $ref)
function resolveSchema(
  schema: any,
  openApiSpec: any,
  visited: Set<string> = new Set()
): any {
  if (!schema) return null;

  // Nếu có $ref, resolve nó
  if (schema.$ref) {
    // Tránh circular reference
    if (visited.has(schema.$ref)) {
      return null;
    }
    visited.add(schema.$ref);

    const resolved = resolveRef(schema.$ref, openApiSpec);
    if (resolved) {
      // Merge với schema hiện tại (để giữ required, nullable, etc.)
      const merged = { ...resolved };
      // Resolve nested $ref nếu có
      if (merged.properties) {
        const resolvedProps: any = {};
        Object.entries(merged.properties).forEach(
          ([key, prop]: [string, any]) => {
            if (prop && typeof prop === "object") {
              resolvedProps[key] = resolveSchema(prop, openApiSpec, visited);
            } else {
              resolvedProps[key] = prop;
            }
          }
        );
        merged.properties = resolvedProps;
      }
      if (merged.items) {
        merged.items = resolveSchema(merged.items, openApiSpec, visited);
      }
      return merged;
    }
  }

  // Resolve nested schemas
  if (schema.properties) {
    const resolvedProps: any = {};
    Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
      if (prop && typeof prop === "object") {
        resolvedProps[key] = resolveSchema(prop, openApiSpec, visited);
      } else {
        resolvedProps[key] = prop;
      }
    });
    return { ...schema, properties: resolvedProps };
  }

  if (schema.items) {
    return {
      ...schema,
      items: resolveSchema(schema.items, openApiSpec, visited),
    };
  }

  return schema;
}

// Helper function để generate example từ schema
function generateExampleFromSchema(schema: any, openApiSpec: any): any {
  if (!schema) return null;

  // Resolve $ref trước
  const resolvedSchema = resolveSchema(schema, openApiSpec);
  if (!resolvedSchema) return null;

  // Nếu có example trong schema
  if (resolvedSchema.example !== undefined) {
    return resolvedSchema.example;
  }

  // Xử lý theo type
  if (resolvedSchema.type === "object" && resolvedSchema.properties) {
    const example: any = {};
    Object.entries(resolvedSchema.properties).forEach(
      ([key, prop]: [string, any]) => {
        // Hiển thị tất cả fields (giống Swagger UI)
        const value = generateExampleFromSchema(prop, openApiSpec);
        if (value !== null && value !== undefined) {
          example[key] = value;
        }
      }
    );
    return example;
  }

  if (resolvedSchema.type === "array" && resolvedSchema.items) {
    return [generateExampleFromSchema(resolvedSchema.items, openApiSpec)];
  }

  // Xử lý allOf, oneOf, anyOf
  if (resolvedSchema.allOf) {
    const merged: any = {};
    resolvedSchema.allOf.forEach((subSchema: any) => {
      const resolved = resolveSchema(subSchema, openApiSpec);
      const subExample = generateExampleFromSchema(resolved, openApiSpec);
      if (subExample && typeof subExample === "object") {
        Object.assign(merged, subExample);
      }
    });
    return Object.keys(merged).length > 0 ? merged : null;
  }

  if (resolvedSchema.oneOf && resolvedSchema.oneOf.length > 0) {
    return generateExampleFromSchema(resolvedSchema.oneOf[0], openApiSpec);
  }

  if (resolvedSchema.anyOf && resolvedSchema.anyOf.length > 0) {
    return generateExampleFromSchema(resolvedSchema.anyOf[0], openApiSpec);
  }

  // Xử lý enum
  if (resolvedSchema.enum && resolvedSchema.enum.length > 0) {
    return resolvedSchema.enum[0];
  }

  // Default values theo type
  switch (resolvedSchema.type) {
    case "string":
      if (resolvedSchema.format === "uuid") {
        return "3fa85f64-5717-4562-b3fc-2c963f66afa6";
      }
      if (resolvedSchema.format === "date-time") {
        return "2024-01-01T00:00:00Z";
      }
      if (resolvedSchema.format === "date") {
        return "2024-01-01";
      }
      return "string";
    case "integer":
    case "number":
      if (resolvedSchema.format === "int32") {
        return 0;
      }
      if (resolvedSchema.format === "int64") {
        return 0;
      }
      if (
        resolvedSchema.format === "double" ||
        resolvedSchema.format === "float"
      ) {
        return 0.0;
      }
      return 0;
    case "boolean":
      return false;
    case "object":
      return {};
    case "array":
      return [];
    default:
      return null;
  }
}

export function EndpointDetail() {
  const { selectedEndpoint, apiInfo, openApiSpec } = useApi();
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  if (!selectedEndpoint) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">Chọn một endpoint để xem chi tiết</p>
          <p className="text-sm">Chọn endpoint từ sidebar để bắt đầu</p>
        </div>
      </div>
    );
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    if (!selectedEndpoint) return;

    // Tạo shareable URL (chỉ với endpoint, không có params)
    const url = createShareableUrl(selectedEndpoint.id);
    await copyToClipboard(url);
    setShareLink(url);
  };

  const getParameterType = (param: any) => {
    if (param.schema?.type) {
      return param.schema.type;
    }
    if (param.schema?.$ref) {
      return param.schema.$ref.split("/").pop() || "object";
    }
    return "string";
  };

  const getResponseExample = (responses: Record<string, any> | undefined) => {
    if (!responses) return null;

    // Tìm response 200 trước
    const successResponse =
      responses["200"] || responses["201"] || responses["204"];
    if (successResponse?.content?.["application/json"]?.example) {
      return successResponse.content["application/json"].example;
    }
    if (successResponse?.content?.["application/json"]?.schema) {
      return { schema: successResponse.content["application/json"].schema };
    }

    // Nếu không có 200, lấy response đầu tiên
    const firstKey = Object.keys(responses)[0];
    const firstResponse = responses[firstKey];
    if (firstResponse?.content?.["application/json"]?.example) {
      return firstResponse.content["application/json"].example;
    }

    return null;
  };

  const getRequestBodyExample = (requestBody: any) => {
    if (!requestBody?.content) return null;

    const jsonContent =
      requestBody.content["application/json"] ||
      requestBody.content["application/json-patch+json"] ||
      Object.values(requestBody.content)[0];

    if (jsonContent?.example) {
      return jsonContent.example;
    }
    if (jsonContent?.schema) {
      return { schema: jsonContent.schema };
    }

    return null;
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span
            style={{
              backgroundColor: getMethodBackgroundColor(
                selectedEndpoint.method
              ),
            }}
            className={`px-3 py-1 rounded text-sm font-semibold ${getMethodTextColor(
              selectedEndpoint.method
            )}`}
          >
            {selectedEndpoint.method}
          </span>
          <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono">
            {selectedEndpoint.path}
          </code>
          <button
            onClick={() => copyToClipboard(selectedEndpoint.path)}
            className="p-2 hover:bg-muted rounded transition-colors"
            title="Copy path"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-muted rounded transition-colors"
            title="Share link"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {selectedEndpoint.summary && (
          <h1 className="text-2xl font-bold">{selectedEndpoint.summary}</h1>
        )}

        {selectedEndpoint.description && (
          <p className="text-muted-foreground">
            {selectedEndpoint.description}
          </p>
        )}
      </div>

      {/* API Tester */}
      <ApiTester endpoint={selectedEndpoint} openApiSpec={openApiSpec} />

      {/* Parameters */}
      {selectedEndpoint.parameters &&
        selectedEndpoint.parameters.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Parameters</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border rounded-lg">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold">
                      Name
                    </th>
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold">
                      In
                    </th>
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold">
                      Type
                    </th>
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold">
                      Required
                    </th>
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEndpoint.parameters.map(
                    (param: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/50">
                        <td className="border border-border px-4 py-2 text-sm font-mono">
                          {param.name}
                        </td>
                        <td className="border border-border px-4 py-2 text-sm">
                          <span className="px-2 py-0.5 bg-secondary rounded text-xs">
                            {param.in}
                          </span>
                        </td>
                        <td className="border border-border px-4 py-2 text-sm">
                          {getParameterType(param)}
                        </td>
                        <td className="border border-border px-4 py-2 text-sm">
                          {param.required ? (
                            <span className="text-red-500 font-semibold">
                              Yes
                            </span>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </td>
                        <td className="border border-border px-4 py-2 text-sm text-muted-foreground">
                          {param.description || "-"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Request Body */}
      {selectedEndpoint.requestBody && (
        <RequestBodySection
          requestBody={selectedEndpoint.requestBody}
          openApiSpec={openApiSpec}
        />
      )}

      {/* Responses */}
      {selectedEndpoint.responses && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Responses</h2>
          {Object.entries(selectedEndpoint.responses).map(
            ([statusCode, response]: [string, any]) => (
              <div key={statusCode} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      statusCode.startsWith("2")
                        ? "bg-green-500 text-white"
                        : statusCode.startsWith("4")
                        ? "bg-red-500 text-white"
                        : "bg-yellow-500 text-white"
                    }`}
                  >
                    {statusCode}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {response.description}
                  </span>
                </div>
                {response.content && (
                  <JsonViewer
                    data={Object.values(response.content)[0]}
                    collapsed={false}
                  />
                )}
              </div>
            )
          )}
          {getResponseExample(selectedEndpoint.responses) && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Example Response</h3>
              <JsonViewer
                data={getResponseExample(selectedEndpoint.responses)}
                collapsed={false}
              />
            </div>
          )}
        </div>
      )}

      {/* Empty state nếu không có thông tin */}
      {!selectedEndpoint.parameters?.length &&
        !selectedEndpoint.requestBody &&
        !selectedEndpoint.responses && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Không có thông tin chi tiết cho endpoint này</p>
          </div>
        )}
    </div>
  );
}
