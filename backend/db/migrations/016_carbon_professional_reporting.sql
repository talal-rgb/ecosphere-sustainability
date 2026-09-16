INSERT INTO platform.report_template_definitions (
  code, name, report_type, audience, supported_formats, template_spec
) VALUES (
  'carbon-professional',
  'Carbon Accounting Professional Report',
  'technical',
  'sustainability leaders, management, and reviewers',
  ARRAY['pdf', 'xlsx'],
  jsonb_build_object(
    'schemaVersion', 1,
    'sections', jsonb_build_array(
      'executiveSummary', 'inventoryBoundary', 'reportingPeriod', 'methodology',
      'scope1', 'scope2', 'scope3', 'emissionSources', 'emissionFactors',
      'calculationMethodology', 'evidenceCoverage', 'dataQuality', 'assumptions',
      'exceptionsAndAnomalies', 'yearOverYearAnalysis', 'decarbonizationOpportunities',
      'terrnixRecommendations', 'auditProvenanceAppendix'
    ),
    'assuranceLanguage', 'audit-ready, traceable, evidence-backed, reproducible, version-controlled',
    'externalAssuranceRequired', true
  )
);
