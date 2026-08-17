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
