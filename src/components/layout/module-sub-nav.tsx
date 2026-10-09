"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface SubNavTab {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface ModuleSubNavProps {
  title: string;
  subtitle?: string;
  tabs: SubNavTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  actions?: React.ReactNode;
}

export function ModuleSubNav({
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  actions,
}: ModuleSubNavProps) {
  return (
    <div className="rounded-2xl bg-white border border-neutral-200/80 p-3 sm:p-4 shadow-2xs space-y-3 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-neutral-900 font-display">
            {title}
          </h1>
          {subtitle && (
            <p className="text-neutral-500 text-xs mt-0.5 font-normal">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {/* Tabs Menu Strip */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100/80 border border-neutral-200/60 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              type="button"
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer",
                isActive
                  ? "bg-[#0f343c] text-white shadow-xs font-black"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-white/60"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", isActive ? "text-[#c5a059]" : "text-neutral-500")} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                    isActive
                      ? "bg-white/20 text-white font-bold"
                      : "bg-neutral-200 text-neutral-700"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
