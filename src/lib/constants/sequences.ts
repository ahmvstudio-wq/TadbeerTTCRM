export type SequenceTrack = "cold_cadence" | "conversation";

export type ProspectPersona =
  | "owner_founder"
  | "clinical_doctor"
  | "marketing_ops"
  | "corporate_executive";

export type ReplySentiment =
  | "interested"
  | "audit_requested"
  | "question_pricing"
  | "busy_timing"
  | "objection_agency"
  | "ready_to_meet";

export interface PersonaConfig {
  id: ProspectPersona;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

export const PROSPECT_PERSONAS: Record<ProspectPersona, PersonaConfig> = {
  owner_founder: {
    id: "owner_founder",
    label: "Business Owner / Founder",
    shortLabel: "Founder",
    icon: "👑",
    description: "Decisive, focused on revenue growth, customer conversion, and saving founder time.",
  },
  clinical_doctor: {
    id: "clinical_doctor",
    label: "Doctor / Clinical MD",
    shortLabel: "Doctor",
    icon: "🩺",
    description: "Values clinical reputation, ethical patient care, and reducing reception friction.",
  },
  marketing_ops: {
    id: "marketing_ops",
    label: "Marketing / Operations Manager",
    shortLabel: "Manager",
    icon: "📊",
    description: "Process-oriented, metrics-driven, focused on conversion rates and inquiry response time.",
  },
  corporate_executive: {
    id: "corporate_executive",
    label: "Executive / Corporate Director",
    shortLabel: "Executive",
    icon: "🏢",
    description: "High-level strategic focus, corporate training levy compliance, ROI, and governance.",
  },
};

export interface ReplySentimentConfig {
  id: ReplySentiment;
  label: string;
  shortLabel: string;
  icon: string;
  defaultDelay: number;
  nextStep: string;
  description: string;
}

export const REPLY_SENTIMENTS: Record<ReplySentiment, ReplySentimentConfig> = {
  interested: {
    id: "interested",
    label: "Interested / Positive",
    shortLabel: "Interested",
    icon: "✨",
    defaultDelay: 1,
    nextStep: "Polite Slide-In & Discovery",
    description: "Prospect is curious and welcoming. Politely slide in to learn their current setup.",
  },
  audit_requested: {
    id: "audit_requested",
    label: "Audit Requested",
    shortLabel: "Audit Req",
    icon: "📋",
    defaultDelay: 2,
    nextStep: "Deliver Audit Breakdown",
    description: "Prospect agreed to review the outside-in digital/growth audit.",
  },
  question_pricing: {
    id: "question_pricing",
    label: "Asking Questions / Pricing",
    shortLabel: "Pricing/Questions",
    icon: "💬",
    defaultDelay: 1,
    nextStep: "Consultative Answer & Bridge",
    description: "Prospect asked about service scope, pricing, or company location.",
  },
  busy_timing: {
    id: "busy_timing",
    label: "Busy / Check Later",
    shortLabel: "Check Later",
    icon: "⏳",
    defaultDelay: 3,
    nextStep: "Gentle Check-In Note",
    description: "Prospect is temporarily occupied; follow up with courtesy at agreed timing.",
  },
  objection_agency: {
    id: "objection_agency",
    label: "Has Agency / Objection",
    shortLabel: "Has Agency",
    icon: "🛡️",
    defaultDelay: 2,
    nextStep: "Value Comparison & ROI Gap",
    description: "Currently working with another agency or vendor; highlight complementary ROI gaps.",
  },
  ready_to_meet: {
    id: "ready_to_meet",
    label: "Ready to Meet / Call",
    shortLabel: "Ready to Meet",
    icon: "☕",
    defaultDelay: 1,
    nextStep: "Confirm Coffee / Call Time",
    description: "Prospect welcomed an in-person coffee in Muscat or a discovery phone call.",
  },
};

export interface StageDefinition {
  num: number;
  key: string;
  label: string;
  shortLabel: string;
  delay: string;
  nextStep: string;
  nextDelayDays: number;
  badge: string;
}

export const COLD_CADENCE_STAGES: Record<number, StageDefinition> = {
  1: {
    num: 1,
    key: "greeting",
    label: "Stage 1: Greeting Sent",
    shortLabel: "Greeting Sent",
    delay: "Start",
    nextStep: "Value Check-in",
    nextDelayDays: 2,
    badge: "Initial Touch",
  },
  2: {
    num: 2,
    key: "value_check",
    label: "Stage 2: Value Check-in",
    shortLabel: "Value Check-in",
    delay: "+2 Days",
    nextStep: "Audit Offer",
    nextDelayDays: 3,
    badge: "Follow-up 1",
  },
  3: {
    num: 3,
    key: "audit_offer",
    label: "Stage 3: Audit Offer",
    shortLabel: "Audit Offer",
    delay: "+3 Days",
    nextStep: "Coffee / Call Proposed",
    nextDelayDays: 5,
    badge: "Follow-up 2",
  },
  4: {
    num: 4,
    key: "coffee_call",
    label: "Stage 4: Coffee / Call Proposed",
    shortLabel: "Coffee / Call",
    delay: "+5 Days",
    nextStep: "Decision / Re-engagement",
    nextDelayDays: 5,
    badge: "Follow-up 3",
  },
};

export const CONVERSATION_STAGES: Record<number, StageDefinition> = {
  1: {
    num: 1,
    key: "reply_ack",
    label: "Stage 1: Reply Received — Slide In",
    shortLabel: "Reply Received",
    delay: "Day 0-1",
    nextStep: "Context & Discovery Question",
    nextDelayDays: 1,
    badge: "Polite Slide-In",
  },
  2: {
    num: 2,
    key: "discovery",
    label: "Stage 2: Context & Discovery",
    shortLabel: "Context & Discovery",
    delay: "+1-2 Days",
    nextStep: "Tailored Value / Audit Review",
    nextDelayDays: 2,
    badge: "Discovery & Rapport",
  },
  3: {
    num: 3,
    key: "value_delivery",
    label: "Stage 3: Value & Audit Review",
    shortLabel: "Value & Audit",
    delay: "+2-3 Days",
    nextStep: "Coffee / Discovery Meeting Close",
    nextDelayDays: 2,
    badge: "Deliver Insights",
  },
  4: {
    num: 4,
    key: "meeting_close",
    label: "Stage 4: Coffee / Meeting Close",
    shortLabel: "Meeting Close",
    delay: "+2-3 Days",
    nextStep: "Confirm Time & Location in Muscat",
    nextDelayDays: 1,
    badge: "Lock In Coffee",
  },
};

/**
 * Resolves whether a lead is on the Cold Cadence or the Active Conversation track.
 */
export function resolveSequenceTrack(company: any): SequenceTrack {
  if (!company) return "cold_cadence";

  const rJson = company.research_json || {};
  if (rJson.sequence_track === "conversation") return "conversation";
  if (rJson.sequence_track === "cold_cadence") return "cold_cadence";

  const status = String(company.status || "").toLowerCase().trim();
  const pStage = String(company.pipeline_stage || "").toLowerCase().trim();

  const conversationStatuses = [
    "reply_received",
    "warm_up",
    "opening_identified",
    "audit_requested",
    "audit_sent",
    "booking_link_sent",
    "portfolio_shared",
    "objection",
    "agency_existing",
    "meeting_booked",
    "opportunity",
  ];

  if (conversationStatuses.includes(status)) {
    return "conversation";
  }

  if (
    pStage.includes("replied") ||
    pStage.includes("conversation") ||
    pStage.includes("audit request") ||
    pStage.includes("meeting booked") ||
    pStage.includes("objection") ||
    pStage.includes("booking link")
  ) {
    return "conversation";
  }

  return "cold_cadence";
}

/**
 * Generates natural, context-aware conversational copy tailored to persona and reply sentiment.
 */
export function generateConversationScript(params: {
  stage: number;
  persona?: ProspectPersona;
  replySentiment?: ReplySentiment;
  companyName: string;
  contactName?: string;
  specificObservation?: string;
  area?: string;
  channel?: string;
}): string {
  const {
    stage,
    persona = "owner_founder",
    replySentiment = "interested",
    companyName,
    contactName = "there",
    specificObservation = "your recent business operations",
    area = "Muscat",
    channel = "whatsapp",
  } = params;

  const firstName = contactName && contactName.trim() && contactName !== "Decision Maker" && contactName !== "there"
    ? contactName.split(" ")[0]
    : "there";

  const isDoctor = persona === "clinical_doctor";
  const salutation = isDoctor ? `Dr ${firstName}` : `Ahlan ${firstName !== "there" ? firstName : ""}`.trim();

  // Stage 1: Immediate polite slide-in upon reply
  if (stage === 1) {
    if (replySentiment === "audit_requested") {
      return `${salutation}, appreciate the response! We actually put together a 1-page outside-in audit on ${companyName}'s customer acquisition journey in ${area}. Would you prefer I share a brief 2-minute overview right here on ${channel === "instagram_dm" ? "Instagram" : "WhatsApp"}, or send across the PDF summary?`;
    }
    if (replySentiment === "question_pricing") {
      return `${salutation}, thanks for checking in. Our engagements typically range depending on whether you need a quick audit implementation or a complete workflow buildout. Rather than throwing out arbitrary numbers, I want to make sure I understand ${companyName}'s current setup. Are you primarily looking to solve customer inquiry response time or scale booked sales?`;
    }
    if (replySentiment === "busy_timing") {
      return `${salutation}, completely understand — running operations at ${companyName} keeps schedules full. I will make a note to check back with you in a couple of weeks. If anything comes up before then, feel free to reach out anytime.`;
    }
    if (replySentiment === "objection_agency") {
      return `${salutation}, completely understand! Having an existing agency handling marketing is great, and I am certainly not suggesting replacing them. I was more curious whether you are seeing those ad campaigns turn into direct, repeat booked customers without manual follow-up friction. Happy to share a quick perspective if useful.`;
    }
    if (replySentiment === "ready_to_meet") {
      return `${salutation}, that would be fantastic. Can I buy you a quick 15-minute coffee this Wednesday or Thursday in ${area} to review ${companyName}'s growth opportunities in person? Which day suits you best?`;
    }

    // Default 'interested'
    if (isDoctor) {
      return `Ahlan Dr ${firstName}, thank you for getting back to me — I know patient consultations take full priority. When looking at ${companyName}'s patient flow, are you seeing most cosmetic/specialist patients come through Google search, or primarily Instagram and word-of-mouth?`;
    }
    if (persona === "marketing_ops") {
      return `Ahlan ${firstName}, appreciate you getting back to me! To make sure I only share insights that are directly useful for ${companyName}, what is the biggest friction point your team experiences right now — inquiry response lag or lead qualification?`;
    }
    return `Assalamu Alaikum ${firstName !== "there" ? firstName : ""}, appreciate you getting back to me! Completely understand how busy things get with ${companyName}. To make sure I share what is genuinely relevant, do most of your prospective customers reach out via ${channel === "instagram_dm" ? "Instagram DM" : "WhatsApp"}, or find you through search?`;
  }

  // Stage 2: Context & Pain Discovery
  if (stage === 2) {
    if (isDoctor) {
      return `Dr ${firstName}, that makes total sense. We frequently see clinics in Muscat losing 20-30% of high-intent patient inquiries because reception gets tied up during busy clinic hours. Have you noticed any leakage with patient messages going unanswered during peak times?`;
    }
    if (persona === "marketing_ops") {
      return `${firstName}, makes complete sense. We analyzed lead velocity across comparable businesses in Oman, and found that responding within 5 minutes versus 30 minutes increases appointment conversion by over 3x. Are you currently tracking your inquiry drop-off rate?`;
    }
    return `${salutation}, that is very common across businesses in ${area}. The challenge most founders face is spending hours manually answering repetitive inquiries every evening instead of having an automated qualifier. Is that something taking up your team's time as well?`;
  }

  // Stage 3: Value & Audit Delivery
  if (stage === 3) {
    return `${salutation}, based on what you shared, we compiled a tailored 1-page breakdown of how ${companyName} can streamline this and capture more revenue. Happy to share the key takeaways. Are you open to reviewing it?`;
  }

  // Stage 4: Coffee / Meeting Close
  return `${salutation}, would you have 10-15 minutes for a quick coffee this week in ${area} or a direct call so we can walk you through the practical takeaways for ${companyName}? Let me know if Wednesday or Thursday afternoon works best for you.`;
}
