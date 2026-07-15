#!/usr/bin/env node
/**
 * Terrnix Intelligence Content Validator
 *
 * Enforces editorial standards before deployment:
 * - No em dash variants (Unicode, HTML entity, numeric)
 * - No AI-style phrases
 * - Valid article card hrefs
 * - Client-side category filtering (no broken routes)
 *
 * Exit code 0 = all checks pass
 * Exit code 1 = violations found
 */

const fs = require('fs');
const path = require('path');

const INTELLIGENCE_DIR = path.join(__dirname, '..', 'sustainability-intelligence');

// Forbidden punctuation patterns
const EM_DASH_PATTERNS = [
  { name: 'Unicode em dash', regex: /—/g },
  { name: '&mdash;', regex: /&mdash;/gi },
  { name: '&#8212;', regex: /&#8212;/gi },
  { name: '&#x2014;', regex: /&#x2014;/gi },
];

// Forbidden AI-style phrases (case-insensitive, word-boundary aware)
const AI_PHRASES = [
  /\bHere\s+is\s+what\s+changed\b/gi,
  /\bHere\s+are\s+the\s+key\s+changes\b/gi,
  /\bBottom\s+line\b/gi,
  /\bWhat\s+this\s+means\b/gi,
  /\bWhat\s+to\s+do\s+now\b/gi,
  /\bThe\s+reality\s+is\b/gi,
  /\bIn\s+today['']?s\s+world\b/gi,
  /\bGame\s+changer\b/gi,
  /\bRevolutionary\b/gi,
  /\bThis\s+changes\s+everything\b/gi,
  /\bNow\s+more\s+than\s+ever\b/gi,
  /\bIt\s+is\s+important\s+to\s+note\b/gi,
  /\bNeedless\s+to\s+say\b/gi,
  /\bNeedless\s+to\s+mention\b/gi,
  /\bAs\s+we\s+move\s+forward\b/gi,
  /\bKey\s+takeaways?\b/gi,
];

// File extensions to scan
const SCAN_EXTENSIONS = new Set(['.html', '.md', '.json', '.js']);

let violations = [];
let filesScanned = 0;

function logViolation(file, line, type, detail) {
  violations.push({ file, line, type, detail });
}

function scanFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!SCAN_EXTENSIONS.has(ext)) return;

  const relativePath = path.relative(process.cwd(), filePath);
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`ERROR: Cannot read ${relativePath}: ${err.message}`);
    process.exit(1);
  }

  filesScanned++;
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check em dash variants
    EM_DASH_PATTERNS.forEach(({ name, regex }) => {
      const matches = line.match(regex);
      if (matches) {
        logViolation(relativePath, lineNum, 'EM_DASH', `${name}: ${matches.length} occurrence(s)`);
      }
    });

    // Check AI phrases
    AI_PHRASES.forEach((regex) => {
      const matches = line.match(regex);
      if (matches) {
        logViolation(relativePath, lineNum, 'AI_PHRASE', `"${matches[0]}"`);
      }
    });
  });

  // Check for broken category links (only in HTML files)
  if (ext === '.html') {
    const categoryLinkRegex = /href=["']\/sustainability-intelligence\/category\/[^"']+["']/gi;
    const matches = content.match(categoryLinkRegex);
    if (matches) {
      matches.forEach((match) => {
        logViolation(relativePath, null, 'BROKEN_CATEGORY_LINK', `Category link found: ${match}`);
      });
    }
  }

  // Check article card hrefs (only in hub index.html)
  if (filePath.endsWith('sustainability-intelligence/index.html')) {
    const cardRegex = /<a[^>]+class=["'][^"']*article-card[^"']*["'][^>]*href=["']([^"']+)["']/gi;
    let m;
    while ((m = cardRegex.exec(content)) !== null) {
      const href = m[1];
      if (!href || href.trim() === '') {
        logViolation(relativePath, null, 'MISSING_CARD_HREF', 'Article card has empty or missing href');
      } else if (!href.startsWith('/sustainability-intelligence/')) {
        logViolation(relativePath, null, 'INVALID_CARD_HREF', `Article card href does not start with /sustainability-intelligence/: ${href}`);
      }
    }
  }
}

function scanDirectory(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    console.error(`ERROR: Cannot read directory ${dir}: ${err.message}`);
    process.exit(1);
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      scanFile(fullPath);
    }
  }
}

function main() {
  console.log('Terrnix Intelligence Content Validator');
  console.log('=====================================\n');

  if (!fs.existsSync(INTELLIGENCE_DIR)) {
    console.error(`ERROR: Intelligence directory not found: ${INTELLIGENCE_DIR}`);
    process.exit(1);
  }

  scanDirectory(INTELLIGENCE_DIR);

  console.log(`Files scanned: ${filesScanned}`);
  console.log(`Violations found: ${violations.length}\n`);

  if (violations.length === 0) {
    console.log('✅ All checks passed.');
    process.exit(0);
  }

  // Group violations by type
  const byType = {};
  violations.forEach((v) => {
    byType[v.type] = byType[v.type] || [];
    byType[v.type].push(v);
  });

  Object.keys(byType).sort().forEach((type) => {
    const items = byType[type];
    console.log(`\n❌ ${type} (${items.length} violation${items.length > 1 ? 's' : ''}):`);
    items.forEach((v) => {
      const location = v.line ? `${v.file}:${v.line}` : v.file;
      console.log(`   ${location} — ${v.detail}`);
    });
  });

  console.log('\n⛔ Validation failed. Fix violations before committing.');
  process.exit(1);
}

main();
