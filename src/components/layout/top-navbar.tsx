"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
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
} from "lucide-react";
import Image from "next/image";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Prospects", href: "/prospects", icon: Users },
  { name: "Daily Cadence", href: "/daily-cadence", icon: Zap },
  { name: "LinkedIn", href: "/linkedin", icon: Globe2 },
  { name: "Calls", href: "/calls", icon: Phone },
  { name: "Follow-ups", href: "/follow-ups", icon: Clock },
  { name: "Meetings", href: "/meetings", icon: Calendar },
  { name: "Pipeline", href: "/pipeline", icon: TrendingUp },
];

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b border-border/80 shadow-xs">
      <div className="flex items-center justify-between h-14 sm:h-16 md:h-20 px-3 sm:px-6">
        <Link href="/daily-cadence" className="flex-shrink-0 flex items-center">
          <Image src="/logo/tadbeer-logo.png" alt="Tadbeer" width={140} height={140} className="object-contain h-10 sm:h-12 md:h-14 w-auto" priority />
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button className="relative p-2 rounded-xl text-text-secondary hover:bg-white border border-transparent hover:border-border transition-all active:scale-95">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brand-gold" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-text-secondary hover:bg-white border border-transparent hover:border-border transition-all active:scale-95"
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
                "flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-all rounded-xl",
                isActive
                  ? "bg-brand-teal text-white shadow-xs"
                  : "text-text-secondary hover:text-brand-teal hover:bg-white"
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
            "flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-all rounded-xl",
            pathname === "/settings"
              ? "bg-brand-teal text-white shadow-xs"
              : "text-text-secondary hover:text-brand-teal hover:bg-white"
          )}
        >
          <Settings className="h-3.5 w-3.5" />
          Settings
        </Link>
      </nav>
    </header>
  );
}
