import { getChannelDailyBatch } from '../src/lib/actions/ig-dm';

async function main() {
  console.log('Testing getChannelDailyBatch across channels and categories...');

  // Test 1: WhatsApp with All industries
  const resWaAll = await getChannelDailyBatch('whatsapp', 50, 'all');
  console.log('\n--- WhatsApp (All) ---');
  console.log('Total returned:', resWaAll.data?.length, 'Total available:', resWaAll.totalAvailable);
  const waCats: Record<string, number> = {};
  resWaAll.data?.forEach(l => {
    waCats[l.sector || 'none'] = (waCats[l.sector || 'none'] || 0) + 1;
  });
  console.log('Sectors in batch:', waCats);

  // Test 2: WhatsApp with DTC & Commerce specifically
  const resWaDtc = await getChannelDailyBatch('whatsapp', 50, 'social_commerce_dtc');
  console.log('\n--- WhatsApp (social_commerce_dtc) ---');
  console.log('Total returned:', resWaDtc.data?.length, 'Total available:', resWaDtc.totalAvailable);
  console.log('Sample leads:', resWaDtc.data?.slice(0, 3).map(l => ({ name: l.company_name, sector: l.sector, phone: l.phone })));

  // Test 3: Instagram DM with DTC & Commerce
  const resIgDtc = await getChannelDailyBatch('instagram_dm', 50, 'social_commerce_dtc');
  console.log('\n--- Instagram DM (social_commerce_dtc) ---');
  console.log('Total returned:', resIgDtc.data?.length, 'Total available:', resIgDtc.totalAvailable);
  console.log('Sample leads:', resIgDtc.data?.slice(0, 3).map(l => ({ name: l.company_name, sector: l.sector, ig: l.instagram_handle })));
}

main().catch(console.error);
