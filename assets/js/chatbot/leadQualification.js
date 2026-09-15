/**
 * Soft Lead Qualification Module
 * Infers user profile from conversation without explicit questions
 * Privacy-first: no PII, no aggressive data capture, session-only
 */

const LeadQualification = {
  // Industry inference patterns
  INDUSTRIES: {
    manufacturing: ['manufacturing', 'factory', 'production', 'assembly', 'industrial', 'plant'],
    technology: ['software', 'saas', 'tech', 'it services', 'digital', 'data center'],
    financial: ['bank', 'insurance', 'investment', 'asset management', 'financial services'],
    retail: ['retail', 'e-commerce', 'consumer goods', 'merchandise', 'store'],
    energy: ['energy', 'oil', 'gas', 'renewable', 'utility', 'power generation'],
    transport: ['logistics', 'shipping', 'transport', 'fleet', 'aviation', 'maritime'],
    construction: ['construction', 'building', 'real estate', 'infrastructure'],
    healthcare: ['healthcare', 'pharmaceutical', 'medical', 'hospital'],
    agriculture: ['agriculture', 'farming', 'food production', 'agrifood']
  },

  // Company size inference
  SIZE_PATTERNS: {
    enterprise: ['1000+', 'enterprise', 'multinational', 'global', 'fortune 500', 'listed'],
    large: ['500-1000', 'large', 'multiple offices', 'subsidiary'],
    medium: ['50-500', 'sme', 'mid-size', 'growing'],
    small: ['<50', 'startup', 'small', 'founder', 'team']
  },

  // Reporting maturity inference
  MATURITY_PATTERNS: {
    beginner: ['new to', 'starting', 'first time', 'don\'t know', 'beginner', 'basics'],
    intermediate: ['measured', 'calculated', 'reported', 'scope 3', 'baseline'],
    advanced: ['assurance', 'verification', 'science-based target', 'net zero roadmap', 'decarbonization']
  },

  // State
  profile: {
    industry: null,
    companySize: null,
    reportingMaturity: null,
    interests: new Set(),
    engagementScore: 0
  },

  /**
   * Initialize
   */
  init() {
    this.profile = {
      industry: null,
      companySize: null,
      reportingMaturity: null,
      interests: new Set(),
      engagementScore: 0
    };
    return this;
  },

  /**
   * Infer profile from user message
   */
  inferFromMessage(text, intent, topic) {
    const textLower = text.toLowerCase();

    // Infer industry
    if (!this.profile.industry) {
      for (const [industry, patterns] of Object.entries(this.INDUSTRIES)) {
        if (patterns.some(pattern => textLower.includes(pattern))) {
          this.profile.industry = industry;
          break;
        }
      }
    }

    // Infer company size
    if (!this.profile.companySize) {
      for (const [size, patterns] of Object.entries(this.SIZE_PATTERNS)) {
        if (patterns.some(pattern => textLower.includes(pattern))) {
          this.profile.companySize = size;
          break;
        }
      }
    }

    // Infer reporting maturity
    for (const [maturity, patterns] of Object.entries(this.MATURITY_PATTERNS)) {
      if (patterns.some(pattern => textLower.includes(pattern))) {
        // Only upgrade maturity, never downgrade
        const maturityOrder = ['beginner', 'intermediate', 'advanced'];
        const currentIndex = maturityOrder.indexOf(this.profile.reportingMaturity || 'beginner');
        const newIndex = maturityOrder.indexOf(maturity);
        
        if (newIndex > currentIndex) {
          this.profile.reportingMaturity = maturity;
        }
        break;
      }
    }

    // Track interests
    if (topic) {
      this.profile.interests.add(topic);
    }
    if (intent) {
      this.profile.interests.add(intent);
    }

    return this.profile;
  },

  /**
   * Calculate engagement score
   */
  calculateEngagementScore(sessionMemory) {
    if (!sessionMemory) return 0;

    let score = 0;
    
    // Message count (max 30 points)
    score += Math.min(sessionMemory.engagement?.messageCount * 2 || 0, 30);
    
    // Topics explored (max 25 points)
    score += Math.min(sessionMemory.engagement?.topicsExplored * 5 || 0, 25);
    
    // Calculator used (20 points)
    if (sessionMemory.engagement?.calculatorUsed) {
      score += 20;
    }
    
    // Guides viewed (max 15 points)
    score += Math.min((sessionMemory.engagement?.guidesViewed?.length || 0) * 3, 15);
    
    // Quiz interest (10 points)
    if (sessionMemory.engagement?.quizInterest) {
      score += 10;
    }

    this.profile.engagementScore = Math.min(score, 100);
    return this.profile.engagementScore;
  },

  /**
   * Get qualification summary
   */
  getSummary() {
    const parts = [];
    
    if (this.profile.industry) {
      parts.push(`Industry: ${this.profile.industry}`);
    }
    
    if (this.profile.companySize) {
      parts.push(`Size: ${this.profile.companySize}`);
    }
    
    if (this.profile.reportingMaturity) {
      parts.push(`Maturity: ${this.profile.reportingMaturity}`);
    }
    
    if (this.profile.interests.size > 0) {
      parts.push(`Interests: ${Array.from(this.profile.interests).slice(0, 3).join(', ')}`);
    }

    return parts.length > 0 ? parts.join(' | ') : 'Profile not yet determined';
  },

  /**
   * Get profile for external use
   */
  getProfile() {
    return {
      industry: this.profile.industry,
      companySize: this.profile.companySize,
      reportingMaturity: this.profile.reportingMaturity,
      interests: Array.from(this.profile.interests),
      engagementScore: this.profile.engagementScore
    };
  },

  /**
   * Check if user is qualified lead
   */
  isQualifiedLead() {
    return this.profile.engagementScore >= 60;
  },

  /**
   * Get recommended next steps
   */
  getRecommendations() {
    const recs = [];

    if (this.profile.reportingMaturity === 'beginner') {
      recs.push('Start with the GHG Protocol Guide');
      recs.push('Try the Carbon Calculator with rough estimates');
    } else if (this.profile.reportingMaturity === 'intermediate') {
      recs.push('Explore Scope 3 measurement strategies');
      recs.push('Review CSRD applicability for your company');
    } else {
      recs.push('Consider science-based target setting');
      recs.push('Explore advanced decarbonization pathways');
    }

    if (this.profile.industry) {
      recs.push(`Explore ${this.profile.industry}-specific benchmarks`);
    }

    return recs;
  },

  /**
   * Clear profile (privacy)
   */
  clear() {
    this.init();
    return this;
  }
};

// Auto-initialize
LeadQualification.init();

// Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LeadQualification };
}
