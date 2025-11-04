"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface BearerToken {
  id: string;
  name: string;
  token: string;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  keyName: string;
  location: "header" | "query";
  createdAt: string;
}

interface AuthContextType {
  bearerTokens: BearerToken[];
  apiKeys: ApiKey[];
  addBearerToken: (name: string, token: string) => void;
  addApiKey: (
    name: string,
    key: string,
    keyName: string,
    location: "header" | "query"
  ) => void;
  removeBearerToken: (id: string) => void;
  removeApiKey: (id: string) => void;
  clearAllCredentials: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_BEARER = "api-viewer-bearer-tokens";
const STORAGE_KEY_API_KEY = "api-viewer-api-keys";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [bearerTokens, setBearerTokens] = useState<BearerToken[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  // Load credentials from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedBearer = localStorage.getItem(STORAGE_KEY_BEARER);
        if (storedBearer) {
          setBearerTokens(JSON.parse(storedBearer));
        }

        const storedApiKey = localStorage.getItem(STORAGE_KEY_API_KEY);
        if (storedApiKey) {
          setApiKeys(JSON.parse(storedApiKey));
        }
      } catch (err) {
        console.error("Error loading credentials:", err);
      }
    }
  }, []);

  // Save bearer tokens to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_BEARER, JSON.stringify(bearerTokens));
      } catch (err) {
        console.error("Error saving bearer tokens:", err);
      }
    }
  }, [bearerTokens]);

  // Save API keys to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_API_KEY, JSON.stringify(apiKeys));
      } catch (err) {
        console.error("Error saving API keys:", err);
      }
    }
  }, [apiKeys]);

  const addBearerToken = (name: string, token: string) => {
    const newToken: BearerToken = {
      id: `bearer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || `Bearer Token ${bearerTokens.length + 1}`,
      token,
      createdAt: new Date().toISOString(),
    };
    setBearerTokens((prev) => [...prev, newToken]);
  };

  const addApiKey = (
    name: string,
    key: string,
    keyName: string,
    location: "header" | "query"
  ) => {
    const newApiKey: ApiKey = {
      id: `apikey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || `API Key ${apiKeys.length + 1}`,
      key,
      keyName: keyName || "X-API-Key",
      location,
      createdAt: new Date().toISOString(),
    };
    setApiKeys((prev) => [...prev, newApiKey]);
  };

  const removeBearerToken = (id: string) => {
    setBearerTokens((prev) => prev.filter((t) => t.id !== id));
  };

  const removeApiKey = (id: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const clearAllCredentials = () => {
    setBearerTokens([]);
    setApiKeys([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY_BEARER);
      localStorage.removeItem(STORAGE_KEY_API_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        bearerTokens,
        apiKeys,
        addBearerToken,
        addApiKey,
        removeBearerToken,
        removeApiKey,
        clearAllCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
