#!/usr/bin/env node

import { readdirSync } from 'node:fs';
import path from 'node:path';
import { parseArgs, printCreated, repoPath, requireText, slugify, todayIso, writeNewFile } from './utils.mjs';

const args = parseArgs();
const root = args.root ?? process.cwd();
const adrDir = repoPath(root, 'docs', 'architecture', 'adr');
const title = requireText(args, 'title', 'Example: npm run scaffold:adr -- --title "Client data-plane routing"');
const status = args.status ?? 'Proposed';
const date = args.date ?? todayIso();
const slug = slugify(args.slug ?? title);

function nextNumber() {
  const explicit = args.number ? Number.parseInt(String(args.number), 10) : null;
  if (Number.isInteger(explicit) && explicit > 0) return explicit;

  let highest = 0;
  for (const entry of readdirSync(adrDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const match = entry.name.match(/^ADR-(\d{4})-/);
    if (match) highest = Math.max(highest, Number.parseInt(match[1], 10));
  }
  return highest + 1;
}

const number = String(nextNumber()).padStart(4, '0');
const fileName = `ADR-${number}-${slug}.md`;
const filePath = path.join(adrDir, fileName);
const contents = `# ADR-${number} - ${title}

## Status

${status}

## Date

${date}

## Context

Describe the forces, constraints, and verified repo facts that make this decision necessary. Reference real paths only.

## Decision

State the decision in plain language.

## Consequences

List the expected benefits, costs, tradeoffs, and follow-up obligations.

## Alternatives

List material alternatives that were considered and why they were not chosen.

## References

- Replace with supporting code paths, docs, PRs, issues, or external references.
`;

const created = writeNewFile(filePath, contents, { force: Boolean(args.force) });
printCreated('ADR scaffolded', created, [
  'Add the ADR to docs/architecture/adr/README.md before opening the PR.',
  'Keep references tied to verified repo paths; do not record aspirations as shipped facts.',
]);
