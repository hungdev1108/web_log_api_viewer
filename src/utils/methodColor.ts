import type { ApiEndpoint } from "./types";

/**
 * Trả về màu background hex cho method badge (giống Swagger UI)
 */
export function getMethodBackgroundColor(
  method: ApiEndpoint["method"]
): string {
  const colors: Record<string, string> = {
    GET: "#61affe",
    POST: "#49cc90",
    PUT: "#fca130",
    DELETE: "#f93e3e",
    PATCH: "#50e3c2",
    OPTIONS: "#6c757d",
    HEAD: "#6c757d",
  };
  return colors[method] || "#6c757d";
}

/**
 * Trả về màu cho method badge (deprecated - dùng getMethodBackgroundColor thay thế)
 */
export function getMethodColor(method: ApiEndpoint["method"]): string {
  // Giữ lại để backward compatibility, nhưng khuyến khích dùng getMethodBackgroundColor
  return "";
}

/**
 * Convert màu hex sang pastel (tăng độ sáng)
 */
export function hexToPastel(hex: string, opacity: number = 0.2): string {
  // Loại bỏ # nếu có
  hex = hex.replace("#", "");

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Tạo màu pastel bằng cách mix với white (80% white)
  const pastelR = Math.round(r + (255 - r) * 0.8);
  const pastelG = Math.round(g + (255 - g) * 0.8);
  const pastelB = Math.round(b + (255 - b) * 0.8);

  return `rgba(${pastelR}, ${pastelG}, ${pastelB}, ${opacity})`;
}

/**
 * Trả về màu background pastel cho button khi selected (chỉ light mode)
 */
export function getMethodPastelColor(
  method: ApiEndpoint["method"],
  isSelected: boolean,
  isDarkMode: boolean
): string | undefined {
  if (isSelected && !isDarkMode) {
    const methodColor = getMethodBackgroundColor(method);
    return hexToPastel(methodColor, 0.7);
  }
  return undefined;
}

/**
 * Trả về text color cho method badge
 */
export function getMethodTextColor(method: ApiEndpoint["method"]): string {
  return "text-white";
}
