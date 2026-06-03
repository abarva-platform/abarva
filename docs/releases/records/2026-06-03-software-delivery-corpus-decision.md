# 2026-06-03-software-delivery-corpus-decision - Software Delivery Corpus Decision

## Release ID

`2026-06-03-software-delivery-corpus-decision`

## Status

`candidate`

## Plain-English Summary

This release records the architecture decision for backlog row T281: AbarVa
will build a governed Software Delivery / AI-Led Dev corpus wave. The decision
keeps the corpus shared and non-confidential, while client-specific software
delivery artifacts remain in the client data plane.

## Layer Impact

- `internal-admin` lane: Adds an architecture decision and verifier for backlog
  governance. No runtime code or client data path changes.
- Knowledge corpus governance: Defines the decision boundary for a future
  shared corpus wave. It does not author, load, or expose new corpus rows.

## Client Applicability

- All clients: Future benefit only after T282 and later implementation work.
- Specific clients: None.
- Internal only: The ADR and tracker evidence are internal planning and
  governance artifacts.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/architecture/adr/ADR-0010-software-delivery-ai-led-dev-corpus-wave.md`
- `docs/architecture/adr/README.md`
- `scripts/architecture/verify-software-delivery-corpus-decision.mjs`
- `package.json`
- `docs/releases/records/2026-06-03-software-delivery-corpus-decision.md`

## QA / Validation

- Pass: `npm run architecture:software-delivery-corpus-decision:verify`
- Pass: `npx eslint scripts/architecture/verify-software-delivery-corpus-decision.mjs`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check`

## Rollout Plan

Docs-only rollout. After merge to `main`, ADR-0010 becomes the accepted
decision for T281. T282 remains the backlog item for scope and implementation
planning.

## Rollback Plan

Revert the PR to remove ADR-0010, the ADR index row, the verifier script,
package script, and this release record. No runtime rollback is required.

## Audit Evidence

- Pull request for this release.
- GitHub CI checks for the pull request.
- Local verifier output listed in QA / Validation.
- Tracker row T281 after merge.

## Known Gaps

This release does not build the corpus wave, load corpus rows, update retrieval,
or expose product UI. Those remain T282 and later implementation work.
