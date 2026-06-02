# 2026-06-02-competitive-intelligence - Competitive Intelligence Brief

## Release ID

`2026-06-02-competitive-intelligence`

## Status

`candidate`

## Plain-English Summary

Added an internal competitive intelligence brief for enterprise pilot
conversations. The brief summarizes how AbarVa should differentiate against
Glean, Hebbia, Writer, Anthropic-direct, BCG GenAI, and McKinsey QuantumBlack.

## Layer Impact

Internal-admin and go-to-market documentation. No runtime code, product UI,
migrations, private data-plane behavior, or client data changed.

## Client Applicability

- All clients: None directly.
- Specific clients: None.
- Internal only: AbarVa founder and sales engineering.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `docs/gtm/COMPETITIVE_INTELLIGENCE.md`.
- Updated `docs/gtm/sales-engineering-toolkit/README.md` to link the brief.
- Updated `docs/internal/README.md` to make competitive differentiation
  findable.

## QA / Validation

- `git diff --check` passed.
- `npm run release:check -- --base origin/main --head HEAD` passed with no
  release-relevant files detected by the current gate.
- Referenced repo paths verified: 69 checked, all exist.
- `npm run secrets:staged` passed with no leaks found.

## Rollout Plan

Merge to main. The brief becomes available as internal GTM documentation. No
runtime deployment, migration, or feature flag is required.

## Rollback Plan

Revert the PR to remove the brief and links.

## Audit Evidence

- PR for this release candidate.
- Local validation output listed above.
- Release record at
  `docs/releases/records/2026-06-02-competitive-intelligence.md`.

## Known Gaps

Competitive positioning is time-sensitive. This brief should be refreshed before
major buyer conversations and does not replace live research for a named
enterprise account.
