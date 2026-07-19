"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Zap,
  Phone,
  Clock,
  Calendar,
  TrendingUp,
  Settings,
  Building2,
  LogOut,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Prospects", href: "/prospects", icon: Users },
  { name: "Daily Cadence", href: "/daily-cadence", icon: Zap },
  { name: "Calls", href: "/calls", icon: Phone },
  { name: "Follow-ups", href: "/follow-ups", icon: Clock },
  { name: "Meetings", href: "/meetings", icon: Calendar },
  { name: "Pipeline", href: "/pipeline", icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-brand-teal text-white">
      <div className="flex h-16 items-center gap-3 px-6 border-b border-white/10">
        <div className="h-9 w-9 rounded-lg bg-brand-gold flex items-center justify-center">
          <Building2 className="h-5 w-5 text-brand-teal-dark" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Tadbeer</h1>
          <p className="text-xs text-white/60 -mt-0.5">CRM Operating System</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-brand-gold" : "text-white/50")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
        >
          <Settings className="h-5 w-5 text-white/50" />
          Settings
        </Link>
      </div>
    </aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-64 bg-brand-teal text-white">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-white/10">
          <div className="h-9 w-9 rounded-lg bg-brand-gold flex items-center justify-center">
            <Building2 className="h-5 w-5 text-brand-teal-dark" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Tadbeer</h1>
            <p className="text-xs text-white/60 -mt-0.5">CRM Operating System</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-brand-gold" : "text-white/50")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
