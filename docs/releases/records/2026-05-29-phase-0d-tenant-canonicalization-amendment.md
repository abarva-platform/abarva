# 2026-05-29-phase-0d-tenant-canonicalization-amendment — Tenant Canonicalization Control Package

## Release ID

`2026-05-29-phase-0d-tenant-canonicalization-amendment`

## Status

`candidate`

## Plain-English Summary

This release records the founder-approved tenant canonicalization decision and prepares the control-plane instructions for Phase 0D cleanup. It defines five canonical tenants, splits healthcare into provider and medtech sub-verticals, adds Packet 31 invariants for industry isolation and canonical tenant allowlists, and creates the Codex execution prompt for archive-first cleanup of retired tenants.

## Layer Impact

Architecture/control lane: ADR-0001 is amended with the five canonical tenants, the healthcare provider/medtech split, and the Phase 0D cleanup scope.

Governance/QA lane: Packet 31 gains I9, I10, the universal-verification rule, and the "Drift via implicit allowlist" anti-pattern so future agent work inherits the same discipline.

Execution lane: Packet 35 Phase 0D prompt defines the diagnostic, archive, merge/delete, orphan-scan, and verification sequence. This release does not execute destructive cleanup by itself.

## Client Applicability

- All clients: establishes the control-plane rule that only canonical tenants are allowed after Phase 0D.
- Specific clients: Apex Retail, Meridian Health, Northstar Clinical Technologies, First Capital, and SkyHarbor Air are the canonical tenant set.
- Internal only: Phase 0D execution prompt and Packet 31 amendments.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- PR #2411.
- `docs/architecture/adr/0001-canonical-pattern-storage.md`
- `docs/architecture/packet-31-amendments/2026-05-29-i9-i10-allowlist-drift.md`
- `docs/build/PACKET_35_PHASE_0D_CODEX_PROMPT.md`
- `docs/releases/records/2026-05-29-phase-0d-tenant-canonicalization-amendment.md`

## QA / Validation

- PASS: `git diff --check`.
- PASS: GitHub release-control gate after this record is added.
- NOT RUN: production tenant cleanup. This release is the control package; Phase 0D execution happens in follow-on implementation PRs/runs.

## Rollout Plan

Merge to `main` after CI green. The amended ADR and Packet 31 rules become the operating source of truth immediately. Phase 0D cleanup then runs from refreshed `main` using the prompt in `docs/build/PACKET_35_PHASE_0D_CODEX_PROMPT.md`.

## Rollback Plan

Revert PR #2411 to remove the Phase 0D control package. No production data is changed by this release, so rollback is docs-only.

## Audit Evidence

- PR #2411.
- Founder approval in 2026-05-29 thread for five canonical tenants and healthcare provider/medtech split.
- ADR-0001 Amendment A1.
- Packet 31 I9/I10 amendment.
- Phase 0D execution prompt with archive-first and orphan-scan requirements.

## Known Gaps

Phase 0D has not yet executed. Retired tenants are still present until the follow-on cleanup runs and verifies zero orphan references.
