import assert from 'node:assert/strict';
import test from 'node:test';
import ExcelJS from 'exceljs';

import {
  SECTION_DEFINITIONS,
  buildProfessionalExcelReport,
  buildProfessionalPdfReport,
  validateProfessionalReport
} from '../services/professionalReportRenderer.js';

function reportFixture() {
  return {
    metadata: {
      organizationName: 'Example Manufacturing', reportTitle: 'FY2026 GHG Inventory',
      reportingStandard: 'GHG Protocol Corporate Standard', generatedAt: '2026-09-15T12:00:00.000Z',
      inventoryVersion: '3', ledgerHash: 'a'.repeat(64)
    },
    sections: Object.fromEntries(SECTION_DEFINITIONS.map(([key]) => [key, [{
      status: 'reviewed', detail: `${key} content`, evidenceReference: 'evidence-version-1'
    }]]))
  };
}

test('professional report schema requires every audit-oriented section', () => {
  const report = reportFixture();
  delete report.sections.evidenceCoverage;
  assert.throws(() => validateProfessionalReport(report), /evidenceCoverage is required/);
  assert.doesNotThrow(() => validateProfessionalReport(reportFixture()));
});

test('Excel report includes the professional section set and neutralizes formula injection', async () => {
  const report = reportFixture();
  report.sections.assumptions = [
    { assumption: '=HYPERLINK("https://example.test")' },
    { assumption: ' \t@SUM(1,1)' },
    { assumption: '\r-2+3' }
  ];
  const buffer = await buildProfessionalExcelReport(report);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  assert.ok(buffer.byteLength > 10_000);
  assert.ok(workbook.getWorksheet('Executive Summary'));
  assert.ok(workbook.getWorksheet('Emission Factors'));
  assert.ok(workbook.getWorksheet('Audit and Provenance Appendix'));
  assert.equal(workbook.getWorksheet('Assumptions').getCell('A2').value, "'=HYPERLINK(\"https://example.test\")");
  assert.equal(workbook.getWorksheet('Assumptions').getCell('A3').value, "' \t@SUM(1,1)");
  assert.equal(workbook.getWorksheet('Assumptions').getCell('A4').value, "'\n-2+3");
});

test('professional report validation rejects oversized sections and cells', () => {
  const tooManyRows = reportFixture();
  tooManyRows.sections.scope3 = Array.from({ length: 2001 }, () => ({ category: 'Purchased goods' }));
  assert.throws(() => validateProfessionalReport(tooManyRows), /too many rows/);

  const oversizedCell = reportFixture();
  oversizedCell.sections.assumptions = [{ assumption: 'x'.repeat(20_001) }];
  assert.throws(() => validateProfessionalReport(oversizedCell), /cell size limit/);
});

test('PDF renderer produces a non-empty professional report without assurance claims', async () => {
  const buffer = await buildProfessionalPdfReport(reportFixture());
  assert.equal(buffer.subarray(0, 4).toString(), '%PDF');
  assert.ok(buffer.byteLength > 1_500);
});
