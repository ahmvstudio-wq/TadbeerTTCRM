"use client";

import { useState } from "react";
import { Menu, Search, Bell, LogOut } from "lucide-react";
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
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-white px-4 sm:px-6">
        <button
          type="button"
          className="lg:hidden p-2 rounded-md text-text-secondary hover:bg-surface-hover"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <div className="relative hidden sm:block w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search prospects, contacts..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-surface-hover text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg text-text-secondary hover:bg-surface-hover">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <Avatar name="User" size="md" />
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-red-600 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>
    </>
  );
}
