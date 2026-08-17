import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { error: checkErr } = await supabase
      .from('linkedin_prospects')
      .select('id')
      .limit(1)

    if (!checkErr) {
      return NextResponse.json({ message: 'LinkedIn prospects table is active and accessible.', seeded: true })
    }

    return NextResponse.json(
      { message: 'LinkedIn schema migration pending in database.', seeded: false },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'An internal error occurred while checking LinkedIn schema status.' },
      { status: 500 }
    )
  }
}
