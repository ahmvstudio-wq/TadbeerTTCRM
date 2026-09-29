import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(date);
}

export function isOverdue(dueDate: string | Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export function isDueToday(dueDate: string | Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due.getTime() === today.getTime();
}

export function formatCurrency(amount: number, currency = "OMR"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

/**
 * Formats any phone number into a clean WhatsApp digits string (e.g. "96899132814").
 * Default country: Oman (+968). Preserves existing international country codes.
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return "";

  let raw = phone.trim();

  // Strip leading 00 if present
  if (raw.startsWith("00")) {
    raw = "+" + raw.substring(2);
  }

  const hasLeadingPlus = raw.startsWith("+");
  let digits = raw.replace(/\D/g, "");

  if (!digits) return "";

  // Strip single leading zero if any (e.g. 099132814 or 0505300590)
  if (digits.startsWith("0")) {
    digits = digits.substring(1);
  }

  // Handle 8-digit local Oman numbers (starting with 9, 7, 2)
  if (digits.length === 8 && !digits.startsWith("968")) {
    digits = "968" + digits;
  } else if (!hasLeadingPlus && digits.length <= 9 && !digits.startsWith("968") && !digits.startsWith("971") && !digits.startsWith("966") && !digits.startsWith("974") && !digits.startsWith("973") && !digits.startsWith("965") && !digits.startsWith("91")) {
    digits = "968" + digits;
  }

  return digits;
}

/**
 * Formats any phone number into a clean display string with country code (e.g. "+968 9913 2814").
 */
export function formatPhoneNumberForDisplay(phone: string): string {
  if (!phone) return "";
  const digits = formatWhatsAppNumber(phone);
  if (!digits) return phone;

  if (digits.startsWith("968") && digits.length === 11) {
    const local = digits.substring(3);
    return `+968 ${local.slice(0, 4)} ${local.slice(4)}`;
  }
  if (digits.startsWith("971") && digits.length >= 11) {
    const cc = digits.slice(0, 3);
    const rest = digits.slice(3);
    return `+${cc} ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
  }
  return `+${digits}`;
}

export function formatOmanWhatsAppUrl(phone?: string, message?: string): string | null {
  if (!phone || typeof phone !== 'string') return null;
  const digits = formatWhatsAppNumber(phone);
  if (!digits) return null;

  const baseUrl = `https://wa.me/${digits}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
}

export function isValidLinkedInUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed === '#' || trimmed === 'n/a' || trimmed === 'not available') return false;
  if (trimmed.length < 22 || trimmed.includes(' ')) return false;
  if (!trimmed.includes('linkedin.com/in/')) return false;
  return !trimmed.endsWith('linkedin.com/in/') && !trimmed.endsWith('linkedin.com/in');
}

export interface ParsedLeadNotes {
  category?: string;
  instagram_handle?: string;
  instagram_url?: string;
  followers?: string;
  business_type?: string;
  research_signal?: string;
  confidence?: string;
  qualification?: string;
  execution_note?: string;
  contact_status?: string;
  specific_observation?: string;
  staged_sequence?: any;
  original_notes?: string;
  target_channel?: string;
  draft_message?: string;
  draft_angle_reasoning?: string;
  phone?: string;
  whatsapp?: string;
  linkedin_url?: string;
  email?: string;
  rawText?: string;
}

export function parseLeadNotes(notes: any): ParsedLeadNotes {
  if (!notes) return {};
  if (typeof notes === 'object') {
    if (notes.research_json && typeof notes.research_json === 'object') {
      return {
        ...notes.research_json,
        ...notes,
        staged_sequence: notes.research_json.staged_sequence || notes.staged_sequence,
        specific_observation: notes.research_json.specific_observation || notes.specific_observation
      };
    }
    return notes;
  }
  const trimmed = String(notes).trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj && typeof obj === 'object') return obj;
    } catch {}
  }
  return { rawText: trimmed };
}

export function getCleanObservation(leadOrNotes: any): string {
  if (!leadOrNotes) return 'No specific observation logged';
  if (typeof leadOrNotes === 'object') {
    if (leadOrNotes.research_json?.specific_observation) {
      return leadOrNotes.research_json.specific_observation;
    }
    if (leadOrNotes.research_json?.research_signal) {
      return leadOrNotes.research_json.research_signal;
    }
    if (leadOrNotes.specific_observation && typeof leadOrNotes.specific_observation === 'string' && !leadOrNotes.specific_observation.startsWith('{')) {
      return leadOrNotes.specific_observation;
    }
    const parsed = parseLeadNotes(leadOrNotes.notes || leadOrNotes);
    if (parsed.specific_observation && !parsed.specific_observation.startsWith('{')) return parsed.specific_observation;
    if (parsed.research_signal) return parsed.research_signal;
    if (parsed.staged_sequence?.touch_1?.specific_observation) return parsed.staged_sequence.touch_1.specific_observation;
    if (parsed.original_notes) return parsed.original_notes;
    if (parsed.rawText && !parsed.rawText.startsWith('{')) return parsed.rawText;
    return 'Recent business growth & market positioning';
  }
  const parsed = parseLeadNotes(leadOrNotes);
  return parsed.specific_observation || parsed.research_signal || parsed.original_notes || (parsed.rawText && !parsed.rawText.startsWith('{') ? parsed.rawText : 'Recent business growth & market positioning');
}

export function getCleanDraftMessage(leadOrNotes: any): string {
  if (!leadOrNotes) return 'Assalamu Alaikum, I came across your business today and wanted to share a quick observation.';
  if (typeof leadOrNotes === 'object') {
    if (leadOrNotes.research_json?.staged_sequence?.touch_1?.message) {
      return leadOrNotes.research_json.staged_sequence.touch_1.message;
    }
    if (leadOrNotes.draft_message && typeof leadOrNotes.draft_message === 'string' && !leadOrNotes.draft_message.startsWith('{')) {
      return leadOrNotes.draft_message;
    }
    if (leadOrNotes.staged_sequence?.touch_1?.message) {
      return leadOrNotes.staged_sequence.touch_1.message;
    }
    const parsed = parseLeadNotes(leadOrNotes.notes || leadOrNotes);
    if (parsed.draft_message && !parsed.draft_message.startsWith('{')) return parsed.draft_message;
    if (parsed.staged_sequence?.touch_1?.message) return parsed.staged_sequence.touch_1.message;
    if (parsed.original_notes && !parsed.original_notes.startsWith('{')) return parsed.original_notes;
    if (parsed.rawText && !parsed.rawText.startsWith('{')) return parsed.rawText;
    return 'Assalamu Alaikum, I came across your business today and wanted to share a quick observation.';
  }
  const parsed = parseLeadNotes(leadOrNotes);
  return parsed.draft_message || parsed.staged_sequence?.touch_1?.message || (parsed.rawText && !parsed.rawText.startsWith('{') ? parsed.rawText : 'Assalamu Alaikum, I came across your business today and wanted to share a quick observation.');
}

export function getCleanIndustry(companyOrIndustry: any): string {
  if (!companyOrIndustry) return 'General Business Enterprise';
  const isObj = typeof companyOrIndustry === 'object';
  const rawInd = isObj ? (companyOrIndustry.industry || companyOrIndustry.category || '') : companyOrIndustry;
  const name = isObj ? String(companyOrIndustry.company_name || '').toLowerCase() : '';
  const ind = String(rawInd || '').toLowerCase().trim();
  const notes = isObj ? String(companyOrIndustry.notes || '').toLowerCase() : '';

  // 1. Clinics, Dental, Medical & Aesthetics
  if (
    ind.includes('clinic') || ind.includes('aesthetic') || ind.includes('dental') || ind.includes('derma') || ind.includes('ayurvedic') || ind.includes('optics') || ind.includes('medical') || ind.includes('wellness') || ind.includes('doctor') ||
    name.includes('clinic') || name.includes('dental') || name.includes('derma') || name.includes('hospital') || name.includes('medical') || name.includes('polyclinic') || name.includes('physiotherapy') || name.includes('optics') || name.includes('orthodontic')
  ) {
    if (ind.includes('dental') || name.includes('dental') || name.includes('orthodontic')) return 'Dental & Orthodontic Clinics';
    if (ind.includes('derma') || ind.includes('aesthetic') || name.includes('derma') || name.includes('aesthetic') || name.includes('skin') || name.includes('beauty clinic') || name.includes('laser')) return 'Aesthetic & Derma Clinics';
    return 'Healthcare & Medical Centers';
  }

  // 2. F&B, Restaurants, Cafes & Hospitality
  if (
    ind.includes('food') || ind.includes('beverage') || ind.includes('f&b') || ind.includes('restaurant') || ind.includes('café') || ind.includes('cafe') || ind.includes('bakery') || ind.includes('pizzeria') || ind.includes('hospitality') || ind.includes('tourism') || ind.includes('colddrinks') || ind.includes('snacks') ||
    name.includes('cafe') || name.includes('café') || name.includes('coffee') || name.includes('restaurant') || name.includes('roastery') || name.includes('bakery') || name.includes('kitchen') || name.includes('burger') || name.includes('sweets') || name.includes('pastry') || name.includes('bistro') || name.includes('lounge') || name.includes('hotel') || name.includes('resort') || name.includes('tea') || name.includes('cake')
  ) {
    if (name.includes('hotel') || name.includes('resort') || ind.includes('tourism') || name.includes('travel') || ind.includes('travel')) return 'Hospitality, Hotels & Tourism';
    return 'Food & Beverage (F&B / Cafés)';
  }

  // 3. Retail, Fashion, Abayas, Perfumes & DTC
  if (
    ind.includes('fashion') || ind.includes('abaya') || ind.includes('boutique') || ind.includes('perfume') || ind.includes('fragrance') || ind.includes('jewelry') || ind.includes('jewellery') || ind.includes('cosmetic') || ind.includes('make-up') || ind.includes('apparel') || ind.includes('shoe') || ind.includes('flowers') || ind.includes('flower') || ind.includes('gifts') || ind.includes('mussar') || ind.includes('dtc') || ind.includes('social_commerce') ||
    name.includes('abaya') || name.includes('boutique') || name.includes('perfume') || name.includes('fragrance') || name.includes('jewelry') || name.includes('jewellery') || name.includes('fashion') || name.includes('couture') || name.includes('tailor') || name.includes('mussar') || name.includes('flower') || name.includes('floral') || name.includes('gifts') || name.includes('cosmetics') || name.includes('oud') || name.includes('attar')
  ) {
    if (ind.includes('perfume') || ind.includes('fragrance') || name.includes('perfume') || name.includes('fragrance') || name.includes('oud')) return 'Luxury Fragrance & Perfumes';
    if (ind.includes('abaya') || ind.includes('fashion') || ind.includes('boutique') || name.includes('abaya') || name.includes('boutique') || name.includes('couture')) return 'Fashion, Abayas & Boutiques';
    if (ind.includes('flower') || ind.includes('gift') || name.includes('flower') || name.includes('floral') || name.includes('gift')) return 'Florals, Gifts & Events';
    return 'Retail & E-Commerce (DTC)';
  }

  // 4. Real Estate, Property & Interior Design
  if (
    ind.includes('real estate') || ind.includes('property') || ind.includes('interior') || ind.includes('furniture') || ind.includes('furnishing') ||
    name.includes('properties') || name.includes('real estate') || name.includes('realty') || name.includes('developer') || name.includes('brokerage') || name.includes('interior') || name.includes('decor')
  ) {
    return 'Real Estate, Property & Interiors';
  }

  // 5. Automotive, Transport & Logistics
  if (
    ind.includes('automotive') || ind.includes('car') || ind.includes('transportation') || ind.includes('logistics') || ind.includes('aviation') ||
    name.includes('motors') || name.includes('automobiles') || name.includes('automotive') || name.includes('car') || name.includes('cargo') || name.includes('logistics') || name.includes('transport')
  ) {
    return 'Automotive, Logistics & Fleet';
  }

  // 6. Technology, Software, Cybersecurity & Media
  if (
    ind.includes('technology') || ind.includes('pos') || ind.includes('cybersecurity') || ind.includes('software') || ind.includes('electronics') || ind.includes('3d printing') || ind.includes('hardware') || ind.includes('media') || ind.includes('design') || ind.includes('marketing') || ind.includes('advertising') ||
    name.includes('tech') || name.includes('software') || name.includes('digital') || name.includes('media') || name.includes('systems') || name.includes('cyber') || name.includes('marketing')
  ) {
    return 'Technology, Software & Media';
  }

  // 7. Finance, Insurance, Legal & Banking
  if (
    ind.includes('finance') || ind.includes('banking') || ind.includes('insurance') || ind.includes('accounting') || ind.includes('audit') || ind.includes('fintech') || ind.includes('legal') || ind.includes('exchange') || ind.includes('investment') ||
    name.includes('insurance') || name.includes('bank') || name.includes('takaful') || name.includes('finance') || name.includes('capital') || name.includes('exchange') || name.includes('audit') || name.includes('investment')
  ) {
    return 'Finance, Banking & Insurance';
  }

  // 8. Education & Training
  if (
    ind.includes('education') || ind.includes('training') || ind.includes('coaching') ||
    name.includes('academy') || name.includes('school') || name.includes('college') || name.includes('university') || name.includes('training') || name.includes('institute') || name.includes('gutech')
  ) {
    return 'Education & Professional Training';
  }

  // 9. Construction, Contracting, Engineering & Industrial
  if (
    ind.includes('construction') || ind.includes('contracting') || ind.includes('engineering') || ind.includes('manufacturing') || ind.includes('chemical') || ind.includes('oil & gas') || ind.includes('building materials') ||
    name.includes('contracting') || name.includes('construction') || name.includes('engineering') || name.includes('manufacturing') || name.includes('industrial') || name.includes('steel')
  ) {
    return 'Construction, Engineering & Industrial';
  }

  // 10. Supermarket, Hypermarket & FMCG
  if (
    ind.includes('supermarket') || ind.includes('hypermarket') || ind.includes('fmcg') ||
    name.includes('hypermarket') || name.includes('supermarket') || name.includes('mart')
  ) {
    return 'Supermarket & FMCG Retail';
  }

  // 11. Trading & General Business
  if (ind.includes('trading') || name.includes('trading') || name.includes('traders')) {
    return 'Trading & Commercial Distribution';
  }

  if (rawInd && rawInd !== 'General' && rawInd !== 'general' && rawInd !== 'General Business' && !rawInd.startsWith('@') && !rawInd.startsWith('Hey') && !rawInd.startsWith('Hi')) {
    return rawInd;
  }

  return 'General Business Enterprise';
}

export function getCleanDisplayNotes(notes: any): string {
  if (!notes) return '';
  const parsed = parseLeadNotes(notes);
  if (parsed.original_notes && parsed.original_notes.trim()) {
    return parsed.original_notes;
  }
  if (parsed.rawText && !parsed.rawText.startsWith('{')) {
    return parsed.rawText;
  }
  if (parsed.specific_observation && !parsed.specific_observation.startsWith('{')) {
    return `Observation: ${parsed.specific_observation}`;
  }
  return '';
}

export type EmailClientType = 'gmail' | 'outlook' | 'default';

export interface EmailComposeOptions {
  client?: EmailClientType;
  to: string;
  subject?: string;
  body?: string;
  companyName?: string;
  prospectName?: string;
}

export function createEmailComposeUrl({
  client = 'gmail',
  to,
  subject,
  body,
  companyName,
  prospectName,
}: EmailComposeOptions): string {
  const cleanTo = (to || '').trim();
  const defSubject = subject || (companyName ? `Observation regarding ${companyName}` : 'Quick inquiry');
  
  let formattedBody = (body || '').trim();
  if (prospectName && !formattedBody.toLowerCase().startsWith('hi') && !formattedBody.toLowerCase().startsWith('dear') && !formattedBody.toLowerCase().startsWith('assalamu')) {
    formattedBody = `Hi ${prospectName},\n\n${formattedBody}`;
  }

  const encTo = encodeURIComponent(cleanTo);
  const encSub = encodeURIComponent(defSubject);
  const encBody = encodeURIComponent(formattedBody);

  if (client === 'gmail') {
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encTo}&su=${encSub}&body=${encBody}`;
  } else if (client === 'outlook') {
    return `https://outlook.office.com/mail/deeplink/compose?to=${encTo}&subject=${encSub}&body=${encBody}`;
  } else {
    return `mailto:${encTo}?subject=${encSub}&body=${encBody}`;
  }
}

export function openEmailComposer(options: EmailComposeOptions) {
  const url = createEmailComposeUrl(options);
  if (options.client === 'default') {
    window.location.href = url;
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

