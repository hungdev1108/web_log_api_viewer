"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { EndpointDetail } from "@/components/EndpointDetail";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Layout>
      <div className="h-[calc(100vh-80px)] flex relative">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-20 left-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 fixed md:relative w-[600px] flex-shrink-0 h-full bg-card border-r border-border z-40 transition-transform duration-300`}
        >
          <Sidebar onEndpointSelect={() => setSidebarOpen(false)} />
        </aside>

        {/* Overlay cho mobile */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 bg-background overflow-hidden">
          <EndpointDetail />
        </div>
      </div>
    </Layout>
  );
}
