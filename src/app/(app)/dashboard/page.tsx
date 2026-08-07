import { TealCRMDashboardClient } from "./client-page";
import { getDashboardStats, getRecentActivity } from "@/lib/actions/dashboard";
import { getCompanies } from "@/lib/actions/companies";
import { getCallQueue } from "@/lib/actions/calls";
import { getFollowUps } from "@/lib/actions/followups";
import { getMeetings } from "@/lib/actions/meetings";
import { getOpportunities } from "@/lib/actions/opportunities";
import { getLinkedInProspects } from "@/lib/actions/linkedin";
import { getAllLeadsForPipeline } from "@/lib/actions/ig-dm";

export default async function TealCRMDashboardPage() {
  const [
    statsRes,
    activityRes,
    compRes,
    callsRes,
    fuRes,
    meetingsRes,
    oppsRes,
    liRes,
    outreachRes
  ] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(15),
    getCompanies(),
    getCallQueue(),
    getFollowUps("pending"),
    getMeetings("upcoming"),
    getOpportunities(),
    getLinkedInProspects(),
    getAllLeadsForPipeline("all")
  ]);

  const initialData = {
    stats: statsRes.data || null,
    activity: activityRes.data || [],
    companies: compRes.data || [],
    calls: callsRes.data || [],
    followUpsList: fuRes.data || [],
    meetingsList: meetingsRes.data || [],
    opportunitiesList: oppsRes.data || [],
    linkedinProspects: liRes.data || [],
    outreachLeads: outreachRes.data || [],
  };

  return <TealCRMDashboardClient initialData={initialData} />;
}
