/**
 * PDF Report Assistant Module
 * Explains PDF structure, interprets results, and guides users
 * Safety-first: no regulatory compliance or audit readiness claims
 */

const PDFAssistant = {
  // PDF structure definition
  PDF_STRUCTURE: [
    { page: 1, name: 'Cover', content: 'Company name, report date, total emissions' },
    { page: 2, name: 'Executive Summary', content: 'Total emissions, scope breakdown, key metrics' },
    { page: 3, name: 'Scope 1 Breakdown', content: 'Stationary combustion, mobile combustion, fugitive emissions' },
    { page: 4, name: 'Scope 2 Breakdown', content: 'Location-based and market-based totals' },
    { page: 5, name: 'Scope 3 Breakdown', content: 'All 15 categories with totals' },
    { page: 6, name: 'Methodology', content: 'GHG Protocol alignment, calculation approach' },
    { page: 7, name: 'Emission Factors', content: 'Factors used by source and geography' },
    { page: 8, name: 'Recommendations', content: 'Prioritized reduction actions' },
    { page: 9, name: 'Disclaimer', content: 'Limitations, assumptions, educational purpose' }
  ],

  /**
   * Explain PDF structure (no user data needed)
   */
  explainStructure() {
    let response = 'The Terrnix Carbon Report is a **9-page PDF** with the following structure:\n\n';
    
    this.PDF_STRUCTURE.forEach(page => {
      response += `**Page ${page.page}: ${page.name}**\n`;
      response += `${page.content}\n\n`;
    });

    response += '**How to use your report:**\n';
    response += '1. **Share the Executive Summary** with leadership for a quick overview\n';
    response += '2. **Review Scope breakdowns** to identify highest emission sources\n';
    response += '3. **Check Methodology** to understand calculation approach\n';
    response += '4. **Prioritize Recommendations** based on feasibility and impact\n\n';

    response += '⚠️ **Important:** This report is for **educational and internal planning purposes**. ';
    response += 'It does not constitute regulatory compliance documentation or audit-ready reporting. ';
    response += 'Consult a qualified sustainability professional for official submissions.\n\n';

    response += '🧮 **Generate your report:** Use the Terrnix Carbon Calculator to create your own PDF.\n';
    response += '🔗 /carbon-accounting/carbon-footprint-calculator/';

    return response;
  },

  /**
   * Interpret user's PDF results
   */
  interpretResults(calculatorContext) {
    if (!calculatorContext || !calculatorContext.hasData) {
      return this.explainStructure();
    }

    const { scope1, scope2, scope3, total, percentages, topSource } = calculatorContext;

    let response = '**Your Carbon Report Analysis**\n\n';

    // Total emissions
    response += `**Total Emissions:** ${total.toFixed(2)} tCO2e\n\n`;

    // Scope breakdown
    response += '**Scope Breakdown:**\n';
    response += `• Scope 1 (Direct): ${scope1.toFixed(2)} tCO2e (${percentages.scope1}%)\n`;
    response += `• Scope 2 (Energy): ${scope2.toFixed(2)} tCO2e (${percentages.scope2}%)\n`;
    response += `• Scope 3 (Value Chain): ${scope3.toFixed(2)} tCO2e (${percentages.scope3}%)\n\n`;

    // Top contributor analysis
    const maxScope = Math.max(scope1, scope2, scope3);
    let topScope = 'Scope 1';
    if (maxScope === scope2) topScope = 'Scope 2';
    if (maxScope === scope3) topScope = 'Scope 3';

    response += `**Top Contributor:** ${topScope} (${percentages[topScope.toLowerCase().replace(' ', '')]}%)\n`;

    if (topScope === 'Scope 3') {
      response += 'This is typical for service and retail companies where value chain emissions dominate.\n';
      response += 'Focus on supplier engagement and procurement policies for reduction.\n\n';
    } else if (topScope === 'Scope 2') {
      response += 'This suggests energy consumption is your primary lever.\n';
      response += 'Consider renewable energy procurement and efficiency improvements.\n\n';
    } else {
      response += 'This indicates direct operations are your main source.\n';
      response += 'Consider fuel switching and process optimization.\n\n';
    }

    // Recommendations based on profile
    response += '**Prioritized Recommendations:**\n';
    
    if (percentages.scope3 > 50) {
      response += '1. **Supplier engagement** — Request emissions data from top suppliers\n';
      response += '2. **Sustainable procurement** — Include carbon criteria in purchasing\n';
      response += '3. **Business travel policy** — Implement virtual meeting alternatives\n';
    } else if (percentages.scope2 > 40) {
      response += '1. **Renewable energy** — Switch to green tariffs or PPAs\n';
      response += '2. **Energy efficiency** — LED lighting, HVAC optimization\n';
      response += '3. **Market-based reporting** — Purchase RECs or GOs\n';
    } else {
      response += '1. **Fuel switching** — Transition from diesel to electric vehicles\n';
      response += '2. **Process optimization** — Improve combustion efficiency\n';
      response += '3. **Fugitive emission control** — Regular maintenance and leak detection\n';
    }

    response += '\n\n';

    // Methodology note
    response += '**Methodology:**\n';
    response += 'Calculations follow the GHG Protocol Corporate Standard. ';
    response += 'Emission factors are from EPA (US), IEA (global grid), and DEFRA (UK). ';
    response += 'All calculations are estimates for planning purposes.\n\n';

    // Safety disclaimer
    response += '⚠️ **Disclaimer:** This analysis is for **educational purposes only**. ';
    response += 'It is not audit-ready and does not guarantee regulatory compliance. ';
    response += 'Consult a sustainability professional for official reporting.\n\n';

    response += '📖 **Want to learn more?** Check the Academy Guides for detailed reduction strategies.\n';
    response += '🔗 /resources/academy/';

    return response;
  },

  /**
   * Explain a specific section
   */
  explainSection(sectionName) {
    const sections = {
      'executive summary': 'The Executive Summary provides a high-level overview: total emissions, scope breakdown percentages, and key metrics. Share this page with leadership for quick decision-making.',
      'scope 1': 'Scope 1 covers direct emissions from owned/controlled sources: fuel combustion, company vehicles, and process emissions. This page shows your breakdown by source type.',
      'scope 2': 'Scope 2 covers indirect emissions from purchased electricity, heat, or steam. The report shows both location-based (grid average) and market-based (contractual) totals.',
      'scope 3': 'Scope 3 covers all other indirect emissions in your value chain. The report breaks down all 15 categories, highlighting your largest sources.',
      'methodology': 'The Methodology section explains how calculations were performed: GHG Protocol alignment, calculation methods (spend-based vs activity-based), and data sources.',
      'factors': 'The Emission Factors section lists all factors used: fuel types, grid factors by country, and GWP values. This provides transparency for verification.',
      'recommendations': 'The Recommendations section provides prioritized actions based on your emission profile. Each recommendation includes estimated impact and feasibility.',
      'disclaimer': 'The Disclaimer outlines limitations: estimates vs actuals, data quality assumptions, and educational purpose. Always verify before official use.'
    };

    const normalizedName = sectionName.toLowerCase().trim();
    
    for (const [key, value] of Object.entries(sections)) {
      if (normalizedName.includes(key)) {
        return value;
      }
    }

    return `I don't have specific information about "${sectionName}". The report includes: Executive Summary, Scope 1/2/3 Breakdowns, Methodology, Emission Factors, Recommendations, and Disclaimer. Which would you like to know about?`;
  },

  /**
   * Get tips for using the PDF
   */
  getUsageTips() {
    return `
**Tips for Using Your Carbon Report:**

**For Leadership:**
• Share the Executive Summary (Page 2) for quick overview
• Highlight total emissions and year-over-year trends
• Focus on top 3 reduction opportunities

**For Sustainability Teams:**
• Review Scope 3 categories for data gaps
• Check Methodology for calculation assumptions
• Use Recommendations to build action plans

**For Finance:**
• Link reduction opportunities to cost savings
• Calculate ROI for energy efficiency projects
• Budget for renewable energy procurement

**For Operations:**
• Focus on Scope 1 breakdown for direct actions
• Identify fuel switching opportunities
• Review fugitive emission sources

⚠️ **Remember:** This report is for internal planning. For regulatory submission or external disclosure, consult a qualified sustainability professional.
`;
  }
};

// Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PDFAssistant };
}
