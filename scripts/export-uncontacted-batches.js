const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CANONICAL_INDUSTRIES = [
  'Food & Beverage (F&B / Cafés)',
  'Technology, Software & Media',
  'Real Estate, Property & Interiors',
  'Retail & E-Commerce (DTC)',
  'Finance, Banking & Insurance',
  'Fashion, Abayas & Boutiques',
  'Automotive, Logistics & Fleet',
  'Luxury Fragrance & Perfumes',
  'Aesthetic & Derma Clinics',
  'Healthcare & Medical Centers',
  'Construction, Engineering & Industrial',
  'Trading & Commercial Distribution',
  'Florals, Gifts & Events',
  'Education & Professional Training',
  'Supermarket & FMCG Retail',
  'Hospitality, Hotels & Tourism',
  'Dental & Orthodontic Clinics',
  'General Business Enterprise'
];

async function generateBatches() {
  console.log('--- Step 1: Fetching all companies and contacts ---');
  let allCompanies = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from('companies')
      .select('*, contacts(*)')
      .range(page * 1000, (page + 1) * 1000 - 1)
      .order('company_name', { ascending: true });
    if (error || !data || data.length === 0) break;
    allCompanies = allCompanies.concat(data);
    if (data.length < 1000) break;
    page++;
  }

  console.log('Total companies retrieved:', allCompanies.length);

  // Filter strictly uncontacted prospects (no Instagram / LinkedIn active touches, stage/status is New/Prospect)
  const uncontacted = allCompanies.filter(c => {
    const stage = (c.pipeline_stage || '').toLowerCase();
    const leadStat = (c.lead_status || '').toLowerCase();
    const stat = (c.status || '').toLowerCase();
    
    return (stage === 'new' || leadStat === 'new' || stat === 'prospect') && 
           stage !== 'contacted' && 
           stage !== 'audit sent' && 
           stage !== 'follow-up sent' && 
           stage !== 'follow-up' &&
           stage !== 'replied' && 
           stage !== 'lost' && 
           leadStat !== 'contacted' &&
           leadStat !== 'qualified' &&
           leadStat !== 'meeting booked';
  });

  console.log('Total Uncontacted Leads to Export:', uncontacted.length);

  const outputDir = path.join(process.cwd(), 'exports', 'industry_review_batches');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const batchSize = 100;
  const totalBatches = Math.ceil(uncontacted.length / batchSize);

  console.log(`Generating ${totalBatches} Excel batches of up to ${batchSize} leads each...`);

  for (let i = 0; i < totalBatches; i++) {
    const startIdx = i * batchSize;
    const endIdx = Math.min(startIdx + batchSize, uncontacted.length);
    const batchItems = uncontacted.slice(startIdx, endIdx);
    const batchNum = String(i + 1).padStart(2, '0');
    const startNum = startIdx + 1;
    const endNum = endIdx;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Tadbeer CRM';
    workbook.created = new Date();

    // 1. Data Sheet
    const sheet = workbook.addWorksheet('Prospects Review', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    // 2. Lookup Sheet for Data Validation
    const lookupSheet = workbook.addWorksheet('LookupData', { state: 'hidden' });
    lookupSheet.getColumn(1).values = ['Industry List', ...CANONICAL_INDUSTRIES];

    // Define columns
    sheet.columns = [
      { header: 'CRM ID', key: 'id', width: 38 },
      { header: 'Company Name', key: 'company_name', width: 32 },
      { header: 'Current Industry', key: 'current_industry', width: 34 },
      { header: 'New Industry / Category (Select Dropdown)', key: 'new_industry', width: 38 },
      { header: 'Contact Person', key: 'contact_name', width: 22 },
      { header: 'Phone / WhatsApp', key: 'phone', width: 20 },
      { header: 'Email', key: 'email', width: 24 },
      { header: 'City / Location', key: 'city', width: 18 },
      { header: 'Website / Social Link', key: 'website', width: 32 },
      { header: 'Notes / Context', key: 'notes', width: 45 }
    ];

    // Style Header Row
    const headerRow = sheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colNumber === 4 ? 'FF1E3A8A' : 'FF0F172A' } // Highlight dropdown column with royal blue
      };
      cell.font = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    // Populate Rows
    batchItems.forEach((lead, rowIdx) => {
      const rowNumber = rowIdx + 2;
      const primaryContact = Array.isArray(lead.contacts) && lead.contacts.length > 0 ? lead.contacts[0] : null;

      // Extract clean notes without messy JSON dump if possible
      let cleanNotes = '';
      if (lead.notes) {
        if (lead.notes.startsWith('{') && lead.notes.endsWith('}')) {
          try {
            const parsed = JSON.parse(lead.notes);
            cleanNotes = parsed.specific_observation || parsed.original_notes || '';
          } catch (e) {
            cleanNotes = '';
          }
        } else {
          cleanNotes = lead.notes;
        }
      }

      const row = sheet.addRow({
        id: lead.id,
        company_name: lead.company_name || '',
        current_industry: lead.industry || 'General Business Enterprise',
        new_industry: lead.industry || 'General Business Enterprise',
        contact_name: primaryContact ? primaryContact.full_name : '',
        phone: lead.phone || (primaryContact ? primaryContact.phone || primaryContact.whatsapp : '') || '',
        email: lead.email || (primaryContact ? primaryContact.email : '') || '',
        city: lead.city || lead.country || '',
        website: lead.website || lead.linkedin_url || '',
        notes: cleanNotes
      });

      row.height = 22;

      // Format Data Cells
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Segoe UI', size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 || colNumber === 6 ? 'center' : 'left' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };

        // Alternate row fill
        if (rowIdx % 2 === 1 && colNumber !== 4) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }
          };
        }

        // Highlight editable dropdown column in soft amber/teal
        if (colNumber === 4) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0F2FE' }
          };
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0369A1' } };
        }
      });

      // Data validation for column D (New Industry dropdown)
      sheet.getCell(`D${rowNumber}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`LookupData!$A$2:$A$${CANONICAL_INDUSTRIES.length + 1}`],
        showErrorMessage: true,
        errorTitle: 'Invalid Industry',
        error: 'Please select an industry from the dropdown list.'
      };
    });

    const fileName = `Batch_${batchNum}_Leads_${startNum}_to_${endNum}.xlsx`;
    const filePath = path.join(outputDir, fileName);
    await workbook.xlsx.writeFile(filePath);
    console.log(`Saved: ${fileName} (${batchItems.length} leads)`);
  }

  console.log(`\n🎉 Successfully exported all ${uncontacted.length} uncontacted leads into ${totalBatches} batch files in: ${outputDir}`);
}

generateBatches();
