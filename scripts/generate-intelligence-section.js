#!/usr/bin/env node
/**
 * Generate Sustainability Intelligence section for homepage
 * Reads article manifest and outputs HTML section
 */

const fs = require('fs');

const ARTICLES = [
  {
    title: "EU ESG Rating Regulation Now Live: What African Companies Must Do Before Q4 2026",
    slug: "eu-esg-rating-regulation-african-businesses",
    date: "2026-07-14",
    category: "Policy",
    excerpt: "The EU ESG Rating Regulation entered force July 2, 2026. African companies with EU investors, listings, or export contracts must verify their ESG rating providers are ESMA-authorized. Complete compliance checklist and Morocco-specific guidance.",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=450&fit=crop",
    imageAlt: "European Union flag with ESG rating chart and African continent map",
    readingTime: "12 min"
  },
  {
    title: "Morocco's Carbon Tax Meets CBAM: How Exporters Can Turn Compliance into an $8 Billion Advantage",
    slug: "morocco-carbon-tax-cbam-8-billion-opportunity",
    date: "2026-07-14",
    category: "Corporate",
    excerpt: "Morocco's national carbon tax and EU CBAM create a dual compliance challenge. Learn how Moroccan steel, cement, and fertilizer exporters can leverage renewable energy to capture EU market share and access €1 billion in green financing.",
    image: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=800&h=450&fit=crop",
    imageAlt: "Morocco industrial port with renewable energy and EU trade symbols",
    readingTime: "10 min"
  },
  {
    title: "SBTi Rules Update 2026: Why 2030 Targets Just Got Easier",
    slug: "sbti-rules-update-2026-2030-targets",
    date: "2026-06-29",
    category: "Strategy",
    excerpt: "SBTi relaxed its near-term target rules in April 2026. Scope 1 and 2 targets for 2030 dropped from 42% to 21%. The change brings more companies into the system, but critics warn it widens the gap between science-based targets and actual climate science.",
    image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=450&fit=crop",
    imageAlt: "SBTi target reduction chart showing 42% to 21% change",
    readingTime: "11 min"
  },
  {
    title: "GHG Protocol Scope 3 Revisions 2026: Six Changes Reshaping Carbon Reporting",
    slug: "ghg-protocol-scope-3-revisions-2026",
    date: "2026-06-29",
    category: "Policy",
    excerpt: "The GHG Protocol published its Phase 1 Progress Update, the first revision since 2011. Six proposed changes will fundamentally alter how companies measure, report, and verify Scope 3 emissions. CSRD, ISSB, CDP, and SBTi will all be affected.",
    image: "https://images.unsplash.com/photo-1500829243541-74b677fecc30?w=800&h=450&fit=crop",
    imageAlt: "Supply chain carbon footprint diagram",
    readingTime: "12 min"
  },
  {
    title: "CBAM Definitive Phase 2026: Compliance Roadmap for EU Importers",
    slug: "cbam-definitive-phase-2026-compliance",
    date: "2026-06-29",
    category: "Policy",
    excerpt: "The EU Carbon Border Adjustment Mechanism entered its definitive phase on January 1, 2026. Authorization required by March 31, 2026. This article covers certificate mechanics, annual reporting, and verification requirements for importers.",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=450&fit=crop",
    imageAlt: "EU border with carbon inspection checkpoint",
    readingTime: "10 min"
  },
  {
    title: "ESRS Simplified Standards 2026: What Changed and What Companies Must Do",
    slug: "esrs-simplified-standards-2026",
    date: "2026-06-29",
    category: "Policy",
    excerpt: "The European Commission adopted simplified ESRS standards in June 2026. Listed SMEs and non-EU companies with EU subsidiaries face reduced disclosure requirements. This guide covers what changed, who is affected, and the compliance timeline.",
    image: "https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800&h=450&fit=crop",
    imageAlt: "European Commission building with simplified reporting documents",
    readingTime: "9 min"
  }
];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function generateCard(article, index) {
  const loading = index < 3 ? 'eager' : 'lazy';
  const url = `/sustainability-intelligence/${article.date.slice(0,4)}/${article.date.slice(5,7)}/${article.slug}/`;
  return `
    <article class="article-card neon-border rounded-xl overflow-hidden cursor-pointer group" data-slug="${article.slug}" data-position="${index + 1}" data-category="${article.category}">
      <a href="${url}" class="block" onclick="trackIntelligenceClick('${article.slug}', '${article.title.replace(/'/g, "\\'")}', ${index + 1}, '${article.category}')">
        <div class="relative overflow-hidden" style="aspect-ratio: 16/9;">
          <img 
            alt="${article.imageAlt}" 
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            decoding="async"
            height="450"
            loading="${loading}"
            src="${article.image}"
            width="800"
          />
          <span class="absolute top-3 left-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">${article.category}</span>
        </div>
        <div class="p-5">
          <p class="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            ${formatDate(article.date)}
          </p>
          <h3 class="text-lg font-semibold text-gray-100 mb-2 group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">${article.title}</h3>
          <p class="text-sm text-gray-400 line-clamp-3 leading-relaxed">${article.excerpt}</p>
          <div class="mt-4 flex items-center justify-between">
            <span class="text-xs text-emerald-500 font-medium">Read analysis</span>
            <span class="text-xs text-gray-500">${article.readingTime} read</span>
          </div>
        </div>
      </a>
    </article>
  `;
}

function generateSection() {
  const cards = ARTICLES.map((a, i) => generateCard(a, i)).join('\n');
  
  return `<!-- ============================================ -->
<!-- SUSTAINABILITY INTELLIGENCE SECTION -->
<!-- ============================================ -->
<section class="section-alt reveal" id="intelligence">
  <div class="max-w-7xl mx-auto px-6">
    <!-- Section Header -->
    <div class="text-center mb-12 reveal">
      <div class="flex items-center justify-center gap-3 mb-4">
        <h2 class="text-4xl md:text-5xl font-bold" style="font-family: 'Orbitron', sans-serif; color: #b8e994;">Sustainability Intelligence</h2>
      </div>
      <p class="text-gray-400 max-w-2xl mx-auto">Practical analysis of sustainability regulation, climate policy, carbon markets and business impacts.</p>
    </div>
    
    <!-- Intelligence Grid -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 stagger-children">
${cards}
    </div>
    
    <!-- View All CTA -->
    <div class="text-center">
      <a href="/sustainability-intelligence/" class="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all">
        View all Sustainability Intelligence
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
      </a>
    </div>
  </div>
</section>`;
}

console.log(generateSection());
