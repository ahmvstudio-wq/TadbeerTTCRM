import './load-env';
import { getCadenceFollowUps } from '../src/lib/actions/followups';

async function main() {
  const res = await getCadenceFollowUps();
  console.log('getCadenceFollowUps result:', res.error ? `ERROR: ${res.error}` : `SUCCESS: ${res.data?.length} items`);
  if (res.data && res.data.length > 0) {
    const todayItems = res.data.filter(i => i.is_today);
    const overdueItems = res.data.filter(i => i.is_overdue);
    const upcomingItems = res.data.filter(i => !i.is_today && !i.is_overdue);

    console.log(`- Overdue: ${overdueItems.length}`);
    console.log(`- Due Today: ${todayItems.length}`);
    console.log(`- Upcoming: ${upcomingItems.length}`);

    console.log('\nSample Due Today item:');
    console.log(JSON.stringify(todayItems[0] || res.data[0], null, 2));
  }
}

main().catch(console.error);
