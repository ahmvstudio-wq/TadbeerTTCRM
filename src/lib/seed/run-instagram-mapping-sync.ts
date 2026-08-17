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

export function extractInstagramUrl(input: any): string {
  if (!input) return "";

  const textToScan = typeof input === "object"
    ? `${input.website || ""} ${input.notes || ""} ${input.pain_point || ""} ${input.contacts?.[0]?.notes || ""}`
    : String(input);

  // 1. Direct http(s) instagram URL anywhere in text or website
  const directMatch = textToScan.match(/https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+(?:\/[^\s\n"']*)?/i);
  if (directMatch) {
    const rawUrl = directMatch[0].trim();
    return rawUrl.replace(/[,;)]$/, '');
  }

  // 2. Pattern: Instagram: @handle or Instagram: handle
  const handleMatch = textToScan.match(/Instagram:\s*@?([a-zA-Z0-9_.]+)/i);
  if (handleMatch && handleMatch[1]) {
    const handle = handleMatch[1].replace(/^@/, '').trim();
    if (handle && !handle.toLowerCase().startsWith("http")) {
      return `https://www.instagram.com/${handle}/`;
    }
  }

  // 3. Pattern: @handle in notes/pain_point
  const atMatch = textToScan.match(/@([a-zA-Z0-9_.]+)/);
  if (atMatch && atMatch[1]) {
    const handle = atMatch[1].trim();
    if (handle.length >= 3 && !['gmail', 'yahoo', 'hotmail', 'outlook', 'today', 'team', 'gmail.com'].includes(handle.toLowerCase())) {
      return `https://www.instagram.com/${handle}/`;
    }
  }

  return "";
}

async function runInstagramMappingSync() {
  console.log('🔄 Executing Instagram & Research Data Mapping Sync across 890 companies...');

  const { data: companies, error } = await supabase
    .from('companies')
    .select('*, contacts(*), activities(*)');

  if (error || !companies) {
    console.error('Error fetching companies:', error);
    return;
  }

  console.log(`Processing ${companies.length} records...`);

  let igCount = 0;
  let updatedWebsiteCount = 0;

  for (const c of companies) {
    const igUrl = extractInstagramUrl(c);

    if (igUrl) {
      igCount++;

      // If website is empty or google maps, update website to Instagram link for clean 1-click access
      if (!c.website || c.website.trim() === '' || c.website.includes('google.com/maps')) {
        const { error: updateErr } = await supabase
          .from('companies')
          .update({ website: igUrl, updated_at: new Date().toISOString() })
          .eq('id', c.id);

        if (!updateErr) updatedWebsiteCount++;
      }
    }
  }

  console.log(`==================================================`);
  console.log(`✅ SYNC COMPLETE!`);
  console.log(`• Total Instagram Profile URLs extracted: ${igCount}`);
  console.log(`• Company records updated with clean Instagram website links: ${updatedWebsiteCount}`);
}

runInstagramMappingSync();
