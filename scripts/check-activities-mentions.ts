import './load-env';
import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function main() {
  const sb = getSupabaseAdminClient();
  const names = ['Plaza', 'GHC', 'AHMED BEAUTY', 'Hussain', 'Yusr', 'Manoj Prem', 'Yousuf Allamki', 'Vishal Sobti'];

  const { data: acts } = await sb.from('activities').select('*');
  console.log('Total activities:', acts?.length);

  for (const name of names) {
    const matched = acts?.filter(a => {
      const desc = (a.description || '').toLowerCase();
      const title = (a.title || '').toLowerCase();
      return desc.includes(name.toLowerCase()) || title.includes(name.toLowerCase());
    });
    console.log(name, 'matched in activities:', matched?.length);
    if (matched && matched.length > 0) {
      console.log('  sample:', matched[0].title, matched[0].description?.slice(0, 120));
    }
  }
}

main().catch(console.error);
