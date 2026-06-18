#!/usr/bin/env node
/**
 * Fetch Google Search Console Data
 * 
 * Fetches weekly SEO metrics for the KPI dashboard:
 * - Impressions
 * - Clicks
 * - CTR
 * - Average position
 * - Top 20 keywords
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SITE_URL = process.env.GSC_SITE_URL || 'https://terrnix.com';
const CREDENTIALS = process.env.GSC_CREDENTIALS;

async function fetchGSCData() {
  if (!CREDENTIALS) {
    console.log('⚠️  GSC credentials not configured. Skipping GSC data fetch.');
    console.log('Set GSC_CREDENTIALS and GSC_SITE_URL environment variables.');
    return null;
  }

  let credsPath = null;

  try {
    // Write credentials to temp file
    credsPath = path.join(__dirname, '..', '.gsc-credentials.json');
    fs.writeFileSync(credsPath, CREDENTIALS);

    const auth = new google.auth.GoogleAuth({
      keyFile: credsPath,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
    });

    const searchconsole = google.searchconsole({
      version: 'v3',
      auth
    });

    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const formatDate = (d) => d.toISOString().split('T')[0];

    console.log(`🔍 Fetching GSC data: ${formatDate(startDate)} to ${formatDate(endDate)}`);

    // Fetch site overview
    const [overviewResponse] = await Promise.all([
      searchconsole.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          dimensions: ['date']
        }
      })
    ]);

    // Fetch top keywords
    const [keywordsResponse] = await Promise.all([
      searchconsole.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          dimensions: ['query'],
          rowLimit: 20,
          startRow: 0
        }
      })
    ]);

    // Calculate totals from overview
    let totalClicks = 0;
    let totalImpressions = 0;
    let totalPosition = 0;
    let rowCount = 0;

    if (overviewResponse.data.rows) {
      overviewResponse.data.rows.forEach(row => {
        totalClicks += row.clicks || 0;
        totalImpressions += row.impressions || 0;
        totalPosition += row.position || 0;
        rowCount++;
      });
    }

    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : 0;
    const avgPosition = rowCount > 0 ? (totalPosition / rowCount).toFixed(1) : 0;

    // Process top keywords
    const keywords = [];
    if (keywordsResponse.data.rows) {
      keywordsResponse.data.rows.forEach((row, index) => {
        keywords.push({
          rank: index + 1,
          keyword: row.keys[0],
          impressions: row.impressions || 0,
          clicks: row.clicks || 0,
          ctr: row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(2) : 0,
          position: row.position ? row.position.toFixed(1) : 0
        });
      });
    }

    const result = {
      weekEnding: formatDate(endDate),
      summary: {
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr: avgCTR,
        avgPosition: avgPosition
      },
      keywords: keywords
    };

    // Save to temp file for dashboard update script
    const outputPath = path.join(__dirname, '..', '.gsc-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

    console.log('✅ GSC data fetched successfully');
    console.log(`   Impressions: ${totalImpressions}`);
    console.log(`   Clicks: ${totalClicks}`);
    console.log(`   CTR: ${avgCTR}%`);
    console.log(`   Avg Position: ${avgPosition}`);
    console.log(`   Keywords tracked: ${keywords.length}`);

    return result;

  } catch (error) {
    console.error('❌ Error fetching GSC data:', error.message);
    console.error('Stack:', error.stack);
    return null;
  } finally {
    // Always clean up temp credentials
    if (credsPath && fs.existsSync(credsPath)) {
      try {
        fs.unlinkSync(credsPath);
        console.log('🔒 Cleaned up temporary credentials file');
      } catch (cleanupError) {
        console.warn('⚠️  Failed to clean up credentials file:', cleanupError.message);
      }
    }
  }
}

// Run if called directly
if (require.main === module) {
  fetchGSCData();
}

module.exports = { fetchGSCData };
