# 2026-07-31-healthcare-demo-new-foundation-v2-phase0-data-instantiation — Freeze healthcare-demo-new's instantiated data packet (Phase 0)

## Release ID

`2026-07-31-healthcare-demo-new-foundation-v2-phase0-data-instantiation`

## Status

`candidate`

## Plain-English Summary

healthcare-demo-new's design/template source corpus was frozen on 2026-07-27 (PR #5676) but the
tenant-input registry's `canonicalInputRoot` (`datasets/tenant-inputs/active/healthcare-demo-new/current`)
had no real files behind it — the actual consolidated, one-file-per-domain dataset instantiated from
that design corpus had not landed. This release lands that dataset (24 files, 432-row/18-role
interview set) and freezes it as its own Phase 0 gate, distinct from and building on the 2026-07-27
design freeze, mirroring exactly the freeze pattern used for `skyharbor-air` (PR #5849).

Real semantic audit evidence — `node scripts/audit/tenant-quality-audit.mjs --tenant healthcare-demo-new`'s
actual output (18/24 files `PRODUCT_USABLE`, 6 `USABLE_WITH_LIMITATIONS` with specific named findings,
0 `NOT_USABLE`) — re-run fresh during this PR's preparation in a clean worktree checked out from
current `main`, not copied from an earlier claim. This exceeds skyharbor-air's own frozen bar (14/26
`PRODUCT_USABLE`, 54%) at 18/24 (75%).

## Layer Impact

**Release lane: `client-data-lane`.**

- Layer 1 (client intake data) only. Adds a new source dataset for a synthetic reference tenant. No
  Layer 3 canonical model touched, no database write, no Azure action of any kind.

## Client Applicability

- All clients: No.
- Specific clients: `healthcare-demo-new` only.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `datasets/tenant-inputs/active/healthcare-demo-new/current/` (24 CSV files — the consolidated
  Universal Tenant Input Standard v3 packet).
- Adds `datasets/tenant-inputs/healthcare-demo-new/interviews/executive_interviews.csv` (432 rows, 18
  distinct stakeholder roles).
- Modifies `datasets/tenant-inputs/tenant-input-registry.json` — adds a `current-universal` packet
  entry under the existing `healthcare-demo-new` tenant block, alongside the existing golden-slice
  entry. `canonicalInputRoot` was unchanged (it already pointed here).
- Adds `clients/healthcare-demo-new/execution/healthcare-demo-new-current-universal-packet-v1.0.0.freeze-manifest.json`
  — a new, distinct freeze manifest. Does **not** modify or supersede the existing
  `healthcare-demo-new-source-corpus-v1.0.0.freeze-manifest.json` (2026-07-27 design-corpus freeze),
  which remains the design layer this data was instantiated from.
- Adds `clients/healthcare-demo-new/execution/healthcare-demo-new-tenant-quality-audit-2026-07-31.json`
  (real audit tool output, captured as evidence).
- Modifies `docs/ops/dual-tenant-knowledge-execution-program.md` — updates healthcare-demo-new's
  Current Disposition row and adds a "Phase 0 Healthcare Data Instantiation" section describing this
  as a distinct, later event from the 2026-07-27 design freeze.

## QA / Validation

- Freeze manifest validated as syntactically correct JSON before commit.
- Audit evidence is the actual, real output of the audit tool run against the actual files in this
  PR, in a clean worktree checked out fresh from `origin/main` — re-run twice (once in the original
  background-agent worktree, once again after copying files into the clean PR worktree) with
  identical results both times, confirming no drift and no copy corruption.
- Confirmed the pre-existing `healthcare-demo-new-source-corpus-v1.0.0.freeze-manifest.json` was not
  overwritten — read in full before choosing a distinct filename for the new manifest.
- `node scripts/release-check.mjs` — see result below.

## Rollout Plan

Merge to `main` via the standard squash-merge path. No runtime rollout — new source dataset and
governance evidence only.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable.
- Shared runtime mutators: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the merge commit. No live data, infrastructure, or runtime behavior touched.

## Audit Evidence

- PR (this change) — see PR description for link.
- `clients/healthcare-demo-new/execution/healthcare-demo-new-tenant-quality-audit-2026-07-31.json`
- `clients/healthcare-demo-new/execution/healthcare-demo-new-current-universal-packet-v1.0.0.freeze-manifest.json`

## Known Gaps

- Whether the existing restricted-evaluator hidden-truth/crosswalk package (built against the
  2026-07-27 design corpus) applies unmodified to this instantiated packet's actual file shapes has
  not been checked — a real open question, recorded in the new freeze manifest, not assumed either
  way.
- Phase 1 (Azure zero-data infrastructure) is not started and not authorized by this release —
  requires its own explicit go-ahead before any `az` command runs against real infrastructure.
- The interview set's realism was independently assessed as "improved and verified distinct across 6
  voice registers" but not fully under target by an earlier review pass in this session; the audit
  tool itself does not measure this dimension.
