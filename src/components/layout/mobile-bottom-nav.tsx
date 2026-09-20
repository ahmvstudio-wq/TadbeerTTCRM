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
  FileCheck,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const mainNav = [
  { name: "Cadence", href: "/daily-cadence", icon: Zap },
  { name: "Prospects", href: "/prospects", icon: Users },
  { name: "Outreach", href: "/outreach", icon: Send },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
]

const extraNav = [
  { name: "Audits", href: "/audits", icon: FileCheck },
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-2xl border-t border-black/[0.06] shadow-[0_-4px_24px_rgba(0,0,0,0.04)] px-2 py-1.5 flex items-center justify-around font-body">
        {mainNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[64px] active:scale-95",
                isActive
                  ? "text-black font-normal"
                  : "text-[#8a8d95] hover:text-black"
              )}
            >
              <div className={cn(
                "p-1 rounded-lg transition-colors",
                isActive && "bg-black text-white shadow-2xs"
              )}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
            </Link>
          )
        })}

        {/* More Menu Drawer Trigger */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[64px] active:scale-95 cursor-pointer",
            drawerOpen ? "text-black font-normal" : "text-[#8a8d95] hover:text-black"
          )}
        >
          <div className={cn(
            "p-1 rounded-lg transition-colors",
            drawerOpen && "bg-black text-white shadow-2xs"
          )}>
            <Menu className="h-4 w-4" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">More</span>
        </button>
      </div>

      {/* Mobile Slide-Over Drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm animate-fade-in font-body">
          <div
            className="fixed inset-0"
            onClick={() => setDrawerOpen(false)}
          />
          
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-t-3xl border-t border-black/[0.08] p-5 shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-in-down">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.04]">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-10 rounded-full bg-black/10 mx-auto absolute left-1/2 -translate-x-1/2 top-2.5" />
                <span className="text-sm font-light text-black pt-2 font-display">Menu & Navigation</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-[#6b7280] transition-colors mt-2 cursor-pointer"
              >
                <X className="h-4 w-4" />
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
                      "flex items-center justify-between p-3 rounded-xl transition-all text-xs font-light",
                      isActive
                        ? "bg-black text-white font-normal shadow-xs"
                        : "text-[#0c0d0f] hover:bg-black/[0.03] border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-1.5 rounded-lg", isActive ? "bg-white/20 text-white" : "bg-black/[0.04] text-black")}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                  </Link>
                )
              })}
            </div>

            <div className="pt-3 border-t border-black/[0.04]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 font-normal text-xs transition-colors active:scale-98 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
