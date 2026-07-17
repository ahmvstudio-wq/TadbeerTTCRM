"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

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
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) setError(authError.message);
      else { router.push("/dashboard"); router.refresh(); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="flex justify-center mb-8 animate-bounce-in">
          <Image src="/logo/tadbeer-logo.png" alt="Tadbeer" width={160} height={160} className="object-contain h-28 w-auto" priority />
        </div>

        <Card className="hover-lift">
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200 animate-slide-in-down">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="transition-all duration-200 focus:scale-[1.01]" />
              </div>
              <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="transition-all duration-200 focus:scale-[1.01]" />
              </div>
              <div className="animate-fade-in" style={{ animationDelay: "300ms" }}>
                <Button type="submit" className="w-full bg-brand-teal hover:bg-brand-teal-dark text-white hover-lift press-effect" disabled={loading}>
                  {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in...</>) : "Sign In"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
