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

export interface ParsedLeadNotes {
  category?: string;
  instagram_handle?: string;
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
  if (typeof notes === 'object') return notes;
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
    if (leadOrNotes.specific_observation && typeof leadOrNotes.specific_observation === 'string' && !leadOrNotes.specific_observation.startsWith('{')) {
      return leadOrNotes.specific_observation;
    }
    const parsed = parseLeadNotes(leadOrNotes.notes || leadOrNotes);
    if (parsed.specific_observation && !parsed.specific_observation.startsWith('{')) return parsed.specific_observation;
    if (parsed.staged_sequence?.touch_1?.specific_observation) return parsed.staged_sequence.touch_1.specific_observation;
    if (parsed.original_notes) return parsed.original_notes;
    if (parsed.rawText && !parsed.rawText.startsWith('{')) return parsed.rawText;
    return 'Recent business growth & market positioning';
  }
  const parsed = parseLeadNotes(leadOrNotes);
  return parsed.specific_observation || parsed.original_notes || (parsed.rawText && !parsed.rawText.startsWith('{') ? parsed.rawText : 'Recent business growth & market positioning');
}

export function getCleanDraftMessage(leadOrNotes: any): string {
  if (!leadOrNotes) return 'Assalamu Alaikum, I came across your business today and wanted to share a quick observation.';
  if (typeof leadOrNotes === 'object') {
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

