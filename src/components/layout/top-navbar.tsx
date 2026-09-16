"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useUnifiedLead } from "@/context/unified-lead-context";
import { getCompanies } from "@/lib/actions/companies";
import { Company } from "@/lib/types/database";
import {
  LayoutDashboard,
  Users,
  Zap,
  Phone,
  Clock,
  Calendar,
  TrendingUp,
  Settings,
  LogOut,
  Bell,
  Globe2,
  Send,
  Search,
  Building,
  User,
  Loader2
} from "lucide-react";
import Image from "next/image";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Prospects", href: "/prospects", icon: Users },
  { name: "Daily Cadence", href: "/daily-cadence", icon: Zap },
  { name: "Outreach", href: "/outreach", icon: Send },
  { name: "Meetings", href: "/meetings", icon: Calendar },
  { name: "Pipeline", href: "/pipeline", icon: TrendingUp },
];

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { openLead } = useUnifiedLead();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    document.cookie = "tadbeer-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "tadbeer-user-email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "tadbeer-user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    if (typeof window !== "undefined") {
      localStorage.removeItem("tadbeer_user");
    }
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        const res = await getCompanies({ search: searchQuery });
        if (res.data) {
          setSearchResults(res.data as any[]);
          setShowDropdown(true);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-black/[0.06] shadow-glass">
      <div className="flex items-center justify-between h-14 sm:h-16 md:h-18 px-3 sm:px-6 gap-3">
        <Link href="/dashboard" className="flex-shrink-0 flex items-center group">
          <Image src="/logo/tadbeer-logo.png" alt="Tadbeer" width={140} height={140} className="object-contain h-9 sm:h-11 md:h-12 w-auto group-hover:opacity-90 transition-opacity" priority />
        </Link>

        {/* Global Live Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-md mx-2 font-body">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca3af]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 2 && setShowDropdown(true)}
              placeholder="Search company, contact, or phone..."
              className="w-full bg-[#f5f5f7]/90 hover:bg-[#ebebee] focus:bg-white border border-black/[0.05] focus:border-black/[0.18] rounded-xl pl-9 pr-8 py-1.5 text-xs font-light text-[#0c0d0f] placeholder:text-[#9ca3af] focus:outline-none transition-all shadow-2xs focus:shadow-[0_0_20px_rgba(15,52,60,0.06)]"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-[#0f343c]" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-2xl rounded-2xl border border-black/[0.08] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2.5 border-b border-black/[0.04] bg-neutral-50/70 flex items-center justify-between font-mono">
                <span className="text-[10px] font-medium text-[#6b7280] uppercase tracking-wider">
                  Lead Search Results ({searchResults.length})
                </span>
                <span className="text-[10px] text-[#9ca3af]">Click to open lead workspace</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-5 text-center text-xs text-[#6b7280] font-light">
                  No matching leads found for &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-black/[0.03]">
                  {searchResults.map((comp) => {
                    const primary = ((comp as any).contacts || []).find((c: any) => c.is_primary) || (comp as any).contacts?.[0];
                    return (
                      <button
                        key={comp.id}
                        onClick={() => {
                          openLead(comp.id);
                          setShowDropdown(false);
                          setSearchQuery("");
                        }}
                        className="w-full p-3 text-left hover:bg-black/[0.02] transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-xl bg-black text-white font-medium text-xs flex items-center justify-center shrink-0 group-hover:bg-[#0f343c] transition-colors">
                            {comp.company_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-normal text-[#0c0d0f] text-xs block truncate group-hover:text-black">
                              {comp.company_name}
                            </span>
                            <p className="text-[10px] text-[#8a8d95] font-light truncate">
                              {comp.industry || "General"} • {primary ? primary.full_name : (comp.city || "No location")}
                            </p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 text-[9px] font-mono uppercase rounded-md bg-black/[0.04] text-[#6b7280] shrink-0 group-hover:bg-[#0f343c]/10 group-hover:text-[#0f343c]">
                          {comp.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button className="relative p-2 rounded-xl text-[#6b7280] hover:text-black bg-[#f5f5f7]/80 hover:bg-[#ebebee] border border-black/[0.04] transition-all active:scale-95 cursor-pointer" title="Notifications">
            <Bell className="h-3.5 w-3.5" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-[#6b7280] hover:text-red-600 bg-[#f5f5f7]/80 hover:bg-red-50 border border-black/[0.04] hover:border-red-200 transition-all active:scale-95 cursor-pointer"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Desktop CallMy Mgmt Pill Navigation Bar */}
      <div className="hidden md:flex items-center px-4 sm:px-6 pb-2.5 pt-0.5 overflow-x-auto scrollbar-hide">
        <nav className="flex items-center gap-1 bg-[#f5f5f7]/90 border border-black/[0.04] p-1 rounded-2xl shadow-2xs font-body">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 text-xs transition-all duration-150 rounded-xl relative font-light",
                  isActive
                    ? "bg-white text-black font-normal shadow-sm"
                    : "text-[#6b7280] hover:text-black hover:bg-black/[0.02]"
                )}
              >
                <item.icon className={cn("h-3.5 w-3.5 transition-colors", isActive ? "text-black" : "text-[#9ca3af]")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 text-xs transition-all duration-150 rounded-xl relative font-light",
              pathname === "/settings"
                ? "bg-white text-black font-normal shadow-sm"
                : "text-[#6b7280] hover:text-black hover:bg-black/[0.02]"
            )}
          >
            <Settings className={cn("h-3.5 w-3.5 transition-colors", pathname === "/settings" ? "text-black" : "text-[#9ca3af]")} />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

