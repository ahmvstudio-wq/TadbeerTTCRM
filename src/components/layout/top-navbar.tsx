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
} from "lucide-react";
import Image from "next/image";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Prospects", href: "/prospects", icon: Users },
  { name: "Daily Cadence", href: "/daily-cadence", icon: Zap },
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
    <header className="sticky top-0 z-50 bg-cream border-b border-border">
      <div className="flex items-center justify-between h-24 px-4 sm:px-6">
        <Link href="/dashboard" className="flex-shrink-0">
          <Image src="/logo/tadbeer-logo.png" alt="Tadbeer" width={160} height={160} className="object-contain h-16 w-auto" priority />
        </Link>

        <div className="flex items-center gap-1">
          <button className="relative p-2 rounded-lg text-text-secondary hover:bg-white border border-transparent hover:border-border transition-all">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brand-gold" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-text-secondary hover:bg-white border border-transparent hover:border-border transition-all"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <nav className="flex items-center gap-0.5 px-4 sm:px-6 overflow-x-auto scrollbar-hide">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-all rounded-md",
                isActive
                  ? "bg-brand-teal text-white"
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
            "flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-all rounded-md",
            pathname === "/settings"
              ? "bg-brand-teal text-white"
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
