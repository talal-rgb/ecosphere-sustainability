import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import request from 'supertest';

import { parseActivityUpload } from '../services/activityIngestion.js';
import app from '../server.js';

const csv = `date,supplier,activity_type,quantity,unit,site,evidence_ref
2026-01-31,Grid Co,Electricity invoice,1000,kWh,London,ELEC-1
2026-02-01,Fuel Co,Diesel delivery,100,litres,Paris,FUEL-1
2026-02-02,Travel Co,Short-haul flight,800,passenger-km,Paris,TRAVEL-1
2026-02-03,Unknown Co,Office supplies,50,items,Paris,PO-1
2026-02-04,Fleet Co,Car mileage,300,km,Paris,FLEET-1`;

test('CSV ingestion classifies approved rows and flags uncertain or unsupported rows', async () => {
  const result = await parseActivityUpload({ buffer: Buffer.from(csv), fileName: 'activities.csv', mimeType: 'text/csv' });

  assert.equal(result.summary.rows_ready, 3);
  assert.equal(result.summary.rows_requiring_review, 1);
  assert.equal(result.summary.rows_excluded, 1);
  assert.equal(result.activities.length, 3);
  assert.deepEqual(result.summary.scopes, { scope_2: 1, scope_1: 1, scope_3: 1 });
  assert.equal(result.activities[0].factorId, 'uk_2026');
  assert.equal(result.activities[1].evidenceRef, 'FUEL-1');
  assert.match(result.anomalies.find((item) => item.row === 5).message, /No approved emission-factor mapping/);
});

test('XLSX ingestion reads the first worksheet without executing formulas', async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Activity data');
  worksheet.addRow(['activity type', 'quantity', 'unit', 'invoice number']);
  worksheet.addRow(['Natural gas bill', 250, 'm3', 'GAS-22']);
  const buffer = await workbook.xlsx.writeBuffer();

  const result = await parseActivityUpload({
    buffer,
    fileName: 'activity-data.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  assert.equal(result.summary.rows_ready, 1);
  assert.equal(result.activities[0].factorId, 'natural_gas_m3');
  assert.equal(result.activities[0].evidenceRef, 'GAS-22');
});

test('ingestion normalizes MWh to the factor activity unit before calculation', async () => {
  const input = 'activity_type,quantity,unit,evidence_ref\nElectricity invoice,2,MWh,ELEC-MWH-1';
  const result = await parseActivityUpload({ buffer: Buffer.from(input), fileName: 'power.csv', mimeType: 'text/csv' });

  assert.equal(result.activities[0].sourceQuantity, 2);
  assert.equal(result.activities[0].sourceUnit, 'mwh');
  assert.equal(result.activities[0].quantity, 2000);
  assert.equal(result.activities[0].unit, 'kWh');
});

test('duplicate evidence references are held for review to prevent double counting', async () => {
  const input = `activity_type,quantity,unit,evidence_ref
Diesel delivery,100,litres,INV-DUP
Diesel delivery,100,litres,INV-DUP`;
  const result = await parseActivityUpload({ buffer: Buffer.from(input), fileName: 'duplicates.csv', mimeType: 'text/csv' });

  assert.equal(result.summary.rows_ready, 0);
  assert.equal(result.summary.rows_requiring_review, 2);
  assert.equal(result.activities.length, 0);
  assert.equal(result.anomalies.filter((item) => /duplicate invoice/.test(item.message)).length, 2);
});

test('ingestion rejects unsupported files and invalid quantity schemas', async () => {
  await assert.rejects(
    parseActivityUpload({ buffer: Buffer.from('content'), fileName: 'invoice.pdf', mimeType: 'application/pdf' }),
    (error) => error.code === 'unsupported_file_type'
  );
  await assert.rejects(
    parseActivityUpload({ buffer: Buffer.from('activity_type,unit\nDiesel,litres'), fileName: 'missing.csv', mimeType: 'text/csv' }),
    (error) => error.code === 'missing_quantity_column'
  );
});

test('ingestion API returns a calculation-ready payload without persisting uploads', async () => {
  const response = await request(app)
    .post('/api/carbon/ingest')
    .set('Origin', 'https://terrnix.com')
    .field('organization', 'Example Organization')
    .field('reportingPeriod', 'FY2026')
    .attach('file', Buffer.from(csv), { filename: 'activities.csv', contentType: 'text/csv' })
    .expect(200);

  assert.equal(response.body.calculation_input.organization, 'Example Organization');
  assert.equal(response.body.calculation_input.activities.length, 3);
  assert.equal(response.body.source.rows_received, 5);
  assert.match(response.body.next_step, /Review all classifications/);

  const calculation = await request(app)
    .post('/api/carbon/calculate')
    .set('Origin', 'https://terrnix.com')
    .send(response.body.calculation_input)
    .expect(200);
  assert.equal(calculation.body.evidence_summary.activities_calculated, 3);
  assert.equal(calculation.body.totals.total_location_based_tonnes_co2e, 0.492);
});
