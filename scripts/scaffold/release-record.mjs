#!/usr/bin/env node

import { parseArgs, printCreated, repoPath, requireText, slugify, todayIso, writeNewFile } from './utils.mjs';

const args = parseArgs();
const root = args.root ?? process.cwd();
const date = args.date ?? todayIso();
const title = requireText(args, 'title', 'Example: npm run scaffold:release -- --title "Source approval gate"');
const slug = slugify(args.slug ?? title);
const lane = args.lane ?? 'internal-admin';
const layer = args.layer ?? `${lane}: describe the affected layer before opening the PR.`;
const clients = args.clients ?? 'Internal only: replace with all clients, specific clients, internal only, public/demo only, or feature flag.';
const status = args.status ?? 'draft';
const id = args.id ?? `${date}-${slug}`;
const filePath = repoPath(root, 'docs', 'releases', 'records', `${id}.md`);

const contents = `# ${id} - ${title}

## Release ID

\`${id}\`

## Status

\`${status}\`

## Plain-English Summary

Scaffolded release record for ${title}. Replace this paragraph with a pilot-buyer-readable explanation of what changed and why before the pull request is ready.

## Layer Impact

- \`${lane}\`: ${layer}

## Client Applicability

- All clients: Replace with applicability.
- Specific clients: Replace with named clients or None.
- Internal only: ${clients}
- Public/demo only: Replace with applicability or None.
- Feature flag: Replace with flag name or None.

## Changes Included

- Replace with the PR, commits, routes, scripts, migrations, and docs that materially changed.

## QA / Validation

- Not run yet: replace with passed, failed, blocked, or not-run validation before merge.

## Rollout Plan

Replace with how this becomes active, such as merge to main, Azure Container Apps deploy, manual runbook, migration apply, or no runtime rollout.

## Rollback Plan

Replace with the fastest safe rollback path, including any migration constraints if applicable.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Additional evidence: Replace with screenshots, logs, smoke output, or not applicable.

## Known Gaps

Replace with known gaps, explicit out-of-scope items, or \`None known\`.
`;

const created = writeNewFile(filePath, contents, { force: Boolean(args.force) });
printCreated('Release record scaffolded', created, [
  'Fill every placeholder before opening the PR.',
  'Run npm run release:check -- --base origin/main --head HEAD before pushing.',
]);
