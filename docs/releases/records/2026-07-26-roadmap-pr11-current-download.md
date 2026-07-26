# 2026-07-26-roadmap-pr11-current-download — PR11: client-addressable governed roadmap downloads

## Release ID

`2026-07-26-roadmap-pr11-current-download`

## Status

`candidate`

## Plain-English Summary

PR10 shipped a governed roadmap download route addressed by the **internal** `deliverables_v2.id` — but
no Move/artifact/module/UI API exposes that id, and the `/generate` response that carries it commonly
returns a proxy 504 after the server persists. Result: the route could refuse correctly but could not
be **addressed** by a real client after generation. That is a genuine usability defect, not a test
inconvenience.

PR11 fixes it with **client-addressable, Move-based routes** that resolve the correct internal governed
contract server-side — the caller never supplies `deliverables_v2.id`:

- `GET /api/v1/moves/{moveId}/artifacts/execution-roadmap/current/{format}`
- `GET /api/v1/moves/{moveId}/artifacts/execution-roadmap/versions/{version}/{format}`

Formats: `pptx`, `docx`, `html` (public) + `contract`, `provenance` (restricted to audit/admin).

Resolution rules (pure `selectRoadmapTarget`, unit-tested):

1. Authenticate; resolve tenant; tenant-fence the Move (non-enumerating).
2. `current` = the **newest version that carries a valid governed contract**. A failed generation
   attempt that persisted only narrative has **no** governed record and is skipped — so it can never
   hide a prior valid version.
3. Never resolve by title/filename; never manufacture a contract from the narrative.
4. Rejected / superseded deliverables surface as governed refusals (409), not downloads.
5. Serve the requested format by re-rendering from that persisted contract (PR10 path).
6. Governed `roadmap_not_found` when no valid contract exists.

Provenance is returned via response headers (`x-roadmap-content-hash`, `-contract-version`,
`-lifecycle-state`, `-lifecycle-state-version`, `-generation-run-id`, `-generated-at`, `-pipeline`,
`-version`, `-superseded`, `-artifact-id`) so a caller can retain a link by **stable governed
identifiers**, never `deliverables_v2.id`.

The internal-id route (PR10) is retained temporarily but is not exposed in the UI; it now shares the
same compose/authorize logic. Removal is a follow-up.

## Layer Impact

- **global-control-lane** (flag-gated, `moves_governed_roadmap_downloads`): two additive routes + a
  pure resolver + a headers helper. No migration.

## Client Applicability

- Gated behind the **feature flag** `moves_governed_roadmap_downloads` (default off). Specific clients
  receive it — Meridian first. All other clients: no change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: verify after deploy.
- Live signed-in proof required: **yes** — the Meridian `current/{html,docx,pptx}` capture (below).

## Changes Included

- New: `roadmap-current-resolver.ts` (`selectRoadmapTarget` + `loadCurrentRoadmapTarget`),
  `roadmap-move-download.ts` (shared handler), `roadmapProvenanceHeaders` in `roadmap-download-service.ts`,
  the two `…/moves/{moveId}/artifacts/execution-roadmap/…` routes, and
  `roadmap-current-resolver.test.ts` (7 tests).

## QA / Validation

- Status: **pass** for local checks; live/app checks **not-run** (deferred to the post-deploy capture).
- `npx jest roadmap-current-resolver` — **pass**, 7/7 (current-resolves-newest-valid; failed attempt
  doesn't hide prior valid; explicit version; rejected → 409; superseded → 409; no-contract →
  not_found; provenance headers expose stable ids, never `deliverables_v2.id`). Full
  `src/lib/deliverables` — pre-existing 6-failure baseline **unchanged**.
- `npx eslint` — clean. `tsc --noEmit` — 0 errors.

## Audit Evidence

- PR: to be opened. Builds on PR10 #5635 (the internal-id route this makes addressable).
- Live evidence: **pending** — the Meridian `current` capture will supply the public artifact/version
  reference, content hash, lifecycle-state version, run id, pipeline, file sizes and MIME types, and
  confirm all three formats share one contract hash.

## Rollout Plan

Squash-merge to `main`; deploy via the ACA workflow. Flag already on for Meridian.

## Rollback Plan

Disable the flag (instant) or revert the merge. No schema/data change.

## Known Gaps

The roadmap pilot **stays OPEN**. This PR makes downloads addressable and unblocks the live proof.
Remaining (post-deploy / on Anand's Mac):

- **Live Meridian capture** via `current/html`, `current/docx`, `current/pptx` — record the provenance
  headers + confirm one shared contract hash; confirm the files come from the newly persisted v3
  generation, or document why they resolve to an earlier valid governed version. **If the v3
  generation persisted only narrative and did not attach a valid governed structured contract, that is
  a separate generation/persistence failure to report — the resolver must not manufacture a contract.**
- **UI wiring** of the V4/P4 artifact surface (Download PowerPoint / Download Word / Open HTML preview)
  to these Move-based routes — sequenced after the live route + governed-record are proven, so the UI
  isn't wired to an unproven path.
- **Pipeline parity** (orchestrator roadmap → same shared contract) and **PowerPoint acceptance** on
  the stronger live PPTX, then the **final live artifact ZIP** outside `/tmp`.

**Closure language until PR11 live proof succeeds:** _"Story-first renderer and structured-output path
proven; live generation persists, but governed download addressability, pipeline parity and PowerPoint
acceptance remain open."_
