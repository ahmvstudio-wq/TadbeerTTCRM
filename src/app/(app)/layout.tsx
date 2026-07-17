"use client";

import { TopNavbar } from "@/components/layout/top-navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <TopNavbar />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
