# UX_REVIEW.md — Terrnix Platform User Experience Review

**Date:** 2026-07-22  
**Review Type:** Multi-persona heuristic evaluation  
**Platform:** https://terrnix.com  
**Scope:** All public-facing pages and features

---

## Methodology

Reviewed the platform from the perspective of five distinct user personas:
1. Sustainability Director
2. ESG Manager
3. Manufacturing Executive
4. Consultant
5. First-time Visitor

Each persona evaluated: clarity of offering, tool discoverability, navigation, trust signals, and friction points.

---

## Persona 1: Sustainability Director

**Profile:** VP or Director of Sustainability at a mid-to-large enterprise. Needs strategic oversight, reporting tools, and frameworks. Time-poor. Evaluates platforms for team adoption.

### Can they immediately understand what Terrnix offers?
**Verdict:** PARTIAL
- Hero section mentions "AI-powered sustainability intelligence" but the *product* is unclear
- No clear product grid on homepage — tools are scattered in navigation
- Value proposition is vague: "intelligence" could mean many things

### Can they easily find relevant tools?
**Verdict:** MODERATE DIFFICULTY
- Carbon calculator is findable via "Carbon Accounting" nav
- ESG tools require clicking through ESG Reporting hub
- No single "Products" or "Tools" overview that shows everything at a glance
- Missing: comparison table of tools, use-case based navigation

### Confusing pages?
- **Deep Dive** — unclear what this is vs "Resources" or "Guides"
- **Tools hub** — mixes live calculators with "Coming Soon" items without clear distinction

### Dead ends?
- Deep Dive articles have no clear next step (no CTA to calculator or assessment)
- Some glossary terms lack cross-links to related guides

### Trust signals?
- Professional dark theme
- No client logos, testimonials, or case studies
- No "About" page with team/company info (empty or minimal)
- No trust badges, certifications, or partnerships

### Would they trust the platform?
**Verdict:** CAUTIOUSLY — looks professional but lacks social proof and clear product positioning

---

## Persona 2: ESG Manager

**Profile:** Responsible for CSRD/ISSB reporting, data collection, and disclosure quality. Needs practical guidance and tools for compliance.

### Can they immediately understand what Terrnix offers?
**Verdict:** YES — AFTER CLICKING
- Homepage doesn't scream "ESG reporting help"
- But the ESG Reporting hub (/esg-reporting/) is clear and well-structured
- CSRD Omnibus Guide is comprehensive and valuable

### Can they easily find relevant tools?
**Verdict:** YES
- ESG Reporting hub is well-organised
- CSRD guide is prominently linked
- ESG Report Analyzer landing page sets clear expectations ("Coming Soon")

### Confusing pages?
- **ESG Report Analyzer** — "Coming Soon" badge is clear, but the CTA "Analyze Now" could be misleading. Should be "Join Waitlist" throughout.
- **Resources** — mix of guides, FAQ, glossary without clear categorisation

### Dead ends?
- CSRD guide ends without a clear next step (no CTA to assessment or contact)
- No "Need help with CSRD?" conversion path

### Trust signals?
- CSRD guide demonstrates expertise
- No author bylines or credentials on guides
- No date stamps showing content freshness

### Would they trust the platform?
**Verdict:** YES — for content. But would want to see more evidence of active maintenance and expertise.

---

## Persona 3: Manufacturing Executive

**Profile:** Plant manager or operations director. Needs carbon accounting for regulatory compliance and cost reduction. Practical, numbers-focused.

### Can they immediately understand what Terrnix offers?
**Verdict:** NO — NOT IMMEDIATELY
- Homepage speaks to "sustainability intelligence" — too abstract
- They need to see "Carbon Calculator" immediately
- Current homepage buries the calculator in nav

### Can they easily find relevant tools?
**Verdict:** MODERATE
- Carbon Accounting hub is good
- Scope 1/2/3 guides are well-structured
- Calculator is accessible but not prominent enough

### Confusing pages?
- **Carbon Accounting hub** — good, but the "Readiness Assessment" is unclear vs "Calculator"
- **Scope 3** — complex topic, guide is good but could use a simplified executive summary

### Dead ends?
- Calculator results page — no clear "What next?" (no CTA to assessment, reporting, or contact)
- No "Get a detailed report" or "Talk to an expert" path

### Trust signals?
- Calculator shows methodology and factors — good
- No manufacturing-specific case studies or examples
- No ROI calculations or cost-saving examples

### Would they trust the platform?
**Verdict:** PARTIALLY — calculator is credible but lacks industry-specific credibility

---

## Persona 4: Consultant

**Profile:** Sustainability consultant serving multiple clients. Needs reference materials, tools for client work, and professional outputs.

### Can they immediately understand what Terrnix offers?
**Verdict:** YES
- Recognises the platform model quickly
- Understands hub-and-spoke content structure
- Sees value in guides + tools combination

### Can they easily find relevant tools?
**Verdict:** YES
- Navigation is logical for an experienced user
- Glossary is useful for client explanations
- Guides are comprehensive enough to reference

### Confusing pages?
- **Resources** — unclear distinction between "Guides", "Glossary", and "FAQ"
- **Tools** — some tools live in /tools/, some in /carbon-accounting/ — inconsistent

### Dead ends?
- No "Download as PDF" or "Share with client" functionality on guides
- No white-label or branded export options
- Calculator results can't be saved or shared

### Trust signals?
- Content depth is good for referencing
- No indication of content update frequency
- No citation of sources in guides (e.g., IPCC version, EPA year)

### Would they trust the platform?
**Verdict:** YES — for personal reference. But limited for client-facing work without export/share features.

---

## Persona 5: First-time Visitor

**Profile:** Discovered Terrnix via search or social. No prior knowledge. Evaluates in 5-10 seconds whether to stay.

### Can they immediately understand what Terrnix offers?
**Verdict:** NO
- Hero headline: "Sustainability Intelligence Platform" — jargon
- Subheadline mentions "AI-driven analytics" — still abstract
- No visual product grid or feature icons
- No "What is Terrnix?" explainer video or animation
- The chatbot is the most prominent interactive element — but it's collapsed by default

### Can they easily find relevant tools?
**Verdict:** NO
- Navigation has 5 items — reasonable but not scannable
- No "Start Here" or "Popular Tools" section
- No visual hierarchy distinguishing tools from content

### Confusing pages?
- **Homepage** — too much text, not enough visual guidance
- **Deep Dive** — name is unclear (is it news? blog? articles?)
- **Tools** — mixes live and coming soon without visual distinction

### Dead ends?
- Homepage scrolls forever with no clear action path
- No sticky CTA or floating action button
- Footer is the only consistent navigation aid

### Trust signals?
- Dark theme looks modern
- No social proof (testimonials, user counts, client logos)
- No "As seen in" or media mentions
- No security badges or privacy certifications

### Would they trust the platform?
**Verdict:** UNLIKELY — looks professional but doesn't quickly communicate value or credibility

---

## Strengths

1. **Professional visual design** — Dark theme, consistent colour palette, modern typography
2. **Comprehensive content** — Guides are detailed and well-researched
3. **Calculator functionality** — Scope 1/2/3 with live charts is genuinely useful
4. **SEO structure** — Good metadata, canonicals, schema on most pages
5. **Accessibility foundations** — Skip links, semantic HTML, ARIA labels present
6. **Mobile responsiveness** — Tailwind-based responsive design works across devices
7. **Chatbot** — Terrnix AI provides immediate engagement for confused users
8. **Certificate generation** — Quiz completion with certificate adds credibility
9. **Breadcrumb navigation** — Present on most pages, aids orientation
10. **Consistent footer** — Reliable navigation fallback across all pages

---

## Weaknesses

1. **Homepage value proposition is unclear** — "Sustainability Intelligence" is jargon
2. **No product grid on homepage** — Tools are hidden in navigation
3. **Missing social proof** — No testimonials, client logos, case studies, user counts
4. **Deep Dive section is confusing** — Name and purpose are unclear
5. **Inconsistent tool locations** — Some in /tools/, some in /carbon-accounting/
6. **Missing conversion paths** — Guides end without CTAs; calculator results have no next step
7. **No content freshness signals** — No dates on guides, no "last updated" indicators
8. **Trust signals are weak** — No about page, team info, credentials, or certifications
9. **Coming Soon items look too live** — Some cards don't clearly indicate unavailability
10. **No save/share functionality** — Calculator results, guides can't be bookmarked or shared
11. **Footer product links are misleading** — Links to "Academy" and "Energy Suite" go to empty or generic pages
12. **Navigation lacks hierarchy** — All items feel equal, no visual distinction for primary tools
13. **Missing onboarding** — No "Getting Started" guide or tooltips for first-time users
14. **Chatbot is hidden by default** — Most users won't discover it
15. **No progress indicators** — Assessment and quiz don't show "Step 3 of 5" style progress

---

## Top 10 UX Improvements (Priority Ranked)

### P0 — Critical (Fix Before Release)

**1. Add Product Grid to Homepage**
- Show 4 product cards: Carbon Calculator, ESG Analyzer, Academy (Soon), Energy Suite (Soon)
- Clear visual distinction between LIVE and COMING SOON
- Primary CTAs for live tools, waitlist CTAs for upcoming

**2. Fix Footer Product Links**
- Remove links to empty/unready pages
- Use "Coming Soon" text instead of clickable links for Academy and Energy Suite
- Or link to their landing pages with clear "Coming Soon" messaging

**3. Clarify Deep Dive Section**
- Rename to "Sustainability Intelligence" or "News & Insights"
- Add description explaining what content type it is
- Consider merging with Resources hub

### P1 — High (Fix in RC2 Patch or RC3)

**4. Add Conversion CTAs to All Guides**
- Every guide ends with: "Try the Calculator", "Take the Assessment", or "Contact Us"
- Contextual CTAs based on guide topic

**5. Improve Calculator Results Page**
- Add "What Next?" section with 3 options: Download Report, Share Results, Get Consultation
- Show methodology summary for credibility

**6. Add Content Freshness Signals**
- "Last updated: [date]" on all guides
- "Published: [date]" on news articles
- Version numbers for framework guides (e.g., "CSRD Guide v2026.1")

**7. Standardise Tool Locations**
- All tools under /tools/ with category subfolders
- Or clear categorisation: /tools/carbon/, /tools/esg/, /tools/energy/
- Redirect old URLs to maintain SEO

### P2 — Medium (RC3 or Later)

**8. Add Social Proof Section**
- Testimonials carousel (even 2-3 is enough to start)
- "Trusted by X sustainability professionals" counter
- Client logos (when available)

**9. Create "Getting Started" Flow**
- Onboarding modal for first-time visitors
- "Not sure where to start? Take our 2-minute assessment"
- Tooltips on first visit to calculator

**10. Make Chatbot More Discoverable**
- Floating action button instead of corner bubble
- "Ask Terrnix AI" text label visible by default
- Prompt suggestions visible before opening

---

## Priority Summary

| Priority | Count | Impact | Effort |
|----------|-------|--------|--------|
| P0 — Critical | 3 | Very High | Low-Medium |
| P1 — High | 4 | High | Medium |
| P2 — Medium | 3 | Medium | Medium-High |

**Recommendation:** Address all P0 items before RC2 release. P1 items can be patched post-release. P2 items become RC3 backlog.

---

## Overall UX Score

| Dimension | Score (/10) |
|-----------|-------------|
| Clarity of Offering | 5 |
| Tool Discoverability | 6 |
| Navigation | 6 |
| Trust & Credibility | 5 |
| Content Quality | 8 |
| Mobile Experience | 7 |
| Accessibility | 7 |
| Conversion Paths | 4 |
| **Overall** | **6.0** |

**Verdict:** Good foundation with significant room for improvement. P0 fixes would raise score to 7.5+.

---

*End of UX Review*
