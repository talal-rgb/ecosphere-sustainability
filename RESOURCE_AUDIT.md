# Resource Section Audit — 2026-07-19

## Summary

| Page | URL | Status | Issue |
|------|-----|--------|-------|
| FAQ Hub | `/resources/faq/` | **404 — MISSING** | Linked from resources/index.html, directory does not exist |
| Glossary Hub | `/resources/glossary/` | **404 — MISSING** | Linked from resources/index.html, directory does not exist |
| Guides Hub | `/resources/guides/` | **404 — MISSING** | Linked from resources/index.html, directory does not exist |

## Findings

### 1. FAQ Hub (`/resources/faq/`)
- **Linked from:** `resources/index.html:56`
- **Status:** 404 — directory `resources/faq/` does not exist
- **Impact:** Broken link on live site
- **Action required:** Create `resources/faq/index.html` with ~20 high-quality FAQs

### 2. Glossary Hub (`/resources/glossary/`)
- **Linked from:** `resources/index.html:48`
- **Status:** 404 — directory `resources/glossary/` does not exist
- **Impact:** Broken link on live site
- **Action required:** Create `resources/glossary/index.html` with ~30 sustainability terms

### 3. Guides Hub (`/resources/guides/`)
- **Linked from:** `resources/index.html:64`
- **Status:** 404 — directory `resources/guides/` does not exist
- **Impact:** Broken link on live site
- **Action required:** Create `resources/guides/index.html` with ~10 practical implementation guides

### 4. Cross-site Link Check
- Searched all HTML/JS/JSON files for references to `faq`, `glossary`, `guides`
- **Result:** Only `resources/index.html` contains links to these three directories
- No other pages, navigation, footers, or components reference them
- No existing content to duplicate — these are genuinely new pages

## Stop Condition

✅ When all three hubs exist with real content, metadata, internal links, and schema
✅ No placeholders, no "Coming Soon", no empty sections
✅ All pages return HTTP 200

## Files to Create

1. `resources/faq/index.html` — 20 FAQs
2. `resources/glossary/index.html` — 30 terms
3. `resources/guides/index.html` — 10 guides

## Files to Modify

None — existing links in `resources/index.html` are correct and will work once directories exist.
