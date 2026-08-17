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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 font-sans relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in-up relative z-10 space-y-6">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-xl">
            <Image src="/logo/tadbeer-logo.png" alt="Tadbeer" width={160} height={160} className="object-contain h-14 w-auto brightness-200" priority />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <Lock className="h-4 w-4 text-teal-400" /> Administrative Access Required
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Protected CRM Workspace • Authorized Personnel Only
            </p>
          </div>
        </div>

        <Card className="bg-slate-800/90 border-slate-700/80 text-white shadow-2xl backdrop-blur-md rounded-3xl">
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-500/10 text-red-300 text-xs border border-red-500/20 animate-slide-in-down font-medium">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Admin Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tadbeertt.com"
                  required
                  className="bg-slate-900/90 border-slate-700 text-white text-xs h-10 rounded-xl focus:border-teal-500 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="bg-slate-900/90 border-slate-700 text-white text-xs h-10 rounded-xl focus:border-teal-500 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-10 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
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
