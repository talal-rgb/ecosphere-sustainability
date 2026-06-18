#!/usr/bin/env node
/**
 * Update KPI Dashboard
 * 
 * Reads GA and GSC data files and updates TERRNIX_KPI_DASHBOARD.md
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_PATH = path.join(__dirname, '..', 'TERRNIX_KPI_DASHBOARD.md');
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

  // Verify dashboard file exists and is readable
  if (!fs.existsSync(DASHBOARD_PATH)) {
    console.error('❌ Dashboard file not found:', DASHBOARD_PATH);
    process.exit(1);
  }

  let dashboard = fs.readFileSync(DASHBOARD_PATH, 'utf8');
  const today = new Date().toISOString().split('T')[0];
  
  console.log(`📄 Loaded dashboard: ${DASHBOARD_PATH}`);
  console.log(`📊 GA data: ${gaData ? 'present' : 'missing'}`);
  console.log(`🔍 GSC data: ${gscData ? 'present' : 'missing'}`);

  // Update last updated date
  dashboard = dashboard.replace(
    /\*\*Last Updated:\*\* .*/,
    `**Last Updated:** ${today}`
  );

  // Update next update date (next Monday)
  const nextMonday = new Date();
  nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()) % 7 || 7);
  dashboard = dashboard.replace(
    /\*\*Next Update:\*\* .*/,
    `**Next Update:** ${nextMonday.toISOString().split('T')[0]}`
  );

  // Update Traffic section if GA data available
  if (gaData && gaData.traffic) {
    const t = gaData.traffic;
    
    // Update summary table
    dashboard = updateTableRow(dashboard, 'Organic Sessions', t.organicSessions || '-');
    dashboard = updateTableRow(dashboard, 'Total Users', t.totalUsers || '-');
    dashboard = updateTableRow(dashboard, 'Returning Users', t.returningUsers || '-');

    // Update traffic sources
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
    
    // Update summary table
    dashboard = updateTableRow(dashboard, 'Impressions', s.impressions || '-');
    dashboard = updateTableRow(dashboard, 'Clicks', s.clicks || '-');
    dashboard = updateTableRow(dashboard, 'CTR', s.ctr ? `${s.ctr}%` : '-');

    // Update GSC overview
    let gscTable = '| Metric | This Week | Last Week | Change |\n';
    gscTable += '|--------|-----------|-----------|--------|\n';
    gscTable += `| Impressions | ${s.impressions} | - | - |\n`;
    gscTable += `| Clicks | ${s.clicks} | - | - |\n`;
    gscTable += `| CTR | ${s.ctr}% | - | - |\n`;
    gscTable += `| Avg Position | ${s.avgPosition} | - | - |\n`;

    dashboard = replaceSection(dashboard, '### Search Console Overview', gscTable);

    // Update top keywords
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

    // Update calculator performance
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

  // Save updated dashboard
  try {
    fs.writeFileSync(DASHBOARD_PATH, dashboard);
    console.log('✅ Dashboard updated successfully');
  } catch (writeError) {
    console.error('❌ Failed to write dashboard:', writeError.message);
    process.exit(1);
  }

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

function updateTableRow(content, metricName, newValue) {
  // Find the row with this metric and update the "This Week" column
  const lines = content.split('\n');
  const updatedLines = lines.map(line => {
    if (line.includes(`| **${metricName}**`) || line.includes(`| ${metricName} `)) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 3) {
        parts[2] = newValue; // This Week column
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
  let sectionReplaced = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === sectionHeader) {
      result.push(line);
      result.push('');
      result.push(newContent);
      inSection = true;
      sectionReplaced = true;
      continue;
    }

    if (inSection) {
      // Skip until next section header
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

// Run if called directly
if (require.main === module) {
  updateDashboard();
}

module.exports = { updateDashboard };
