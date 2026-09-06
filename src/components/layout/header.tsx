"use client";

import { useState } from "react";
import { Menu, Search, Bell, LogOut, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { MobileSidebar } from "@/components/layout/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      <MobileSidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-neutral-200 bg-white px-4 sm:px-6 font-sans">
        <button
          type="button"
          className="lg:hidden p-2 rounded-xl text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex-1 flex items-center gap-2">
          <div className="relative hidden sm:block w-96">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search leads, companies..."
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-neutral-200 bg-neutral-50/70 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0f343c]/10 text-[#0f343c] border border-[#0f343c]/20 text-[10px] font-mono font-bold uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0f343c] animate-pulse" />
            <span>Online</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-black px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>
    </>
  );
}
