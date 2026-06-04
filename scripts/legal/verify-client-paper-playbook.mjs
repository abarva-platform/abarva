#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const playbookPath = path.join(root, 'docs/legal/client-paper-review-playbook.md');
const redlineBriefPath = path.join(root, 'docs/legal/contract-redline-brief.md');

const requiredPlaybookSnippets = [
  'Backlog rows: T019, T020, T021',
  '## T019 - NDA Review',
  '## T020 - MSA Review',
  '## T021 - SOW Review',
  '## Issue Log Template',
  '## Evidence Packet for Counsel',
  'Mark T019, T020, or T021 `In progress`',
  'Mark a row `Done` only after counsel has reviewed',
];

const requiredRedlineSnippets = [
  'docs/legal/client-paper-review-playbook.md',
];

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${path.relative(root, filePath)}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function assertIncludes(content, snippets, filePath) {
  for (const snippet of snippets) {
    if (!content.includes(snippet)) {
      throw new Error(
        `${path.relative(root, filePath)} is missing required snippet: ${snippet}`,
      );
    }
  }
}

const playbook = readRequired(playbookPath);
const redlineBrief = readRequired(redlineBriefPath);

assertIncludes(playbook, requiredPlaybookSnippets, playbookPath);
assertIncludes(redlineBrief, requiredRedlineSnippets, redlineBriefPath);

console.log(
  JSON.stringify(
    {
      status: 'pass',
      playbook: path.relative(root, playbookPath),
      mappedBacklogRows: ['T019', 'T020', 'T021'],
      note:
        'Verifier confirms draft client-paper review coverage only; counsel approval remains external evidence.',
    },
    null,
    2,
  ),
);
