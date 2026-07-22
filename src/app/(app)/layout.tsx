"use client";

import { TopNavbar } from "@/components/layout/top-navbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { ToastContainer } from "@/components/ui/toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-cream pb-16 md:pb-0">
      <TopNavbar />
      <ToastContainer />
      <main className="flex-1 p-3 sm:p-5 md:p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
