export type LeadPriority = 1 | 2 | 3;

export interface PriorityConfig {
  id: LeadPriority;
  label: string;
  shortLabel: string;
  tag: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
}

export const PRIORITY_CONFIGS: Record<LeadPriority, PriorityConfig> = {
  1: {
    id: 1,
    label: "Priority 1 — Retail, FMCG, Spas & Clinics",
    shortLabel: "Priority 1",
    tag: "Retail, FMCG, Spas, Clinics",
    description: "Retail businesses, FMCG, beauty spas, and medical / dental / aesthetic clinics.",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/40",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    badgeBorder: "border-emerald-300 dark:border-emerald-800",
    dotColor: "bg-emerald-500",
  },
  2: {
    id: 2,
    label: "Priority 2 — Real Estate & Supermarkets",
    shortLabel: "Priority 2",
    tag: "Real Estate & Supermarkets",
    description: "Real estate developers, property agencies, and hypermarkets / supermarkets.",
    badgeBg: "bg-indigo-50 dark:bg-indigo-950/40",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    badgeBorder: "border-indigo-300 dark:border-indigo-800",
    dotColor: "bg-indigo-500",
  },
  3: {
    id: 3,
    label: "Priority 3 — Remaining Industries",
    shortLabel: "Priority 3",
    tag: "Other Industries",
    description: "All other remaining B2B sectors (corporate, engineering, tech, hospitality, finance, general).",
    badgeBg: "bg-slate-100 dark:bg-slate-800",
    badgeText: "text-slate-700 dark:text-slate-300",
    badgeBorder: "border-slate-300 dark:border-slate-700",
    dotColor: "bg-slate-400",
  },
};

/**
 * Resolves the Priority (1, 2, or 3) based on industry, category, company name, and notes.
 *
 * Rules:
 * 1. Priority 1: Retail businesses, FMCG, Spas, and Clinics. (General businesses strictly excluded).
 * 2. Priority 2: Real estate businesses and supermarkets.
 * 3. Priority 3: All remaining industries.
 */
export function resolveLeadPriority(input?: {
  industry?: string | null;
  category?: string | null;
  company_name?: string | null;
  notes?: string | null;
} | null): LeadPriority {
  if (!input) return 3;

  const raw = [
    input.industry,
    input.category,
    input.company_name,
    input.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // 1. Priority 2: Real estate & Supermarkets
  const isSupermarket =
    raw.includes("supermarket") ||
    raw.includes("hypermarket") ||
    raw.includes("grocery") ||
    raw.includes("mart");

  const isRealEstate =
    raw.includes("real estate") ||
    raw.includes("property") ||
    raw.includes("housing") ||
    raw.includes("realt") ||
    raw.includes("waterfront") ||
    raw.includes("mixed-use development") ||
    (raw.includes("development") && (raw.includes("land") || raw.includes("estate") || raw.includes("villa") || raw.includes("properties")));

  if (isSupermarket || isRealEstate) {
    return 2;
  }

  // 2. General businesses exclusion from Priority 1
  const isPureGeneral =
    raw.includes("general business") ||
    raw.includes("general enterprise") ||
    raw.includes("general sme") ||
    raw.trim() === "general";

  // 3. Priority 1: Retail, FMCG, Spas, Clinics
  const isClinic =
    raw.includes("clinic") ||
    raw.includes("derma") ||
    raw.includes("aesthetic") ||
    raw.includes("dental") ||
    raw.includes("orthodont") ||
    raw.includes("medical") ||
    raw.includes("healthcare") ||
    raw.includes("hospital") ||
    raw.includes("doctor");

  const isSpa =
    raw.includes("spa") ||
    raw.includes("salon") ||
    raw.includes("beauty") ||
    raw.includes("wellness") ||
    raw.includes("massage");

  const isFMCG =
    raw.includes("fmcg") ||
    raw.includes("consumer goods");

  const isRetail =
    raw.includes("retail") ||
    raw.includes("fashion") ||
    raw.includes("abaya") ||
    raw.includes("boutique") ||
    raw.includes("perfume") ||
    raw.includes("fragrance") ||
    raw.includes("cosmetic") ||
    raw.includes("apparel") ||
    raw.includes("clothing") ||
    raw.includes("shoes") ||
    raw.includes("jewelry") ||
    raw.includes("jewellery") ||
    raw.includes("floral") ||
    raw.includes("flower") ||
    raw.includes("gift") ||
    raw.includes("consumer electronics") ||
    raw.includes("dtc") ||
    raw.includes("e-commerce") ||
    raw.includes("ecommerce") ||
    raw.includes("q-commerce") ||
    raw.includes("social_commerce_dtc");

  if (!isPureGeneral && (isClinic || isSpa || isFMCG || isRetail)) {
    return 1;
  }

  // 4. Priority 3: All remaining industries
  return 3;
}
