# Homepage Redesign Phase B — Implementation Plan

## Baseline (2026-08-04)
- HTML size: 364,015 bytes (356 KB)
- Lines: 6,521
- DOM nodes (tag estimate): ~1,649
- Sections: 10
- Script tags: 18

## Target Structure

1. HERO (id="hero")
2. TRUST BAR (id="trust-bar") — NEW
3. WHO WE SERVE (id="who-we-serve") — NEW
4. PLATFORM LAUNCHER (id="platform-launcher") — REFACTORED
5. QUICK CARBON ESTIMATE (id="quick-carbon") — NEW
6. WHY TERRNIX (id="why-terrnix") — NEW
7. FEATURED INTELLIGENCE (id="featured-intelligence") — REFACTORED
8. AI COPILOT (id="ai-copilot") — REFACTORED
9. SOCIAL PROOF (id="social-proof") — NEW
10. FINAL CTA (id="final-cta") — NEW

## Sections to REMOVE from homepage
- Full Carbon Calculator (id="calculator") → move to /carbon-accounting/carbon-footprint-calculator/
- Energy Economics (id="economics") → move to /tools/energy-suite/
- Quiz (id="quiz") → move to /quiz/
- Contact Form (id="contact") → move to /contact/
- Deep Dive Topics (id="topics") → move to /sustainability-intelligence/
- Intelligence grid (6 articles) → reduce to 3 featured, rest stays on /sustainability-intelligence/

## Sections to KEEP but REFACTOR
- Hero: improve copy, reduce CTAs to 2
- Platform Launcher: keep 6 cards, add value statements + completion time
- Chatbot: improve intro, add example prompts
- Trust framework: expand with positioning statements

## Performance Targets
- HTML size: < 200 KB (reduce by ~45%)
- DOM nodes: < 1,000 (reduce by ~40%)
- Lighthouse Performance: >95
- Accessibility: >98
- SEO: 100
- Best Practices: 100
