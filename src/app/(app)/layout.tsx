"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopNavbar } from "@/components/layout/top-navbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { ToastContainer } from "@/components/ui/toast";
import { AIDrawer } from "@/components/ai/ai-drawer";
import { UnifiedLeadProvider } from "@/context/unified-lead-context";
import { Loader2 } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const hasAuthCookie = document.cookie.includes("tadbeer-auth=true") || document.cookie.includes("auth-token") || document.cookie.includes("sb-access-token");
    const hasLocalUser = typeof window !== "undefined" && Boolean(localStorage.getItem("tadbeer_user"));

    if (!hasAuthCookie && !hasLocalUser) {
      router.push("/login");
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbfbfd] text-[#0c0d0f] font-sans">
        <Loader2 className="h-7 w-7 animate-spin text-neutral-800 mb-3" />
        <p className="text-xs font-light text-neutral-500 font-display tracking-wide uppercase">Authenticating Tadbeer CRM Workspace...</p>
      </div>
    );
  }

  return (
    <UnifiedLeadProvider>
      <div className="min-h-screen flex flex-col bg-[#fbfbfd] text-[#0c0d0f] pb-16 md:pb-0 font-sans relative selection:bg-black/10">
        {/* Ambient Lighting Canvas (CallMy Mgmt / Luxury High-End Aura) */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          {/* Top-left soft lavender ambient glow */}
          <div className="absolute -top-[15%] -left-[10%] w-[680px] h-[680px] rounded-full bg-gradient-to-br from-indigo-200/25 via-purple-100/15 to-transparent blur-[140px] animate-pulse-soft" />
          
          {/* Top-right subtle Tadbeer teal ambient aura */}
          <div className="absolute -top-[10%] -right-[8%] w-[620px] h-[620px] rounded-full bg-gradient-to-bl from-teal-200/20 via-emerald-100/15 to-transparent blur-[140px]" />
          
          {/* Center ambient warm gold/champagne diffuse light */}
          <div className="absolute top-[35%] left-[20%] w-[700px] h-[500px] rounded-full bg-gradient-to-tr from-amber-100/15 via-rose-50/10 to-transparent blur-[160px]" />
          
          {/* Bottom-right cool ambient wash */}
          <div className="absolute -bottom-[15%] right-[10%] w-[650px] h-[650px] rounded-full bg-gradient-to-tl from-slate-200/25 via-indigo-50/10 to-transparent blur-[150px]" />
          
          {/* Topo Texture Dot Grid Overlay */}
          <div className="absolute inset-0 bg-topo-pattern opacity-[0.035]" />
        </div>

        {/* Content Container - Above Ambient Layer */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <TopNavbar />
          <ToastContainer />
          <main className="flex-1 p-3 sm:p-5 md:p-8 max-w-[1850px] w-full mx-auto">
            {children}
          </main>
          <AIDrawer />
          <MobileBottomNav />
        </div>
      </div>
    </UnifiedLeadProvider>
  );
}
