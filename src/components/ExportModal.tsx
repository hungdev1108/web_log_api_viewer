"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CheckSquare, Square, ChevronDown } from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { exportToPDF } from "@/utils/exportUtils";
import { getMethodBackgroundColor } from "@/utils/methodColor";
import type { ApiEndpoint } from "@/utils/types";

interface ExportModalProps {
  onClose: () => void;
}

export function ExportModal({ onClose }: ExportModalProps) {
  const { endpoints, groupedEndpoints, apiInfo, openApiSpec } = useApi();
  const [selectedEndpoints, setSelectedEndpoints] = useState<Set<string>>(
    new Set(endpoints.map((e) => e.id))
  );
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => {
      const expanded: Record<string, boolean> = {};
      Object.keys(groupedEndpoints).forEach((tag) => {
        expanded[tag] = true;
      });
      return expanded;
    }
  );

  // Toggle select/deselect tất cả
  const toggleSelectAll = () => {
    if (selectedEndpoints.size === endpoints.length) {
      setSelectedEndpoints(new Set());
    } else {
      setSelectedEndpoints(new Set(endpoints.map((e) => e.id)));
    }
  };

  // Toggle select/deselect một group
  const toggleGroup = (groupName: string) => {
    const groupEndpoints = groupedEndpoints[groupName] || [];
    const groupIds = groupEndpoints.map((e) => e.id);
    const allSelected = groupIds.every((id) => selectedEndpoints.has(id));

    setSelectedEndpoints((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupIds.forEach((id) => next.delete(id));
      } else {
        groupIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Toggle select/deselect một endpoint
  const toggleEndpoint = (endpointId: string) => {
    setSelectedEndpoints((prev) => {
      const next = new Set(prev);
      if (next.has(endpointId)) {
        next.delete(endpointId);
      } else {
        next.add(endpointId);
      }
      return next;
    });
  };

  // Kiểm tra xem một group có được chọn toàn bộ không
  const isGroupFullySelected = (groupName: string) => {
    const groupEndpoints = groupedEndpoints[groupName] || [];
    if (groupEndpoints.length === 0) return false;
    return groupEndpoints.every((e) => selectedEndpoints.has(e.id));
  };

  // Kiểm tra xem một group có được chọn một phần không
  const isGroupPartiallySelected = (groupName: string) => {
    const groupEndpoints = groupedEndpoints[groupName] || [];
    const selectedCount = groupEndpoints.filter((e) =>
      selectedEndpoints.has(e.id)
    ).length;
    return selectedCount > 0 && selectedCount < groupEndpoints.length;
  };

  const handleExport = async () => {
    const selected = endpoints.filter((e) => selectedEndpoints.has(e.id));
    if (selected.length === 0) {
      alert("Vui lòng chọn ít nhất một API để xuất PDF");
      return;
    }

    await exportToPDF(
      selected,
      apiInfo?.title || "API Documentation",
      openApiSpec
    );
    onClose();
  };

  const allSelected = selectedEndpoints.size === endpoints.length;
  const someSelected = selectedEndpoints.size > 0;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      {/* Modal Content */}
      <div
        className="relative bg-card bg-white border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          margin: "auto",
          maxHeight: "calc(100vh - 10rem)",
          zIndex: 10000,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Chọn API để xuất PDF</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Select All */}
        <div className="px-4 py-2 border-b border-border">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 hover:bg-muted px-2 py-1 rounded transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="w-5 h-5 text-primary" />
            ) : someSelected ? (
              <Square className="w-5 h-5 border-2 border-primary" />
            ) : (
              <Square className="w-5 h-5 border-2" />
            )}
            <span className="font-medium">
              {allSelected
                ? "Bỏ chọn tất cả"
                : someSelected
                ? "Chọn tất cả"
                : "Chọn tất cả"}
            </span>
            <span className="text-sm text-muted-foreground">
              ({selectedEndpoints.size}/{endpoints.length} đã chọn)
            </span>
          </button>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {Object.entries(groupedEndpoints).map(
              ([groupName, groupEndpoints]) => {
                const isFullySelected = isGroupFullySelected(groupName);
                const isPartiallySelected = isGroupPartiallySelected(groupName);
                const isExpanded = expandedGroups[groupName];

                return (
                  <div
                    key={groupName}
                    className="border border-border rounded-lg"
                  >
                    {/* Group Header */}
                    <button
                      onClick={() =>
                        setExpandedGroups((prev) => ({
                          ...prev,
                          [groupName]: !prev[groupName],
                        }))
                      }
                      className="w-full px-4 py-3 bg-muted/50 hover:bg-muted flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroup(groupName);
                          }}
                          className="flex items-center gap-2"
                        >
                          {isFullySelected ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : isPartiallySelected ? (
                            <Square className="w-5 h-5 border-2 border-primary" />
                          ) : (
                            <Square className="w-5 h-5 border-2" />
                          )}
                        </button>
                        <span className="font-semibold">{groupName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded">
                          {
                            groupEndpoints.filter((e) =>
                              selectedEndpoints.has(e.id)
                            ).length
                          }
                          /{groupEndpoints.length}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Endpoints List */}
                    {isExpanded && (
                      <div className="p-2 space-y-1">
                        {groupEndpoints.map((endpoint) => (
                          <button
                            key={endpoint.id}
                            onClick={() => toggleEndpoint(endpoint.id)}
                            className="w-full px-4 py-2 hover:bg-muted rounded flex items-center gap-2 text-left transition-colors"
                          >
                            {selectedEndpoints.has(endpoint.id) ? (
                              <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 border-2 flex-shrink-0" />
                            )}
                            <span
                              className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                              style={{
                                backgroundColor: getMethodBackgroundColor(
                                  endpoint.method
                                ),
                              }}
                            >
                              {endpoint.method}
                            </span>
                            <span className="text-sm flex-1 truncate">
                              {endpoint.summary || endpoint.path}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleExport}
            disabled={selectedEndpoints.size === 0}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xuất PDF ({selectedEndpoints.size} API)
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
}
