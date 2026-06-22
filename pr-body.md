## Goal
Add comprehensive lead attribution tracking to the contact form submission pipeline.

## Files Changed
- `index.html` — Frontend: capture UTM params, referrer, source URL, timestamp; calculate lead score
- `backend/server.js` — Backend: validate new fields, persist to lead store, include in notification email
- `backend/services/leadStore.js` — Storage: extend record schema with attribution fields

## What Gets Tracked
| Field | Source | Example |
|-------|--------|---------|
| **sourceUrl** | `window.location.href` | `https://terrnix.com/?utm_source=linkedin` |
| **submissionTimestamp** | `new Date().toISOString()` | `2026-06-22T10:54:00.000Z` |
| **utmSource** | URL param `utm_source` | `linkedin`, `google`, `newsletter` |
| **utmMedium** | URL param `utm_medium` | `cpc`, `organic`, `email` |
| **utmCampaign** | URL param `utm_campaign` | `q3-esg-webinar` |
| **referrer** | `document.referrer` | `https://linkedin.com/...` |
| **leadScore** | Calculated (0-100) | `85` |

## Lead Scoring Logic
| Criteria | Points |
|----------|--------|
| Company provided | +25 |
| Phone provided | +20 |
| Business email domain (not free) | +20 |
| Specific discipline selected | +15 |
| Detailed message (≥100 chars) | +15 |
| Message contains project keywords | +5 |
| **Max** | **100** |

## Security
- All new fields are optional (backward-compatible)
- Server-side validation: URL format, ISO8601 timestamp, length limits, regex sanitization
- Lead score validated as integer 0-100
- No PII stored in lead file (IP/UA still null)

## Tests
- [ ] Submit form with UTM params → verify all fields in lead JSONL
- [ ] Submit form without UTM params → verify backward compatibility
- [ ] Verify lead score calculation accuracy
- [ ] Verify email notification includes attribution block

## Rollback
Revert commit `b756baa` or restore previous `saveLead()` signature.
