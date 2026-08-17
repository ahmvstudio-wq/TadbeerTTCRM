import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...vals] = trimmed.split('=');
      if (key && vals.length > 0) {
        process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export function parseInstagramFromText(text: string): string | null {
  if (!text) return null;

  // 1. Direct Instagram URL regex (handles query params, trailing slashes, etc.)
  const directMatch = text.match(/https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)(?:\/|\?[^\s\n"']*)?/i);
  if (directMatch && directMatch[1]) {
    const handle = directMatch[1].replace(/\/$/, '');
    if (handle && handle.toLowerCase() !== 'p' && handle.toLowerCase() !== 'reel' && handle.toLowerCase() !== 'stories') {
      return `https://www.instagram.com/${handle}/`;
    }
  }

  // 2. Pattern: Instagram: @handle or Instagram: handle
  const handleMatch = text.match(/Instagram:\s*@?([a-zA-Z0-9_.]+)/i);
  if (handleMatch && handleMatch[1]) {
    const handle = handleMatch[1].replace(/^@/, '').trim();
    if (handle && !handle.startsWith('http')) {
      return `https://www.instagram.com/${handle}/`;
    }
  }

  // 3. Pattern: @handle inside notes
  const atMatch = text.match(/@([a-zA-Z0-9_.]+)/);
  if (atMatch && atMatch[1]) {
    const handle = atMatch[1].trim();
    if (handle.length >= 3 && !['gmail', 'yahoo', 'hotmail', 'outlook', 'today', 'team'].includes(handle.toLowerCase())) {
      return `https://www.instagram.com/${handle}/`;
    }
  }

  return null;
}

async function fixDataMapping() {
  console.log('🔍 Running full data mapping scan on 890 company records...');

  const { data: companies, error } = await supabase
    .from('companies')
    .select('*, contacts(*), activities(*)');

  if (error || !companies) {
    console.error('Error fetching companies:', error);
    return;
  }

  console.log(`Analyzing ${companies.length} records...`);

  let instagramFoundCount = 0;
  let researchNotesCount = 0;
  let updatedCount = 0;

  for (const c of companies) {
    const fullText = [
      c.notes,
      c.website,
      c.pain_point,
      ...(c.contacts || []).map((cnt: any) => `${cnt.notes || ''} ${cnt.social_handle || ''}`),
      ...(c.activities || []).map((act: any) => `${act.notes || ''}`)
    ].filter(Boolean).join('\n');

    const igUrl = parseInstagramFromText(fullText);

    if (igUrl) {
      instagramFoundCount++;
    }

    if (c.notes && (c.notes.includes('Research Profile') || c.notes.includes('Rating:') || c.notes.length > 40)) {
      researchNotesCount++;
    }

    // If website is empty or generic, and we found an Instagram URL, set website or update notes
    let needsUpdate = false;
    let newWebsite = c.website;

    if (igUrl && (!c.website || c.website.trim() === '' || c.website.includes('www.google.com') || c.website.includes('example.com'))) {
      newWebsite = igUrl;
      needsUpdate = true;
    }

    if (needsUpdate) {
      const { error: updateErr } = await supabase
        .from('companies')
        .update({ website: newWebsite, updated_at: new Date().toISOString() })
        .eq('id', c.id);

      if (!updateErr) updatedCount++;
    }
  }

  console.log(`✅ Scan Complete!`);
  console.log(`• Total Companies with Instagram Profile Links: ${instagramFoundCount}`);
  console.log(`• Total Companies with Rich Research Notes: ${researchNotesCount}`);
  console.log(`• Database Records Updated with Instagram Websites: ${updatedCount}`);
}

fixDataMapping();
