import './load-env';
import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function main() {
  const sb = getSupabaseAdminClient();
  const testChannels = ['whatsapp', 'call', 'email', 'linkedin', 'instagram', 'sms', 'other', 'direct'];
  const testCompanyId = '816e647b-af80-4f58-9eb4-0ed0a1ed6852'; // بيتك للعقارات

  for (const ch of testChannels) {
    const { data, error } = await sb.from('follow_ups').insert({
      company_id: testCompanyId,
      due_date: '2026-10-02',
      subject: 'Test ' + ch,
      channel: ch,
      status: 'pending'
    }).select().single();

    if (error) {
      console.log(`Channel "${ch}": REJECTED - ${error.message}`);
    } else {
      console.log(`Channel "${ch}": ACCEPTED (id: ${data.id})`);
      // Delete test row
      await sb.from('follow_ups').delete().eq('id', data.id);
    }
  }
}

main().catch(console.error);
