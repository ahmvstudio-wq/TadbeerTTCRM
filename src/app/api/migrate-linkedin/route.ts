import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  // Try to query the table first — if it works, it exists
  const { error: checkErr } = await supabase
    .from('linkedin_prospects')
    .select('id')
    .limit(1)

  if (!checkErr) {
    return NextResponse.json({ message: 'Table already exists', seeded: false })
  }

  // Table doesn't exist — return SQL for user to run in Supabase dashboard
  const sql = `
-- Run this SQL in your Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.linkedin_prospects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  title text,
  company text,
  location text,
  degree text,
  connections text,
  profile_url text,
  connection_status text NOT NULL DEFAULT 'to_connect',
  message_status text NOT NULL DEFAULT 'to_send',
  mutual_connection text,
  industry text,
  screenshot_date text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.linkedin_prospects ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated" ON public.linkedin_prospects
  FOR ALL USING (true) WITH CHECK (true);
  `

  return NextResponse.json({ error: checkErr.message, sql_to_run: sql })
}
