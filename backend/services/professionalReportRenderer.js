import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const MAX_REPORT_BYTES = 2 * 1024 * 1024;
const MAX_SECTION_ROWS = 2000;
const MAX_CELL_CHARACTERS = 20_000;

const SECTION_DEFINITIONS = Object.freeze([
  ['executiveSummary', 'Executive Summary'],
  ['inventoryBoundary', 'Inventory Boundary'],
  ['reportingPeriod', 'Reporting Period'],
  ['methodology', 'Methodology'],
  ['scope1', 'Scope 1'],
  ['scope2', 'Scope 2'],
  ['scope3', 'Scope 3'],
  ['emissionSources', 'Emission Sources'],
  ['emissionFactors', 'Emission Factors'],
  ['calculationMethodology', 'Calculation Methodology'],
  ['evidenceCoverage', 'Evidence Coverage'],
  ['dataQuality', 'Data Quality'],
  ['assumptions', 'Assumptions'],
  ['exceptionsAndAnomalies', 'Exceptions and Anomalies'],
  ['yearOverYearAnalysis', 'Year-over-Year Analysis'],
  ['decarbonizationOpportunities', 'Decarbonization Opportunities'],
  ['terrnixRecommendations', 'Terrnix Recommendations'],
  ['auditProvenanceAppendix', 'Audit and Provenance Appendix']
]);

export function validateProfessionalReport(report) {
  if (!report || typeof report !== 'object' || Array.isArray(report)) throw validationError('report must be an object.');
  let serialized;
  try { serialized = JSON.stringify(report); }
  catch { throw validationError('report must contain JSON-serializable values.'); }
  if (Buffer.byteLength(serialized, 'utf8') > MAX_REPORT_BYTES) {
    throw validationError('report exceeds the supported size limit.');
  }
  const metadata = object(report.metadata, 'metadata');
  requiredText(metadata.organizationName, 'metadata.organizationName', 200);
  requiredText(metadata.reportTitle, 'metadata.reportTitle', 250);
  requiredText(metadata.reportingStandard, 'metadata.reportingStandard', 120);
  requiredText(metadata.generatedAt, 'metadata.generatedAt', 50);
  if (!Number.isFinite(new Date(metadata.generatedAt).valueOf())) throw validationError('metadata.generatedAt must be an ISO timestamp.');
  const sections = object(report.sections, 'sections');
  for (const [key] of SECTION_DEFINITIONS) {
    if (!(key in sections)) throw validationError(`sections.${key} is required.`);
    sectionRows(sections[key], key);
  }
  return { metadata, sections };
}

export async function buildProfessionalExcelReport(report) {
  const { metadata, sections } = validateProfessionalReport(report);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Terrnix';
  workbook.company = metadata.organizationName;
  workbook.subject = metadata.reportTitle;
  workbook.created = new Date(metadata.generatedAt);
  workbook.properties.date1904 = false;

  const cover = workbook.addWorksheet('Report Overview');
  cover.columns = [{ width: 30 }, { width: 80 }];
  addHeader(cover, ['Report field', 'Value']);
  for (const [label, value] of [
    ['Report title', metadata.reportTitle], ['Organization', metadata.organizationName],
    ['Reporting standard', metadata.reportingStandard], ['Generated at', metadata.generatedAt],
    ['Inventory version', metadata.inventoryVersion || 'Not supplied'],
    ['Calculation ledger hash', metadata.ledgerHash || 'Not supplied']
  ]) cover.addRow([safeCell(label), safeCell(value)]);
  finishWorksheet(cover);

  for (const [key, title] of SECTION_DEFINITIONS) {
    const worksheet = workbook.addWorksheet(sheetName(title));
    const rows = sectionRows(sections[key], key);
    const columns = uniqueColumns(rows);
    worksheet.columns = columns.map((column) => ({ key: column, width: Math.min(60, Math.max(16, column.length + 4)) }));
    addHeader(worksheet, columns.map(humanize));
    for (const row of rows) worksheet.addRow(Object.fromEntries(columns.map((column) => [column, safeCell(row[column])] )));
    finishWorksheet(worksheet);
  }

  return workbook.xlsx.writeBuffer();
}

export async function buildProfessionalPdfReport(report) {
  const { metadata, sections } = validateProfessionalReport(report);
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ margin: 46, size: 'A4', info: {
      Title: metadata.reportTitle, Author: 'Terrnix', Subject: metadata.reportingStandard
    } });
    const chunks = [];
    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    document.fillColor('#143d2b').fontSize(24).text(metadata.reportTitle);
    document.moveDown(.4).fillColor('#334e42').fontSize(11).text(metadata.organizationName);
    document.text(`${metadata.reportingStandard} · ${metadata.generatedAt}`);
    document.moveDown(1.2).fillColor('#111111').fontSize(9)
      .text('Audit-ready, traceable, evidence-backed, reproducible, and version-controlled. Independent assurance or certification is not provided by Terrnix.');

    for (const [key, title] of SECTION_DEFINITIONS) {
      ensureSpace(document, 110);
      document.moveDown().fillColor('#166534').fontSize(15).text(title, { keepTogether: true });
      document.moveDown(.25).fillColor('#222222').fontSize(9.5);
      const rows = sectionRows(sections[key], key);
      for (const row of rows) {
        ensureSpace(document, 55);
        const entries = Object.entries(row);
        if (entries.length === 1 && entries[0][0] === 'text') document.text(String(entries[0][1]), { paragraphGap: 5 });
        else document.text(entries.map(([label, value]) => `${humanize(label)}: ${display(value)}`).join(' · '), { paragraphGap: 5 });
      }
    }

    ensureSpace(document, 80);
    document.moveDown().fillColor('#666666').fontSize(8)
      .text('Terrnix supports inventory preparation and review. External assurance, certification, legal conclusions, and regulatory acceptance remain the responsibility of qualified independent parties.');
    document.end();
  });
}

export { SECTION_DEFINITIONS };

function sectionRows(value, field) {
  if (Array.isArray(value)) {
    if (!value.length) return [{ status: 'No items reported' }];
    if (value.length > MAX_SECTION_ROWS) throw validationError(`sections.${field} has too many rows.`);
    return value.map((item, index) => normalizeRow(item, `${field}[${index}]`));
  }
  if (value && typeof value === 'object') return [normalizeRow(value, field)];
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return [{ text: value }];
  throw validationError(`sections.${field} must be text, an object, or an array.`);
}

function normalizeRow(value, field) {
  if (value === null || value === undefined) return { value: '' };
  if (typeof value !== 'object' || Array.isArray(value)) return { value };
  const entries = Object.entries(value);
  if (!entries.length) return { status: 'Not reported' };
  if (entries.length > 40) throw validationError(`${field} has too many fields.`);
  return Object.fromEntries(entries.map(([key, item]) => [
    requiredText(key, `${field} key`, 100), boundedCellValue(item, `${field}.${key}`)
  ]));
}

function uniqueColumns(rows) {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return columns.length ? columns : ['status'];
}

function addHeader(worksheet, labels) {
  const row = worksheet.addRow(labels);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
}

function finishWorksheet(worksheet) {
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: Math.max(1, worksheet.columnCount) } };
  worksheet.eachRow((row) => { row.alignment = { vertical: 'top', wrapText: true }; });
}

function safeCell(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (text.length > MAX_CELL_CHARACTERS) throw validationError('Report cell exceeds the supported size limit.');
  return /^[\u0000-\u0020]*[=+\-@]/u.test(text) ? `'${text}` : text;
}

function display(value) {
  if (value === null || value === undefined || value === '') return 'Not supplied';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function sheetName(title) { return title.replace(/[\\/*?:\[\]]/g, '').slice(0, 31); }
function humanize(value) { return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (letter) => letter.toUpperCase()); }
function ensureSpace(document, height) { if (document.y + height > document.page.height - document.page.margins.bottom) document.addPage(); }
function boundedCellValue(value, field) {
  if (value === null || value === undefined || typeof value === 'number' || typeof value === 'boolean') return value;
  let text;
  try { text = typeof value === 'string' ? value : JSON.stringify(value); }
  catch { throw validationError(`${field} must be JSON-serializable.`); }
  if (typeof text !== 'string' || text.length > MAX_CELL_CHARACTERS) {
    throw validationError(`${field} exceeds the supported cell size limit.`);
  }
  return value;
}
function object(value, field) { if (!value || typeof value !== 'object' || Array.isArray(value)) throw validationError(`${field} must be an object.`); return value; }
function requiredText(value, field, max) { const text = String(value || '').trim(); if (!text || text.length > max) throw validationError(`${field} is required and must be at most ${max} characters.`); return text; }
function validationError(message) { const error = new Error(message); error.code = 'invalid_professional_report'; error.status = 400; return error; }
