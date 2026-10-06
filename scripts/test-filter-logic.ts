import { getSupabaseAdminClient } from '../src/lib/supabase/config';
import { normalizeCategorySync } from '../src/lib/outreach-playbook';

async function testFilter(channel: string, industry: string) {
  const sb = getSupabaseAdminClient();

  const { data: companies } = await sb
    .from('companies')
    .select('*, contacts(*)')
    .not('status', 'in', '("won","lost","archived")')
    .limit(1000);

  const uncontacted = (companies || []).filter(c => {
    const st = (c.status || '').toLowerCase().trim();
    if (['contacted', 'meeting_booked', 'won', 'lost', 'dormant'].includes(st)) return false;

    if (industry && industry !== 'all') {
      const norm = normalizeCategorySync(c.category || c.industry, c.company_name);
      if (norm !== industry) return false;
    }

    if (channel === 'whatsapp' || channel === 'cold_call') {
      const ph = c.phone || c.contacts?.[0]?.phone || c.contacts?.[0]?.whatsapp;
      return Boolean(ph && String(ph).replace(/\D/g, '').length >= 7);
    }

    if (channel === 'instagram_dm') {
      let rJson: any = {};
      try {
        if (c.research_json && typeof c.research_json === 'object') rJson = c.research_json;
        else if (c.notes && (c.notes.startsWith('{') || c.notes.startsWith('['))) rJson = JSON.parse(c.notes);
      } catch {}
      const rawIg = rJson.instagram_handle || (c.notes && c.notes.match(/Instagram:\s*(@?[^\s,]+)/i)?.[1]) || null;
      return Boolean(rawIg);
    }

    return true;
  });

  return uncontacted;
}

async function main() {
  const dtcWa = await testFilter('whatsapp', 'social_commerce_dtc');
  console.log('WhatsApp leads for DTC & Commerce:', dtcWa.length);
  console.log('Sample DTC WhatsApp leads:', dtcWa.slice(0, 5).map(c => ({ name: c.company_name, phone: c.phone, cat: c.category })));

  const clinicsWa = await testFilter('whatsapp', 'aesthetic_clinics');
  console.log('WhatsApp leads for Aesthetic Clinics:', clinicsWa.length);

  const fnbWa = await testFilter('whatsapp', 'hospitality_fnb');
  console.log('WhatsApp leads for Hospitality & F&B:', fnbWa.length);

  const allWa = await testFilter('whatsapp', 'all');
  console.log('Total uncontacted WhatsApp leads across all sectors:', allWa.length);
}

main().catch(console.error);
