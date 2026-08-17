"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UnifiedLeadWorkspace } from "@/components/workspace/unified-lead-workspace";

export default function ProspectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center gap-3">
        <Link
          href="/prospects"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-base font-extrabold text-slate-900">Prospect Profile & Workspace</h1>
          <p className="text-xs text-slate-500 font-medium">Single source of truth for this company</p>
        </div>
      </div>

      <UnifiedLeadWorkspace companyId={id} currentUser="Ramij" />
    </div>
  );
}
