"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Zap,
  Users,
  Globe2,
  LayoutDashboard,
  Menu,
  X,
  Phone,
  Clock,
  Calendar,
  TrendingUp,
  Settings,
  LogOut,
  ChevronRight,
  FileText,
  Send,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const mainNav = [
  { name: "Cadence", href: "/daily-cadence", icon: Zap },
  { name: "Prospects", href: "/prospects", icon: Users },
  { name: "Outreach", href: "/outreach", icon: Send },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
]

const extraNav = [
  { name: "Bulk Proposals", href: "/daily-cadence/bulk-proposals", icon: FileText },
  { name: "Calls", href: "/calls", icon: Phone },
  { name: "Follow-ups", href: "/follow-ups", icon: Clock },
  { name: "Meetings", href: "/meetings", icon: Calendar },
  { name: "Pipeline", href: "/pipeline", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = async () => {
    setDrawerOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <>
      {/* Fixed Native Bottom App Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-border/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around">
        {mainNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[64px] active:scale-95",
                isActive
                  ? "text-brand-teal font-bold bg-brand-teal-light/70"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <item.icon className={cn("h-5 w-5 mb-0.5 transition-transform", isActive && "scale-110")} />
              <span className="text-[10px] tracking-tight">{item.name}</span>
            </Link>
          )
        })}

        {/* More Menu Drawer Trigger */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[64px] active:scale-95",
            drawerOpen ? "text-brand-teal font-bold bg-brand-teal-light/70" : "text-text-secondary"
          )}
        >
          <Menu className="h-5 w-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </div>

      {/* Mobile Slide-Over Drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setDrawerOpen(false)}
          />
          
          <div className="relative bg-white rounded-t-3xl border-t border-border p-5 shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-in-down">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="h-2 w-10 rounded-full bg-border/80 mx-auto absolute left-1/2 -translate-x-1/2 top-2.5" />
                <span className="text-base font-bold text-text-primary pt-2">Menu & Navigation</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-full bg-cream hover:bg-cream-dark text-text-secondary transition-colors mt-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-1">
              {extraNav.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-xl transition-all text-sm font-medium",
                      isActive
                        ? "bg-brand-teal text-white font-bold"
                        : "text-text-primary hover:bg-slate-50 border border-transparent hover:border-border/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", isActive ? "bg-white/20" : "bg-cream text-brand-teal")}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </Link>
                )
              })}
            </div>

            <div className="pt-3 border-t border-border/60">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 font-semibold text-sm transition-colors active:scale-98"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
