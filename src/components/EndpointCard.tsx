"use client";

import type { ApiEndpoint } from "@/utils/types";
import { getMethodColor, getMethodTextColor } from "@/utils/methodColor";

interface EndpointCardProps {
  endpoint: ApiEndpoint;
  isSelected: boolean;
  onClick: () => void;
}

export function EndpointCard({
  endpoint,
  isSelected,
  onClick,
}: EndpointCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-all ${
        isSelected
          ? "bg-primary text-primary-foreground shadow-md"
          : "bg-card hover:bg-accent border border-border"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold ${getMethodColor(
            endpoint.method
          )} ${getMethodTextColor(endpoint.method)}`}
        >
          {endpoint.method}
        </span>
        <span
          className={`text-sm font-mono truncate ${
            isSelected ? "text-primary-foreground/90" : "text-muted-foreground"
          }`}
        >
          {endpoint.path}
        </span>
      </div>
      {endpoint.summary && (
        <p
          className={`text-xs mt-1 line-clamp-2 ${
            isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
          }`}
        >
          {endpoint.summary}
        </p>
      )}
    </button>
  );
}
