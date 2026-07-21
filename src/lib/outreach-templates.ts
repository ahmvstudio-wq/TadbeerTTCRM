// Message Template System with Placeholders

export interface MessageTemplate {
  id: string;
  name: string;
  channel: "whatsapp" | "linkedin" | "email";
  category: string;
  subject?: string;
  body: string;
  touch_number?: number;
  created_at: string;
}

export const PLACEHOLDERS = [
  { key: "{name}", description: "Contact's full name" },
  { key: "{first_name}", description: "Contact's first name" },
  { key: "{company}", description: "Company name" },
  { key: "{title}", description: "Contact's job title" },
  { key: "{industry}", description: "Company industry" },
  { key: "{city}", description: "Company city" },
  { key: "{country}", description: "Company country" },
  { key: "{service}", description: "Service pillar / offering" },
  { key: "{use_case}", description: "Specific use case" },
  { key: "{bdm}", description: "Assigned BDM name" },
  { key: "{date}", description: "Current date" },
  { key: "{referral_name}", description: "Referral contact name" },
];

export function fillTemplate(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.split(key).join(value || "");
  }
  return result;
}

// ─── Default WhatsApp Templates (5-step sequence) ──────────────────
export const DEFAULT_WHATSAPP_TEMPLATES: MessageTemplate[] = [
  {
    id: "wa-t1", name: "WA Step 1: Introduction", channel: "whatsapp", category: "Cold Outreach",
    touch_number: 1, created_at: "2026-01-01",
    body: `Hi {name} 👋

I came across {company} and was really impressed by your work in {industry}.

I'm {bdm} from Tadbeer TT — we help companies like yours with {service}.

Would you be open to a quick 10-minute chat this week to explore how we might support {company}'s goals?

Best regards`,
  },
  {
    id: "wa-t2", name: "WA Step 2: Value Proposition", channel: "whatsapp", category: "Warm Follow-up",
    touch_number: 2, created_at: "2026-01-01",
    body: `Hi {name},

Following up on my previous message. I wanted to share a quick insight:

Companies in {industry} are seeing 30-40% efficiency gains with the right {service} solutions.

We recently helped a similar company in {city} achieve remarkable results.

Would a 15-minute call this week work for you?`,
  },
  {
    id: "wa-t3", name: "WA Step 3: Case Study Share", channel: "whatsapp", category: "Warm Follow-up",
    touch_number: 3, created_at: "2026-01-01",
    body: `Hi {name},

I thought you might find this interesting — we recently helped a {industry} company similar to {company}:

✅ 40% reduction in operational costs
✅ 3x faster processing times
✅ Full team adoption within 2 weeks

Happy to share the full case study if you're interested. Would that be helpful?`,
  },
  {
    id: "wa-t4", name: "WA Step 4: Follow-up", channel: "whatsapp", category: "Warm Follow-up",
    touch_number: 4, created_at: "2026-01-01",
    body: `Hi {name},

Just checking in — I know things get busy!

I'd love to connect for just 10 minutes to understand what challenges {company} is facing with {service}.

No pressure at all — happy to share some free insights even if we're not the right fit.

Would {date} work?`,
  },
  {
    id: "wa-t5", name: "WA Step 5: Break-up", channel: "whatsapp", category: "Re-engagement",
    touch_number: 5, created_at: "2026-01-01",
    body: `Hi {name},

I've reached out a few times and I don't want to be pushy!

If {service} isn't a priority right now, no worries at all. I'll keep you in mind for future updates.

If anything changes, feel free to reach out anytime. Wishing {company} continued success! 🙏`,
  },
];

// ─── Default LinkedIn Templates (7-touch sequence) ──────────────────
export const DEFAULT_LINKEDIN_TEMPLATES: MessageTemplate[] = [
  {
    id: "li-t1", name: "LI Touch 1: Connection Request", channel: "linkedin", category: "Cold Outreach",
    touch_number: 1, created_at: "2026-01-01",
    body: `Hi {name}, I noticed your work at {company} in {industry}. I'm building relationships with leaders in this space. Would love to connect!`,
  },
  {
    id: "li-t2", name: "LI Touch 2: Welcome Message", channel: "linkedin", category: "Cold Outreach",
    touch_number: 2, created_at: "2026-01-01",
    body: `Thanks for connecting, {name}! I help {industry} companies with {service}. What's the biggest challenge {company} is facing right now?`,
  },
  {
    id: "li-t3", name: "LI Touch 3: Value Share", channel: "linkedin", category: "Warm Follow-up",
    touch_number: 3, created_at: "2026-01-01",
    body: `Hi {name}, I just published a case study on how a {industry} company similar to {company} achieved 40% cost reduction. Thought you might find it interesting!`,
  },
  {
    id: "li-t4", name: "LI Touch 4: Case Study", channel: "linkedin", category: "Warm Follow-up",
    touch_number: 4, created_at: "2026-01-01",
    body: `Hi {name}, following up on my previous message. Here's the case study: [link]. Would love to hear if any of this resonates with what {company} is working on.`,
  },
  {
    id: "li-t5", name: "LI Touch 5: Engagement", channel: "linkedin", category: "Warm Follow-up",
    touch_number: 5, created_at: "2026-01-01",
    body: `Hi {name}, I noticed you shared some interesting content recently. Great perspective! Quick question — is {service} something {company} is actively exploring?`,
  },
  {
    id: "li-t6", name: "LI Touch 6: Break-up", channel: "linkedin", category: "Re-engagement",
    touch_number: 6, created_at: "2026-01-01",
    body: `Hi {name}, I've reached out a few times and don't want to overstep. If {service} isn't a priority right now, no worries. Feel free to reach out anytime!`,
  },
  {
    id: "li-t7", name: "LI Touch 7: Final", channel: "linkedin", category: "Re-engagement",
    touch_number: 7, created_at: "2026-01-01",
    body: `Hi {name}, last message from me! Just wanted to leave you with this: we helped a {industry} company reduce costs by 40%. If that's ever relevant, I'm here. Best wishes to {company}!`,
  },
];

// ─── Default Email Templates ────────────────────────────────────────
export const DEFAULT_EMAIL_TEMPLATES: MessageTemplate[] = [
  {
    id: "em-t1", name: "Email: Introduction", channel: "email", category: "Cold Outreach",
    subject: "Partnership Opportunity — {service} for {company}",
    touch_number: 1, created_at: "2026-01-01",
    body: `Dear {name},

I hope this message finds you well. I'm reaching out because {company}'s work in {industry} caught our attention.

At Tadbeer TT, we specialize in {service}. We've helped organizations in your sector achieve:

• 40% reduction in operational costs
• 3x faster processing times
• Full team adoption within 2 weeks

I'd welcome the opportunity to discuss how we can support {company}'s objectives.

Would a 15-minute call this week work for you?

Best regards,
Tadbeer TT`,
  },
  {
    id: "em-t2", name: "Email: Follow-up", channel: "email", category: "Warm Follow-up",
    subject: "Following up — {service} for {company}",
    touch_number: 2, created_at: "2026-01-01",
    body: `Dear {name},

I wanted to follow up on my previous email. I understand you're busy, so I'll keep this brief.

We recently helped a {industry} company similar to {company} achieve remarkable results. I'd love to share how we might do the same for you.

Would a quick 10-minute chat this week be possible?

Best regards`,
  },
];

// ─── Channel-specific rules ─────────────────────────────────────────
export const CHANNEL_RULES = {
  whatsapp: {
    name: "WhatsApp",
    max_daily_touches: 50,
    follow_up_interval_days: 3,
    max_sequence_steps: 5,
    steps: ["Introduction", "Value Proposition", "Case Study", "Follow-up", "Break-up"],
    color: "#22c55e",
  },
  linkedin: {
    name: "LinkedIn",
    max_daily_touches: 30,
    follow_up_interval_days: 4,
    max_sequence_steps: 7,
    steps: ["Connection Request", "Welcome Message", "Value Share", "Case Study", "Engagement", "Break-up", "Final"],
    color: "#3b82f6",
  },
  email: {
    name: "Email",
    max_daily_touches: 100,
    follow_up_interval_days: 5,
    max_sequence_steps: 4,
    steps: ["Introduction", "Follow-up 1", "Follow-up 2", "Final"],
    color: "#64748b",
  },
  call: {
    name: "Call",
    max_daily_touches: 20,
    follow_up_interval_days: 2,
    max_sequence_steps: 4,
    steps: ["Cold Call", "Follow-up Call", "Proposal Call", "Closing Call"],
    color: "#f59e0b",
  },
  meeting: {
    name: "Meeting",
    max_daily_touches: 5,
    follow_up_interval_days: 7,
    max_sequence_steps: 3,
    steps: ["Discovery Meeting", "Demo Meeting", "Closing Meeting"],
    color: "#8b5cf6",
  },
};
