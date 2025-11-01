"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { getMethodColor, getMethodTextColor } from "@/utils/methodColor";
import { JsonViewer } from "./JsonViewer";
import type { ApiEndpoint } from "@/utils/types";

export function EndpointDetail() {
  const { selectedEndpoint, apiInfo } = useApi();
  const [copied, setCopied] = useState(false);

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
            className={`px-3 py-1 rounded text-sm font-semibold ${getMethodColor(
              selectedEndpoint.method
            )} ${getMethodTextColor(selectedEndpoint.method)}`}
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
        <div>
          <h2 className="text-xl font-semibold mb-3">Request Body</h2>
          <JsonViewer
            data={getRequestBodyExample(selectedEndpoint.requestBody)}
            collapsed={false}
          />
        </div>
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
                    collapsed={true}
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
