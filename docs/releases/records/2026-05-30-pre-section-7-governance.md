# 2026-05-30 Pre-Section-7 Governance

## Release ID

`2026-05-30-pre-section-7-governance`

## Status

`candidate`

## Plain-English Summary

This release records the governance cleanup required before Apex foundation training begins. It adds the postmortem for the `retrieveKnowledge()` tenant-scope incident, confirms the Moves redirect concern is not reproduced in production, and promotes two new operating invariants: typed tenant scope for retrieval functions and a standing Ask performance budget.

## Layer Impact

- Governance lane: Adds a committed incident postmortem and updates Packet 31 trust/invariant rules.
- QA / audit lane: Records production Moves verification and production egress-audit evidence.
- Runtime app lane: No runtime code change.
- Data plane lane: No database writes or migrations.

## Client Applicability

- All clients: Yes, the invariants apply platform-wide.
- Specific clients: The postmortem concerns SkyHarbor Ask validation and synthetic canonical tenants.
- Internal only: Yes, governance and audit artifact.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `verification/incidents/2026-05-30-retrieveknowledge-tenant-scope/POSTMORTEM.md`
- `docs/build/PACKET_31_ARCHITECTURAL_CONSTITUTION_AND_OPERATING_MODEL.md`
- `docs/architecture/packet-31-amendments/2026-05-29-i9-i10-allowlist-drift.md`

## QA / Validation

- PASS: PR #2474 was inspected for merge time, fix scope, and source files.
- PASS: `ai_egress_audit` was queried for logged production traffic during the affected window.
- PASS: Production Moves probe reached `/strategic-moves` for SkyHarbor CTO, Apex CIO, Meridian CDIO, and SkyHarbor Admin with zero console errors.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to main after CI passes. No production deploy is required because this is a documentation and audit-governance release.

## Rollback Plan

Revert this PR. No application or data rollback is required.

## Audit Evidence

- Incident postmortem: `verification/incidents/2026-05-30-retrieveknowledge-tenant-scope/POSTMORTEM.md`.
- Fix PR: https://github.com/anandsundaram-hash/abarva/pull/2474.
- First unscoped retriever commit: `2c3b9c3af38a09ee02693f9758fee8366810e835`.
- Fixed merge commit: `6eabf221fa24d37e659f16a15545c1e9f7b9b168`.
- Production Moves probe timestamp: 2026-05-30T11:26:17Z.

## Known Gaps

The I11 lint/type guard is documented as required but not implemented in this docs-only slice. It should ship as a follow-up enforcement PR.
