"use client";

import { TopNavbar } from "@/components/layout/top-navbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { ToastContainer } from "@/components/ui/toast";
import { AIDrawer } from "@/components/ai/ai-drawer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white pb-16 md:pb-0">
      <TopNavbar />
      <ToastContainer />
      <main className="flex-1 p-3 sm:p-5 md:p-6 max-w-[1850px] w-full mx-auto">
        {children}
      </main>
      <AIDrawer />
      <MobileBottomNav />
    </div>
  );
}
