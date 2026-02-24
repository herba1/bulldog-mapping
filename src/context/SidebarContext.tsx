'use client'
import React, { createContext, useContext, useState } from "react"

type SidebarView = "search" | "building" | "event" | "filters" | null | "eventCreator" | "eventList" | "schedule" | "constructionZones" | "chatbot";

type SidebarContextType = {
  view: SidebarView;
  isOpen: boolean;
  setView: (view: SidebarView) => void;
  setIsOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

type SidebarProviderProps = {
  children: React.ReactNode;
};

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [view, setView] = useState<SidebarView>("search");
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const value: SidebarContextType = {
    view,
    isOpen,
    setView,
    setIsOpen,
    toggleSidebar,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export type { SidebarView };
