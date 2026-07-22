# CURRENT_SPRINT.md — Terrnix Active Sprint

**Sprint:** RC2 — Content Completion & Product Experience  
**Started:** 2026-07-22  
**Target Completion:** TBD (pending PR #52 merge)  
**Owner:** Tallal (Founder)

---

## Sprint Goal

Complete all Category 2 implementation commitments from PROJECT_MEMORY.md.

---

## In Progress

| # | Commitment | Status | Owner | Branch |
|---|-----------|--------|-------|--------|
| 1 | GHG Protocol Guide | 🟢 Ready to merge | OpenClaw | agent/rc2-ghg-protocol-20260721 |
| 2 | Emission Factors Reference | 🟢 Ready to merge | OpenClaw | agent/rc2-ghg-protocol-20260721 |
| 3 | Terrnix Branding (favicon + logo) | 🟢 Ready to merge | OpenClaw | agent/rc2-branding-20260721 |
| 4 | Sustainability Quiz Platform | 🟢 Ready to merge | OpenClaw | agent/rc2-quiz-platform-20260721 |
| 5 | ESG Report Analyzer | 🔴 Not started | OpenClaw | To create |
| 6 | Energy Economics Suite | 🔴 Not started | OpenClaw | To create |

---

## Ready to Start (Priority Order)

| Priority | Commitment | Effort | Dependencies |
|----------|-----------|--------|--------------|
| P0 | ESG Report Analyzer Landing Page | Medium | None |
| P0 | Energy Economics Suite Landing Page | Small | None |
| P1 | Terrnix Branding (PDFs, Certificates, OG) | Medium | Logo assets exist |
| P2 | Google Search Console Submission | Low | Tallal manual action |

---

## Blocked

| Commitment | Blocked By | Resolution |
|-----------|-----------|------------|
| Homepage Product Experience | RC1 homepage changes not merged | Merge PR #52 first |
| Deep Dive → Academy implementation | Awaiting Tallal's decision | Tallal to decide: Academy / Learning Centre / Hybrid |
| Google Search Console submission | Requires manual action by Tallal | Tallal to submit when ready |

---

## Definition of Done

- [ ] Code reviewed and approved
- [ ] SEO impact assessed (titles, meta, schema, canonicals)
- [ ] Security impact assessed (no secrets, no XSS, no empty pages)
- [ ] Mobile responsive verified
- [ ] No broken links introduced
- [ ] No empty pages linked from homepage
- [ ] PR created with summary, files changed, risk assessment

---

## Sprint Rules

1. **Never link to empty pages** — use "Coming Soon" instead
2. **Security before features** — no shortcuts on validation, CSP, or secrets
3. **Small, reviewable PRs** — one commitment per PR where possible
4. **Always create feature branches** — never push to main
5. **Update this file daily** — status must be current

---

## Daily Standup Format

- What was completed yesterday?
- What is planned for today?
- What is blocked?
