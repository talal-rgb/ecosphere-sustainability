/**
 * Content Scoring Engine
 * Calculates article scores and assigns lifecycle states
 */

class ContentScoringEngine {
  constructor(config = {}) {
    this.weights = {
      traffic: config.trafficWeight || 0.25,
      leads: config.leadsWeight || 0.30,
      engagement: config.engagementWeight || 0.20,
      relevance: config.relevanceWeight || 0.25
    };

    this.thresholds = {
      doubleDown: { score: 75, traffic: 100, conversions: 5 },
      maintain: { score: 50, traffic: 20, conversions: 1 },
      atRisk: { score: 30, traffic: 0, conversions: 0 },
      consolidate: { score: 30, traffic: 20, conversions: 0 },
      sunset: { score: 20, traffic: 10, conversions: 0, days: 90 }
    };
  }

  /**
   * Calculate traffic score (0-100)
   */
  calculateTrafficScore(monthlyUsers) {
    if (monthlyUsers >= 5000) return 100;
    if (monthlyUsers >= 1001) return 85;
    if (monthlyUsers >= 501) return 70;
    if (monthlyUsers >= 101) return 50;
    if (monthlyUsers >= 51) return 30;
    if (monthlyUsers >= 11) return 15;
    if (monthlyUsers >= 1) return 5;
    return 0;
  }

  /**
   * Calculate leads score (0-100)
   */
  calculateLeadsScore(monthlyConversions) {
    if (monthlyConversions >= 21) return 100;
    if (monthlyConversions >= 11) return 80;
    if (monthlyConversions >= 6) return 60;
    if (monthlyConversions >= 3) return 40;
    if (monthlyConversions >= 1) return 20;
    return 0;
  }

  /**
   * Calculate engagement score (0-100)
   */
  calculateEngagementScore(avgSessionDuration, pagesPerSession) {
    const durationScore = Math.min((avgSessionDuration / 300) * 50, 50);
    const pagesScore = Math.min((pagesPerSession / 3) * 50, 50);
    return Math.min(durationScore + pagesScore, 100);
  }

  /**
   * Calculate relevance score (0-100)
   */
  calculateRelevanceScore(checks) {
    let score = 0;
    if (checks.keywordInTitle) score += 20;
    score += Math.min(checks.internalLinks * 5, 20); // 4+ links = 20
    if (checks.hasCalculatorOrCTA) score += 20;
    score += Math.min(checks.coreOfferingRelevance, 20);
    score += Math.min(checks.freshnessScore, 20);
    return score;
  }

  /**
   * Calculate overall article score
   */
  calculateScore(metrics) {
    const traffic = this.calculateTrafficScore(metrics.monthlyUsers || 0);
    const leads = this.calculateLeadsScore(metrics.monthlyConversions || 0);
    const engagement = this.calculateEngagementScore(
      metrics.avgSessionDuration || 0,
      metrics.pagesPerSession || 0
    );
    const relevance = this.calculateRelevanceScore(metrics.relevanceChecks || {});

    const overall = Math.round(
      traffic * this.weights.traffic +
      leads * this.weights.leads +
      engagement * this.weights.engagement +
      relevance * this.weights.relevance
    );

    return {
      traffic,
      leads,
      engagement,
      relevance,
      overall,
      breakdown: {
        traffic: `${traffic} × ${this.weights.traffic} = ${Math.round(traffic * this.weights.traffic)}`,
        leads: `${leads} × ${this.weights.leads} = ${Math.round(leads * this.weights.leads)}`,
        engagement: `${engagement} × ${this.weights.engagement} = ${Math.round(engagement * this.weights.engagement)}`,
        relevance: `${relevance} × ${this.weights.relevance} = ${Math.round(relevance * this.weights.relevance)}`
      }
    };
  }

  /**
   * Determine lifecycle state
   */
  determineState(score, metrics, history = []) {
    const { monthlyUsers, monthlyConversions } = metrics;
    const daysSincePublish = metrics.daysSincePublish || 0;
    
    // Check declining trend (2+ months)
    const isDeclining = history.length >= 2 && 
      history[0].score > history[1].score && 
      history[1].score > score;

    // Sunset: Very low performance for 90+ days
    if (score < this.thresholds.sunset.score && 
        monthlyUsers < this.thresholds.sunset.traffic && 
        monthlyConversions === 0 && 
        daysSincePublish >= this.thresholds.sunset.days) {
      return 'sunset';
    }

    // Consolidate: Low score, low traffic, similar content exists
    if (score < this.thresholds.consolidate.score && 
        monthlyUsers < this.thresholds.consolidate.traffic &&
        metrics.hasSimilarContent) {
      return 'consolidate';
    }

    // Double Down: High performers
    if (score >= this.thresholds.doubleDown.score && 
        monthlyUsers >= this.thresholds.doubleDown.traffic && 
        monthlyConversions >= this.thresholds.doubleDown.conversions) {
      return 'doubleDown';
    }

    // At Risk: Declining or borderline
    if (isDeclining || 
        (score < this.thresholds.maintain.score && score >= this.thresholds.atRisk.score)) {
      return 'atRisk';
    }

    // Maintain: Middle performers
    if (score >= this.thresholds.maintain.score) {
      return 'maintain';
    }

    // Default: At Risk for new/low content
    return 'atRisk';
  }

  /**
   * Get state metadata
   */
  getStateMetadata(state) {
    const metadata = {
      doubleDown: {
        label: '🚀 Double Down',
        description: 'High performer - expand and promote',
        action: 'Create cluster content, update regularly, promote heavily',
        reviewFrequency: 'weekly',
        color: '#10b981'
      },
      maintain: {
        label: '✅ Maintain',
        description: 'Steady performer - keep fresh',
        action: 'Minor updates, monitor metrics, optimize CTAs',
        reviewFrequency: 'monthly',
        color: '#3b82f6'
      },
      atRisk: {
        label: '⚠️ At Risk',
        description: 'Declining or underperforming',
        action: 'Audit content, optimize title/meta, A/B test, improve internal links',
        reviewFrequency: 'bi-weekly',
        color: '#f59e0b'
      },
      consolidate: {
        label: '🔧 Consolidate',
        description: 'Merge into stronger content',
        action: 'Identify best piece, merge content, 301 redirect',
        reviewFrequency: 'monthly',
        color: '#8b5cf6'
      },
      sunset: {
        label: '🌅 Sunset',
        description: 'Remove or archive',
        action: 'Document learnings, redirect to hub, remove from nav',
        reviewFrequency: 'quarterly',
        color: '#ef4444'
      }
    };

    return metadata[state] || metadata.atRisk;
  }

  /**
   * Generate full article report
   */
  generateReport(article, metrics, history = []) {
    const score = this.calculateScore(metrics);
    const state = this.determineState(score.overall, metrics, history);
    const stateMeta = this.getStateMetadata(state);

    return {
      article,
      score,
      state,
      stateMeta,
      history,
      recommendations: this.generateRecommendations(state, score, metrics),
      nextReview: this.calculateNextReview(state)
    };
  }

  /**
   * Generate action recommendations
   */
  generateRecommendations(state, score, metrics) {
    const recs = [];

    switch (state) {
      case 'doubleDown':
        recs.push('Create 2-3 supporting articles in this topic cluster');
        recs.push('Add more internal links from high-traffic pages');
        recs.push('Update with latest data and expand sections');
        recs.push('Promote via newsletter and social media');
        break;
      case 'maintain':
        recs.push('Refresh statistics and examples quarterly');
        recs.push('Test CTA variations to improve conversions');
        recs.push('Add FAQ section based on search queries');
        break;
      case 'atRisk':
        recs.push('Audit title tag and meta description');
        recs.push('Check if content matches search intent');
        recs.push('Add/update internal links from stronger pages');
        recs.push('Improve page speed and mobile experience');
        recs.push('Add more engaging elements (calculator, quiz, visuals)');
        break;
      case 'consolidate':
        recs.push('Identify the strongest competing article');
        recs.push('Merge unique insights into the stronger piece');
        recs.push('Implement 301 redirect after merge');
        recs.push('Update internal links to point to new URL');
        break;
      case 'sunset':
        recs.push('Document why this content underperformed');
        recs.push('Redirect to most relevant hub page');
        recs.push('Remove from navigation and sitemap');
        recs.push('Archive content for reference');
        break;
    }

    // Generic recommendations based on score components
    if (score.traffic < 30) {
      recs.push('Improve SEO: better title, meta, headers, keyword usage');
    }
    if (score.leads < 30) {
      recs.push('Add or improve CTAs, calculators, download offers');
    }
    if (score.engagement < 30) {
      recs.push('Improve readability, add visuals, break up text');
    }
    if (score.relevance < 30) {
      recs.push('Better align with core offerings and user intent');
    }

    return recs;
  }

  /**
   * Calculate next review date
   */
  calculateNextReview(state) {
    const now = new Date();
    const frequencies = {
      doubleDown: 7,    // weekly
      maintain: 30,     // monthly
      atRisk: 14,       // bi-weekly
      consolidate: 30,  // monthly
      sunset: 90        // quarterly
    };
    
    const days = frequencies[state] || 30;
    return new Date(now.setDate(now.getDate() + days));
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentScoringEngine;
}
