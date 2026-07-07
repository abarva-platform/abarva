# 2026-06-02-corpus-release-manifest - Corpus Release Manifest

## Release ID

`2026-06-02-corpus-release-manifest`

## Status

`candidate`

## Plain-English Summary

Added an idempotent corpus release manifest generator and seeded the first
committed manifest for AbarVa industry corpus release inputs. The manifest gives
operators a concrete release id, version, file list, per-file SHA-256 checksums,
and aggregate SHA-256 for audit and future client/pilot corpus pinning.

## Layer Impact

Architecture and internal-admin documentation/tooling. No runtime code, product
UI, migrations, private data-plane behavior, or client data changed.

## Client Applicability

- All clients: None directly.
- Specific clients: None.
- Internal only: AbarVa corpus operations and pilot preparation.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `scripts/corpus/release-manifest.mjs`.
- Added `npm run corpus:release-manifest`.
- Added `npm run corpus:release-manifest:check`.
- Added seeded JSON manifest at
  `docs/knowledge-corpus/releases/corpus-release-manifest.json`.
- Added human-readable manifest at `docs/knowledge-corpus/releases/README.md`.
- Added runbook `docs/runbooks/corpus-release-manifest.md`.

## QA / Validation

- `npm run corpus:release-manifest` passed and generated a 124-file manifest
  with aggregate SHA-256
  `c74ca49c5aece369dda41be99430f4268a49aebbaf112ae9760612999e183eaf`.
- `npm run corpus:release-manifest:check` passed.
- `git diff --check` passed.
- `npm run release:check -- --base origin/main --head HEAD` initially failed
  because this section still said planned validation; this release record was
  corrected and the gate passed.
- `npm run secrets:staged` passed with no leaks found.

## Rollout Plan

Merge to main. The manifest and scripts become available to corpus operators.
No runtime deployment, migration, or feature flag is required.

## Rollback Plan

Revert the PR to remove the manifest generator, generated manifest files,
package scripts, and runbook.

## Audit Evidence

- PR for this release candidate.
- Local validation output listed above.
- Release record at
  `docs/releases/records/2026-06-02-corpus-release-manifest.md`.

## Known Gaps

This creates repo-level corpus release checksums. It does not yet write
client-specific corpus pins into a database or pilot tenant configuration.
