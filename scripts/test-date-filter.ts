process.env.CRM_TEST_MODE = 'true'
import './load-env'
import { resolveDateRange, isDateInRange, toDateString } from '../src/lib/date-utils'
import { getDashboardStats } from '../src/lib/actions/dashboard'
import { getAllLeadsForPipeline } from '../src/lib/actions/ig-dm'

async function testDateFiltering() {
  console.log('--- Testing resolveDateRange ---')
  const refDate = new Date('2026-10-01T12:00:00Z')

  const todayRes = resolveDateRange('today', refDate)
  console.log('Today:', todayRes)
  if (todayRes.startDate !== '2026-10-01' || todayRes.endDate !== '2026-10-01') {
    throw new Error('Today resolution failed')
  }

  const yestRes = resolveDateRange('yesterday', refDate)
  console.log('Yesterday:', yestRes)
  if (yestRes.startDate !== '2026-09-30' || yestRes.endDate !== '2026-09-30') {
    throw new Error('Yesterday resolution failed')
  }

  const weekRes = resolveDateRange('week', refDate)
  console.log('Week:', weekRes)
  if (weekRes.startDate !== '2026-09-25' || weekRes.endDate !== '2026-10-01') {
    throw new Error('Week resolution failed')
  }

  const monthRes = resolveDateRange('month', refDate)
  console.log('Month:', monthRes)
  if (monthRes.startDate !== '2026-10-01' || monthRes.endDate !== '2026-10-01') {
    throw new Error('Month resolution failed')
  }

  const last30Res = resolveDateRange('last_30_days', refDate)
  console.log('Last 30 Days:', last30Res)
  if (last30Res.startDate !== '2026-09-02' || last30Res.endDate !== '2026-10-01') {
    throw new Error('Last 30 Days resolution failed')
  }

  const singleDayRes = resolveDateRange('2026-09-30', refDate)
  console.log('Single Day (2026-09-30):', singleDayRes)
  if (singleDayRes.startDate !== '2026-09-30' || singleDayRes.endDate !== '2026-09-30') {
    throw new Error('Single Day resolution failed')
  }

  const rangeRes = resolveDateRange('2026-09-01:2026-09-30', refDate)
  console.log('Custom Range (2026-09-01:2026-09-30):', rangeRes)
  if (rangeRes.startDate !== '2026-09-01' || rangeRes.endDate !== '2026-09-30') {
    throw new Error('Custom Range resolution failed')
  }

  console.log('--- Testing isDateInRange ---')
  if (!isDateInRange('2026-09-30T10:00:00Z', '2026-09-30', '2026-09-30')) {
    throw new Error('isDateInRange single day failed')
  }
  if (isDateInRange('2026-09-29T23:59:59Z', '2026-09-30', '2026-09-30')) {
    throw new Error('isDateInRange out of bounds failed')
  }
  if (!isDateInRange('2026-09-15', '2026-09-01', '2026-09-30')) {
    throw new Error('isDateInRange in range failed')
  }

  console.log('--- Testing getDashboardStats with real DB ---')
  const statsAll = await getDashboardStats('all')
  console.log('Stats All Time:', {
    total_companies: statsAll.data?.total_companies,
    in_outreach: statsAll.data?.in_outreach,
    upcoming_meetings: statsAll.data?.upcoming_meetings,
    conversion_rate: statsAll.data?.conversion_rate,
    is_filtered: statsAll.data?.is_filtered
  })

  const stats30d = await getDashboardStats('last_30_days')
  console.log('Stats Last 30 Days:', {
    total_companies: stats30d.data?.total_companies,
    in_outreach: stats30d.data?.in_outreach,
    upcoming_meetings: stats30d.data?.upcoming_meetings,
    conversion_rate: stats30d.data?.conversion_rate,
    is_filtered: stats30d.data?.is_filtered,
    filter_label: stats30d.data?.filter_label
  })

  const statsYest = await getDashboardStats('yesterday')
  console.log('Stats Yesterday:', {
    total_companies: statsYest.data?.total_companies,
    in_outreach: statsYest.data?.in_outreach,
    upcoming_meetings: statsYest.data?.upcoming_meetings,
    conversion_rate: statsYest.data?.conversion_rate,
    is_filtered: statsYest.data?.is_filtered,
    filter_label: statsYest.data?.filter_label
  })

  console.log('--- Testing getAllLeadsForPipeline with real DB ---')
  const leadsAll = await getAllLeadsForPipeline('all')
  console.log(`Leads All Time: ${leadsAll.data?.length}`)

  const leads30d = await getAllLeadsForPipeline('last_30_days')
  console.log(`Leads Last 30 Days: ${leads30d.data?.length}`)

  const leadsCustom = await getAllLeadsForPipeline('2026-09-01:2026-09-30')
  console.log(`Leads Custom Range (Sep 2026): ${leadsCustom.data?.length}`)

  console.log('✓ ALL DATE FILTERING TESTS PASSED PERFECTLY!')
}

testDateFiltering().catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})
