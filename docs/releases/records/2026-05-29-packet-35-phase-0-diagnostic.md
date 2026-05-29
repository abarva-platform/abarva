# 2026-05-29-packet-35-phase-0-diagnostic — Canonical Pattern Storage ADR and Diagnostic

## Release ID

`2026-05-29-packet-35-phase-0-diagnostic`

## Status

`candidate`

## Plain-English Summary

This release adds the operating decision and execution packets for the next corpus scale-up. It accepts ADR-0001, which makes `corpus_patterns` the intended single source of truth for industry pattern storage, and records the Phase 0A diagnostic finding: the app can partially retrieve the old canonical industry table today, but the newer `corpus_patterns` path is not yet the live Sentinel path.

## Layer Impact

Architecture and control lane: defines the storage decision, migration sequence, and gate before any large-scale pattern authoring starts.

Audit and release governance: adds a durable diagnostic artifact explaining the retrieval-path finding, affected tables, QA performed, and the gate that prevents Packet 35 Phase 2 authoring until the schema reconciliation lands.

Runtime app: no runtime code changes in this PR.

## Client Applicability

- All clients: the decision affects the shared corpus architecture that will later apply to every tenant.
- Specific clients: Apex Retail and SkyHarbor are named in the diagnostic smoke/gate because they are the first required post-migration verification targets.
- Internal only: the ADR, packets, and diagnostic are internal execution artifacts.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- PR #2409.
- `docs/architecture/adr/0001-canonical-pattern-storage.md`
- `docs/build/PACKET_33_PILOT_ENTERPRISE_INVESTOR_READINESS_AUDIT.md`
- `docs/build/PACKET_34_COMPREHENSIVE_BROWSER_CRAWL_SESSION.md`
- `docs/build/PACKET_35_RETAIL_ADJACENT_CORPUS_AUDIT_GENERATE_VALIDATE.md`
- `docs/build/PACKET_35_PHASE_0_CODEX_PROMPT.md`
- `verification/phase-0/RETRIEVAL_PATH_DIAGNOSTIC.md`

## QA / Validation

- PASS: static retrieval-path audit with `rg` on the current packet worktree.
- PASS: source-event smoke for an Apex Retail OMS question with model and vector provider keys blanked.
- PASS: `git diff --check`.
- PASS: Phase 0A finding recorded as P0 schema-reconciliation work, not as a completed runtime fix.

## Rollout Plan

Merge to main as documentation and release-control metadata. No Vercel production runtime behavior changes from this PR. Phase 0B code and migration work proceeds in follow-up PRs.

## Rollback Plan

Revert PR #2409 if the ADR or packet language is incorrect. Because this PR does not apply a database migration or change runtime code, rollback is documentation-only.

## Audit Evidence

- PR #2409.
- `verification/phase-0/RETRIEVAL_PATH_DIAGNOSTIC.md`
- Release-control failure log from the first #2409 run, which identified the missing release record.
- Source smoke output summarized in the diagnostic artifact.

## Known Gaps

Phase 0B is not complete in this PR. The next PR must migrate existing canonical rows into `corpus_patterns`, wire Sentinel retrieval to the canonical corpus path, handle founder classification for legacy `pattern_packs`, and verify Apex/SkyHarbor source smokes.
