#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'docs/security/EXTERNAL_PEN_TEST_READINESS_PACKET.md',
  'docs/runbooks/external-penetration-test.md',
  'docs/releases/records/2026-06-03-external-pen-test-readiness.md',
];

const requiredTerms = new Map([
  [
    'docs/security/EXTERNAL_PEN_TEST_READINESS_PACKET.md',
    [
      'T031 remains `In progress`',
      'No cross-client testing',
      'Tenant isolation',
      'AI/agent surfaces',
      'Done Criteria For T031',
      'Vendor contract or statement of work executed',
    ],
  ],
  [
    'docs/runbooks/external-penetration-test.md',
    [
      'Pre-Booking Checklist',
      'Rules Of Engagement',
      'Finding Triage',
      'Closure Checklist',
      'npm run security:pen-test-readiness:verify',
    ],
  ],
  [
    'docs/releases/records/2026-06-03-external-pen-test-readiness.md',
    ['internal-admin', 'T031', 'does not complete the external penetration test'],
  ],
]);

let failures = 0;

for (const file of requiredFiles) {
  let content = '';
  try {
    content = readFileSync(join(root, file), 'utf8');
  } catch (error) {
    console.error(`missing: ${file}`);
    failures += 1;
    continue;
  }

  for (const term of requiredTerms.get(file) ?? []) {
    if (!content.includes(term)) {
      console.error(`missing term in ${file}: ${term}`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  console.error(`pen-test readiness verification failed: ${failures} issue(s)`);
  process.exit(1);
}

console.log('pen-test readiness verification passed');
