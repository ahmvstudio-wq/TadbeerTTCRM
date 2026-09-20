"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Zap,
  Send,
  Phone,
  Clock,
  Calendar,
  TrendingUp,
  Settings,
  Building2,
  ChevronRight,
  FileCheck
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Prospects", href: "/prospects", icon: Users },
  { name: "Daily Cadence", href: "/daily-cadence", icon: Zap },
  { name: "Outreach", href: "/outreach", icon: Send },
  { name: "Audits", href: "/audits", icon: FileCheck },
  { name: "Meetings", href: "/meetings", icon: Calendar },
  { name: "Pipeline", href: "/pipeline", icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-neutral-950 text-white border-r border-neutral-800">
      {/* Brand Top Bar */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-neutral-800/80">
        <div className="h-8 w-8 rounded-lg bg-[#0f343c] border border-[#16434d] text-white flex items-center justify-center font-black shadow-xs">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-black tracking-tight text-white uppercase">Tadbeer CRM</h1>
          <p className="text-[10px] text-neutral-400 font-bold -mt-0.5">Sales CRM</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all",
                isActive
                  ? "bg-[#0f343c] text-white shadow-xs font-black border border-[#16434d]"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
              )}
            >
              <div className="flex items-center gap-2.5">
                <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-neutral-400")} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer Settings */}
      <div className="border-t border-neutral-800/80 p-3 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:bg-neutral-900 hover:text-white transition-all"
        >
          <Settings className="h-4 w-4 text-neutral-400" />
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-64 bg-neutral-950 text-white border-r border-neutral-800">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-neutral-800/80">
          <div className="h-8 w-8 rounded-lg bg-[#0f343c] border border-[#16434d] text-white flex items-center justify-center font-black">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white uppercase">Tadbeer CRM</h1>
            <p className="text-[10px] text-neutral-400 font-bold -mt-0.5">Sales CRM</p>
          </div>
        </div>
        <nav className="px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all",
                  isActive
                    ? "bg-[#0f343c] text-white font-black border border-[#16434d]"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-neutral-400")} />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
