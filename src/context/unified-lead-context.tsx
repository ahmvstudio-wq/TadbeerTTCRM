"use client";

import React, { createContext, useContext, useState } from "react";
import { UnifiedLeadWorkspace } from "@/components/workspace/unified-lead-workspace";

interface UnifiedLeadContextType {
  openLead: (leadId: string, initialTab?: string) => void;
  closeLead: () => void;
  selectedLeadId: string | null;
  initialTab?: string | null;
}

const UnifiedLeadContext = createContext<UnifiedLeadContextType | undefined>(undefined);

export function UnifiedLeadProvider({ children }: { children: React.ReactNode }) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [activeInitialTab, setActiveInitialTab] = useState<string | null>(null);

  const openLead = (leadId: string, initialTab?: string) => {
    setSelectedLeadId(leadId);
    if (initialTab) {
      setActiveInitialTab(initialTab);
    } else {
      setActiveInitialTab(null);
    }
  };

  const closeLead = () => {
    setSelectedLeadId(null);
    setActiveInitialTab(null);
  };

  return (
    <UnifiedLeadContext.Provider value={{ openLead, closeLead, selectedLeadId, initialTab: activeInitialTab }}>
      {children}

      {/* Global Slide-Over Modal for Unified Lead Workspace */}
      {selectedLeadId && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
          onClick={closeLead}
        >
          <div
            className="w-full max-w-5xl my-auto shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <UnifiedLeadWorkspace
              companyId={selectedLeadId}
              onClose={closeLead}
              currentUser="Ramij"
              initialTab={activeInitialTab as any}
            />
          </div>
        </div>
      )}
    </UnifiedLeadContext.Provider>
  );
}

export function useUnifiedLead() {
  const context = useContext(UnifiedLeadContext);
  if (!context) {
    throw new Error("useUnifiedLead must be used within a UnifiedLeadProvider");
  }
  return context;
}
