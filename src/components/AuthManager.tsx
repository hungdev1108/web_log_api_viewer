"use client";

import { useState } from "react";
import { Key, X, Plus, Trash2, AlertTriangle, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function AuthManager() {
  const {
    bearerTokens,
    apiKeys,
    addBearerToken,
    addApiKey,
    removeBearerToken,
    removeApiKey,
    clearAllCredentials,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"bearer" | "apikey" | "list">(
    "list"
  );

  // Form states cho Bearer Token
  const [bearerName, setBearerName] = useState("");
  const [bearerToken, setBearerToken] = useState("");

  // Form states cho API Key
  const [apiKeyName, setApiKeyName] = useState("");
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [apiKeyHeaderName, setApiKeyHeaderName] = useState("X-API-Key");
  const [apiKeyLocation, setApiKeyLocation] = useState<"header" | "query">(
    "header"
  );

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleAddBearerToken = () => {
    if (!bearerToken.trim()) {
      return;
    }
    addBearerToken(bearerName.trim(), bearerToken.trim());
    setBearerName("");
    setBearerToken("");
    setActiveTab("list");
  };

  const handleAddApiKey = () => {
    if (!apiKeyValue.trim() || !apiKeyHeaderName.trim()) {
      return;
    }
    addApiKey(
      apiKeyName.trim(),
      apiKeyValue.trim(),
      apiKeyHeaderName.trim(),
      apiKeyLocation
    );
    setApiKeyName("");
    setApiKeyValue("");
    setApiKeyHeaderName("X-API-Key");
    setApiKeyLocation("header");
    setActiveTab("list");
  };

  const handleClearAll = () => {
    clearAllCredentials();
    setShowClearConfirm(false);
  };

  const totalCredentials = bearerTokens.length + apiKeys.length;

  return (
    <>
      {/* Button mở Auth Manager */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-secondary hover:bg-accent transition-colors flex items-center gap-2"
        title="Quản lý Authentication"
      >
        Authentication key
        {totalCredentials > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {totalCredentials}
          </span>
        )}
      </button>

      {/* Modal/Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="bg-white absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-lg shadow-lg z-50 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold">Quản lý Authentication</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-accent rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab("list")}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "list"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Đã lưu ({totalCredentials})
                </button>
                <button
                  onClick={() => setActiveTab("bearer")}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "bearer"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  + Bearer Token
                </button>
                <button
                  onClick={() => setActiveTab("apikey")}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "apikey"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  + API Key
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {/* List Tab */}
                {activeTab === "list" && (
                  <div className="space-y-4">
                    {/* Bearer Tokens */}
                    {bearerTokens.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2">
                          Bearer Tokens
                        </h3>
                        <div className="space-y-2">
                          {bearerTokens.map((token) => (
                            <div
                              key={token.id}
                              className="p-3 border border-border rounded bg-muted/50 flex items-start justify-between gap-2"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {token.name}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono truncate mt-1">
                                  {token.token.substring(0, 20)}...
                                </div>
                              </div>
                              <button
                                onClick={() => removeBearerToken(token.id)}
                                className="p-1 hover:bg-destructive/20 rounded transition-colors flex-shrink-0"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* API Keys */}
                    {apiKeys.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2">API Keys</h3>
                        <div className="space-y-2">
                          {apiKeys.map((key) => (
                            <div
                              key={key.id}
                              className="p-3 border border-border rounded bg-muted/50 flex items-start justify-between gap-2"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {key.name}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  <span className="font-mono">
                                    {key.keyName}
                                  </span>{" "}
                                  •{" "}
                                  <span className="capitalize">
                                    {key.location}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground font-mono truncate mt-1">
                                  {key.key.substring(0, 20)}...
                                </div>
                              </div>
                              <button
                                onClick={() => removeApiKey(key.id)}
                                className="p-1 hover:bg-destructive/20 rounded transition-colors flex-shrink-0"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {totalCredentials === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          Chưa có credentials nào được lưu
                        </p>
                        <p className="text-xs mt-1">
                          Thêm Bearer Token hoặc API Key để bắt đầu
                        </p>
                      </div>
                    )}

                    {/* Clear All Button */}
                    {totalCredentials > 0 && (
                      <div className="pt-4 border-t border-border">
                        {!showClearConfirm ? (
                          <button
                            onClick={() => setShowClearConfirm(true)}
                            className="w-full px-4 py-2 text-sm bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            Xóa tất cả credentials
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground text-center">
                              Bạn có chắc chắn muốn xóa tất cả credentials?
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={handleClearAll}
                                className="flex-1 px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                              >
                                Xác nhận
                              </button>
                              <button
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 px-4 py-2 text-sm bg-secondary rounded hover:bg-accent transition-colors"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Add Bearer Token Tab */}
                {activeTab === "bearer" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Tên (tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={bearerName}
                        onChange={(e) => setBearerName(e.target.value)}
                        placeholder="Ví dụ: Production Token"
                        className="w-full px-3 py-2 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Bearer Token <span className="text-destructive">*</span>
                      </label>
                      <textarea
                        value={bearerToken}
                        onChange={(e) => setBearerToken(e.target.value)}
                        placeholder="Nhập bearer token"
                        rows={4}
                        className="w-full px-3 py-2 border border-border rounded bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <button
                      onClick={handleAddBearerToken}
                      disabled={!bearerToken.trim()}
                      className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Lưu Bearer Token
                    </button>
                  </div>
                )}

                {/* Add API Key Tab */}
                {activeTab === "apikey" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Tên (tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={apiKeyName}
                        onChange={(e) => setApiKeyName(e.target.value)}
                        placeholder="Ví dụ: Production API Key"
                        className="w-full px-3 py-2 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        API Key Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={apiKeyHeaderName}
                        onChange={(e) => setApiKeyHeaderName(e.target.value)}
                        placeholder="X-API-Key"
                        className="w-full px-3 py-2 border border-border rounded bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        API Key Value{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <textarea
                        value={apiKeyValue}
                        onChange={(e) => setApiKeyValue(e.target.value)}
                        placeholder="Nhập API key"
                        rows={4}
                        className="w-full px-3 py-2 border border-border rounded bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Location
                      </label>
                      <select
                        value={apiKeyLocation}
                        onChange={(e) =>
                          setApiKeyLocation(
                            e.target.value as "header" | "query"
                          )
                        }
                        className="w-full px-3 py-2 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="header">Header</option>
                        <option value="query">Query Parameter</option>
                      </select>
                    </div>

                    <button
                      onClick={handleAddApiKey}
                      disabled={!apiKeyValue.trim() || !apiKeyHeaderName.trim()}
                      className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Lưu API Key
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
