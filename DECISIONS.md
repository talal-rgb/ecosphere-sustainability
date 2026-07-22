# DECISIONS.md — Terrnix Architectural & Product Decisions

**Last Updated:** 2026-07-22  
**Owner:** Tallal (Founder)  
**Repository:** talal-rgb/ecosphere-sustainability

---

## Canonical & SEO Decisions

### 1. Canonical Host: https://terrnix.com
**Decision:** All canonical URLs must use `https://terrnix.com/` — no `www.` prefix.  
**Rationale:** Consistency for SEO, avoids duplicate content issues.  
**Enforcement:** robots.txt, all canonical tags, OG URLs, sitemap.  
**Date:** 2026-07-21  
**Reversible:** No — would break SEO equity if changed.

### 2. OG Image Standard
**Decision:** Use `/assets/og-image.png` as default Open Graph image until custom images are created per page.  
**Date:** 2026-07-21  
**Reversible:** Yes — upgrade to page-specific OG images as content grows.

---

## Content & UX Decisions

### 3. Never Expose Empty Pages
**Decision:** Products or features not yet implemented must display "Coming Soon" instead of linking to empty or broken pages.  
**Rationale:** Empty pages harm user trust and SEO. "Coming Soon" sets expectation.  
**Applies To:** Homepage product cards, navigation, CTAs, internal links.  
**Date:** 2026-07-22  
**Reversible:** No — permanent UX standard.

### 4. Content Learning System Principle
**Decision:** The goal is not publishing more articles. The goal is learning which content creates traffic and customers.  
**Tracking Required:** Publish date, target keyword, search volume, ranking position, organic traffic, leads generated, conversion rate.  
**Lifecycle States:**
- **Double Down:** traffic >100/mo + conv >2%
- **Maintain:** traffic 20-100/mo
- **Sunset:** traffic <20/mo + conv <0.5% for 90 days
**Date:** 2026-06-09  
**Reversible:** No — core business methodology.

### 5. Academy Replaces Deep Dive (If Approved)
**Decision:** If Tallal approves the Academy model, the Deep Dive section will be fully replaced by Sustainability Academy.  
**Pending:** Tallal's decision on Academy vs Learning Centre vs Hybrid.  
**Date:** 2026-07-22  
**Reversible:** Only before implementation begins.

---

## Security Decisions

### 6. Security Before Features
**Decision:** Security phases take priority over new functionality.  
**Order:** Phase 1 (basics) → Phase 2 (SRI, rate limiting) → Phase 3 (headers) → new features.  
**Date:** 2026-06-07  
**Reversible:** No — non-negotiable.

### 7. Never Push Secrets
**Decision:** API keys, tokens, credentials, and sensitive data are never committed to the repository.  
**Enforcement:** .gitignore, pre-commit checks, manual review.  
**Date:** 2026-05-22  
**Reversible:** No — permanent security rule.

### 8. Never Push Directly to Main
**Decision:** All changes go through feature branches and draft pull requests.  
**Workflow:** `git checkout -b agent/<task>-YYYYMMDD` → edit → `npm run check` → commit → PR → review → merge.  
**Date:** 2026-05-22  
**Reversible:** No — permanent workflow rule.

---

## Merge & Conflict Resolution

### 9. Merge Conflict Rule
**Decision:** Never accept `--ours` or `--theirs` without comparing section headings, CTAs, metadata, schema, and file size.  
**Rationale:** Blind conflict resolution has caused broken pages and lost content.  
**Date:** 2026-07-21  
**Reversible:** No — permanent workflow rule.

---

## Content Scoring Mandate

### 10. Every Content Recommendation Must Be Scored
**Decision:** No content recommendation without a scorecard.  
**Formula:**  
`Overall = (Traffic × 0.25) + (Leads × 0.30) + ((10 - Difficulty) × 0.20) + (Relevance × 0.25)`  
**Dimensions:**
- Traffic Potential (1-10)
- Lead Generation Potential (1-10)
- Ranking Difficulty (1-10)
- Business Relevance (1-10)
**Date:** 2026-06-09  
**Reversible:** No — permanent content standard.

---

## Product Display Rules

### 11. Homepage Product Cards
**Decision:** Product section on homepage must show platform-oriented experience.  
**Products:**
- Carbon Calculator (live → link)
- ESG Report Analyzer (landing page → link)
- Sustainability Academy (coming soon → no link)
- Energy Economics Suite (coming soon → no link)
**Date:** 2026-07-22  
**Reversible:** Yes — update as products launch.

---

## Repository & Workflow

### 12. Feature Branch Naming
**Decision:** All agent branches use format: `agent/<task>-YYYYMMDD`  
**Examples:** `agent/rc1-release-candidate-20260721`, `agent/project-memory-20260722`  
**Date:** 2026-05-22  
**Reversible:** No — permanent naming convention.

### 13. PR Requirements
**Decision:** Every PR must include: summary, files changed, tests, risks, rollback plan.  
**Default:** Create draft PRs first. Never merge automatically.  
**Date:** 2026-05-22  
**Reversible:** No — permanent workflow rule.

---

## Decision Log Format

| # | Decision | Date | Reversible | Owner |
|---|----------|------|------------|-------|
| 1 | Canonical host: terrnix.com | 2026-07-21 | No | Tallal |
| 2 | OG image standard | 2026-07-21 | Yes | Tallal |
| 3 | Never expose empty pages | 2026-07-22 | No | Tallal |
| 4 | Content Learning System | 2026-06-09 | No | Tallal |
| 5 | Academy replaces Deep Dive (if approved) | 2026-07-22 | Pre-impl only | Tallal |
| 6 | Security before features | 2026-06-07 | No | Tallal |
| 7 | Never push secrets | 2026-05-22 | No | Tallal |
| 8 | Never push to main | 2026-05-22 | No | Tallal |
| 9 | Merge conflict rule | 2026-07-21 | No | Tallal |
| 10 | Content scoring mandate | 2026-06-09 | No | Tallal |
| 11 | Homepage product cards | 2026-07-22 | Yes | Tallal |
| 12 | Feature branch naming | 2026-05-22 | No | Tallal |
| 13 | PR requirements | 2026-05-22 | No | Tallal |

---

## Adding New Decisions

1. Assign next sequential number
2. State decision clearly
3. Provide rationale
4. Note reversibility
5. Add to log table
6. Update "Last Updated" date
