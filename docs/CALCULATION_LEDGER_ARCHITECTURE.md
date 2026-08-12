# Evidence-backed calculation ledger

Carbon Accounting Professional creates a calculation only from the current evidence version after extraction and classification review is resolved. The caller explicitly selects an approved factor; Terrnix rejects scope mismatches, unsupported unit conversions, rejected fields, unresolved reviews, and unacknowledged low-confidence factors.

Each calculated activity preserves the evidence document and version, extraction run, source field and page/row locator, review revisions, original and normalized quantity, deterministic conversion, effective classification, factor snapshot and bundle version, formula, result, actor, timestamp, and a canonical input hash. The lineage row is immutable. A later correction creates a new calculation version rather than overwriting provenance.

The first adapter uses the curated local factor bundle. Future factor registries must implement the same snapshot contract and may not replace the recorded factor version in an existing ledger entry.
