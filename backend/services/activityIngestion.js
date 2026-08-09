import path from 'node:path';
import ExcelJS from 'exceljs';

const MAX_ROWS = 5000;
const MAX_CELL_LENGTH = 500;

const HEADER_ALIASES = {
  activityType: ['activity_type', 'activity type', 'type', 'category', 'emissions source', 'source type'],
  description: ['description', 'item description', 'line description', 'details'],
  quantity: ['quantity', 'amount', 'usage', 'consumption', 'activity amount', 'activity_data'],
  unit: ['unit', 'uom', 'activity unit', 'measurement unit'],
  date: ['date', 'invoice date', 'activity date', 'transaction date'],
  supplier: ['supplier', 'vendor', 'merchant'],
  site: ['site', 'location', 'facility', 'business unit'],
  evidenceRef: ['evidence_ref', 'evidence ref', 'invoice number', 'invoice id', 'document id', 'reference'],
  currency: ['currency', 'currency code'],
  cost: ['cost', 'spend', 'invoice total', 'total amount']
};

const RULES = [
  rule(/\b(electricity|electric|power|utility)\b/, ['kwh', 'mwh'], 'electricity_location_based', 'uk_2026', 2, 'Purchased electricity', 'high'),
  rule(/\b(natural gas|mains gas|gas utility)\b/, ['m3', 'cubic metre', 'cubic meter'], 'stationary_combustion', 'natural_gas_m3', 1, 'Stationary combustion', 'high'),
  rule(/\b(diesel|gasoil|gas oil)\b/, ['l', 'litre', 'liter', 'litres', 'liters'], 'stationary_combustion', 'diesel_litre', 1, 'Stationary combustion', 'high'),
  rule(/\b(petrol|gasoline)\b/, ['l', 'litre', 'liter', 'litres', 'liters'], 'stationary_combustion', 'petrol_litre', 1, 'Stationary combustion', 'high'),
  rule(/\b(diesel car|diesel vehicle|fleet diesel)\b/, ['km', 'kilometre', 'kilometer', 'kilometres', 'kilometers'], 'mobile_combustion', 'passenger_car_diesel_km', 1, 'Mobile combustion', 'high'),
  rule(/\b(petrol car|gasoline car|petrol vehicle|fleet petrol)\b/, ['km', 'kilometre', 'kilometer', 'kilometres', 'kilometers'], 'mobile_combustion', 'passenger_car_petrol_km', 1, 'Mobile combustion', 'high'),
  rule(/\b(car|vehicle|fleet mileage)\b/, ['km', 'kilometre', 'kilometer', 'kilometres', 'kilometers'], 'mobile_combustion', 'passenger_car_unknown_km', 1, 'Mobile combustion', 'medium'),
  rule(/\b(short.?haul flight|short.?haul air|regional flight)\b/, ['passenger-km', 'passenger km', 'pkm'], 'scope3', 'business_flight_short_haul_pkm', 3, 'Category 6 — Business travel', 'high'),
  rule(/\b(long.?haul flight|long.?haul air|international flight)\b/, ['passenger-km', 'passenger km', 'pkm'], 'scope3', 'business_flight_long_haul_pkm', 3, 'Category 6 — Business travel', 'high'),
  rule(/\b(rail|train)\b/, ['passenger-km', 'passenger km', 'pkm'], 'scope3', 'business_rail_pkm', 3, 'Category 6 — Business travel', 'high')
];

function rule(pattern, units, factorGroup, factorId, scope, ghgCategory, confidence) {
  return {
    pattern,
    units,
    unitMultipliers: Object.fromEntries(units.map((unit) => [unit, unit === 'mwh' ? 1000 : 1])),
    canonicalUnit: canonicalUnitFor(factorId),
    factorGroup,
    factorId,
    scope,
    ghgCategory,
    confidence
  };
}

function canonicalUnitFor(factorId) {
  if (factorId.endsWith('_kwh') || factorId === 'uk_2026') return 'kWh';
  if (factorId.endsWith('_m3')) return 'm3';
  if (factorId.endsWith('_litre')) return 'litre';
  if (factorId.endsWith('_km')) return 'km';
  if (factorId.endsWith('_pkm')) return 'passenger-km';
  return null;
}

export async function parseActivityUpload({ buffer, fileName, mimeType }) {
  const extension = path.extname(fileName || '').toLowerCase();
  let table;

  if (extension === '.csv' || mimeType === 'text/csv' || mimeType === 'application/csv') {
    table = parseCsv(buffer.toString('utf8'));
  } else if (
    extension === '.xlsx' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    table = await parseWorkbook(buffer);
  } else {
    throw ingestionError('unsupported_file_type', 'Only CSV and XLSX files are accepted in this ingestion endpoint.');
  }

  if (table.length < 2) throw ingestionError('empty_file', 'The upload must contain a header row and at least one activity row.');
  if (table.length - 1 > MAX_ROWS) throw ingestionError('row_limit_exceeded', `Uploads are limited to ${MAX_ROWS} activity rows.`);

  const headerMap = buildHeaderMap(table[0]);
  if (headerMap.quantity === undefined) throw ingestionError('missing_quantity_column', 'A quantity or amount column is required.');
  if (headerMap.activityType === undefined && headerMap.description === undefined) {
    throw ingestionError('missing_activity_column', 'An activity type, category, or description column is required.');
  }

  const reviewRows = table.slice(1).filter(hasValues).map((row, index) => normalizeRow(row, index + 2, headerMap));
  applyCrossRowAnomalies(reviewRows);
  const activities = reviewRows.filter((row) => row.status === 'ready').map(toActivity);
  const anomalies = reviewRows.flatMap((row) => row.anomalies.map((message) => ({ row: row.sourceRow, severity: row.status === 'excluded' ? 'error' : 'warning', message })));

  return {
    schema_version: '1.0',
    classification_method: 'deterministic_activity_rules_v1',
    source: {
      file_name: safeText(fileName, 200),
      media_type: safeText(mimeType, 100),
      rows_received: reviewRows.length
    },
    summary: {
      rows_ready: activities.length,
      rows_requiring_review: reviewRows.filter((row) => row.status === 'review').length,
      rows_excluded: reviewRows.filter((row) => row.status === 'excluded').length,
      anomaly_count: anomalies.length,
      scopes: countBy(activities, (item) => `scope_${item.scope}`),
      sites: [...new Set(activities.map((item) => item.site).filter(Boolean))]
    },
    activities,
    review_rows: reviewRows,
    anomalies,
    next_step: 'Review all classifications and anomalies before submitting activities to /api/carbon/calculate.'
  };
}

function normalizeRow(row, sourceRow, headerMap) {
  const activityType = getCell(row, headerMap.activityType);
  const description = getCell(row, headerMap.description);
  const quantityRaw = getCell(row, headerMap.quantity);
  const unit = normalizeUnit(getCell(row, headerMap.unit));
  const searchText = `${activityType} ${description}`.trim().toLowerCase();
  const quantity = parseQuantity(quantityRaw);
  const mapping = classify(searchText, unit);
  const evidenceRef = safeText(getCell(row, headerMap.evidenceRef), 200);
  const anomalies = [];

  if (!Number.isFinite(quantity) || quantity <= 0) anomalies.push('Quantity must be a positive number.');
  if (!unit) anomalies.push('Unit is missing; classification requires manual confirmation.');
  if (!mapping) anomalies.push('No approved emission-factor mapping was found.');
  if (!evidenceRef) anomalies.push('Evidence reference is missing; add an invoice or document identifier before approval.');

  const status = !Number.isFinite(quantity) || quantity <= 0 || !mapping
    ? 'excluded'
    : (!unit || !evidenceRef || mapping.confidence !== 'high' ? 'review' : 'ready');

  return {
    sourceRow,
    status,
    activityType: safeText(activityType),
    description: safeText(description),
    quantity: Number.isFinite(quantity) ? quantity : null,
    unit,
    normalizedQuantity: Number.isFinite(quantity) && mapping ? quantity * mapping.multiplier : null,
    normalizedUnit: mapping?.canonicalUnit || null,
    date: safeText(getCell(row, headerMap.date), 50) || null,
    supplier: safeText(getCell(row, headerMap.supplier), 200) || null,
    site: safeText(getCell(row, headerMap.site), 200) || null,
    evidenceRef: evidenceRef || `row-${sourceRow}`,
    cost: parseQuantity(getCell(row, headerMap.cost)) || null,
    currency: safeText(getCell(row, headerMap.currency), 10).toUpperCase() || null,
    mapping,
    anomalies
  };
}

function applyCrossRowAnomalies(rows) {
  const byEvidence = new Map();
  for (const row of rows) {
    if (!row.evidenceRef || row.evidenceRef.startsWith('row-')) continue;
    const key = row.evidenceRef.toLowerCase();
    byEvidence.set(key, [...(byEvidence.get(key) || []), row]);
  }
  for (const duplicates of byEvidence.values()) {
    if (duplicates.length < 2) continue;
    for (const row of duplicates) {
      row.anomalies.push(`Evidence reference ${row.evidenceRef} appears in multiple rows; confirm this is not a duplicate invoice.`);
      if (row.status === 'ready') row.status = 'review';
    }
  }

  const byFactor = new Map();
  for (const row of rows) {
    if (!row.mapping || !Number.isFinite(row.normalizedQuantity) || row.normalizedQuantity <= 0) continue;
    const key = `${row.mapping.factorGroup}:${row.mapping.factorId}`;
    byFactor.set(key, [...(byFactor.get(key) || []), row]);
  }
  for (const group of byFactor.values()) {
    if (group.length < 5) continue;
    const quantities = group.map((row) => row.normalizedQuantity).sort((a, b) => a - b);
    const median = quantities[Math.floor(quantities.length / 2)];
    if (!median) continue;
    for (const row of group) {
      if (row.normalizedQuantity <= median * 20) continue;
      row.anomalies.push('Quantity is more than 20 times the median for this activity type; verify the unit and source document.');
      if (row.status === 'ready') row.status = 'review';
    }
  }
}

function classify(text, unit) {
  for (const candidate of RULES) {
    if (candidate.pattern.test(text) && candidate.units.includes(unit)) {
      return {
        factorGroup: candidate.factorGroup,
        factorId: candidate.factorId,
        scope: candidate.scope,
        ghgCategory: candidate.ghgCategory,
        confidence: candidate.confidence,
        multiplier: candidate.unitMultipliers[unit],
        canonicalUnit: candidate.canonicalUnit
      };
    }
  }
  return null;
}

function toActivity(row) {
  return {
    id: `import-row-${row.sourceRow}`,
    activityType: row.activityType || row.description,
    quantity: row.normalizedQuantity,
    unit: row.normalizedUnit,
    sourceQuantity: row.quantity,
    sourceUnit: row.unit,
    date: row.date,
    supplier: row.supplier,
    site: row.site,
    evidenceRef: row.evidenceRef,
    factorGroup: row.mapping.factorGroup,
    factorId: row.mapping.factorId,
    scope: row.mapping.scope,
    ghgCategory: row.mapping.ghgCategory,
    classificationConfidence: row.mapping.confidence
  };
}

async function parseWorkbook(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer, { ignoreNodes: ['dataValidations'] });
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];
  const rows = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    rows.push(Array.from({ length: row.cellCount }, (_, index) => cellText(row.getCell(index + 1))));
  });
  return rows;
}

function cellText(cell) {
  const value = cell.value;
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    if ('result' in value) return safeText(value.result);
    if ('text' in value) return safeText(value.text);
    return safeText(cell.text);
  }
  return safeText(value);
}

function parseCsv(input) {
  const text = input.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted && char === '"' && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(safeText(field));
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(safeText(field));
      if (hasValues(row)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
      if (field.length > MAX_CELL_LENGTH) throw ingestionError('cell_limit_exceeded', `Individual cells are limited to ${MAX_CELL_LENGTH} characters.`);
    }
  }
  row.push(safeText(field));
  if (hasValues(row)) rows.push(row);
  if (quoted) throw ingestionError('invalid_csv', 'The CSV contains an unterminated quoted field.');
  return rows;
}

function buildHeaderMap(headerRow) {
  const normalized = headerRow.map(normalizeHeader);
  return Object.fromEntries(Object.entries(HEADER_ALIASES).map(([field, aliases]) => [field, normalized.findIndex((header) => aliases.includes(header))]).filter(([, index]) => index >= 0));
}

function normalizeHeader(value) {
  return safeText(value).trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
}

function normalizeUnit(value) {
  const unit = safeText(value, 50).trim().toLowerCase().replace(/³/g, '3').replace(/\s+/g, ' ');
  if (['cubic metres', 'cubic meters', 'm^3'].includes(unit)) return 'm3';
  if (['passenger kilometres', 'passenger kilometers', 'passenger-kilometres', 'passenger-kilometers'].includes(unit)) return 'passenger-km';
  return unit;
}

function parseQuantity(value) {
  if (typeof value === 'number') return value;
  const normalized = safeText(value, 100).replace(/\s/g, '').replace(/,/g, '');
  if (!normalized) return Number.NaN;
  return Number(normalized);
}

function getCell(row, index) {
  return index === undefined ? '' : row[index];
}

function safeText(value, maxLength = MAX_CELL_LENGTH) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, maxLength);
}

function hasValues(row) {
  return row.some((value) => safeText(value) !== '');
}

function countBy(items, keyFn) {
  return items.reduce((result, item) => {
    const key = keyFn(item);
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
}

function ingestionError(code, message) {
  const error = new Error(message);
  error.code = code;
  error.status = 400;
  return error;
}
