import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const CRM_PROJECT_REF = 'gmwogtyjqmwluspcxbzb'
export const CRM_DEFAULT_URL = 'https://gmwogtyjqmwluspcxbzb.supabase.co'
export const CRM_DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtd29ndHlqcW13bHVzcGN4YnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODY5NjAsImV4cCI6MjA5OTg2Mjk2MH0.731hd_hytgy_FTW6z5e93Kd-DyvIrS2m1YoP0FSEj-A'
export const CRM_DEFAULT_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtd29ndHlqcW13bHVzcGN4YnpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDI4Njk2MCwiZXhwIjoyMDk5ODYyOTYwfQ.n8z4qlZt3S5LfnwYH_mKVy2cM3r5Hyz-Ob-8vAO9a6g'

function cleanEnvValue(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return ''
  let cleaned = raw.trim()
  cleaned = cleaned.replace(/^["']+|["']+$/g, '').trim()
  if (cleaned.includes('=')) {
    const parts = cleaned.split('=')
    cleaned = parts[parts.length - 1].trim()
  }
  return cleaned.replace(/[;,]$/, '').replace(/^["']+|["']+$/g, '').trim()
}

function getJwtProjectRef(token: string): string | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const jsonStr =
      typeof atob === 'function'
        ? atob(part)
        : typeof Buffer !== 'undefined'
        ? Buffer.from(part, 'base64').toString('utf-8')
        : ''
    if (!jsonStr) return null
    return JSON.parse(jsonStr)?.ref || null
  } catch {
    return null
  }
}

export function getSupabaseUrl(): string {
  const custom = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL)
  if (custom && custom.startsWith('http') && custom.includes(CRM_PROJECT_REF)) {
    return custom
  }
  return CRM_DEFAULT_URL
}

export function getSupabaseAnonKey(): string {
  const custom = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  if (custom && getJwtProjectRef(custom) === CRM_PROJECT_REF) {
    return custom
  }
  return CRM_DEFAULT_ANON_KEY
}

export function getSupabaseServiceKey(): string {
  const customService = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (customService && getJwtProjectRef(customService) === CRM_PROJECT_REF) {
    return customService
  }
  return CRM_DEFAULT_SERVICE_ROLE_KEY
}

let cachedAdminClient: SupabaseClient | null = null

export function getSupabaseAdminClient(): SupabaseClient {
  if (!cachedAdminClient) {
    cachedAdminClient = createClient(getSupabaseUrl(), getSupabaseServiceKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
  return cachedAdminClient
}
