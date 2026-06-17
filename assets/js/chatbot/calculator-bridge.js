/**
 * Chatbot V2 — Calculator Bridge
 * Week 1 Implementation
 * Read-only access to calculator state (anonymized)
 * NO storage of PII or absolute values with company context
 */

const CalculatorBridge = {
  // Track if calculator is present on current page
  isCalculatorPage() {
    return !!document.getElementById('calculator-form') ||
           !!document.getElementById('scope1-total') ||
           !!document.getElementById('total-emissions');
  },

  /**
   * Read calculator state from DOM
   * Returns anonymized context only
   */
  getContext() {
    if (!this.isCalculatorPage()) {
      return { hasData: false, reason: 'not-calculator-page' };
    }

    try {
      const context = {
        hasData: false,
        scopeSplit: null,
        topCategory: null,
        intensity: null,
        inputsEntered: false
      };

      // Try to read scope totals
      const s1El = document.getElementById('scope1-total');
      const s2El = document.getElementById('scope2-total');
      const s3El = document.getElementById('scope3-total');
      const totalEl = document.getElementById('total-emissions');

      let s1 = 0, s2 = 0, s3 = 0, total = 0;

      if (s1El) s1 = parseFloat(s1El.textContent) || 0;
      if (s2El) s2 = parseFloat(s2El.textContent) || 0;
      if (s3El) s3 = parseFloat(s3El.textContent) || 0;
      if (totalEl) total = parseFloat(totalEl.textContent) || 0;

      // If no totals parsed, try alternative selectors
      if (total === 0) {
        total = s1 + s2 + s3;
      }

      // Check if any data has been entered
      if (total > 0) {
        context.hasData = true;
        context.inputsEntered = true;

        // Store only percentages, never absolute values
        context.scopeSplit = {
          s1: total > 0 ? s1 / total : 0,
          s2: total > 0 ? s2 / total : 0,
          s3: total > 0 ? s3 / total : 0
        };

        // Determine top category (by percentage)
        const maxScope = Math.max(s1, s2, s3);
        if (maxScope === s1 && s1 > 0) {
          context.topCategory = 'Scope 1 - Direct Emissions';
        } else if (maxScope === s2 && s2 > 0) {
          context.topCategory = 'Scope 2 - Purchased Electricity';
        } else if (maxScope === s3 && s3 > 0) {
          context.topCategory = 'Scope 3 - Value Chain';
        }

        // Intensity ratios (if revenue/employee fields exist)
        const revenueEl = document.getElementById('company-revenue');
        const employeeEl = document.getElementById('company-employees');

        if (revenueEl && employeeEl) {
          const revenue = parseFloat(revenueEl.value) || 0;
          const employees = parseFloat(employeeEl.value) || 0;

          if (revenue > 0) {
            context.intensity = {
              type: 'per-revenue',
              // Store ratio only, not absolute values
              ratio: total / revenue
            };
          } else if (employees > 0) {
            context.intensity = {
              type: 'per-employee',
              ratio: total / employees
            };
          }
        }
      } else {
        // Check if any inputs have been entered (even if not calculated)
        const inputs = document.querySelectorAll('#calculator-form input[type="number"]');
        for (const input of inputs) {
          if (input.value && parseFloat(input.value) > 0) {
            context.inputsEntered = true;
            break;
          }
        }
      }

      return context;
    } catch (error) {
      console.warn('CalculatorBridge error:', error);
      return { hasData: false, reason: 'error', error: error.message };
    }
  },

  /**
   * Get industry benchmark info (static data)
   */
  getBenchmark(industry) {
    const benchmarks = {
      'manufacturing': { avgScope3: 0.75, description: 'Manufacturing typically has high Scope 3 from purchased goods and raw materials.' },
      'retail': { avgScope3: 0.80, description: 'Retail often sees 80%+ Scope 3 from purchased goods and downstream transport.' },
      'technology': { avgScope3: 0.60, description: 'Tech companies usually have lower Scope 3, with significant Scope 2 from data centers.' },
      'financial': { avgScope3: 0.85, description: 'Financial services have high Scope 3 from investments (Category 15).' },
      'services': { avgScope3: 0.50, description: 'Service companies typically have lower overall emissions with Scope 2 dominance.' }
    };

    return benchmarks[industry] || null;
  },

  /**
   * Format calculator context for response
   */
  formatContext(context) {
    if (!context.hasData) {
      return null;
    }

    const parts = [];

    if (context.scopeSplit) {
      parts.push(`Scope 1: ${(context.scopeSplit.s1 * 100).toFixed(1)}%`);
      parts.push(`Scope 2: ${(context.scopeSplit.s2 * 100).toFixed(1)}%`);
      parts.push(`Scope 3: ${(context.scopeSplit.s3 * 100).toFixed(1)}%`);
    }

    if (context.topCategory) {
      parts.push(`Top source: ${context.topCategory}`);
    }

    return parts.join(', ');
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CalculatorBridge };
} else {
  window.CalculatorBridge = CalculatorBridge;
}
