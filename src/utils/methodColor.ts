import type { ApiEndpoint } from "./types";

/**
 * Trả về màu cho method badge
 */
export function getMethodColor(method: ApiEndpoint["method"]): string {
  const colors: Record<string, string> = {
    GET: "bg-green-500",
    POST: "bg-yellow-500",
    PUT: "bg-blue-500",
    PATCH: "bg-blue-400",
    DELETE: "bg-red-500",
    OPTIONS: "bg-gray-500",
    HEAD: "bg-gray-600",
  };
  return colors[method] || "bg-gray-500";
}

/**
 * Trả về text color cho method badge
 */
export function getMethodTextColor(method: ApiEndpoint["method"]): string {
  return "text-white";
}
