/**
 * End-to-End Automated Workflow Test Suite
 * Tadbeer TT CRM Outreach Operating System
 *
 * Tests:
 * 1. Import & Auto-Generation (bulkImportCompanies, 3-touch sequence, name derivation)
 * 2. Channel Daily Batches (25/day Zero-Contradiction, handle cleanup, phone formatting)
 * 3. 1-Click Touch Logging & Channel Launchers (markChannelTouchSent, touch exclusion)
 * 4. AI Generation & Gemini Integration (generateOutreachMessage, sector playbooks)
 * 5. Clean Data & UI Verification (getCleanObservation, getCleanDraftMessage, getCleanDisplayNotes)
 */

import './load-env';

import { createClient } from '@supabase/supabase-js';
import { bulkImportCompanies } from '../src/lib/actions/import';
import { getChannelDailyBatch, markChannelTouchSent, getAllLeadsForPipeline } from '../src/lib/actions/ig-dm';
import { generateOutreachMessage, normalizeCategory, getCategoryPlaybook, buildDeterministicSequence } from '../src/lib/ai/outreach-generator';
import {
  formatWhatsAppNumber,
  formatPhoneNumberForDisplay,
  getCleanObservation,
  getCleanDraftMessage,
  getCleanDisplayNotes,
  parseLeadNotes
} from '../src/lib/utils';
import { SectorCategory, OutreachChannel } from '../src/lib/types/outreach';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Test Reporting Utilities ────────────────────────────────────────────────
interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: any;
}

const testResults: TestResult[] = [];
const createdCompanyIds: string[] = [];

function assert(condition: boolean, message: string, details?: any) {
  if (!condition) {
    const err = new Error(`Assertion Failed: ${message}`);
    (err as any).details = details;
    throw err;
  }
}

async function runTest(suite: string, name: string, fn: () => Promise<any>) {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    testResults.push({ suite, name, passed: true, durationMs: Math.round(duration), details: result });
    console.log(`  [PASS] ${name} (${Math.round(duration)}ms)`);
  } catch (err: any) {
    const duration = performance.now() - start;
    testResults.push({ suite, name, passed: false, durationMs: Math.round(duration), error: err.message, details: err.details });
    console.error(`  [FAIL] ${name} (${Math.round(duration)}ms):`, err.message);
  }
}

// ─── Main Test Runner ────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  TADBEER TT CRM OUTREACH OPERATING SYSTEM - E2E TEST RUNNER');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const testBatchTimestamp = Date.now();
  const testPrefix = `__E2E_TEST_${testBatchTimestamp}__`;

  try {
    // ═════════════════════════════════════════════════════════════════════════
    // SUITE 1: Import & Auto-Generation
    // ═════════════════════════════════════════════════════════════════════════
    console.log('▶ SUITE 1: Import & Auto-Generation Verification');

    const sampleImportData: Record<string, string>[] = [
      {
        company_name: '',
        instagram_handle: '@tephra.om',
        category: 'aesthetic clinics',
        specific_observation: 'Specialized non-surgical body contouring results and high patient engagement',
        city: 'Muscat',
        status: 'prospect',
        notes: `E2E Test Lead 1 ${testPrefix}`
      },
      {
        instagram_handle: '@zahwah_clothes',
        category: 'perfumes and fashion boutique',
        specific_observation: 'Exclusive handcrafted Omani silk abaya collection release',
        city: 'Muscat',
        status: 'prospect',
        notes: `E2E Test Lead 2 ${testPrefix}`
      },
      {
        company_name: `Muscat Smiles Dental ${testPrefix}`,
        person_name: 'Dr. Salim Al-Harthy',
        person_title: 'Lead Implantologist',
        phone: '99132814',
        whatsapp: '99132814',
        category: 'Aesthetic / Medical Clinics',
        specific_observation: 'High inquiry volume clinic running seasonal derma promotions',
        city: 'Muscat',
        status: 'prospect',
        notes: `E2E Test Lead 3 ${testPrefix}`
      },
      {
        company_name: 'Oman Training Institute LLC',
        person_name: 'Ahmed Al-Balushi',
        person_title: 'Managing Director',
        phone: '+968 2412 3456',
        category: 'Training / Education',
        specific_observation: 'Corporate training provider with corporate registration packages',
        city: 'Muscat',
        status: 'prospect',
        notes: `E2E Test Lead 4 ${testPrefix}`
      },
      {
        company_name: 'Muscat Specialty Hospitality',
        instagram_handle: '@muscat_specialty_cafe',
        phone: '+968 9123 4567',
        category: 'Hospitality / F&B',
        specific_observation: 'Specialty cafe expanding to new branches across Muscat',
        city: 'Muscat',
        status: 'prospect',
        notes: `E2E Test Lead 5 ${testPrefix}`
      }
    ];

    let importResult: any;

    await runTest('Import & Auto-Generation', 'bulkImportCompanies successfully processes and inserts 5 leads', async () => {
      importResult = await bulkImportCompanies(sampleImportData, 'all');
      assert(importResult.imported === 5, `Expected 5 imported leads, got ${importResult.imported}`, importResult);
      assert(importResult.failed === 0, `Expected 0 failed leads, got ${importResult.failed}`, importResult);
      return { imported: importResult.imported, failed: importResult.failed };
    });

    await runTest('Import & Auto-Generation', 'Verify DB records: company names auto-derived from IG handles with dots/underscores', async () => {
      const { data: insertedCos, error } = await supabase
        .from('companies')
        .select('*, contacts(*)')
        .ilike('notes', `%${testPrefix}%`);

      assert(!error, `Supabase query error: ${error?.message}`);
      assert(Boolean(insertedCos && insertedCos.length === 5), `Expected 5 companies found in DB, got ${insertedCos?.length}`);

      // Track IDs for cleanup
      insertedCos!.forEach(c => createdCompanyIds.push(c.id));

      const tephraLead = insertedCos!.find(c => c.notes.includes('E2E Test Lead 1'));
      assert(!!tephraLead, 'Tephra lead not found in DB');
      assert(tephraLead.company_name === 'Tephra Om', `Expected company_name 'Tephra Om', got '${tephraLead.company_name}'`);
      assert(tephraLead.status === 'prospect', `Expected status 'prospect', got '${tephraLead.status}'`);

      const zahwahLead = insertedCos!.find(c => c.notes.includes('E2E Test Lead 2'));
      assert(!!zahwahLead, 'Zahwah lead not found in DB');
      assert(zahwahLead.company_name === 'Zahwah Clothes', `Expected company_name 'Zahwah Clothes', got '${zahwahLead.company_name}'`);

      return {
        tephraDerivedName: tephraLead.company_name,
        zahwahDerivedName: zahwahLead.company_name,
        totalInserted: insertedCos!.length
      };
    });

    await runTest('Import & Auto-Generation', 'Verify 3-Touch pre-staged sequence and objection packs stored in notes JSON', async () => {
      const { data: insertedCos } = await supabase
        .from('companies')
        .select('*')
        .ilike('notes', `%${testPrefix}%`);

      for (const co of insertedCos!) {
        const parsed = parseLeadNotes(co.notes);
        assert(!!parsed.staged_sequence, `Lead ${co.company_name} missing staged_sequence`);
        assert(!!parsed.staged_sequence.touch_1?.message, `Lead ${co.company_name} missing touch_1 message`);
        assert(!!parsed.staged_sequence.touch_2?.message, `Lead ${co.company_name} missing touch_2 message`);
        assert(!!parsed.staged_sequence.touch_3?.message, `Lead ${co.company_name} missing touch_3 message`);
        assert(!!parsed.staged_sequence.cold_call_script?.opener, `Lead ${co.company_name} missing cold call opener`);
        assert(!!parsed.staged_sequence.objection_pack?.has_agency, `Lead ${co.company_name} missing objection pack`);
      }
      return { verifiedSequencesCount: insertedCos!.length };
    });

    await runTest('Import & Auto-Generation', 'Verify initial outreach_touches rows staged', async () => {
      const { data: touches, error } = await supabase
        .from('outreach_touches')
        .select('*')
        .in('lead_id', createdCompanyIds);

      assert(!error, `Query touches error: ${error?.message}`);
      assert(Boolean(touches && touches.length === 5), `Expected 5 staged outreach_touches, got ${touches?.length}`);
      touches!.forEach(t => {
        assert(t.step_number === 1, `Expected step_number 1, got ${t.step_number}`);
        assert(t.status === 'staged', `Expected status 'staged', got ${t.status}`);
      });
      return { stagedTouchesCount: touches!.length };
    });

    // ═════════════════════════════════════════════════════════════════════════
    // SUITE 2: Channel Daily Batches (25/day Zero-Contradiction)
    // ═════════════════════════════════════════════════════════════════════════
    console.log('\n▶ SUITE 2: Channel Daily Batches (25/day Zero-Contradiction)');

    await runTest('Channel Daily Batches', 'getChannelDailyBatch("instagram_dm", 25) retrieves clean IG handles without raw JSON', async () => {
      const { data: batch, totalAvailable, error } = await getChannelDailyBatch('instagram_dm', 25);
      assert(!error, `Daily batch error: ${error}`);
      assert(Array.isArray(batch), 'Expected batch array');
      assert(batch.length > 0, `Expected at least 1 lead in IG DM batch, got ${batch.length}`);

      // Verify each lead in batch
      for (const lead of batch) {
        assert(!!lead.instagram_handle, `Lead ${lead.company_name} missing instagram_handle`);
        const igHandle = String(lead.instagram_handle || '');
        const obs = String(lead.specific_observation || '');
        assert(igHandle.startsWith('@'), `Handle '${igHandle}' must start with @`);
        assert(!obs.includes('{') && !obs.includes('}'),
          `Observation '${obs}' contains raw JSON braces!`);
        assert(lead.status === 'gate_opener_staged', `Expected status 'gate_opener_staged', got '${lead.status}'`);
      }

      // Check our imported test leads are present in batch
      const tephraInBatch = batch.find(b => b.instagram_handle === '@tephra.om');
      assert(!!tephraInBatch, 'Test lead @tephra.om should be present in IG DM batch');
      assert(tephraInBatch!.company_name === 'Tephra Om', `Expected Tephra Om, got ${tephraInBatch!.company_name}`);

      return {
        batchSize: batch.length,
        totalAvailable,
        sampleLead: {
          name: tephraInBatch?.company_name,
          handle: tephraInBatch?.instagram_handle,
          observation: tephraInBatch?.specific_observation
        }
      };
    });

    await runTest('Channel Daily Batches', 'getChannelDailyBatch("whatsapp", 25) retrieves leads with formatted phone numbers', async () => {
      const { data: batch, totalAvailable, error } = await getChannelDailyBatch('whatsapp', 25);
      assert(!error, `Daily batch error: ${error}`);
      assert(Array.isArray(batch), 'Expected batch array');
      assert(batch.length > 0, `Expected leads in WhatsApp batch, got ${batch.length}`);

      for (const lead of batch) {
        assert(!!lead.phone, `Lead ${lead.company_name} missing phone number`);
        const waDigits = formatWhatsAppNumber(String(lead.phone || ''));
        const obs = String(lead.specific_observation || '');
        assert(waDigits.length >= 8, `Invalid formatted WhatsApp digits: ${waDigits}`);
        assert(!obs.includes('{') && !obs.includes('}'),
          `Observation contains raw JSON: ${obs}`);
      }

      return { batchSize: batch.length, totalAvailable };
    });

    await runTest('Channel Daily Batches', 'getChannelDailyBatch("cold_call", 25) retrieves leads with cold call scripts', async () => {
      const { data: batch, totalAvailable, error } = await getChannelDailyBatch('cold_call', 25);
      assert(!error, `Daily batch error: ${error}`);
      assert(Array.isArray(batch), 'Expected batch array');
      assert(batch.length > 0, `Expected leads in Cold Call batch, got ${batch.length}`);

      for (const lead of batch) {
        assert(!!lead.phone, `Lead ${lead.company_name} missing phone number in cold call batch`);
        assert(!!lead.call_opening_line, `Lead ${lead.company_name} missing call_opening_line in cold call batch`);
        const obs = String(lead.specific_observation || '');
        assert(!obs.includes('{') && !obs.includes('}'),
          `Observation contains raw JSON: ${obs}`);
      }

      return { batchSize: batch.length, totalAvailable };
    });

    // ═════════════════════════════════════════════════════════════════════════
    // SUITE 3: 1-Click Touch Logging & Channel Launchers
    // ═════════════════════════════════════════════════════════════════════════
    console.log('\n▶ SUITE 3: 1-Click Touch Logging & Channel Launchers');

    let testTouchCompanyId: string = '';

    await runTest('1-Click Touch Logging', 'markChannelTouchSent logs touch and updates company status to contacted', async () => {
      const { data: insertedCos } = await supabase
        .from('companies')
        .select('*')
        .ilike('notes', `%${testPrefix}%`);

      const targetLead = insertedCos!.find(c => c.company_name === 'Tephra Om');
      assert(!!targetLead, 'Target lead Tephra Om not found');
      testTouchCompanyId = targetLead!.id;

      const touchResult = await markChannelTouchSent({
        company_id: testTouchCompanyId,
        channel: 'instagram_dm',
        handle: '@tephra.om',
        observation: 'Specialized non-surgical body contouring results',
        message: 'Dr Tephra, your work on non-surgical body contouring is really impressive!'
      });

      assert(!touchResult.error, `markChannelTouchSent failed: ${touchResult.error}`);
      assert(!!touchResult.data?.activityId, 'Missing activityId in response');

      // Verify Supabase activity record
      const { data: act } = await supabase
        .from('activities')
        .select('*')
        .eq('id', touchResult.data!.activityId)
        .single();
      assert(!!act, 'Activity record not found in DB');
      assert(act.company_id === testTouchCompanyId, 'Activity company_id mismatch');

      // Verify Company updated to contacted
      const { data: co } = await supabase
        .from('companies')
        .select('status')
        .eq('id', testTouchCompanyId)
        .single();
      assert(co?.status === 'contacted', `Expected company status 'contacted', got '${co?.status}'`);

      return {
        activityId: touchResult.data?.activityId,
        companyStatus: co?.status
      };
    });

    await runTest('1-Click Touch Logging', 'Zero-Contradiction Verification: contacted lead is immediately excluded from daily batch', async () => {
      const { data: batch } = await getChannelDailyBatch('instagram_dm', 25);
      const isLeadStillInBatch = batch.some(b => b.company_id === testTouchCompanyId);
      assert(!isLeadStillInBatch, `Zero-Contradiction Failure: Touched lead ${testTouchCompanyId} was still returned in uncontacted daily batch!`);
      return { excludedCompanyId: testTouchCompanyId, verifiedZeroContradiction: true };
    });

    // ═════════════════════════════════════════════════════════════════════════
    // SUITE 4: AI Generation & Gemini Integration
    // ═════════════════════════════════════════════════════════════════════════
    console.log('\n▶ SUITE 4: AI Generation & Gemini Integration');

    await runTest('AI Generation', 'normalizeCategory properly maps 5 distinct Omani industry sectors', async () => {
      const dental = await normalizeCategory('Dental & Orthodontic Care');
      const aesthetic = await normalizeCategory('Cosmetic Derma & Skin Clinic');
      const dtc = await normalizeCategory('Luxury Perfumes & Abaya Fashion Store');
      const training = await normalizeCategory('Corporate Training Institute');
      const hospitality = await normalizeCategory('Fine Dining Restaurant & Lounge');
      const general = await normalizeCategory('General Trading LLC');

      assert(dental === 'dental_clinics', `Expected dental_clinics, got ${dental}`);
      assert(aesthetic === 'aesthetic_clinics', `Expected aesthetic_clinics, got ${aesthetic}`);
      assert(dtc === 'social_commerce_dtc', `Expected social_commerce_dtc, got ${dtc}`);
      assert(training === 'training_education', `Expected training_education, got ${training}`);
      assert(hospitality === 'hospitality_fnb', `Expected hospitality_fnb, got ${hospitality}`);
      assert(general === 'general', `Expected general, got ${general}`);

      return { dental, aesthetic, dtc, training, hospitality, general };
    });

    await runTest('AI Generation', 'generateOutreachMessage executes Gemini LLM generation with sector playbook constraints', async () => {
      const { data: insertedCos } = await supabase
        .from('companies')
        .select('*')
        .ilike('notes', `%${testPrefix}%`);

      const targetLead = insertedCos!.find(c => c.company_name.includes('Muscat Smiles Dental'));
      assert(!!targetLead, 'Target lead Muscat Smiles Dental not found');

      const result = await generateOutreachMessage(targetLead!.id);
      assert(result.status === 'ready_to_send', `Expected status 'ready_to_send', got '${result.status}'. Reason: ${result.reason}`);
      assert(!!result.draftMessage, 'Draft message was not generated');
      assert(result.draftMessage!.length > 20, `Draft message too short: ${result.draftMessage}`);
      assert(!!result.angleReasoning, 'Angle reasoning was not generated');

      // Verify saved in DB
      const { data: updatedCo } = await supabase
        .from('companies')
        .select('notes')
        .eq('id', targetLead!.id)
        .single();
      const parsedNotes = parseLeadNotes(updatedCo?.notes);
      assert(parsedNotes.draft_message === result.draftMessage, 'Draft message was not synced to DB notes JSON');

      return {
        companyName: targetLead!.company_name,
        draftMessage: result.draftMessage,
        angleReasoning: result.angleReasoning,
        status: result.status
      };
    });

    // ═════════════════════════════════════════════════════════════════════════
    // SUITE 5: Clean Data & UI Verification
    // ═════════════════════════════════════════════════════════════════════════
    console.log('\n▶ SUITE 5: Clean Data & UI Verification');

    await runTest('Clean Data & UI', 'getCleanObservation extracts pure text and strips raw JSON code strings', async () => {
      // Case A: Raw JSON string with nested notes
      const rawJsonString = JSON.stringify({
        category: 'aesthetic_clinics',
        specific_observation: 'Pioneering non-surgical rhinoplasty treatments in Muscat',
        draft_message: 'Dr Sarah, your work on rhinoplasty is remarkable.'
      });
      const obsA = getCleanObservation(rawJsonString);
      assert(obsA === 'Pioneering non-surgical rhinoplasty treatments in Muscat', `Failed Case A: ${obsA}`);

      // Case B: Lead object with nested staged_sequence
      const leadObjB = {
        company_name: 'Apex Clinic',
        notes: JSON.stringify({
          staged_sequence: {
            touch_1: { specific_observation: 'State-of-the-art 3D smile design studio' }
          }
        })
      };
      const obsB = getCleanObservation(leadObjB);
      assert(obsB === 'State-of-the-art 3D smile design studio', `Failed Case B: ${obsB}`);

      // Case C: Null / undefined fallback
      const obsC = getCleanObservation(null);
      assert(obsC === 'No specific observation logged', `Failed Case C: ${obsC}`);

      return { caseA: obsA, caseB: obsB, caseC: obsC };
    });

    await runTest('Clean Data & UI', 'getCleanDraftMessage extracts draft message cleanly without exposing JSON braces', async () => {
      const rawJsonString = JSON.stringify({
        draft_message: 'Ahlan Dr Salim, loved your recent case study on dental implants.'
      });
      const msgA = getCleanDraftMessage(rawJsonString);
      assert(msgA === 'Ahlan Dr Salim, loved your recent case study on dental implants.', `Failed Case A: ${msgA}`);
      assert(!msgA.startsWith('{') && !msgA.endsWith('}'), 'Message must not contain JSON wrapper');

      const msgB = getCleanDraftMessage(null);
      assert(typeof msgB === 'string' && msgB.length > 10, 'Fallback message invalid');

      return { msgA, msgB };
    });

    await runTest('Clean Data & UI', 'formatWhatsAppNumber & formatPhoneNumberForDisplay handle Oman and GCC numbers', async () => {
      const num1 = formatWhatsAppNumber('99132814'); // Local Oman 8-digit
      assert(num1 === '96899132814', `Expected 96899132814, got ${num1}`);
      const disp1 = formatPhoneNumberForDisplay('99132814');
      assert(disp1 === '+968 9913 2814', `Expected '+968 9913 2814', got '${disp1}'`);

      const num2 = formatWhatsAppNumber('+968 9123 4567'); // International Oman
      assert(num2 === '96891234567', `Expected 96891234567, got ${num2}`);

      const num3 = formatWhatsAppNumber('00971501234567'); // UAE 00 prefix
      assert(num3 === '971501234567', `Expected 971501234567, got ${num3}`);

      return { num1, disp1, num2, num3 };
    });

  } finally {
    // ═════════════════════════════════════════════════════════════════════════
    // CLEANUP / TEARDOWN
    // ═════════════════════════════════════════════════════════════════════════
    console.log('\n▶ CLEANUP: Removing E2E test records from Supabase...');
    if (createdCompanyIds.length > 0) {
      try {
        // Delete activities for test companies
        await supabase.from('activities').delete().in('company_id', createdCompanyIds);
        // Delete outreach_touches for test companies
        await supabase.from('outreach_touches').delete().in('lead_id', createdCompanyIds);
        // Delete contacts for test companies
        await supabase.from('contacts').delete().in('company_id', createdCompanyIds);
        // Delete companies
        const { error: delErr } = await supabase.from('companies').delete().in('id', createdCompanyIds);
        if (delErr) console.warn('Cleanup warning:', delErr.message);
        else console.log(`✓ Cleaned up ${createdCompanyIds.length} test company records and child relations.`);
      } catch (cleanErr: any) {
        console.warn('Cleanup error:', cleanErr.message);
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // FINAL REPORT & METRICS SUMMARY
  // ═════════════════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('                   E2E TEST EXECUTION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════');

  const total = testResults.length;
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;
  const totalDurationMs = testResults.reduce((acc, r) => acc + r.durationMs, 0);

  console.log(`Total Tests:    ${total}`);
  console.log(`Passed:         ${passed}`);
  console.log(`Failed:         ${failed}`);
  console.log(`Total Duration: ${totalDurationMs}ms`);
  console.log(`Success Rate:   ${Math.round((passed / total) * 100)}%\n`);

  if (failed > 0) {
    console.error('Failed Test Details:');
    testResults.filter(r => !r.passed).forEach(r => {
      console.error(` ✗ [${r.suite}] ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 ALL 12 TEST SUITE ASSERTIONS PASSED WITH 100% SUCCESS RATE!\n');
  }
}

main().catch(err => {
  console.error('Fatal E2E test execution error:', err);
  process.exit(1);
});
