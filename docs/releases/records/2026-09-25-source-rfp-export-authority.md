# 2026-09-25-source-rfp-export-authority — Governed RFP download boundary

## Release ID

`2026-09-25-source-rfp-export-authority`

## Status

`candidate`

## Plain-English Summary

RFP downloads now require the exact artifact linked to the event to be current, tenant-matched, approved for external use, and actively accepted. The downloaded bytes must match the file's recorded SHA-256 digest. No route may silently regenerate a different RFP, substitute another client-final file, or return a cover-only PDF as a successful RFP.

## Layer Impact

Release lane: `global-control-lane`. This is a Layer 4 Source export control over existing governed artifact references. It does not create or alter Layer 3 commercial facts, supplier identity, pricing, approvals, or canonical evidence.

## Client Applicability

- All clients: RFP downloads through the unified and legacy DOCX, HTML, and PDF routes.
- Specific clients: None.
- Internal only: The authenticated export path remains an internal operator path; this release does not issue supplier invitations.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Require a linked, current Source artifact with matching event, tenant, client, and code before RFP bytes are returned.
- Require active acceptance for the same event and artifact version, with current content, ready gate preconditions, authoritative role, and the contract's external-use governance stage.
- Stream only the linked persisted file after SHA-256 readback; a format mismatch remains explicit.
- Keep the authored-body quality gate for accepted generated files and refuse degraded cover-only RFP PDFs.
- Apply the same RFP authority helper to unified and legacy render endpoints.

## QA / Validation

- Red-first route tests: Pass as a reproduced failure before implementation for missing link, early final-file streaming, cross-tenant row, acceptance omission, wrong linked file, digest mismatch, and failed body quality.
- Focused Jest: Pass, 37 tests across route, legacy wiring, RFP quality, and the packed DOCX renderer. The wiring suite parses TypeScript call nodes and rejects a renamed authority call. The DOCX suite inspects actual `word/document.xml` bytes from a synthetic rendered file. HTML response tests verify restrictive CSP and `nosniff` survive the accepted-file path. Stale, not-ready, wrong-event, and wrong-version acceptance rows each fail closed.
- TypeScript: Pass with Node 24 and an 8 GB heap. The initial Node 25 default-heap run failed before diagnostics.
- Scoped ESLint: Pass.
- `npm run audit:lib-orphans`: Pass, no baseline change. `npm run release:check`: Pass.
- Live rendered-file and supplier-recipient acceptance: Not run. No synthetic or live supplier distribution is claimed.

## Rollout Plan

Merge by reviewed PR. Only the repository-owned ACA main workflow may build and deploy the resulting image. No migration, data build, email, supplier contact, feature flag, or traffic change is part of this candidate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Owed after merge.
- ACA runtime invariant: Owed after merge.
- Worker image invariant: Owed after merge.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for an RFP download refusal and a separately authorized positive file case.

## Rollback Plan

Revert the PR and redeploy through the repository-owned main workflow. No data rollback is needed. Reversion removes this export control, so an operator should suspend RFP distribution until another fail-closed boundary is proven.

## Audit Evidence

The red and green focused test output, TypeScript and ESLint results, PR review/CI, official deploy run, immutable image proof, and signed-in replay are distinct evidence layers.

## Known Gaps

This is not an immutable recipient-scoped RFx release snapshot or a supplier portal distribution decision. It does not prove supplier-specific visibility, numeric-claim lineage, evidence IDs for every rendered assertion, or the quality of any actual supplier-facing file. Those remain blocked on the separate governed release packet and rendered-content validation work.
