import { CadenceFollowUpsClient } from "./client-page";
import { getCadenceFollowUps } from "@/lib/actions/followups";

export const dynamic = "force-dynamic";

export default async function FollowUpsPage() {
  const res = await getCadenceFollowUps();
  const initialItems = res.data || [];

  return <CadenceFollowUpsClient initialItems={initialItems} />;
}
