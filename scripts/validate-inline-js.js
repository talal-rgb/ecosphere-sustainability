#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const excludedDirectories = new Set([".git", "backend", "components", "node_modules"]);
const excludedRootFiles = new Set([
  "download-pdf.html",
  "test-encryption-migration.html",
  "test-pdf-report.html",
  "test-security-headers.html",
]);

function htmlFiles(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) htmlFiles(file, output);
    else if (entry.name.endsWith(".html") && !(directory === root && excludedRootFiles.has(entry.name))) output.push(file);
  }
  return output;
}

let checked = 0;
const errors = [];
for (const file of htmlFiles(root)) {
  const html = fs.readFileSync(file, "utf8");
  const scripts = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  let index = 0;
  while ((match = scripts.exec(html))) {
    index += 1;
    const attributes = match[1];
    const source = match[2].trim();
    if (!source || /\bsrc\s*=/.test(attributes) || /type\s*=\s*["']application\/(?:ld\+json|json)["']/i.test(attributes)) continue;
    try {
      new vm.Script(source, { filename: `${path.relative(root, file)}:inline-${index}` });
      checked += 1;
    } catch (error) {
      errors.push(`${path.relative(root, file)} inline script ${index}: ${error.message}`);
    }
  }
}

console.log(`Inline JavaScript checked: ${checked}`);
console.log(`Syntax errors: ${errors.length}`);
for (const error of errors) console.error(`  ERROR ${error}`);
process.exit(errors.length ? 1 : 0);
