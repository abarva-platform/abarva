# 2026-07-31-skyharbor-air-foundation-v2-phase0-freeze — Freeze skyharbor-air as a Foundation V2 tenant candidate (Phase 0)

## Release ID

`2026-07-31-skyharbor-air-foundation-v2-phase0-freeze`

## Status

`candidate`

## Plain-English Summary

The Tenant Knowledge Execution Program (formerly "Dual-Tenant," renamed here since this is the third
candidate) governs the real, gated path from source data to a published, product-certified knowledge
baseline — the actual factory model this repo already committed to, as distinct from the faster
tactical Admin-Loader-connector path. Today it covered exactly two candidates: `healthcare-demo-new`
(frozen) and `airline-demo-new` (blocked). skyharbor-air was not a candidate at all, despite having
the richest, most governed dataset of any tenant in this repo as of today (26 files, 510-row interview
set, all landed through individually-reviewed PRs with release records).

This release adds skyharbor-air as a third candidate and completes its Phase 0 (freeze) gate:

- A freeze manifest (`clients/skyharbor-air/execution/skyharbor-air-source-corpus-v1.0.0.freeze-manifest.json`)
  pinning the exact source commit, file list, and what this freeze does and does not authorize.
- Real semantic audit evidence — `npm run audit:tenant-quality -- --tenant skyharbor-air`'s actual
  output (14/26 files `PRODUCT_USABLE`, 12 `USABLE_WITH_LIMITATIONS` with specific named findings, 0
  `NOT_USABLE`), not a self-reported "looks good."
- An honest gap: skyharbor-air has no restricted-evaluator hidden-truth/crosswalk package, unlike the
  other two candidates — recorded as a real gap in the freeze manifest, not fabricated to match their
  shape.
- A scoping document (`docs/ops/skyharbor-air-foundation-v2-extension-scope.md`) laying out Phases
  1-8 with honest effort/risk estimates, explicitly flagging Phase 1 (Azure infrastructure) as
  requiring its own separate go-ahead.

## Layer Impact

**Release lane: `client-data-lane`.**

- Governance/documentation only. No Layer 1 source data changed, no Layer 3 canonical model touched,
  no database write, no Azure action of any kind.

## Client Applicability

- All clients: No.
- Specific clients: `skyharbor-air` only.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `clients/skyharbor-air/execution/skyharbor-air-source-corpus-v1.0.0.freeze-manifest.json`.
- Adds `clients/skyharbor-air/execution/skyharbor-air-tenant-quality-audit-2026-07-31.json` (real audit
  tool output, captured as evidence).
- Modifies `docs/ops/dual-tenant-knowledge-execution-program.md` — renames the document (title text
  only, filename unchanged to avoid link rot; confirmed no other file references the old title text),
  adds skyharbor-air's disposition row and a "Phase 0 SkyHarbor Freeze" section matching the existing
  Healthcare/Airline pattern.
- Adds `docs/ops/skyharbor-air-foundation-v2-extension-scope.md` — the Phase 1-8 scoping document.

## QA / Validation

- Freeze manifest validated as syntactically correct JSON before commit.
- Audit evidence is the actual, real output of a tool run against the actual current dataset — verified
  by re-running it during this PR's preparation, not copied from an earlier claim.
- Confirmed via grep that no other document or code references the old "Dual-Tenant Knowledge Execution
  Program" title text before renaming it, so the rename doesn't break anything.
- `node scripts/release-check.mjs` — passed.

## Rollout Plan

Merge to `main` via the standard squash-merge path. No runtime rollout — documentation and audit
evidence only.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable.
- Shared runtime mutators: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the merge commit. No live data, infrastructure, or runtime behavior touched.

## Audit Evidence

- PR (this change) — see PR description for link.
- `clients/skyharbor-air/execution/skyharbor-air-tenant-quality-audit-2026-07-31.json`
- The 7 prior skyharbor-air enrichment PRs merged today (#5842-#5848), which are what this freeze pins.

## Known Gaps

- No hidden-truth/crosswalk restricted-evaluator package exists for skyharbor-air — a real gap,
  explicit in the freeze manifest, not fabricated.
- Phase 1 (Azure zero-data infrastructure) is scoped but not started and not authorized by this
  release — requires its own explicit go-ahead before any `az` command runs against real
  infrastructure.
