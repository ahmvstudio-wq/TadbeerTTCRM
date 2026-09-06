"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

import { loginAction } from "@/lib/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await loginAction({ email, password });
      if (res.success && res.user) {
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "tadbeer_user",
            JSON.stringify({ email: res.user.email, role: res.user.role, authenticatedAt: new Date().toISOString() })
          );
        }
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(res.error || "Invalid credentials.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] px-4 font-sans relative overflow-hidden text-[#0c0d0f]">
      {/* Ambient Studio Lighting Canvas */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-[15%] -left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-200/25 via-purple-100/15 to-transparent blur-[140px] animate-pulse-soft" />
        <div className="absolute top-[20%] -right-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-bl from-teal-200/20 via-emerald-100/15 to-transparent blur-[140px]" />
        <div className="absolute -bottom-[15%] left-[20%] w-[650px] h-[500px] rounded-full bg-gradient-to-tr from-amber-100/15 via-rose-50/10 to-transparent blur-[150px]" />
        <div className="absolute inset-0 bg-topo-pattern opacity-[0.035]" />
      </div>

      <div className="w-full max-w-md animate-fade-in-up relative z-10 space-y-6">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-3 rounded-2xl bg-white/90 border border-black/[0.06] shadow-sm">
            <Image src="/logo/tadbeer-logo.png" alt="Tadbeer" width={160} height={160} className="object-contain h-12 w-auto" priority />
          </div>
          <div>
            <h1 className="text-xl font-light text-black tracking-tight flex items-center justify-center gap-2 font-display">
              <Lock className="h-4 w-4 text-black" /> Administrative Access
            </h1>
            <p className="text-xs text-[#6b7280] font-light font-body mt-1">
              Protected CRM Workspace • Authorized Personnel Only
            </p>
          </div>
        </div>

        <Card className="bg-white/85 border-black/[0.06] text-[#0c0d0f] shadow-2xl backdrop-blur-2xl rounded-3xl">
          <CardContent className="p-7">
            <form onSubmit={handleLogin} className="space-y-4 font-body">
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs border border-red-200 animate-slide-in-down font-normal">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wider block">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="bg-[#f5f5f7]/80 hover:bg-[#ebebee] focus:bg-white border-black/[0.06] text-[#0c0d0f] text-xs h-10 rounded-xl focus:border-black/[0.2] transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wider block">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="bg-[#f5f5f7]/80 hover:bg-[#ebebee] focus:bg-white border-black/[0.06] text-[#0c0d0f] text-xs h-10 rounded-xl focus:border-black/[0.2] transition-all"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-10 bg-black hover:bg-neutral-800 text-white font-normal text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-98"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying Credentials...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" /> Authenticate Account
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
