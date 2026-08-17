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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400 mb-3" />
        <p className="text-xs font-bold text-slate-300">Authenticating Tadbeer CRM Workspace...</p>
      </div>
    );
  }

  return (
    <UnifiedLeadProvider>
      <div className="min-h-screen flex flex-col bg-white pb-16 md:pb-0 font-sans">
        <TopNavbar />
        <ToastContainer />
        <main className="flex-1 p-3 sm:p-5 md:p-6 max-w-[1850px] w-full mx-auto">
          {children}
        </main>
        <AIDrawer />
        <MobileBottomNav />
      </div>
    </UnifiedLeadProvider>
  );
}
