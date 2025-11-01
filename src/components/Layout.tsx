"use client";

import { ReactNode } from "react";
import { useApi } from "@/context/ApiContext";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBar } from "./SearchBar";
import { ExportMenu } from "./ExportMenu";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { apiInfo, isLoading, error } = useApi();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">API Documentation</h1>
            <p className="text-xs text-muted-foreground">
              SOFIPOS API - v1.0.0
            </p>
          </div>
          <div className="flex items-center gap-4">
            {!isLoading && !error && (
              <>
                <div className="hidden md:block w-64">
                  <SearchBar
                    value=""
                    onChange={() => {}}
                    placeholder="Tìm kiếm..."
                  />
                </div>
                <ExportMenu />
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Đang tải API documentation...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <p className="text-red-500 text-lg mb-2">Lỗi: {error}</p>
              <p className="text-muted-foreground text-sm">
                Không thể tải API từ server. Vui lòng kiểm tra kết nối mạng hoặc
                thử lại sau.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && children}
      </main>
    </div>
  );
}
