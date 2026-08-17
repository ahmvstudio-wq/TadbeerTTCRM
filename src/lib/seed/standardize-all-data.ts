import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local manually
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
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return "";
  let raw = phone.trim();
  if (raw.startsWith("00")) raw = "+" + raw.substring(2);
  const hasPlus = raw.startsWith("+");
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) digits = digits.substring(1);
  if (digits.length === 8 && !digits.startsWith("968")) {
    digits = "968" + digits;
  } else if (!hasPlus && digits.length <= 9 && !digits.startsWith("968") && !digits.startsWith("971") && !digits.startsWith("966")) {
    digits = "968" + digits;
  }
  return digits;
}

export function formatPhoneNumberForDisplay(phone: string): string {
  if (!phone) return "";
  const digits = formatWhatsAppNumber(phone);
  if (!digits) return phone;
  if (digits.startsWith("968") && digits.length === 11) {
    const local = digits.substring(3);
    return `+968 ${local.slice(0, 4)} ${local.slice(4)}`;
  }
  return `+${digits}`;
}

async function standardizeAllData() {
  console.log('🔄 Standardizing & verifying all database data points...');

  const { data: companies, error } = await supabase
    .from('companies')
    .select('*, contacts(*)');

  if (error || !companies) {
    console.error('❌ Error fetching companies:', error);
    return;
  }

  console.log(`Found ${companies.length} company records to standardize.`);

  let updatedCount = 0;

  for (const c of companies) {
    let needsUpdate = false;
    let newName = c.company_name;
    let newPhone = c.phone;
    let newIndustry = c.industry;

    const isSerialId = !c.company_name || /^TT-\d+/i.test(c.company_name.trim());
    const primaryContact = (c.contacts || []).find((cnt: any) => cnt.is_primary) || c.contacts?.[0];

    if (isSerialId) {
      if (primaryContact?.full_name) {
        newName = `${primaryContact.full_name}${c.industry ? ` - ${c.industry}` : ''}`;
        needsUpdate = true;
      } else if (c.industry) {
        newName = `${c.industry} Enterprise`;
        needsUpdate = true;
      }
    }

    const rawPhone = c.phone || primaryContact?.phone || primaryContact?.whatsapp;
    if (rawPhone) {
      const formatted = formatPhoneNumberForDisplay(rawPhone);
      if (formatted !== c.phone) {
        newPhone = formatted;
        needsUpdate = true;
      }
    }

    if (!newIndustry || newIndustry.trim() === '' || newIndustry.toLowerCase() === 'null') {
      newIndustry = 'General Enterprise';
      needsUpdate = true;
    }

    if (needsUpdate) {
      const { error: updateErr } = await supabase
        .from('companies')
        .update({
          company_name: newName,
          phone: newPhone,
          industry: newIndustry,
          updated_at: new Date().toISOString()
        })
        .eq('id', c.id);

      if (!updateErr) updatedCount++;
    }
  }

  console.log(`✅ Successfully standardized ${updatedCount} company records in Supabase!`);
}

standardizeAllData();
