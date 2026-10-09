"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CadenceFollowUpsClient } from "./client-page";

export default function FollowUpsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/outreach?tab=followups");
  }, [router]);

  return <CadenceFollowUpsClient />;
}
