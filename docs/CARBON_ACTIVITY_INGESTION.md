# Carbon Activity Ingestion API

## Purpose

`POST /api/carbon/ingest` converts structured CSV or XLSX activity data into a reviewable calculation payload. It is the first ingestion layer for the Terrnix Carbon Accounting product; it does not claim to perform OCR or autonomous assurance.

The endpoint:

- validates file type and size;
- reads up to 5,000 rows from the first worksheet or CSV table;
- maps supported activity descriptions and units to approved factors;
- normalizes units such as MWh to kWh;
- flags unsupported, invalid, and lower-confidence rows;
- preserves supplier, site, date, and evidence references;
- returns a payload for `POST /api/carbon/calculate`.

Uploads are processed in memory and are not persisted by this endpoint.

## Request

Use `multipart/form-data` with:

| Field | Required | Description |
| --- | --- | --- |
| `file` | Yes | `.csv` or `.xlsx`, maximum 5 MiB |
| `organization` | No | Organization name, maximum 200 characters |
| `reportingPeriod` | No | Reporting period, maximum 100 characters |

```bash
curl -X POST http://localhost:3000/api/carbon/ingest \
  -F 'organization=Example Organization' \
  -F 'reportingPeriod=FY2026' \
  -F 'file=@activity-data.csv;type=text/csv'
```

## Accepted columns

Header aliases are case-insensitive. At minimum, provide a quantity/amount column and either an activity type/category or description column.

| Canonical field | Common accepted headers |
| --- | --- |
| Activity | `activity_type`, `activity type`, `type`, `category`, `description` |
| Quantity | `quantity`, `amount`, `usage`, `consumption` |
| Unit | `unit`, `uom`, `activity unit` |
| Evidence | `evidence_ref`, `invoice number`, `document id`, `reference` |
| Context | `date`, `supplier`, `site`, `currency`, `cost` |

Example:

```csv
date,supplier,activity_type,quantity,unit,site,evidence_ref
2026-01-31,Grid Co,Electricity invoice,2,MWh,London,ELEC-1
2026-02-01,Fuel Co,Diesel delivery,100,litres,Paris,FUEL-1
2026-02-02,Travel Co,Short-haul flight,800,passenger-km,Paris,TRAVEL-1
```

## Review contract

The response separates rows into:

- `ready`: high-confidence approved mapping, included in `calculation_input.activities`;
- `review`: lower-confidence mapping, excluded until a user confirms it;
- `excluded`: invalid quantity, unsupported unit, or no approved factor mapping.

Clients must show `review_rows` and `anomalies` before calculation approval. Deterministic classification is explainable but does not replace source-document review.

## Calculation and audit trail

Submit `calculation_input` from the reviewed response to `POST /api/carbon/calculate`. Results include:

- Scope 1, Scope 2, and Scope 3 totals;
- row-level `breakdown.calculation_lines`;
- factor IDs, values, units, sources, years, and URLs;
- formulas and evidence references;
- excluded-row warnings and evidence summary.

Excel exports include a `Calculation Ledger` worksheet. PDF exports summarize evidence coverage and direct the reviewer to the ledger for row-level traceability.

## Current supported mappings

- UK 2026 electricity;
- natural gas, diesel, and petrol stationary combustion;
- diesel, petrol, and unknown-fuel passenger-car mileage;
- short-haul and long-haul business flights;
- national rail business travel.

Factors are a curated subset of the UK Government GHG Conversion Factors for Company Reporting 2026. International inventories require jurisdiction-appropriate factor selection. Market-based Scope 2 remains provisional until supplier or residual-mix evidence is supplied.

## Planned extensions

PDF/image OCR, document storage, human approval workflows, duplicate detection, expanded Scope 3 mappings, jurisdiction selection, and organization-level evidence retention are separate controlled releases.
