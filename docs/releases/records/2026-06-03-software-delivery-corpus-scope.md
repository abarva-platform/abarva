# 2026-06-03-software-delivery-corpus-scope - Software Delivery Corpus Scope

## Release ID

`2026-06-03-software-delivery-corpus-scope`

## Status

`candidate`

## Plain-English Summary

This release scopes backlog row T282 after ADR-0010 accepted the Software
Delivery / AI-Led Dev corpus wave. It defines the corpus boundary, seed sources,
taxonomy, pattern structure, phased build plan, response-quality gates, and
agent binding rules before any corpus rows are authored or loaded.

## Layer Impact

- `internal-admin` lane: Adds a corpus scope document and verifier for backlog
  governance. No runtime code or client data path changes.
- Knowledge corpus governance: Defines the next implementation plan for a
  shared, non-confidential corpus wave.

## Client Applicability

- All clients: Future benefit only after later corpus authoring, retrieval, and
  product surfacing work.
- Specific clients: None.
- Internal only: This is an internal execution and governance artifact.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/knowledge-corpus/SOFTWARE_DELIVERY_AI_LED_DEV_CORPUS_SCOPE_2026-06-03.md`
- `scripts/corpus/verify-software-delivery-corpus-scope.mjs`
- `package.json`
- `docs/releases/records/2026-06-03-software-delivery-corpus-scope.md`

## QA / Validation

- Pass: `npm run corpus:software-delivery-scope:verify`
- Pass: `npx eslint scripts/corpus/verify-software-delivery-corpus-scope.mjs`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check`

## Rollout Plan

Docs-only rollout. After merge to `main`, the scope document becomes the T282
execution boundary for future corpus authoring and retrieval work.

## Rollback Plan

Revert the PR to remove the scope document, verifier script, package script, and
release record. No runtime rollback is required.

## Audit Evidence

- Pull request for this release.
- GitHub CI checks for the pull request.
- Local verifier output listed in QA / Validation.
- Tracker row T282 after merge.

## Known Gaps

This release does not author patterns, load corpus rows, regenerate the corpus
release manifest, change retrieval, or expose product UI. Those remain follow-on
implementation items.
