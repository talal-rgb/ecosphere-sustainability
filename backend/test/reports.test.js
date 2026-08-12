import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';

import { calculateFootprint } from '../services/carbonEngine.js';
import { getFactorBundle } from '../services/factorProvider.js';
import { buildExcelReport, buildPdfReport } from '../services/reportExporter.js';

test('report dependencies generate valid non-empty Excel and PDF files', async () => {
  const activityData = {
    organization: 'Terrnix Test',
    activities: [{
      id: 'fuel-1',
      quantity: 100,
      unit: 'litre',
      factorGroup: 'stationary_combustion',
      factorId: 'diesel_litre',
      evidenceRef: 'INV-100',
      site: 'Paris'
    }]
  };
  const factors = await getFactorBundle(activityData);
  const result = calculateFootprint(activityData, factors);
  const [excel, pdf] = await Promise.all([
    buildExcelReport(result, activityData),
    buildPdfReport(result, activityData)
  ]);

  assert.ok(excel.length > 10_000, 'Excel workbook should contain report sheets');
  assert.equal(excel.subarray(0, 2).toString(), 'PK', 'Excel output should be an XLSX archive');
  assert.ok(pdf.length > 2_000, 'PDF should contain report content');
  assert.equal(pdf.subarray(0, 4).toString(), '%PDF', 'PDF output should have a PDF signature');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(excel);
  const ledger = workbook.getWorksheet('Calculation Ledger');
  assert.ok(ledger, 'Excel report should include a calculation ledger');
  assert.equal(ledger.getCell('A2').value, 'fuel-1');
  assert.equal(ledger.getCell('B2').value, 'INV-100');
});
