#!/usr/bin/env node
/**
 * Fetch Google Analytics 4 Data
 * 
 * Fetches weekly metrics for the KPI dashboard:
 * - Organic sessions
 * - Total users
 * - Returning users
 * - Traffic sources
 * - Calculator events
 * - PDF downloads
 * - Quiz completions
 * - Contact form submissions
 */

const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const fs = require('fs');
const path = require('path');

const PROPERTY_ID = process.env.GA_PROPERTY_ID;
const CREDENTIALS = process.env.GA_CREDENTIALS;

async function fetchGAData() {
  if (!PROPERTY_ID || !CREDENTIALS) {
    console.log('⚠️  GA credentials not configured. Skipping GA data fetch.');
    console.log('Set GA_PROPERTY_ID and GA_CREDENTIALS environment variables.');
    return null;
  }

  let credsPath = null;

  try {
    // Write credentials to temp file
    credsPath = path.join(__dirname, '..', '.ga-credentials.json');
    fs.writeFileSync(credsPath, CREDENTIALS);

    const analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: credsPath
    });

    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const formatDate = (d) => d.toISOString().split('T')[0];

    console.log(`📊 Fetching GA data: ${formatDate(startDate)} to ${formatDate(endDate)}`);

    // Fetch traffic metrics
    const [trafficResponse] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
      }],
      dimensions: [
        { name: 'sessionDefaultChannelGroup' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'newUsers' }
      ]
    });

    // Fetch event metrics
    const [eventResponse] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
      }],
      dimensions: [
        { name: 'eventName' }
      ],
      metrics: [
        { name: 'eventCount' },
        { name: 'totalUsers' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: [
              'calculator_start',
              'calculator_complete',
              'pdf_download',
              'quiz_complete',
              'contact_submit',
              'newsletter_signup'
            ]
          }
        }
      }
    });

    // Process traffic data
    const trafficData = {
      organicSessions: 0,
      totalUsers: 0,
      newUsers: 0,
      returningUsers: 0,
      sources: {}
    };

    trafficResponse.rows.forEach(row => {
      const channel = row.dimensionValues[0].value;
      const sessions = parseInt(row.metricValues[0].value);
      const users = parseInt(row.metricValues[1].value);
      const newUsers = parseInt(row.metricValues[2].value);

      trafficData.totalUsers += users;
      trafficData.newUsers += newUsers;
      trafficData.sources[channel] = { sessions, users };

      if (channel === 'Organic Search') {
        trafficData.organicSessions = sessions;
      }
    });

    trafficData.returningUsers = trafficData.totalUsers - trafficData.newUsers;

    // Process event data
    const eventData = {
      calculatorRuns: 0,
      calculatorCompletions: 0,
      pdfDownloads: 0,
      quizCompletions: 0,
      contactForms: 0,
      newsletterSignups: 0
    };

    eventResponse.rows.forEach(row => {
      const eventName = row.dimensionValues[0].value;
      const count = parseInt(row.metricValues[0].value);

      switch (eventName) {
        case 'calculator_start':
          eventData.calculatorRuns = count;
          break;
        case 'calculator_complete':
          eventData.calculatorCompletions = count;
          break;
        case 'pdf_download':
          eventData.pdfDownloads = count;
          break;
        case 'quiz_complete':
          eventData.quizCompletions = count;
          break;
        case 'contact_submit':
          eventData.contactForms = count;
          break;
        case 'newsletter_signup':
          eventData.newsletterSignups = count;
          break;
      }
    });

    const result = {
      weekEnding: formatDate(endDate),
      traffic: trafficData,
      events: eventData
    };

    // Save to temp file for dashboard update script
    const outputPath = path.join(__dirname, '..', '.ga-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

    console.log('✅ GA data fetched successfully');
    console.log(`   Organic Sessions: ${trafficData.organicSessions}`);
    console.log(`   Total Users: ${trafficData.totalUsers}`);
    console.log(`   Calculator Runs: ${eventData.calculatorRuns}`);

    return result;

  } catch (error) {
    console.error('❌ Error fetching GA data:', error.message);
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
  fetchGAData();
}

module.exports = { fetchGAData };
