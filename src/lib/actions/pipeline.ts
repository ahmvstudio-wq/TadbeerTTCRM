"use server";

import { getSupabaseAdminClient } from "@/lib/supabase/config";
import { revalidatePath } from "next/cache";
import type {
  PipelineLead,
  PipelineStageKey,
  DemoStatus,
  PresentationStatus,
  ProposalStatus,
  PipelineFollowUpStatus,
  DemoUrlItem,
  PipelineStageSummary,
  PipelineIntelligenceMetrics,
} from "@/lib/types/pipeline";

// ─── CANONICAL STAGE RESOLUTION ───────────────────────────────────────────────
export function resolveCanonicalStage(company: any): PipelineStageKey {
  const rJson = company.research_json || {};
  if (rJson.pipeline_stage) {
    const raw = String(rJson.pipeline_stage).toLowerCase().trim();
    if (raw === "outreach" || raw === "meeting" || raw === "demo" || raw === "proposal" || raw === "follow_up" || raw === "won" || raw === "lost") {
      return raw as PipelineStageKey;
    }
  }

  const pStage = String(company.pipeline_stage || "").toLowerCase();
  const dbStatus = String(company.status || "").toLowerCase();
  const leadStatus = String(company.lead_status || "").toLowerCase();

  // Won check
  if (dbStatus === "won" || leadStatus === "won" || pStage.includes("won")) {
    return "won";
  }

  // Lost / Dormant check
  if (
    dbStatus === "lost" ||
    leadStatus === "lost" ||
    leadStatus === "archived" ||
    dbStatus === "dormant" ||
    pStage.includes("lost") ||
    pStage.includes("dormant")
  ) {
    return "lost";
  }

  // Demo / Presentation check
  if (
    pStage.includes("demo") ||
    pStage.includes("presentation") ||
    rJson.demo_status === "in_progress" ||
    rJson.demo_status === "required" ||
    (rJson.demo_urls && rJson.demo_urls.length > 0)
  ) {
    return "demo";
  }

  // Proposal check
  if (
    pStage.includes("proposal") ||
    pStage.includes("quotation") ||
    pStage.includes("mou") ||
    leadStatus.includes("proposal") ||
    rJson.proposal_status === "sent" ||
    rJson.proposal_status === "drafting"
  ) {
    return "proposal";
  }

  // Follow-up / Negotiation check
  if (
    pStage.includes("negotiation") ||
    pStage.includes("follow-up") ||
    leadStatus.includes("negotiation") ||
    rJson.follow_up_status === "required" ||
    rJson.follow_up_status === "waiting_response"
  ) {
    return "follow_up";
  }

  // Meeting check
  if (
    dbStatus === "meeting_booked" ||
    leadStatus.includes("meeting") ||
    pStage.includes("meeting") ||
    pStage.includes("coffee")
  ) {
    return "meeting";
  }

  // Default to outreach
  return "outreach";
}

// ─── STAGE LABELS & DB MAPPING ────────────────────────────────────────────────
export function getDbMappingsForStage(stage: PipelineStageKey): {
  status: "prospect" | "contacted" | "in_call_queue" | "meeting_booked" | "opportunity" | "won" | "lost";
  pipeline_stage: string;
  lead_status: "New" | "Contacted" | "Qualified" | "Meeting Booked" | "Proposal Sent" | "Negotiation" | "Won" | "Lost";
} {
  switch (stage) {
    case "outreach":
      return {
        status: "contacted",
        pipeline_stage: "Contacted",
        lead_status: "Contacted",
      };
    case "meeting":
      return {
        status: "meeting_booked",
        pipeline_stage: "Meeting Booked",
        lead_status: "Meeting Booked",
      };
    case "demo":
      return {
        status: "meeting_booked",
        pipeline_stage: "Demo / Presentation",
        lead_status: "Qualified",
      };
    case "proposal":
      return {
        status: "opportunity",
        pipeline_stage: "Proposal Sent",
        lead_status: "Proposal Sent",
      };
    case "follow_up":
      return {
        status: "opportunity",
        pipeline_stage: "Follow-up / Negotiation",
        lead_status: "Negotiation",
      };
    case "won":
      return {
        status: "won",
        pipeline_stage: "Won",
        lead_status: "Won",
      };
    case "lost":
      return {
        status: "lost",
        pipeline_stage: "Lost",
        lead_status: "Lost",
      };
  }
}

// ─── GET ALL PIPELINE DATA ───────────────────────────────────────────────────
export async function getPipelineOverview(): Promise<{
  leads: PipelineLead[];
  stageSummaries: Record<PipelineStageKey, PipelineStageSummary>;
  metrics: PipelineIntelligenceMetrics;
  error?: string;
}> {
  try {
    const sb = getSupabaseAdminClient();
    const todayStr = new Date().toISOString().split("T")[0];
    const todayDate = new Date(todayStr);

    // 1. Fetch Companies
    const { data: companies, error: compErr } = await sb
      .from("companies")
      .select("*")
      .order("updated_at", { ascending: false });

    if (compErr || !companies) {
      console.error("Error fetching companies for pipeline:", compErr);
      return {
        leads: [],
        stageSummaries: {
          outreach: { stage: "outreach", count: 0, totalValue: 0 },
          meeting: { stage: "meeting", count: 0, totalValue: 0 },
          demo: { stage: "demo", count: 0, totalValue: 0 },
          proposal: { stage: "proposal", count: 0, totalValue: 0 },
          follow_up: { stage: "follow_up", count: 0, totalValue: 0 },
          won: { stage: "won", count: 0, totalValue: 0 },
          lost: { stage: "lost", count: 0, totalValue: 0 },
        },
        metrics: {
          totalLeads: 0,
          overdueCount: 0,
          todayCount: 0,
          upcomingCount: 0,
          waitingResponseCount: 0,
          waitingDemoCount: 0,
          waitingProposalCount: 0,
          needsActionCount: 0,
        },
        error: compErr?.message || "Failed to load companies",
      };
    }

    // 2. Fetch primary contacts
    const { data: contacts } = await sb
      .from("contacts")
      .select("*")
      .order("is_primary", { ascending: false });

    const contactMap = new Map<string, any>();
    contacts?.forEach((c) => {
      if (!contactMap.has(c.company_id)) {
        contactMap.set(c.company_id, c);
      }
    });

    // 3. Fetch pending follow-ups
    const { data: followUps } = await sb
      .from("follow_ups")
      .select("*")
      .eq("status", "pending")
      .order("due_date", { ascending: true });

    const fuMap = new Map<string, any>();
    followUps?.forEach((fu) => {
      if (!fuMap.has(fu.company_id)) {
        fuMap.set(fu.company_id, fu);
      }
    });

    // 4. Fetch recent activities
    const { data: activities } = await sb
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false });

    const actMap = new Map<string, any>();
    activities?.forEach((act) => {
      if (!actMap.has(act.company_id)) {
        actMap.set(act.company_id, act);
      }
    });

    // 5. Build Pipeline Leads
    const leads: PipelineLead[] = [];
    const stageSummaries: Record<PipelineStageKey, PipelineStageSummary> = {
      outreach: { stage: "outreach", count: 0, totalValue: 0 },
      meeting: { stage: "meeting", count: 0, totalValue: 0 },
      demo: { stage: "demo", count: 0, totalValue: 0 },
      proposal: { stage: "proposal", count: 0, totalValue: 0 },
      follow_up: { stage: "follow_up", count: 0, totalValue: 0 },
      won: { stage: "won", count: 0, totalValue: 0 },
      lost: { stage: "lost", count: 0, totalValue: 0 },
    };

    let overdueCount = 0;
    let todayCount = 0;
    let upcomingCount = 0;
    let waitingResponseCount = 0;
    let waitingDemoCount = 0;
    let waitingProposalCount = 0;
    let needsActionCount = 0;

    for (const c of companies) {
      const canonicalStage = resolveCanonicalStage(c);
      const rJson = c.research_json || {};
      const primaryContact = contactMap.get(c.id) || null;
      const pendingFu = fuMap.get(c.id) || null;
      const lastAct = actMap.get(c.id) || null;

      // Calculate follow-up timing
      let isOverdue = false;
      let isToday = false;
      let daysDiff = 0;
      let formattedFu: PipelineLead["next_follow_up"] = null;

      const effectiveDueDate = pendingFu?.due_date || rJson.action_due_date || null;

      if (effectiveDueDate) {
        const dueDate = new Date(effectiveDueDate);
        const timeDiff = dueDate.getTime() - todayDate.getTime();
        daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        isOverdue = daysDiff < 0;
        isToday = daysDiff === 0;

        formattedFu = {
          id: pendingFu?.id || `fu-${c.id}`,
          due_date: effectiveDueDate,
          due_time: pendingFu?.due_time || null,
          subject: pendingFu?.subject || `Action for ${c.company_name}`,
          channel: pendingFu?.channel || "meeting",
          status: pendingFu?.status || "pending",
          is_overdue: isOverdue,
          is_today: isToday,
          days_diff: daysDiff,
        };
      }

      const nextActionText = rJson.next_action || (pendingFu ? pendingFu.description : null);
      const hasAction = Boolean(nextActionText && nextActionText.trim().length > 0);
      const needsAction = !hasAction && canonicalStage !== "won" && canonicalStage !== "lost";

      const demoStatus: DemoStatus = rJson.demo_status || (canonicalStage === "demo" ? "in_progress" : "none");
      const presentationStatus: PresentationStatus = rJson.presentation_status || "none";
      const proposalStatus: ProposalStatus = rJson.proposal_status || (canonicalStage === "proposal" ? "sent" : "none");
      const followUpStatus: PipelineFollowUpStatus = rJson.follow_up_status || (isOverdue ? "required" : "none");

      const demoUrls: DemoUrlItem[] = Array.isArray(rJson.demo_urls) ? rJson.demo_urls : [];
      const presentationUrls: DemoUrlItem[] = Array.isArray(rJson.presentation_urls) ? rJson.presentation_urls : [];

      if (isOverdue && canonicalStage !== "won" && canonicalStage !== "lost") overdueCount++;
      if (isToday && canonicalStage !== "won" && canonicalStage !== "lost") todayCount++;
      if (daysDiff > 0 && canonicalStage !== "won" && canonicalStage !== "lost") upcomingCount++;
      if (followUpStatus === "waiting_response" || c.status === "contacted") waitingResponseCount++;
      if (demoStatus === "in_progress" || demoStatus === "required") waitingDemoCount++;
      if (proposalStatus === "sent" || proposalStatus === "drafting") waitingProposalCount++;
      if (needsAction || hasAction) needsActionCount++;

      const estValue = Number(c.est_deal_value) || 0;
      stageSummaries[canonicalStage].count += 1;
      stageSummaries[canonicalStage].totalValue += estValue;

      leads.push({
        id: c.id,
        company_name: c.company_name,
        industry: c.industry || null,
        category: c.category || null,
        website: c.website || null,
        linkedin_url: c.linkedin_url || null,
        phone: c.phone || null,
        email: c.email || null,
        status: c.status,
        pipeline_stage_raw: c.pipeline_stage || null,
        canonical_stage: canonicalStage,
        lead_status: c.lead_status || null,
        assigned_to: c.assigned_to || null,
        assigned_bdm: c.assigned_bdm || rJson.owner || "Ramij",
        owner_name: c.assigned_bdm || rJson.owner || "Ramij",
        primary_contact: primaryContact
          ? {
              id: primaryContact.id,
              full_name: primaryContact.full_name,
              title: primaryContact.title,
              phone: primaryContact.phone,
              whatsapp: primaryContact.whatsapp,
              email: primaryContact.email,
              linkedin_url: primaryContact.linkedin_url,
            }
          : null,
        next_action: nextActionText,
        action_due_date: effectiveDueDate,
        demo_status: demoStatus,
        presentation_status: presentationStatus,
        proposal_status: proposalStatus,
        follow_up_status: followUpStatus,
        demo_urls: demoUrls,
        presentation_urls: presentationUrls,
        last_activity: lastAct
          ? {
              type: lastAct.activity_type,
              title: lastAct.title,
              description: lastAct.description,
              created_at: lastAct.created_at,
            }
          : null,
        next_follow_up: formattedFu,
        is_overdue: isOverdue,
        is_today: isToday,
        needs_action: needsAction,
        notes: c.notes || null,
        est_deal_value: estValue,
        created_at: c.created_at,
        updated_at: c.updated_at,
        mgmt_highlight: Boolean(rJson.mgmt_highlight),
      });
    }

    return {
      leads,
      stageSummaries,
      metrics: {
        totalLeads: leads.length,
        overdueCount,
        todayCount,
        upcomingCount,
        waitingResponseCount,
        waitingDemoCount,
        waitingProposalCount,
        needsActionCount,
      },
    };
  } catch (err: any) {
    console.error("Pipeline overview error:", err);
    return {
      leads: [],
      stageSummaries: {
        outreach: { stage: "outreach", count: 0, totalValue: 0 },
        meeting: { stage: "meeting", count: 0, totalValue: 0 },
        demo: { stage: "demo", count: 0, totalValue: 0 },
        proposal: { stage: "proposal", count: 0, totalValue: 0 },
        follow_up: { stage: "follow_up", count: 0, totalValue: 0 },
        won: { stage: "won", count: 0, totalValue: 0 },
        lost: { stage: "lost", count: 0, totalValue: 0 },
      },
      metrics: {
        totalLeads: 0,
        overdueCount: 0,
        todayCount: 0,
        upcomingCount: 0,
        waitingResponseCount: 0,
        waitingDemoCount: 0,
        waitingProposalCount: 0,
        needsActionCount: 0,
      },
      error: err?.message || "Failed to load pipeline data",
    };
  }
}

// ─── UPDATE LEAD STAGE ───────────────────────────────────────────────────────
export async function updatePipelineLeadStage(
  companyId: string,
  newStage: PipelineStageKey,
  nextAction?: string,
  nextFollowUpDate?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = getSupabaseAdminClient();

    // 1. Fetch current record
    const { data: currentCo, error: fetchErr } = await sb
      .from("companies")
      .select("id, company_name, research_json, pipeline_stage, status")
      .eq("id", companyId)
      .single();

    if (fetchErr || !currentCo) {
      return { success: false, error: "Company not found" };
    }

    const mapping = getDbMappingsForStage(newStage);
    const existingRJson = currentCo.research_json || {};

    const updatedRJson = {
      ...existingRJson,
      pipeline_stage: newStage,
      ...(nextAction !== undefined ? { next_action: nextAction } : {}),
      ...(nextFollowUpDate !== undefined ? { action_due_date: nextFollowUpDate } : {}),
      last_stage_changed_at: new Date().toISOString(),
    };

    // 2. Update company
    const { error: updateErr } = await sb
      .from("companies")
      .update({
        status: mapping.status,
        pipeline_stage: mapping.pipeline_stage,
        lead_status: mapping.lead_status,
        research_json: updatedRJson,
        updated_at: new Date().toISOString(),
      })
      .eq("id", companyId);

    if (updateErr) {
      console.error("Error updating company stage:", updateErr);
      return { success: false, error: updateErr.message };
    }

    // 3. If next follow-up date given, schedule/update follow-up
    if (nextFollowUpDate) {
      const { data: existingFu } = await sb
        .from("follow_ups")
        .select("id")
        .eq("company_id", companyId)
        .eq("status", "pending");

      if (existingFu && existingFu.length > 0) {
        await sb
          .from("follow_ups")
          .update({
            due_date: nextFollowUpDate,
            description: nextAction || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingFu[0].id);
      } else {
        await sb.from("follow_ups").insert({
          company_id: companyId,
          due_date: nextFollowUpDate,
          subject: `[${mapping.pipeline_stage}] Action for ${currentCo.company_name}`,
          description: nextAction || `Follow-up in ${mapping.pipeline_stage} stage`,
          channel: "meeting",
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    // 4. Log Activity
    await sb.from("activities").insert({
      company_id: companyId,
      activity_type: "opportunity_stage_changed",
      title: `Moved to ${mapping.pipeline_stage}`,
      description: nextAction ? `Next Action: ${nextAction}` : `Stage advanced to ${mapping.pipeline_stage}`,
      metadata: { newStage, nextAction, nextFollowUpDate },
      created_at: new Date().toISOString(),
    });

    revalidatePath("/pipeline");
    revalidatePath("/follow-ups");
    revalidatePath("/prospects");

    return { success: true };
  } catch (err: any) {
    console.error("Error in updatePipelineLeadStage:", err);
    return { success: false, error: err?.message || "Failed to update pipeline stage" };
  }
}

// ─── UPDATE LEAD ACTION & DEMO DETAILS ─────────────────────────────────────────
export async function updatePipelineLeadDetails(
  companyId: string,
  payload: {
    nextAction?: string;
    actionDueDate?: string;
    demoStatus?: DemoStatus;
    presentationStatus?: PresentationStatus;
    proposalStatus?: ProposalStatus;
    followUpStatus?: PipelineFollowUpStatus;
    demoUrls?: DemoUrlItem[];
    presentationUrls?: DemoUrlItem[];
    assignedBdm?: string;
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = getSupabaseAdminClient();

    const { data: currentCo, error: fetchErr } = await sb
      .from("companies")
      .select("id, company_name, notes, research_json, assigned_bdm")
      .eq("id", companyId)
      .single();

    if (fetchErr || !currentCo) {
      return { success: false, error: "Company not found" };
    }

    const existingRJson = currentCo.research_json || {};
    const updatedRJson = {
      ...existingRJson,
      ...(payload.nextAction !== undefined ? { next_action: payload.nextAction } : {}),
      ...(payload.actionDueDate !== undefined ? { action_due_date: payload.actionDueDate } : {}),
      ...(payload.demoStatus !== undefined ? { demo_status: payload.demoStatus } : {}),
      ...(payload.presentationStatus !== undefined ? { presentation_status: payload.presentationStatus } : {}),
      ...(payload.proposalStatus !== undefined ? { proposal_status: payload.proposalStatus } : {}),
      ...(payload.followUpStatus !== undefined ? { follow_up_status: payload.followUpStatus } : {}),
      ...(payload.demoUrls !== undefined ? { demo_urls: payload.demoUrls } : {}),
      ...(payload.presentationUrls !== undefined ? { presentation_urls: payload.presentationUrls } : {}),
      ...(payload.assignedBdm !== undefined ? { owner: payload.assignedBdm } : {}),
      last_updated: new Date().toISOString(),
    };

    const updateFields: any = {
      research_json: updatedRJson,
      updated_at: new Date().toISOString(),
    };

    if (payload.assignedBdm !== undefined) {
      updateFields.assigned_bdm = payload.assignedBdm;
    }
    if (payload.notes !== undefined) {
      updateFields.notes = payload.notes;
    }

    const { error: updateErr } = await sb
      .from("companies")
      .update(updateFields)
      .eq("id", companyId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Update follow-up schedule if date specified
    if (payload.actionDueDate) {
      const { data: existingFu } = await sb
        .from("follow_ups")
        .select("id")
        .eq("company_id", companyId)
        .eq("status", "pending");

      if (existingFu && existingFu.length > 0) {
        await sb
          .from("follow_ups")
          .update({
            due_date: payload.actionDueDate,
            description: payload.nextAction || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingFu[0].id);
      } else {
        await sb.from("follow_ups").insert({
          company_id: companyId,
          due_date: payload.actionDueDate,
          subject: `Action for ${currentCo.company_name}`,
          description: payload.nextAction || "Pipeline follow-up action",
          channel: "meeting",
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    // Log Activity
    await sb.from("activities").insert({
      company_id: companyId,
      activity_type: "note",
      title: "Pipeline Action & Demo Details Updated",
      description: payload.nextAction ? `Next Action: ${payload.nextAction}` : "Updated demo and presentation details",
      metadata: payload,
      created_at: new Date().toISOString(),
    });

    revalidatePath("/pipeline");
    revalidatePath("/follow-ups");

    return { success: true };
  } catch (err: any) {
    console.error("Error in updatePipelineLeadDetails:", err);
    return { success: false, error: err?.message || "Failed to update details" };
  }
}
