import { createPortalApi } from './api.js';
import { APPLICATION_SECTIONS, buildDashboardView, formatEmissions } from './dashboard-model.js';

const apiOrigin = window.TERRNIX_API_ORIGIN || 'https://terrnix-backend.onrender.com';
const api = createPortalApi(apiOrigin);
const state = { organizations: [], selectedOrganizationId: '', workspace: null };
const elements = {
  status: document.querySelector('[data-status]'),
  organization: document.querySelector('[data-organization-select]'),
  content: document.querySelector('[data-dashboard-content]'),
  navigation: document.querySelector('[data-app-navigation]')
};

start();

async function start() {
  setStatus('Connecting to your Terrnix workspace…');
  try {
    await api.session();
    const result = await api.organizations();
    state.organizations = Array.isArray(result.organizations) ? result.organizations : [];
    if (!state.organizations.length) return renderEmpty('No organization membership is available for this account.');
    const remembered = sessionStorage.getItem('terrnix.organization');
    state.selectedOrganizationId = state.organizations.some((item) => item.id === remembered)
      ? remembered : state.organizations[0].id;
    renderOrganizationOptions();
    await loadWorkspace();
  } catch (error) {
    if (error.status === 401) return renderSignedOut();
    renderError('The workspace could not be loaded. Try again without refreshing submitted data.');
  }
}

async function loadWorkspace() {
  setStatus('Loading verified organization data…');
  state.workspace = await api.workspace(state.selectedOrganizationId);
  sessionStorage.setItem('terrnix.organization', state.selectedOrganizationId);
  renderSection(activeSection());
  setStatus('Workspace data loaded.');
}

function renderOrganizationOptions() {
  elements.organization.replaceChildren(...state.organizations.map((organization) => {
    const option = document.createElement('option');
    option.value = organization.id;
    option.textContent = `${organization.name} · ${organization.role}`;
    option.selected = organization.id === state.selectedOrganizationId;
    return option;
  }));
  elements.organization.addEventListener('change', async () => {
    state.selectedOrganizationId = elements.organization.value;
    try { await loadWorkspace(); } catch { renderError('The selected organization could not be loaded.'); }
  });
}

elements.navigation.addEventListener('click', (event) => {
  const link = event.target.closest('[data-section]');
  if (!link) return;
  event.preventDefault();
  const section = link.dataset.section;
  if (!APPLICATION_SECTIONS.includes(section)) return;
  history.replaceState(null, '', `${location.pathname}?view=${section}`);
  renderSection(section);
});

elements.content.addEventListener('click', (event) => {
  if (event.target.closest('[data-retry]')) start();
});

function renderSection(section) {
  for (const link of elements.navigation.querySelectorAll('[data-section]')) {
    link.toggleAttribute('aria-current', link.dataset.section === section);
  }
  const view = buildDashboardView(state.workspace);
  if (section === 'overview') return renderOverview(view);
  if (section === 'carbon') return renderCarbon(view);
  const collections = {
    evidence: ['Evidence', view.evidence, 'displayName'], reports: ['Reports', view.reports, 'title'],
    facilities: ['Facilities', view.facilities, 'name'], projects: ['Projects', view.projects, 'name'],
    team: ['Team', view.members, 'displayName']
  };
  if (collections[section]) return renderCollection(...collections[section]);
  if (section === 'organizations') return renderOrganization(view);
  if (section === 'reviews') return renderReviews(view);
  if (section === 'subscription') return renderSubscription(view);
  renderPlaceholder('Settings', 'Organization preferences and notification controls will use the existing authenticated settings APIs.');
}

function renderOverview(view) {
  elements.content.innerHTML = `
    <header class="portal-page-heading"><div><p class="portal-eyebrow">Overview</p><h1>${escapeHtml(view.organization.name)}</h1><p>${view.period ? `${escapeHtml(view.period.label)} · ${formatDate(view.period.startsOn)}–${formatDate(view.period.endsOn)}` : 'No reporting period selected'}</p></div><span class="portal-state">${view.period ? escapeHtml(view.period.status.replace('_', ' ')) : 'Setup required'}</span></header>
    <section class="portal-metric-grid" aria-label="Emissions summary">
      ${metric('Total emissions', formatEmissions(view.totalKgCo2e), 'Location-based total')}
      ${view.scopes.map((scope) => metric(scope.label, formatEmissions(scope.kgCo2e), scope.key === 'scope2' ? `Market-based: ${formatEmissions(view.scope2MarketKgCo2e)}` : 'Approved current calculations')).join('')}
    </section>
    <div class="portal-grid-two">
      <section class="portal-panel"><div class="portal-panel-heading"><div><p class="portal-eyebrow">Performance</p><h2>Emissions trend</h2></div></div><div class="portal-trend">${renderTrend(view.trend)}</div></section>
      <section class="portal-panel"><p class="portal-eyebrow">Workflow health</p><h2>Inventory readiness</h2>${progress('Evidence coverage', view.evidenceCoveragePercent)}${progress('High-quality activity data', view.highQualityPercent)}<dl class="portal-inline-stats"><div><dt>Requires review</dt><dd>${view.reviewRequiredCount}</dd></div><div><dt>Approved records</dt><dd>${view.approvedCount}</dd></div></dl></section>
    </div>
    <div class="portal-grid-three">${summaryCard('Facilities', view.facilitiesCount, 'Boundary locations')}${summaryCard('Projects', view.projectsCount, 'Active workspaces')}${summaryCard('Evidence', view.evidenceCount, 'Tenant-protected documents')}</div>
    <section class="portal-panel portal-opportunity"><p class="portal-eyebrow">Reduction opportunity signal</p><h2>Where to focus next</h2><p>${escapeHtml(view.opportunity)}</p><small>Prioritization support only; validate actions against operational feasibility and reviewed inventory data.</small></section>`;
}

function renderCarbon(view) {
  const steps = [
    'Create inventory', 'Select reporting period', 'Define organizational boundary', 'Add facilities',
    'Import activity data', 'Attach evidence', 'Classify scope and category', 'Review emission factor',
    'Calculate and review anomalies', 'Approve and aggregate', 'Generate report'
  ];
  elements.content.innerHTML = `<header class="portal-page-heading"><div><p class="portal-eyebrow">Carbon Accounting Professional</p><h1>${view.inventory ? escapeHtml(view.inventory.name) : 'Build an audit-ready inventory'}</h1><p>Traceable activity data, evidence, factors, calculations, review, and reporting.</p></div></header><section class="portal-panel"><h2>Inventory workflow</h2><ol class="portal-workflow">${steps.map((step, index) => `<li><span>${index + 1}</span><div><strong>${escapeHtml(step)}</strong><small>${workflowStatus(index, view)}</small></div></li>`).join('')}</ol></section><section class="portal-note" role="note"><strong>Document automation boundary</strong><p>Uploads and human review are supported by the application model. OCR and external extraction remain mocked until an approved provider is connected and validated.</p></section>`;
}

function renderCollection(title, items, labelKey) {
  elements.content.innerHTML = `<header class="portal-page-heading"><div><p class="portal-eyebrow">Workspace</p><h1>${title}</h1><p>Data is loaded from the authenticated, tenant-scoped platform API.</p></div></header><section class="portal-panel"><ul class="portal-resource-list">${items.length ? items.map((item) => `<li><strong>${escapeHtml(item[labelKey] || item.name || item.id)}</strong><span>${escapeHtml(item.status || item.roleCode || item.documentType || 'Active')}</span></li>`).join('') : '<li class="portal-empty-row">No records yet.</li>'}</ul></section>`;
}

function renderOrganization(view) { renderPlaceholder('Organizations', `${view.organization.name} is the active tenant. The selector only exposes memberships returned by the authenticated organization API.`); }
function renderReviews(view) { renderPlaceholder('Reviews', `${view.reviewRequiredCount} inventory record${view.reviewRequiredCount === 1 ? '' : 's'} currently require review or anomaly resolution.`); }
function renderSubscription(view) { renderPlaceholder('Subscription', view.billing ? 'Plan, usage, and invoice data are loaded from the billing control plane.' : 'Billing is unavailable or not configured for this organization.'); }
function renderPlaceholder(title, message) { elements.content.innerHTML = `<header class="portal-page-heading"><div><p class="portal-eyebrow">Workspace</p><h1>${escapeHtml(title)}</h1></div></header><section class="portal-panel portal-empty"><p>${escapeHtml(message)}</p></section>`; }
function renderSignedOut() { elements.organization.hidden = true; elements.content.innerHTML = '<section class="portal-auth-state"><p class="portal-eyebrow">Authentication required</p><h1>Sign in to Terrnix</h1><p>The customer workspace is protected. Production sign-in and real email verification remain inactive until an approved SaaS deployment and email credential rotation.</p><a class="portal-button" href="/platform/">Return to platform overview</a></section>'; setStatus('Signed out.'); }
function renderEmpty(message) { elements.content.innerHTML = `<section class="portal-auth-state"><h1>Workspace setup required</h1><p>${escapeHtml(message)}</p></section>`; setStatus(message); }
function renderError(message) { elements.content.innerHTML = `<section class="portal-auth-state" role="alert"><h1>Unable to load workspace</h1><p>${escapeHtml(message)}</p><button class="portal-button" type="button" data-retry>Retry</button></section>`; setStatus('Workspace loading failed.'); }
function setStatus(message) { elements.status.textContent = message; }
function activeSection() { const value = new URLSearchParams(location.search).get('view'); return APPLICATION_SECTIONS.includes(value) ? value : 'overview'; }
function metric(label, value, note) { return `<article class="portal-metric"><p>${label}</p><strong>${value}</strong><small>${note}</small></article>`; }
function summaryCard(label, value, note) { return `<article class="portal-panel portal-summary"><span>${value}</span><h2>${label}</h2><p>${note}</p></article>`; }
function progress(label, value) { const safe = Math.max(0, Math.min(100, Number(value) || 0)); return `<div class="portal-progress"><div><span>${label}</span><strong>${safe}%</strong></div><progress max="100" value="${safe}">${safe}%</progress></div>`; }
function workflowStatus(index, view) { if (!view.inventory) return index === 0 ? 'Ready to begin' : 'Waiting for inventory'; if (!view.period && index > 0) return index === 1 ? 'Next step' : 'Waiting for reporting period'; if (index < 4) return 'Configured in the platform model'; if (index < 8) return view.evidenceCount ? 'Evidence workflow available' : 'Awaiting activity data'; return view.reviewRequiredCount ? `${view.reviewRequiredCount} item(s) need review` : 'Ready when reviewed data is available'; }
function renderTrend(trend) { if (!trend.length) return '<p class="portal-empty-copy">Trend data appears after approved dated activity calculations are available.</p>'; const max = Math.max(...trend.map((item) => Number(item.emissionsKgCo2e) || 0), 1); return trend.map((item) => `<div class="portal-trend-column"><div style="height:${Math.max(4, Math.round((Number(item.emissionsKgCo2e) / max) * 100))}%"></div><span>${escapeHtml(String(item.month).slice(0, 7))}</span></div>`).join(''); }
function formatDate(value) { if (!value) return '—'; return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value)); }
function escapeHtml(value) { const node = document.createElement('span'); node.textContent = String(value ?? ''); return node.innerHTML; }
