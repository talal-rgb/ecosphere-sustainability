import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import { APPLICATION_SECTIONS, buildDashboardView, formatEmissions } from '../assets/js/portal/dashboard-model.js';

test('dashboard model maps API resources without double-counting market Scope 2', () => {
  const view = buildDashboardView({
    organization: { organization: { id: 'org-a', name: 'Acme', usage: { facilities: 2 } } },
    carbon: { overview: { metrics: {
      totalKgCo2e: 1000, scope1KgCo2e: 100, scope2LocationKgCo2e: 200,
      scope2MarketKgCo2e: 150, scope3KgCo2e: 700, evidenceCoveragePercent: 80,
      highQualityPercent: 60, reviewRequiredCount: 2
    }, trend: [] } },
    projects: { items: [{ id: 'project-a', name: 'FY2026' }] },
    evidence: { items: [] }, reports: { items: [] }, facilities: { items: [] }, members: { items: [] }
  });
  assert.equal(view.totalKgCo2e, 1000);
  assert.equal(view.scope2MarketKgCo2e, 150);
  assert.equal(view.facilitiesCount, 2);
  assert.match(view.opportunity, /Scope 3/);
});

test('portal exposes the requested application structure and emissions formatting', () => {
  assert.deepEqual(APPLICATION_SECTIONS, [
    'overview', 'carbon', 'evidence', 'reports', 'organizations', 'facilities',
    'projects', 'reviews', 'team', 'subscription', 'settings'
  ]);
  assert.equal(formatEmissions(1250), '1.3 tCO₂e');
  assert.equal(formatEmissions(undefined), '0 kgCO₂e');
});

test('portal shell preserves keyboard, status, and responsive accessibility contracts', async () => {
  const html = await fs.readFile(new URL('../portal/index.html', import.meta.url), 'utf8');
  const css = await fs.readFile(new URL('../assets/css/portal.css', import.meta.url), 'utf8');
  const api = await fs.readFile(new URL('../assets/js/portal/api.js', import.meta.url), 'utf8');
  assert.match(html, /<meta name="viewport"/);
  assert.match(html, /class="skip-link" href="#main-content"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-label="Application sections"/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(api, /credentials: 'include'/);
  assert.match(api, /X-Terrnix-Organization-ID/);
});
