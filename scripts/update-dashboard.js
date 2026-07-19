#!/usr/bin/env node
/**
 * Update KPI Dashboard
 * 
 * Reads GA and GSC data files and updates:
 * 1. TERRNIX_KPI_DASHBOARD.md (human-readable markdown)
 * 2. analytics-dashboard/dashboard-data.json (machine-readable for HTML dashboard)
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_PATH = path.join(__dirname, '..', 'TERRNIX_KPI_DASHBOARD.md');
const DASHBOARD_DATA_PATH = path.join(__dirname, '..', 'analytics-dashboard', 'dashboard-data.json');
const GA_DATA_PATH = path.join(__dirname, '..', '.ga-data.json');
const GSC_DATA_PATH = path.join(__dirname, '..', '.gsc-data.json');

function loadJSON(path) {
  try {
    if (fs.existsSync(path)) {
      return JSON.parse(fs.readFileSync(path, 'utf8'));
    }
  } catch (e) {
    console.warn(`⚠️  Could not load ${path}:`, e.message);
  }
  return null;
}

function updateDashboard() {
  console.log('📝 Updating KPI Dashboard...\n');

  const gaData = loadJSON(GA_DATA_PATH);
  const gscData = loadJSON(GSC_DATA_PATH);

  if (!gaData && !gscData) {
    console.log('⚠️  No data available to update dashboard');
    console.log('Run fetch-ga-data.js and/or fetch-gsc-data.js first');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const nextMonday = new Date();
  nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()) % 7 || 7);

  // Build dashboard-data.json for the HTML dashboard
  const dashboardData = {
    timestamp: new Date().toISOString(),
    nextUpdate: nextMonday.toISOString().split('T')[0],
    workflowRun: `${today} (automated)`,
    ga4: {
      connected: !!gaData,
      propertyId: '543732911',
      measurementId: 'G-MVBZJTV3S9'
    },
    gsc: {
      connected: !!gscData,
      siteUrl: 'sc-domain:terrnix.com'
    },
    clarity: {
      connected: true,
      projectId: 'xf95a67vp9'
    },
    gtm: {
      connected: false,
      reason: 'Placeholder ID (GTM-XXXXXXX) — not yet configured'
    },
    traffic: gaData?.traffic || null,
    seo: gscData?.summary || null,
    events: gaData?.events || null,
    keywords: gscData?.keywords || []
  };

  // Write dashboard-data.json
  try {
    fs.writeFileSync(DASHBOARD_DATA_PATH, JSON.stringify(dashboardData, null, 2));
    console.log('✅ Dashboard data JSON written:', DASHBOARD_DATA_PATH);
  } catch (e) {
    console.error('❌ Failed to write dashboard-data.json:', e.message);
  }

  // Update markdown dashboard
  updateMarkdownDashboard(gaData, gscData, today, nextMonday);

  // Clean up temp data files
  [GA_DATA_PATH, GSC_DATA_PATH].forEach(p => {
    if (fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
        console.log(`🗑️  Cleaned up: ${p}`);
      } catch (cleanupError) {
        console.warn(`⚠️  Failed to clean up ${p}:`, cleanupError.message);
      }
    }
  });
}

function updateMarkdownDashboard(gaData, gscData, today, nextMonday) {
  if (!fs.existsSync(DASHBOARD_PATH)) {
    console.error('❌ Dashboard file not found:', DASHBOARD_PATH);
    return;
  }

  let dashboard = fs.readFileSync(DASHBOARD_PATH, 'utf8');

  console.log(`📄 Loaded dashboard: ${DASHBOARD_PATH}`);
  console.log(`📊 GA data: ${gaData ? 'present' : 'missing'}`);
  console.log(`🔍 GSC data: ${gscData ? 'present' : 'missing'}`);

  // Update last updated date
  dashboard = dashboard.replace(
    /\*\*Last Updated:\*\* .*/,
    `**Last Updated:** ${today}`
  );

  // Update next update date
  dashboard = dashboard.replace(
    /\*\*Next Update:\*\* .*/,
    `**Next Update:** ${nextMonday.toISOString().split('T')[0]}`
  );

  // Update Traffic section if GA data available
  if (gaData && gaData.traffic) {
    const t = gaData.traffic;
    
    dashboard = updateTableRow(dashboard, 'Organic Sessions', t.organicSessions || '-');
    dashboard = updateTableRow(dashboard, 'Total Users', t.totalUsers || '-');
    dashboard = updateTableRow(dashboard, 'Returning Users', t.returningUsers || '-');

    if (t.sources) {
      let sourcesTable = '| Source | Sessions | % of Total |\n';
      sourcesTable += '|--------|----------|------------|\n';
      
      Object.entries(t.sources).forEach(([source, data]) => {
        const pct = t.totalUsers > 0 ? ((data.users / t.totalUsers) * 100).toFixed(1) : 0;
        sourcesTable += `| ${source} | ${data.sessions} | ${pct}% |\n`;
      });

      dashboard = replaceSection(dashboard, '### Traffic Sources', sourcesTable);
    }
  }

  // Update SEO section if GSC data available
  if (gscData && gscData.summary) {
    const s = gscData.summary;
    
    dashboard = updateTableRow(dashboard, 'Impressions', s.impressions || '-');
    dashboard = updateTableRow(dashboard, 'Clicks', s.clicks || '-');
    dashboard = updateTableRow(dashboard, 'CTR', s.ctr ? `${s.ctr}%` : '-');

    let gscTable = '| Metric | This Week | Last Week | Change |\n';
    gscTable += '|--------|-----------|-----------|--------|\n';
    gscTable += `| Impressions | ${s.impressions} | - | - |\n`;
    gscTable += `| Clicks | ${s.clicks} | - | - |\n`;
    gscTable += `| CTR | ${s.ctr}% | - | - |\n`;
    gscTable += `| Avg Position | ${s.avgPosition} | - | - |\n`;

    dashboard = replaceSection(dashboard, '### Search Console Overview', gscTable);

    if (gscData.keywords && gscData.keywords.length > 0) {
      let keywordsTable = '| Rank | Keyword | Impressions | Clicks | CTR | Position | Change |\n';
      keywordsTable += '|------|---------|-------------|--------|-----|----------|--------|\n';
      
      gscData.keywords.forEach(kw => {
        keywordsTable += `| ${kw.rank} | ${kw.keyword} | ${kw.impressions} | ${kw.clicks} | ${kw.ctr}% | ${kw.position} | - |\n`;
      });

      dashboard = replaceSection(dashboard, '### Top 20 Keywords', keywordsTable);
    }
  }

  // Update Product section if GA events available
  if (gaData && gaData.events) {
    const e = gaData.events;
    
    dashboard = updateTableRow(dashboard, 'Calculator Runs', e.calculatorRuns || '-');
    dashboard = updateTableRow(dashboard, 'PDF Downloads', e.pdfDownloads || '-');
    dashboard = updateTableRow(dashboard, 'Quiz Completions', e.quizCompletions || '-');
    dashboard = updateTableRow(dashboard, 'Contact Forms', e.contactForms || '-');

    let calcTable = '| Calculator | Runs | Completions | Completion Rate | Avg Time |\n';
    calcTable += '|------------|------|-------------|-----------------|----------|\n';
    calcTable += `| Carbon Footprint | ${e.calculatorRuns} | ${e.calculatorCompletions} | - | - |\n`;
    calcTable += `| **Total** | ${e.calculatorRuns} | ${e.calculatorCompletions} | - | - |\n`;

    dashboard = replaceSection(dashboard, '### Calculator Performance', calcTable);
  }

  // Update update log
  const logEntry = `| ${today} | Automated | Weekly KPI update |\n`;
  dashboard = dashboard.replace(
    /(\| Date \| Updated By \| Notes \|\n\|------\|------------\|-------\|\n)/,
    `$1${logEntry}`
  );

  try {
    fs.writeFileSync(DASHBOARD_PATH, dashboard);
    console.log('✅ Markdown dashboard updated successfully');
  } catch (writeError) {
    console.error('❌ Failed to write dashboard:', writeError.message);
  }
}

function updateTableRow(content, metricName, newValue) {
  const lines = content.split('\n');
  const updatedLines = lines.map(line => {
    if (line.includes(`| **${metricName}**`) || line.includes(`| ${metricName} `)) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 3) {
        parts[2] = newValue;
        return parts.join(' | ');
      }
    }
    return line;
  });
  return updatedLines.join('\n');
}

function replaceSection(content, sectionHeader, newContent) {
  const lines = content.split('\n');
  const result = [];
  let inSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === sectionHeader) {
      result.push(line);
      result.push('');
      result.push(newContent);
      inSection = true;
      continue;
    }

    if (inSection) {
      if (line.startsWith('## ') || line.startsWith('### ')) {
        inSection = false;
        result.push(line);
      }
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

if (require.main === module) {
  updateDashboard();
}

module.exports = { updateDashboard };
