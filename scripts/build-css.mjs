#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const tailwind = resolve(root, 'node_modules', '.bin', 'tailwindcss');
const source = resolve(root, 'assets', 'css', 'tailwind-source.css');
const designSource = resolve(root, 'components', 'design-system.css');
const designOutput = resolve(root, 'components', 'design-system.min.css');
const bundles = [
  ['tailwind.config.js', 'assets/css/tailwind.css'],
  ['tailwind.home.config.js', 'assets/css/tailwind-home.css'],
  ['tailwind.platform.config.js', 'assets/css/tailwind-platform.css'],
];

function compile(config, input, output) {
  execFileSync(
    tailwind,
    ['-c', resolve(root, config), '-i', input, '-o', resolve(root, output), '--minify'],
    { cwd: root, stdio: 'inherit' },
  );
}

compile('tailwind.config.js', designSource, designOutput);
const designSystem = readFileSync(designOutput, 'utf8');

for (const [config, output] of bundles) {
  compile(config, source, output);
  appendFileSync(resolve(root, output), `\n${designSystem}\n`);
}
