# 2026-06-03-claude-pdf-fallback-policy - Claude PDF Fallback Policy

## Release ID

`2026-06-03-claude-pdf-fallback-policy`

## Status

`candidate`

## Plain-English Summary

This release records the architecture decision for backlog row T188: production
PDF ingestion should not use Claude native PDF as the default parser. Claude
native PDF remains available only as an explicit, human-approved last-resort
fallback after normal client data-plane, scan, template, and parser controls.

## Layer Impact

- `internal-admin` lane: Adds an architecture decision, ADR index entry, and
  verifier for backlog governance. No runtime code, parser routing, data-load
  UI, or cloud configuration changes.
- Client data-plane architecture: Clarifies the intended production parser
  order for future PDF ingestion without claiming any live Azure parser or
  tenant load is complete.

## Client Applicability

- All clients: Future production-ingestion posture once the loader/parser work
  is implemented.
- Specific clients: None.
- Internal only: The ADR, release record, and verifier are internal governance
  artifacts.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/architecture/adr/ADR-0011-pdf-parser-routing-and-claude-fallback.md`
- `docs/architecture/adr/README.md`
- `scripts/architecture/verify-claude-pdf-fallback-policy.mjs`
- `package.json`
- `docs/releases/records/2026-06-03-claude-pdf-fallback-policy.md`

## QA / Validation

- Pass: `npm run architecture:claude-pdf-fallback:verify`
- Pass: `npx eslint scripts/architecture/verify-claude-pdf-fallback-policy.mjs`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check`

## Rollout Plan

Docs-only rollout. After merge to `main`, ADR-0011 becomes the accepted
architecture policy for T188. Future parser and private data-plane
implementation work should follow this routing order.

## Rollback Plan

Revert the PR to remove ADR-0011, the ADR index row, verifier script, package
script, and this release record. No runtime rollback is required.

## Audit Evidence

- Pull request for this release.
- GitHub CI checks for the pull request.
- Local verifier output listed in QA / Validation.
- Tracker row T188 after merge.

## Known Gaps

This release does not implement Azure Document Intelligence, the parse cache,
the fallback parser, raw-mode exception handling, the admin loader UI, or a
live private data-plane processing run. Those remain separate backlog rows.
