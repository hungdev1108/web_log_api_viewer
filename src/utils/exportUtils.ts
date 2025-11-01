import type { OpenAPISpec, ApiEndpoint } from "./types";
import jsPDF from "jspdf";
import { getMethodBackgroundColor } from "./methodColor";

/**
 * Tải xuống OpenAPI spec file dưới dạng JSON
 */
export function downloadOpenAPISpec(
  spec: OpenAPISpec,
  filename: string = "openapi-spec"
): void {
  const jsonString = JSON.stringify(spec, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Tạo print-friendly view và mở print dialog
 */
export function generatePrintView(): void {
  // Thêm class để áp dụng print styles
  document.body.classList.add("print-mode");

  // Thêm một style sheet tạm thời nếu chưa có
  let printStyle = document.getElementById("print-style");
  if (!printStyle) {
    printStyle = document.createElement("style");
    printStyle.id = "print-style";
    printStyle.textContent = `
      @media print {
        body.print-mode {
          margin: 0;
          padding: 20px;
        }
        body.print-mode header,
        body.print-mode button,
        body.print-mode .no-print {
          display: none !important;
        }
        body.print-mode main {
          width: 100% !important;
          max-width: none !important;
        }
      }
    `;
    document.head.appendChild(printStyle);
  }

  // Trigger print
  window.print();

  // Cleanup sau khi print
  setTimeout(() => {
    document.body.classList.remove("print-mode");
  }, 100);
}

/**
 * Xuất các API đã chọn ra PDF
 */
export async function exportToPDF(
  endpoints: ApiEndpoint[],
  title: string = "API Documentation",
  openApiSpec: any = null
): Promise<void> {
  try {
    // Tạo PDF mới
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper để thêm trang mới nếu cần
    const checkPageBreak = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
    };

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    const titleText = "SOFIPOS API Documentation";
    const titleWidth = pdf.getTextWidth(titleText);
    const titleX = (pageWidth - titleWidth) / 2;
    pdf.text(titleText, titleX, yPosition);
    yPosition += 5;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const date = new Date().toLocaleDateString("vi-VN");
    const dateText = `Exported on: ${date}`;
    const dateWidth = pdf.getTextWidth(dateText);
    const dateX = (pageWidth - dateWidth) / 2;
    pdf.text(dateText, dateX, yPosition);
    yPosition += 8;

    // Group endpoints theo tag
    const grouped: Record<string, ApiEndpoint[]> = {};
    endpoints.forEach((endpoint) => {
      const tag = endpoint.tags?.[0] || "Other";
      if (!grouped[tag]) {
        grouped[tag] = [];
      }
      grouped[tag].push(endpoint);
    });

    // Xuất từng group
    Object.entries(grouped).forEach(([groupName, groupEndpoints]) => {
      checkPageBreak(20);

      // Group header với số lượng API
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${groupName} (${groupEndpoints.length})`, margin, yPosition);
      yPosition += 8;

      // Biến đếm số thứ tự API trong group (bắt đầu từ 0)
      let endpointIndex = 0;

      // Xuất từng endpoint trong group
      groupEndpoints.forEach((endpoint) => {
        checkPageBreak(30);

        // Tăng số index
        endpointIndex++;

        // Index number
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        const indexText = `${endpointIndex}.`;
        pdf.text(indexText, margin, yPosition);

        // Method và Path
        const indexWidth = pdf.getTextWidth(indexText) + 3;
        const methodColor = hexToRgb(getMethodBackgroundColor(endpoint.method));
        pdf.setTextColor(methodColor.r, methodColor.g, methodColor.b);

        pdf.text(`${endpoint.method}`, margin + indexWidth, yPosition);

        const methodWidth = pdf.getTextWidth(endpoint.method) + 3;
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 0, 0);
        pdf.text(endpoint.path, margin + indexWidth + methodWidth, yPosition);

        yPosition += 6;

        // Summary
        if (endpoint.summary) {
          checkPageBreak(15);
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.text("Summary:", margin + 5, yPosition);
          pdf.setFont("helvetica", "normal");
          const summaryLines = pdf.splitTextToSize(
            endpoint.summary,
            maxWidth - 10
          );
          const summaryLineHeight = 5;
          summaryLines.forEach((line: string) => {
            checkPageBreak(summaryLineHeight);
            pdf.text(line, margin + 10, yPosition);
            yPosition += summaryLineHeight;
          });
          yPosition += 3;
        }

        // Description
        if (endpoint.description) {
          checkPageBreak(10);
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "italic");
          const descLines = pdf.splitTextToSize(
            endpoint.description,
            maxWidth - 10
          );
          const descLineHeight = 4;
          descLines.forEach((line: string) => {
            checkPageBreak(descLineHeight);
            pdf.text(line, margin + 5, yPosition);
            yPosition += descLineHeight;
          });
          yPosition += 3;
        }

        // Parameters
        if (endpoint.parameters && endpoint.parameters.length > 0) {
          checkPageBreak(15);
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.text("Parameters:", margin + 5, yPosition);
          yPosition += 5;

          endpoint.parameters.forEach((param: any) => {
            pdf.setFont("helvetica", "normal");
            const paramText = `  • ${param.name} (${param.in})${
              param.required ? " *" : ""
            }: ${param.description || "No description"}`;
            const paramLines = pdf.splitTextToSize(paramText, maxWidth - 10);
            const paramLineHeight = 4;
            paramLines.forEach((line: string) => {
              checkPageBreak(paramLineHeight);
              pdf.text(line, margin + 10, yPosition);
              yPosition += paramLineHeight;
            });
          });
          yPosition += 3;
        }

        // Request Body
        if (endpoint.requestBody) {
          checkPageBreak(10);
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.text("Request Body:", margin + 5, yPosition);
          yPosition += 5;

          if (endpoint.requestBody.description) {
            pdf.setFont("helvetica", "normal");
            const bodyLines = pdf.splitTextToSize(
              endpoint.requestBody.description,
              maxWidth - 10
            );
            const bodyLineHeight = 4;
            bodyLines.forEach((line: string) => {
              checkPageBreak(bodyLineHeight);
              pdf.text(line, margin + 10, yPosition);
              yPosition += bodyLineHeight;
            });
            yPosition += 3;
          }

          // Example Value cho Request Body
          const requestExample = getRequestBodyExample(
            endpoint.requestBody,
            openApiSpec
          );
          if (requestExample) {
            checkPageBreak(15);
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "bold");
            pdf.text("Example Value:", margin + 10, yPosition);
            yPosition += 5;

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
            const exampleJson = JSON.stringify(requestExample, null, 2);
            const exampleLines = pdf.splitTextToSize(
              exampleJson,
              maxWidth - 15
            );

            // Vẽ từng dòng và kiểm tra page break
            const lineHeight = 3.5;
            exampleLines.forEach((line: string) => {
              checkPageBreak(lineHeight);
              pdf.text(line, margin + 15, yPosition);
              yPosition += lineHeight;
            });
            yPosition += 3;
          }
        }

        // Responses
        if (endpoint.responses) {
          checkPageBreak(10);
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.text("Responses:", margin + 5, yPosition);
          yPosition += 5;

          Object.entries(endpoint.responses).forEach(
            ([statusCode, response]: [string, any]) => {
              checkPageBreak(10);
              pdf.setFont("helvetica", "normal");
              const responseText = `  ${statusCode}: ${
                response.description || "No description"
              }`;
              pdf.text(responseText, margin + 10, yPosition);
              yPosition += 5;
            }
          );

          // Example Value cho Response (ưu tiên 200)
          const responseExample = getResponseExample(
            endpoint.responses,
            openApiSpec
          );
          if (responseExample) {
            checkPageBreak(15);
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "bold");
            pdf.text("Example Value:", margin + 10, yPosition);
            yPosition += 5;

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
            const exampleJson = JSON.stringify(responseExample, null, 2);
            const exampleLines = pdf.splitTextToSize(
              exampleJson,
              maxWidth - 15
            );

            // Vẽ từng dòng và kiểm tra page break
            const lineHeight = 3.5;
            exampleLines.forEach((line: string) => {
              checkPageBreak(lineHeight);
              pdf.text(line, margin + 15, yPosition);
              yPosition += lineHeight;
            });
            yPosition += 3;
          }

          yPosition += 3;
        }

        yPosition += 5; // Spacing giữa các endpoints
      });
    });

    // Lưu PDF
    const filename = `sofipos_api_docs_${new Date().getTime()}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error("Error exporting PDF:", error);
    alert("Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại.");
  }
}

/**
 * Helper function để resolve $ref từ OpenAPI spec
 */
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

/**
 * Helper function để resolve schema (có thể có $ref)
 */
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

/**
 * Helper function để generate example từ schema
 */
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

/**
 * Lấy example value từ request body
 */
function getRequestBodyExample(requestBody: any, openApiSpec: any = null): any {
  if (!requestBody?.content) return null;

  const jsonContent =
    requestBody.content["application/json"] ||
    requestBody.content["application/json-patch+json"] ||
    Object.values(requestBody.content)[0];

  if (jsonContent?.example) {
    return jsonContent.example;
  }

  // Nếu không có example, tạo example từ schema
  if (jsonContent?.schema && openApiSpec) {
    return generateExampleFromSchema(jsonContent.schema, openApiSpec);
  }

  return null;
}

/**
 * Lấy example value từ response (ưu tiên 200)
 */
function getResponseExample(
  responses: Record<string, any> | undefined,
  openApiSpec: any = null
): any {
  if (!responses) return null;

  // Tìm response 200 trước
  const successResponse =
    responses["200"] || responses["201"] || responses["204"];
  if (successResponse?.content?.["application/json"]) {
    const jsonContent = successResponse.content["application/json"];
    if (jsonContent?.example) {
      return jsonContent.example;
    }
    // Nếu không có example, tạo example từ schema
    if (jsonContent?.schema && openApiSpec) {
      return generateExampleFromSchema(jsonContent.schema, openApiSpec);
    }
  }

  // Nếu không có 200, lấy response đầu tiên
  const firstKey = Object.keys(responses)[0];
  const firstResponse = responses[firstKey];
  if (firstResponse?.content?.["application/json"]) {
    const jsonContent = firstResponse.content["application/json"];
    if (jsonContent?.example) {
      return jsonContent.example;
    }
    // Nếu không có example, tạo example từ schema
    if (jsonContent?.schema && openApiSpec) {
      return generateExampleFromSchema(jsonContent.schema, openApiSpec);
    }
  }

  return null;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}
