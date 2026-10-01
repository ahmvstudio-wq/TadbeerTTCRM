export type DateFilterShortcut =
  | 'today'
  | 'yesterday'
  | 'week'
  | 'month'
  | 'last_30_days'
  | 'quarter'
  | 'all'

export interface ResolvedDateRange {
  startDate: string | null // YYYY-MM-DD
  endDate: string | null   // YYYY-MM-DD
  label: string
  shortcut?: DateFilterShortcut | 'custom'
}

export function toDateString(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatFriendlyDate(dStr: string): string {
  try {
    const [y, m, d] = dStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
  } catch {
    return dStr
  }
}

/**
 * Resolves any date filter query (shortcut name, single date YYYY-MM-DD, or range YYYY-MM-DD:YYYY-MM-DD)
 * into a normalized { startDate, endDate, label, shortcut } object.
 */
export function resolveDateRange(
  filterInput?: string | { startDate?: string | null; endDate?: string | null },
  referenceDate: Date = new Date()
): ResolvedDateRange {
  if (!filterInput) {
    return { startDate: null, endDate: null, label: 'All Time', shortcut: 'all' }
  }

  // Object input { startDate, endDate }
  if (typeof filterInput === 'object') {
    const s = filterInput.startDate || null
    const e = filterInput.endDate || filterInput.startDate || null
    if (!s && !e) return { startDate: null, endDate: null, label: 'All Time', shortcut: 'all' }
    if (s && e && s === e) {
      return { startDate: s, endDate: e, label: formatFriendlyDate(s), shortcut: 'custom' }
    }
    return {
      startDate: s,
      endDate: e,
      label: s && e ? `${formatFriendlyDate(s)} – ${formatFriendlyDate(e)}` : (s ? `From ${formatFriendlyDate(s)}` : `Until ${formatFriendlyDate(e!)}`),
      shortcut: 'custom'
    }
  }

  const trimmed = filterInput.trim()

  if (trimmed === 'all' || trimmed === 'all_time' || trimmed === '') {
    return { startDate: null, endDate: null, label: 'All Time', shortcut: 'all' }
  }

  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)
  const todayStr = toDateString(today)

  // Shortcuts
  if (trimmed === 'today') {
    return {
      startDate: todayStr,
      endDate: todayStr,
      label: 'Today',
      shortcut: 'today'
    }
  }

  if (trimmed === 'yesterday') {
    const yest = new Date(today)
    yest.setDate(yest.getDate() - 1)
    const yestStr = toDateString(yest)
    return {
      startDate: yestStr,
      endDate: yestStr,
      label: 'Yesterday',
      shortcut: 'yesterday'
    }
  }

  if (trimmed === 'week' || trimmed === 'this_week' || trimmed === 'last_7_days') {
    const pastWeek = new Date(today)
    pastWeek.setDate(pastWeek.getDate() - 6) // Last 7 days including today
    return {
      startDate: toDateString(pastWeek),
      endDate: todayStr,
      label: 'This Week',
      shortcut: 'week'
    }
  }

  if (trimmed === 'month' || trimmed === 'this_month') {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return {
      startDate: toDateString(startOfMonth),
      endDate: todayStr,
      label: 'This Month',
      shortcut: 'month'
    }
  }

  if (trimmed === 'last_30_days' || trimmed === '30d') {
    const past30 = new Date(today)
    past30.setDate(past30.getDate() - 29)
    return {
      startDate: toDateString(past30),
      endDate: todayStr,
      label: 'Last 30 Days',
      shortcut: 'last_30_days'
    }
  }

  if (trimmed === 'quarter' || trimmed === 'this_quarter') {
    const currentMonth = today.getMonth() // 0-11
    const quarterStartMonth = Math.floor(currentMonth / 3) * 3
    const startOfQuarter = new Date(today.getFullYear(), quarterStartMonth, 1)
    return {
      startDate: toDateString(startOfQuarter),
      endDate: todayStr,
      label: 'This Quarter',
      shortcut: 'quarter'
    }
  }

  // Range syntax: "YYYY-MM-DD:YYYY-MM-DD" or "YYYY-MM-DD_YYYY-MM-DD"
  if (trimmed.includes(':') || trimmed.includes('_')) {
    const [start, end] = trimmed.split(/[:_]/)
    if (start && end) {
      return {
        startDate: start.trim(),
        endDate: end.trim(),
        label: `${formatFriendlyDate(start.trim())} – ${formatFriendlyDate(end.trim())}`,
        shortcut: 'custom'
      }
    }
  }

  // Exact single date: "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return {
      startDate: trimmed,
      endDate: trimmed,
      label: formatFriendlyDate(trimmed),
      shortcut: 'custom'
    }
  }

  return { startDate: null, endDate: null, label: 'All Time', shortcut: 'all' }
}

/**
 * Checks whether a given ISO date or YYYY-MM-DD string falls inside [startDate, endDate]
 */
export function isDateInRange(
  dateValue?: string | Date | null,
  startDate?: string | null,
  endDate?: string | null
): boolean {
  if (!startDate && !endDate) return true
  if (!dateValue) return false

  let dateStr: string
  if (dateValue instanceof Date) {
    dateStr = toDateString(dateValue)
  } else {
    dateStr = String(dateValue).slice(0, 10)
  }

  if (startDate && dateStr < startDate) return false
  if (endDate && dateStr > endDate) return false
  return true
}
