#!/usr/bin/env node
/**
 * Monthly Content Review Script
 * 
 * This script:
 * 1. Reads article data from CONTENT_PERFORMANCE.md
 * 2. Fetches metrics from Google Search Console and Google Analytics
 * 3. Calculates scores using the ContentScoringEngine
 * 4. Assigns lifecycle states
 * 5. Generates action recommendations
 * 6. Outputs a markdown report
 */

const fs = require('fs');
const path = require('path');

// Import the scoring engine
const ContentScoringEngine = require('../assets/js/contentScoring');

// Configuration
const CONFIG = {
  performanceFile: path.join(__dirname, '..', 'CONTENT_PERFORMANCE.md'),
  outputDir: path.join(__dirname, '..'),
  gscCredentials: process.env.GSC_CREDENTIALS,
  gaCredentials: process.env.GA_CREDENTIALS,
};

/**
 * Parse article registry from CONTENT_PERFORMANCE.md
 */
function parseArticleRegistry(content) {
  const lines = content.split('\n');
  const articles = [];
  let inTable = false;
  
  for (const line of lines) {
    if (line.includes('| URL |')) {
      inTable = true;
      continue;
    }
    if (inTable && line.startsWith('|') && !line.includes('---')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      if (parts.length >= 4 && parts[0] !== 'URL') {
        articles.push({
          url: parts[0],
          title: parts[1],
          published: parts[2],
          keyword: parts[3],
          score: parts[4] || 'TBD',
          state: parts[5] || '🆕 New',
          lastReview: parts[6] || 'Never'
        });
      }
    }
  }
  
  return articles;
}

/**
 * Mock metrics fetcher (replace with actual API calls)
 */
async function fetchMetrics(article) {
  // TODO: Replace with actual GSC/GA API calls
  // For now, return placeholder data
  return {
    monthlyUsers: 0,
    monthlyConversions: 0,
    avgSessionDuration: 0,
    pagesPerSession: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    position: 0,
    relevanceChecks: {
      keywordInTitle: true,
      internalLinks: 2,
      hasCalculatorOrCTA: false,
      coreOfferingRelevance: 15,
      freshnessScore: 20
    }
  };
}

/**
 * Generate markdown report
 */
function generateReport(articles, scores) {
  const now = new Date();
  const monthYear = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  let report = `# 📊 Monthly Content Review - ${monthYear}\n\n`;
  report += `**Generated:** ${now.toISOString()}\n\n`;
  
  // Summary
  const stateCounts = {};
  scores.forEach(s => {
    stateCounts[s.state] = (stateCounts[s.state] || 0) + 1;
  });
  
  report += `## Summary\n\n`;
  report += `- **Total Articles:** ${articles.length}\n`;
  report += `- **Double Down:** ${stateCounts.doubleDown || 0}\n`;
  report += `- **Maintain:** ${stateCounts.maintain || 0}\n`;
  report += `- **At Risk:** ${stateCounts.atRisk || 0}\n`;
  report += `- **Consolidate:** ${stateCounts.consolidate || 0}\n`;
  report += `- **Sunset:** ${stateCounts.sunset || 0}\n\n`;
  
  // Articles by State
  report += `## Articles by State\n\n`;
  
  const states = ['doubleDown', 'maintain', 'atRisk', 'consolidate', 'sunset'];
  const stateLabels = {
    doubleDown: '🚀 Double Down',
    maintain: '✅ Maintain',
    atRisk: '⚠️ At Risk',
    consolidate: '🔧 Consolidate',
    sunset: '🌅 Sunset'
  };
  
  for (const state of states) {
    const stateArticles = scores.filter(s => s.state === state);
    if (stateArticles.length === 0) continue;
    
    report += `### ${stateLabels[state]} (${stateArticles.length})\n\n`;
    report += `| Article | Score | Traffic | Conversions | Action |\n`;
    report += `|---------|-------|---------|-------------|--------|\n`;
    
    for (const item of stateArticles) {
      report += `| ${item.article.title} | ${item.score.overall} | ${item.metrics.monthlyUsers} | ${item.metrics.monthlyConversions} | ${item.recommendations[0] || 'Review'} |\n`;
    }
    report += `\n`;
  }
  
  // Action Items
  report += `## Action Items\n\n`;
  
  const doubleDown = scores.filter(s => s.state === 'doubleDown');
  if (doubleDown.length > 0) {
    report += `### 🚀 Expand These Winners\n`;
    doubleDown.forEach(item => {
      report += `- [ ] **${item.article.title}** (Score: ${item.score.overall})\n`;
      item.recommendations.forEach(rec => {
        report += `  - ${rec}\n`;
      });
    });
    report += `\n`;
  }
  
  const atRisk = scores.filter(s => s.state === 'atRisk');
  if (atRisk.length > 0) {
    report += `### ⚠️ Audit These ASAP\n`;
    atRisk.forEach(item => {
      report += `- [ ] **${item.article.title}** (Score: ${item.score.overall})\n`;
      item.recommendations.forEach(rec => {
        report += `  - ${rec}\n`;
      });
    });
    report += `\n`;
  }
  
  const consolidate = scores.filter(s => s.state === 'consolidate');
  if (consolidate.length > 0) {
    report += `### 🔧 Plan Merges\n`;
    consolidate.forEach(item => {
      report += `- [ ] **${item.article.title}** → Merge into [target]\n`;
    });
    report += `\n`;
  }
  
  const sunset = scores.filter(s => s.state === 'sunset');
  if (sunset.length > 0) {
    report += `### 🌅 Remove/Redirect\n`;
    sunset.forEach(item => {
      report += `- [ ] **${item.article.title}** → Redirect to [hub]\n`;
    });
    report += `\n`;
  }
  
  // Next Review
  report += `## Next Review\n\n`;
  report += `**Scheduled:** ${new Date(now.setMonth(now.getMonth() + 1)).toISOString().split('T')[0]}\n\n`;
  
  return report;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Monthly Content Review...\n');
  
  try {
    // Read performance file
    console.log('📖 Reading article registry...');
    const performanceContent = fs.readFileSync(CONFIG.performanceFile, 'utf8');
    const articles = parseArticleRegistry(performanceContent);
    console.log(`✅ Found ${articles.length} articles\n`);
    
    // Initialize scoring engine
    const engine = new ContentScoringEngine();
    
    // Score each article
    console.log('📊 Scoring articles...');
    const scores = [];
    
    for (const article of articles) {
      console.log(`  → ${article.title}...`);
      
      // Fetch metrics (mock for now)
      const metrics = await fetchMetrics(article);
      
      // Calculate score
      const score = engine.calculateScore(metrics);
      const state = engine.determineState(score.overall, metrics);
      const recommendations = engine.generateRecommendations(state, score, metrics);
      
      scores.push({
        article,
        score,
        state,
        metrics,
        recommendations
      });
    }
    
    console.log(`✅ Scored ${scores.length} articles\n`);
    
    // Generate report
    console.log('📝 Generating report...');
    const report = generateReport(articles, scores);
    
    // Save report
    const reportPath = path.join(CONFIG.outputDir, `CONTENT_REVIEW_${new Date().toISOString().slice(0, 7)}.md`);
    fs.writeFileSync(reportPath, report);
    console.log(`✅ Report saved: ${reportPath}\n`);
    
    // Print summary
    console.log('📈 Summary:');
    const stateCounts = {};
    scores.forEach(s => {
      stateCounts[s.state] = (stateCounts[s.state] || 0) + 1;
    });
    console.log(`  🚀 Double Down: ${stateCounts.doubleDown || 0}`);
    console.log(`  ✅ Maintain: ${stateCounts.maintain || 0}`);
    console.log(`  ⚠️ At Risk: ${stateCounts.atRisk || 0}`);
    console.log(`  🔧 Consolidate: ${stateCounts.consolidate || 0}`);
    console.log(`  🌅 Sunset: ${stateCounts.sunset || 0}`);
    
    console.log('\n✨ Content review complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { parseArticleRegistry, fetchMetrics, generateReport };
