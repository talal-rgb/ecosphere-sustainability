# Carbon Accounting Professional reporting contract

The `carbon-professional` template produces PDF and Excel artifacts from versioned report content. It is designed for reviewable inventory reporting, not external assurance or certification.

## Required report sections

1. Executive Summary
2. Inventory Boundary
3. Reporting Period
4. Methodology
5. Scope 1
6. Scope 2
7. Scope 3
8. Emission Sources
9. Emission Factors
10. Calculation Methodology
11. Evidence Coverage
12. Data Quality
13. Assumptions
14. Exceptions and Anomalies
15. Year-over-Year Analysis
16. Decarbonization Opportunities
17. Terrnix Recommendations
18. Audit and Provenance Appendix

Every generated artifact must retain the report content version, source manifest, calculation identifiers, evidence-version identifiers, renderer version, SHA-256 digest, and generation audit event through the existing report engine.

## Integration boundary

- PDF and Excel rendering are deterministic and require no external provider.
- The report worker and private object-storage upload remain separate adapters.
- A mocked object-storage adapter may validate queue and metadata behavior locally, but it is not evidence of a real staging upload or authorized download.
- Recommendations are decision support and must remain distinguishable from verified inventory facts.
- Terrnix must not claim independent assurance, certification, legal conclusions, or regulatory acceptance.
