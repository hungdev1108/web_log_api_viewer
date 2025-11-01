"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, ChevronRight } from "lucide-react";

// Wrapper component cho ReactJsonView để tránh SSR
const ReactJsonViewClient = dynamic(
  () =>
    import("react-json-view").then((mod) => {
      // react-json-view có thể export default hoặc named export
      return { default: mod.default || mod };
    }),
  {
    ssr: false,
    loading: () => (
      <div className="p-4">
        <div className="text-sm text-muted-foreground">
          Đang tải JSON viewer...
        </div>
      </div>
    ),
  }
);

interface JsonViewerProps {
  data: any;
  title?: string;
  collapsed?: boolean;
}

export function JsonViewer({
  data,
  title,
  collapsed = false,
}: JsonViewerProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsed);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Kiểm tra theme sau khi mount
    const checkTheme = () => {
      if (typeof window !== "undefined") {
        setIsDark(document.documentElement.classList.contains("dark"));
      }
    };
    checkTheme();

    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    if (typeof window !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    return () => observer.disconnect();
  }, []);

  if (!data) {
    return (
      <div className="p-4 bg-muted rounded-lg text-muted-foreground text-sm">
        Không có dữ liệu
      </div>
    );
  }

  // Format data để hiển thị
  let jsonData = data;

  // Nếu là schema có $ref, chỉ hiển thị ref
  if (data.schema && data.schema.$ref) {
    jsonData = {
      ...data,
      schema: { $ref: data.schema.$ref },
    };
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {title && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2 bg-muted hover:bg-accent flex items-center justify-between text-left"
        >
          <span className="font-medium text-sm">{title}</span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      )}
      {isExpanded && (
        <div className="p-4 overflow-auto max-h-96">
          {mounted ? (
            <ReactJsonViewClient
              src={jsonData}
              theme={isDark ? "monokai" : "rjv-default"}
              collapsed={1}
              displayDataTypes={false}
              displayObjectSize={false}
              enableClipboard={true}
              style={{
                backgroundColor: "transparent",
              }}
            />
          ) : (
            <div className="text-sm text-muted-foreground">Đang tải...</div>
          )}
        </div>
      )}
    </div>
  );
}
