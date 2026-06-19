import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

function safe(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

function round(value) {
  const n = Number(value || 0);
  return Math.round(n * 1000) / 1000;
}

function styleWorksheet(ws) {
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.eachRow((row, rowNumber) => {
    row.alignment = { vertical: 'top', wrapText: true };
    if (rowNumber === 1) {
      row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E3D' } };
    }
  });
}

export async function buildExcelReport(result, activityData = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Terrnix';
  workbook.created = new Date();
  workbook.subject = 'Carbon footprint calculation report';
  workbook.company = 'Terrnix Sustainability Intelligence';

  const summary = workbook.addWorksheet('Executive Summary');
  summary.columns = [{ width: 34 }, { width: 22 }, { width: 52 }];
  summary.addRow(['Metric', 'Value', 'Notes']);
  summary.addRow(['Organization', result.organization, 'Provided by user or default.']);
  summary.addRow(['Reporting period', result.reporting_period, 'Provided by user or default.']);
  summary.addRow(['Generated at', result.generated_at, 'UTC timestamp from API.']);
  summary.addRow(['Scope 1 tonnes CO2e', result.totals.scope1_tonnes_co2e, 'Direct emissions.']);
  summary.addRow(['Scope 2 location-based tonnes CO2e', result.totals.scope2_location_tonnes_co2e, 'Purchased electricity/energy using grid factors.']);
  summary.addRow(['Scope 2 market-based tonnes CO2e', result.totals.scope2_market_tonnes_co2e, 'Simplified market-based result if EAC/PPA data supplied.']);
  summary.addRow(['Scope 3 tonnes CO2e', result.totals.scope3_tonnes_co2e, 'Value chain emissions.']);
  summary.addRow(['Total location-based tonnes CO2e', result.totals.total_location_based_tonnes_co2e, 'Scope 1 + Scope 2 LB + Scope 3.']);
  summary.addRow(['Data quality score', `${result.data_quality_score}/100`, 'Lower if fallback factors or missing categories are used.']);
  styleWorksheet(summary);

  const inputs = workbook.addWorksheet('Inputs');
  inputs.columns = [{ header: 'Input', width: 35 }, { header: 'Value', width: 70 }];
  for (const [key, value] of Object.entries(activityData)) inputs.addRow([key, safe(value)]);
  styleWorksheet(inputs);

  const breakdown = workbook.addWorksheet('Scope Breakdown');
  breakdown.columns = [{ header: 'Category', width: 42 }, { header: 'Tonnes CO2e', width: 18 }, { header: 'Scope', width: 12 }];
  breakdown.addRow(['Stationary combustion', round(result.breakdown.scope1_stationary_tonnes_co2e), 'Scope 1']);
  breakdown.addRow(['Mobile combustion', round(result.breakdown.scope1_mobile_tonnes_co2e), 'Scope 1']);
  breakdown.addRow(['Fugitive emissions', round(result.breakdown.scope1_fugitive_tonnes_co2e), 'Scope 1']);
  breakdown.addRow(['Purchased electricity location-based', round(result.breakdown.scope2_electricity_tonnes_co2e), 'Scope 2']);
  breakdown.addRow(['Purchased steam/heat', round(result.breakdown.scope2_heat_tonnes_co2e), 'Scope 2']);
  breakdown.addRow(['Scope 3 total', round(result.totals.scope3_tonnes_co2e), 'Scope 3']);
  styleWorksheet(breakdown);

  const s3 = workbook.addWorksheet('Scope 3 Detail');
  s3.columns = [
    { header: 'Category', width: 30 },
    { header: 'Activity amount', width: 18 },
    { header: 'Activity unit', width: 18 },
    { header: 'Tonnes CO2e', width: 18 },
    { header: 'Factor ID', width: 32 },
    { header: 'Factor source', width: 45 }
  ];
  for (const row of result.breakdown.scope3_details || []) {
    s3.addRow([row.category, row.amount, row.unit, round(row.tonnes_co2e), row.factor?.id || 'missing', row.factor?.source || 'Missing factor']);
  }
  styleWorksheet(s3);

  const sources = workbook.addWorksheet('Factor Sources');
  sources.columns = [
    { header: 'ID', width: 35 },
    { header: 'Name', width: 44 },
    { header: 'Value', width: 15 },
    { header: 'Unit', width: 18 },
    { header: 'Source', width: 38 },
    { header: 'Year', width: 12 },
    { header: 'Confidence', width: 14 },
    { header: 'URL', width: 60 }
  ];
  for (const f of result.factor_sources || []) sources.addRow([f.id, f.name, f.value, f.unit, f.source, f.year, f.confidence, f.source_url || '']);
  styleWorksheet(sources);

  const methods = workbook.addWorksheet('Methodology');
  methods.columns = [{ header: 'Methodology / warning / assumption', width: 120 }];
  for (const item of result.formula_summary || []) methods.addRow([`Formula: ${item}`]);
  for (const item of result.assumptions || []) methods.addRow([`Assumption: ${item}`]);
  for (const item of result.warnings || []) methods.addRow([`Warning: ${item}`]);
  styleWorksheet(methods);

  const recs = workbook.addWorksheet('Recommendations');
  recs.columns = [{ header: 'Priority', width: 14 }, { header: 'Action', width: 46 }, { header: 'Why it matters', width: 70 }];
  recs.addRow(['High', 'Replace fallback factors with supplier-specific or official factors.', 'Improves accuracy and auditability.']);
  recs.addRow(['High', 'Focus reduction plan on largest categories first.', 'Largest categories produce the most impact.']);
  recs.addRow(['Medium', 'Separate location-based and market-based Scope 2.', 'Required for credible electricity reporting.']);
  recs.addRow(['Medium', 'Improve Scope 3 activity data.', 'Activity data is usually better than spend-based estimates.']);
  styleWorksheet(recs);

  return workbook.xlsx.writeBuffer();
}

export async function buildPdfReport(result, activityData = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(22).text('Terrnix Carbon Footprint Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text('Generated by Terrnix Sustainability Intelligence', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Organization: ${result.organization}`);
    doc.text(`Reporting period: ${result.reporting_period}`);
    doc.text(`Generated: ${result.generated_at}`);
    doc.moveDown();

    doc.fontSize(16).text('Executive Summary');
    doc.moveDown(0.3);
    doc.fontSize(11);
    const rows = [
      ['Scope 1', result.totals.scope1_tonnes_co2e],
      ['Scope 2 location-based', result.totals.scope2_location_tonnes_co2e],
      ['Scope 2 market-based', result.totals.scope2_market_tonnes_co2e],
      ['Scope 3', result.totals.scope3_tonnes_co2e],
      ['Total location-based', result.totals.total_location_based_tonnes_co2e],
      ['Data quality score', `${result.data_quality_score}/100`]
    ];
    for (const [label, value] of rows) doc.text(`${label}: ${value} tonnes CO2e`);
    doc.moveDown();

    doc.fontSize(16).text('Calculation Method');
    doc.fontSize(10);
    for (const item of result.formula_summary || []) doc.text(`- ${item}`);
    doc.moveDown();

    doc.fontSize(16).text('Factor Sources');
    doc.fontSize(8.5);
    for (const f of result.factor_sources || []) {
      doc.text(`- ${f.name}: ${f.value} ${f.unit}; ${f.source}; year ${f.year}; confidence ${f.confidence}`);
    }
    doc.moveDown();

    doc.fontSize(16).text('Warnings and Assumptions');
    doc.fontSize(9.5);
    for (const warning of result.warnings || []) doc.text(`Warning: ${warning}`);
    for (const assumption of result.assumptions || []) doc.text(`Assumption: ${assumption}`);
    doc.moveDown();

    doc.fontSize(16).text('Recommended Next Actions');
    doc.fontSize(10);
    doc.text('1. Replace fallback factors with supplier-specific or official factors where possible.');
    doc.text('2. Improve data quality for the largest emissions categories first.');
    doc.text('3. Keep a versioned factor source log for auditability.');
    doc.text('4. Use qualified professional review before public reporting or regulatory submission.');
    doc.moveDown();

    doc.fontSize(8).fillColor('gray').text('Disclaimer: This report is an estimate for education and planning. It is not third-party assurance, legal advice, financial advice, or regulatory approval.');
    doc.end();
  });
}
