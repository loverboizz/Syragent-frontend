import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { OverviewTab } from "./tabs/OverviewTab";
import { ServicesTab } from "./tabs/ServicesTab";
import { ConversationsTab } from "./tabs/ConversationsTab";
import { WidgetCustomizerTab } from "./tabs/WidgetCustomizerTab";
import { AgentConfigTab } from "./tabs/AgentConfigTab";
import { KnowledgeTab } from "./tabs/KnowledgeTab";
import { UsersTab } from "./tabs/UsersTab";

import { ServiceModal } from "../components/modals/ServiceModal";
import { EmbedModal } from "../components/modals/EmbedModal";
import { UserModal } from "../components/modals/UserModal";
import { apiRequest } from "../api/client";

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Global Data Store
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastFetchTimeRef = useRef(0);

  // Modals state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [embedService, setEmbedService] = useState(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Selected Service for cross-tab jumping
  const [jumpServiceId, setJumpServiceId] = useState(null);

  // Fetch Services and Stats concurrently
  const fetchData = async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoadingData(true);
    }

    try {
      const [srvData, statsData] = await Promise.all([
        apiRequest("/api/v1/services/"),
        apiRequest("/api/v1/services/stats").catch(() => null),
      ]);
      setServices(srvData || []);
      if (statsData) setStats(statsData);
      lastFetchTimeRef.current = Date.now();
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoadingData(false);
      setIsRefreshing(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchData(false);
  }, []);

  // Auto-sync on Window Focus (SWR pattern) with 30s throttle
  useEffect(() => {
    const handleFocus = () => {
      if (Date.now() - lastFetchTimeRef.current > 30000) {
        fetchData(true);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleOpenCreateService = () => {
    setEditingService(null);
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (service) => {
    setEditingService(service);
    setIsServiceModalOpen(true);
  };

  const handleOpenEmbedModal = (service) => {
    setEmbedService(service);
    setIsEmbedModalOpen(true);
  };

  const handleGoToAgent = (serviceId) => {
    setJumpServiceId(serviceId);
    setActiveTab("agents");
  };

  const handleGoToKnowledge = (serviceId) => {
    setJumpServiceId(serviceId);
    setActiveTab("knowledge");
  };

  const handleGoToWidget = (serviceId) => {
    setJumpServiceId(serviceId);
    setActiveTab("widget");
  };

  const handleGoToConversations = (serviceId) => {
    setJumpServiceId(serviceId);
    setActiveTab("conversations");
  };

  const handleServiceSuccess = () => {
    fetchData(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100/70 font-sans">
      {/* 1. Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* 2. Main Viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header
          activeTab={activeTab}
          onRefresh={() => fetchData(true)}
          isRefreshing={isRefreshing}
        />

        {/* Keep-Alive Mounted Tabs Container (Zero-Latency tab switching) */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          <div className={activeTab === "overview" ? "block" : "hidden"}>
            <OverviewTab
              services={services}
              stats={stats}
              loading={loadingData}
              onOpenCreateService={handleOpenCreateService}
              onOpenEmbed={handleOpenEmbedModal}
              onSwitchTab={setActiveTab}
            />
          </div>

          <div className={activeTab === "services" ? "block" : "hidden"}>
            <ServicesTab
              services={services}
              loading={loadingData}
              onReloadServices={() => fetchData(true)}
              onOpenCreate={handleOpenCreateService}
              onOpenEdit={handleOpenEditService}
              onOpenEmbed={handleOpenEmbedModal}
              onGoToAgent={handleGoToAgent}
              onGoToKnowledge={handleGoToKnowledge}
              onGoToWidget={handleGoToWidget}
              onGoToConversations={handleGoToConversations}
            />
          </div>

          <div className={activeTab === "conversations" ? "block" : "hidden"}>
            <ConversationsTab
              services={services}
              preselectedServiceId={jumpServiceId}
            />
          </div>

          <div className={activeTab === "widget" ? "block" : "hidden"}>
            <WidgetCustomizerTab
              services={services}
              preselectedServiceId={jumpServiceId}
              onConfigSaved={() => fetchData(true)}
            />
          </div>

          <div className={activeTab === "agents" ? "block" : "hidden"}>
            <AgentConfigTab
              services={services}
              preselectedServiceId={jumpServiceId}
              onConfigSaved={() => fetchData(true)}
            />
          </div>

          <div className={activeTab === "knowledge" ? "block" : "hidden"}>
            <KnowledgeTab
              services={services}
              preselectedServiceId={jumpServiceId}
              onKnowledgeChanged={() => fetchData(true)}
            />
          </div>

          <div className={activeTab === "users" ? "block" : "hidden"}>
            <UsersTab onOpenCreateUser={() => setIsUserModalOpen(true)} />
          </div>
        </main>
      </div>

      {/* 3. Global Modals */}
      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        editingService={editingService}
        onSuccess={handleServiceSuccess}
      />

      <EmbedModal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
        service={embedService}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSuccess={() => fetchData(true)}
      />
    </div>
  );
}
