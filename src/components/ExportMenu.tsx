"use client";

import { useState } from "react";
import { Download, FileText, ChevronDown } from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { ExportModal } from "@/components/ExportModal";
import { downloadOpenAPISpec } from "@/utils/exportUtils";

export function ExportMenu() {
  const { openApiSpec, apiInfo } = useApi();
  const [showExportModal, setShowExportModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleDownloadOpenAPI = () => {
    if (openApiSpec) {
      downloadOpenAPISpec(openApiSpec, apiInfo?.title || "api-spec");
      setIsMenuOpen(false);
    }
  };

  const handleExportPDF = () => {
    setShowExportModal(true);
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="hidden md:inline">Export</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {isMenuOpen && (
          <>
            {/* Overlay để đóng menu */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu dropdown */}
            <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-[9999] bg-white">
              <div className="py-1">
                <button
                  onClick={handleDownloadOpenAPI}
                  className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-muted transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Tải OpenAPI Spec</span>
                </button>

                <button
                  onClick={handleExportPDF}
                  className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-muted transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất PDF Documentation</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}
    </>
  );
}
