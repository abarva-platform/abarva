#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [
  {
    file: 'src/components/tower/TowerIndexPage.tsx',
    forbidden: [
      '/api/v1/atlas/chat',
      'aVa could not answer that right now',
      'Honest read: the Tower summary is still valid',
    ],
  },
  {
    file: 'src/components/atlas/AtlasChatPanel.tsx',
    forbidden: [
      'replace(/\\bAtlas\\b/g',
      'replace(/\\batlas\\b/g',
    ],
  },
];

const failures = [];

for (const check of checks) {
  const text = fs.readFileSync(path.join(root, check.file), 'utf8');
  for (const forbidden of check.forbidden) {
    if (text.includes(forbidden)) {
      failures.push(`${check.file} still contains ${JSON.stringify(forbidden)}`);
    }
  }
}

if (failures.length) {
  console.error('CIO Tower live chat sunset guard failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('CIO Tower live chat sunset guard passed.');
