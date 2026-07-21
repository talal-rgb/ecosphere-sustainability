# Sustainability Quiz Platform Review — Terrnix RC1

**Date:** 2026-07-21
**Auditor:** Terrnix AI
**Scope:** Main Sustainability Quiz on homepage

---

## Executive Summary

The Sustainability Quiz **exists and is functional** but has significant limitations. It is embedded in the homepage (not standalone), has no certificate integration, and has minimal CBAM coverage.

**Status:** ⚠️ Functional but immature

| Feature | Status | Notes |
|---------|--------|-------|
| Quiz exists | ✅ YES | 30 questions, embedded in homepage |
| Standalone page | ❌ NO | Only accessible via homepage #quiz |
| Score tracking | ✅ YES | Percentage + breakdown by difficulty |
| Explanations | ✅ YES | Every question has detailed explanation |
| Difficulty levels | ✅ YES | Beginner (12), Intermediate (12), Advanced (6) |
| Lead capture | ✅ YES | Email + name + consent |
| Certificate | ❌ NO | No certificate generation |
| CBAM coverage | ⚠️ MINIMAL | 1 question out of 30 |
| Progress tracking | ❌ NO | No persistence between sessions |
| Multiple quizzes | ❌ NO | Only one general quiz |

---

## Quiz Structure

### Questions by Category

| Category | Count | % of Total |
|----------|-------|------------|
| Energy | 5 | 16.7% |
| ESG | 5 | 16.7% |
| Carbon Accounting | 5 | 16.7% |
| GHG Protocol | 5 | 16.7% |
| Regulations | 5 | 16.7% |
| Carbon Pricing | 5 | 16.7% |
| **Total** | **30** | **100%** |

### Questions by Difficulty

| Difficulty | Count | % of Total |
|------------|-------|------------|
| Beginner | 12 | 40% |
| Intermediate | 12 | 40% |
| Advanced | 6 | 20% |
| **Total** | **30** | **100%** |

### CBAM Coverage

**CBAM-specific questions:** 1 out of 30 (3.3%)

The single CBAM question is in the "Carbon Pricing" category:
- Question: "What is the primary goal of the EU Carbon Border Adjustment Mechanism (CBAM)?"
- Difficulty: Intermediate
- Topic: CBAM

**Assessment:** CBAM coverage is insufficient for a platform that has dedicated CBAM intelligence articles. A user reading the CBAM article and wanting to test knowledge will find almost no CBAM content in the quiz.

---

## Technical Implementation

### Strengths

1. **Clean data structure:** Questions are well-structured objects with metadata
2. **Immediate feedback:** Explanations shown after each answer
3. **Difficulty tracking:** Separate scores for Beginner/Intermediate/Advanced
4. **Responsive design:** Works on mobile and desktop
5. **Lead capture:** Integrates with email system for results delivery
6. **No external dependencies:** Pure JavaScript, no framework required

### Weaknesses

1. **Homepage-only:** Quiz is embedded in index.html (lines 4399-5950, ~1,550 lines)
   - Cannot be linked directly
   - Cannot be shared
   - Homepage bloat

2. **No certificate integration:**
   - Certificate verification system exists at `/certificate/verify/`
   - Quiz does not generate certificates
   - Missed opportunity for lead generation and brand authority

3. **No progress persistence:**
   - Results lost on page refresh
   - No user accounts or localStorage tracking
   - Cannot resume incomplete quizzes

4. **Single quiz only:**
   - No topic-specific quizzes
   - No difficulty-filtered quizzes
   - One-size-fits-all approach

5. **Limited accessibility:**
   - No keyboard navigation for options
   - No ARIA labels
   - Screen reader support untested

6. **No analytics:**
   - No tracking of completion rates
   - No tracking of average scores by category
   - No identification of hardest questions

---

## Content Quality

### Question Quality: HIGH

- Questions are specific and unambiguous
- Explanations are detailed and educational
- Topics cover relevant sustainability domains
- No obvious errors or outdated information

### Content Gaps

| Missing Topic | Relevance | Priority |
|---------------|-----------|----------|
| CBAM (detailed) | HIGH | High |
| CSRD/ESRS | HIGH | High |
| ISSB S1/S2 | MEDIUM | Medium |
| Scope 3 (detailed) | HIGH | High |
| Circular Economy | MEDIUM | Medium |
| Water Stewardship | LOW | Low |
| Biodiversity/TNFD | MEDIUM | Medium |

---

## Comparison to Audit Requirements

### Workstream E Requirements

| Requirement | Status | Gap |
|-------------|--------|-----|
| Does it still exist? | ✅ YES | — |
| Was it removed? | ❌ NO | — |
| Is it hidden? | ⚠️ PARTIALLY | Embedded in homepage, no direct link |
| Is it broken? | ❌ NO | Functional |
| Restore if missing | N/A | Not missing |
| Score | ✅ YES | Implemented |
| Explanations | ✅ YES | Implemented |
| Certificate | ❌ NO | System exists but not integrated |
| Verification | ❌ NO | Not integrated |

---

## Recommendations

### Immediate (RC1)

1. **No action required** — Quiz is functional
2. **Document limitations** in QUIZ_PLATFORM_REVIEW.md ✅
3. **Add to BACKLOG:** Certificate integration, standalone quiz page

### Short-term (Post-RC1)

4. **Extract quiz to standalone page**
   - Create `/quiz/` or `/assessment/sustainability/`
   - Reduce homepage size by ~1,550 lines
   - Enable direct linking and sharing
   - **Effort:** 3-4 hours

5. **Integrate certificate system**
   - Generate certificate for scores >70%
   - Store certificate ID in database
   - Enable verification at `/certificate/verify/`
   - **Effort:** 4-6 hours

6. **Add topic-specific quizzes**
   - CBAM Quiz (15-20 questions)
   - CSRD Quiz (15-20 questions)
   - Carbon Accounting Quiz (15-20 questions)
   - **Effort:** 8-12 hours (content + implementation)

### Medium-term

7. **Build quiz platform architecture**
   - Shared question bank
   - Dynamic quiz generation by topic/difficulty
   - User progress tracking (localStorage or accounts)
   - Analytics dashboard
   - **Effort:** 16-24 hours

---

## Files Analyzed

- `index.html` lines 4399-5950 (quiz section)
- `certificate/verify/index.html` (certificate system)
- `QUIZ_PLATFORM_AUDIT.md` (prior audit)

---

## Prior Audit Reference

The file `QUIZ_PLATFORM_AUDIT.md` exists in the repository. It should be reviewed for historical context and to ensure recommendations are not duplicated.

---

*Report generated by Terrnix AI — 2026-07-21*
