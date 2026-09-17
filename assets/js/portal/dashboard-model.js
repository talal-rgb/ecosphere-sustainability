export const APPLICATION_SECTIONS = Object.freeze([
  'overview', 'carbon', 'evidence', 'reports', 'organizations', 'facilities',
  'projects', 'reviews', 'team', 'subscription', 'settings'
]);

export function buildDashboardView(workspace = {}) {
  const resourceStates = Object.fromEntries(['organization', 'access', 'projects', 'facilities', 'evidence', 'reports', 'members', 'billing', 'carbon', 'reviews']
    .map((key) => [key, resourceState(workspace[key])]));
  const metrics = workspace.carbon?.overview?.metrics || {};
  const organization = workspace.organization?.organization || {};
  const usage = organization.usage || {};
  const projects = list(workspace.projects);
  const evidence = list(workspace.evidence);
  const reports = list(workspace.reports);
  const facilities = list(workspace.facilities);
  const members = list(workspace.members);
  const reviews = Array.isArray(workspace.reviews?.reviews) ? workspace.reviews.reviews : [];
  const totalKg = number(metrics.totalKgCo2e);
  const scopes = [
    { key: 'scope1', label: 'Scope 1', kgCo2e: number(metrics.scope1KgCo2e) },
    { key: 'scope2', label: 'Scope 2', kgCo2e: number(metrics.scope2LocationKgCo2e) },
    { key: 'scope3', label: 'Scope 3', kgCo2e: number(metrics.scope3KgCo2e) }
  ];
  const largestScope = scopes.reduce((largest, scope) => scope.kgCo2e > largest.kgCo2e ? scope : largest, scopes[0]);
  return {
    organization: { id: organization.id || '', name: organization.name || 'Organization' },
    resourceStates,
    carbonAvailable: resourceStates.carbon === 'available',
    period: workspace.carbon?.overview?.reportingPeriod || null,
    inventory: workspace.carbon?.overview?.inventory || null,
    totalKgCo2e: totalKg,
    scopes,
    scope2MarketKgCo2e: number(metrics.scope2MarketKgCo2e),
    facilitiesCount: facilities.length || number(usage.facilities),
    projectsCount: projects.length || number(usage.activeProjects),
    evidenceCount: evidence.length || number(usage.evidenceDocuments),
    evidenceCoveragePercent: number(metrics.evidenceCoveragePercent),
    highQualityPercent: number(metrics.highQualityPercent),
    reviewRequiredCount: Math.max(number(metrics.reviewRequiredCount), reviews.length),
    approvedCount: number(metrics.approvedCount),
    projects, evidence, reports, facilities, members, reviews,
    access: workspace.access?.access || {},
    billing: workspace.billing?.billing || null,
    trend: Array.isArray(workspace.carbon?.overview?.trend) ? workspace.carbon.overview.trend : [],
    byFacility: Array.isArray(workspace.carbon?.overview?.byFacility) ? workspace.carbon.overview.byFacility : [],
    byCategory: Array.isArray(workspace.carbon?.overview?.byCategory) ? workspace.carbon.overview.byCategory : [],
    comparison: workspace.carbon?.overview?.comparison || null,
    opportunity: totalKg > 0
      ? `${largestScope.label} is the largest measured source and should be prioritized for data review and reduction planning.`
      : 'Complete the first reviewed inventory to identify evidence-backed reduction opportunities.'
  };
}

export function formatEmissions(kgCo2e) {
  const value = number(kgCo2e);
  if (value >= 1000) return `${new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value / 1000)} tCO₂e`;
  return `${new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value)} kgCO₂e`;
}

function list(value) { return Array.isArray(value?.items) ? value.items : []; }
function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function resourceState(value) {
  if (value?.error) {
    if (value.status === 402) return 'upgrade';
    if (value.status === 401 || value.status === 403) return 'forbidden';
    return 'error';
  }
  return value ? 'available' : 'error';
}
