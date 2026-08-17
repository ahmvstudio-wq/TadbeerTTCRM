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
  { name: "LinkedIn", href: "/linkedin", icon: Globe2 },
  { name: "Calls", href: "/calls", icon: Phone },
  { name: "Follow-ups", href: "/follow-ups", icon: Clock },
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="flex items-center justify-between h-14 sm:h-16 md:h-20 px-3 sm:px-6 gap-3">
        <Link href="/dashboard" className="flex-shrink-0 flex items-center">
          <Image src="/logo/tadbeer-logo.png" alt="Tadbeer" width={140} height={140} className="object-contain h-10 sm:h-12 md:h-14 w-auto" priority />
        </Link>

        {/* Global Live Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-md mx-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 2 && setShowDropdown(true)}
              placeholder="Search company, contact, or phone..."
              className="w-full bg-slate-100/80 hover:bg-slate-100 border border-slate-200 focus:border-slate-400 rounded-xl pl-9 pr-8 py-1.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-2xs"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-teal-600" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Lead Search Results ({searchResults.length})
                </span>
                <span className="text-[10px] text-slate-400">Click to open lead workspace</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No matching leads found for "{searchQuery}"
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
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
                        className="w-full p-3 text-left hover:bg-teal-50/60 transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 group-hover:bg-teal-600 transition-colors">
                            {comp.company_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-900 text-xs block truncate group-hover:text-teal-950">
                              {comp.company_name}
                            </span>
                            <p className="text-[10px] text-slate-500 font-medium truncate">
                              {comp.industry || "General"} • {primary ? primary.full_name : (comp.city || "No location")}
                            </p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md bg-slate-100 text-slate-700 shrink-0 group-hover:bg-teal-100 group-hover:text-teal-900">
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
          <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 border border-slate-200 transition-all active:scale-95 cursor-pointer">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-teal-500" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 border border-slate-200 transition-all active:scale-95 cursor-pointer"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Desktop Tab navigation */}
      <nav className="hidden md:flex items-center gap-1 px-4 sm:px-6 pb-2 overflow-x-auto scrollbar-hide">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-bold whitespace-nowrap transition-all rounded-xl",
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.name}
            </Link>
          );
        })}
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-bold whitespace-nowrap transition-all rounded-xl",
            pathname === "/settings"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <Settings className="h-3.5 w-3.5" />
          Settings
        </Link>
      </nav>
    </header>
  );
}
