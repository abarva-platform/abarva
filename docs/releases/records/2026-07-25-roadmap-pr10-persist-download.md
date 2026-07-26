# 2026-07-25-roadmap-pr10-persist-download — PR10: persisted contract, governed downloads, flag-gated live wiring

## Release ID

`2026-07-25-roadmap-pr10-persist-download`

## Status

`candidate`

## Plain-English Summary

PR10 persists the governed roadmap contract with immutable synchronization metadata and serves the
executive PPTX / detailed DOCX / HTML preview (and restricted contract + provenance JSON) by
**re-rendering from that one persisted contract** — never regenerating at download time. All wiring is
**flag-gated (`moves_governed_roadmap_downloads`, default off, Meridian first), additive, and
guarded**, so with the flag off, generation and existing downloads are byte-for-byte unchanged.

Proven now (pure, unit-tested — 27 new tests):

1. **Immutable synchronization metadata + versioning** (`roadmap-artifact-persistence.ts`): every
   required field (tenant, move, artifact, pipeline, contract version, content hash, lifecycle-state
   version, schema version, source refs, run id, timestamp, validation result, contradiction result,
   renderer versions, supersession lineage, version number). A regenerated contract is a **new
   version that supersedes** — never a silent overwrite.
2. **Download authorization** — honest, non-enumerating refusals: no-contract → 404; cross-tenant →
   404 (never a 403 that would confirm existence); restricted contract/provenance → 403 without
   audit/admin access; rejected → 409; superseded (no version asked) → 409; unavailable version → 404.
3. **Re-render from the persisted contract** with a **hash-integrity check** — a stored contract that
   no longer hashes to its recorded hash is refused (never served as a tampered artifact).
4. **The download-response composer** (`roadmap-download-service.ts`): authorize → re-render → shape
   the HTTP response (content type, filename, version), or an honest refusal.

Wired (flag-gated + additive + guarded; **live-unproven pending deploy**):

5. **Golden-bar generation hook** (`generate-artifact.ts`): for `execution_roadmap` with the flag on,
   runs the governed builder on the RAW model text (before HTML sanitization, so the sentinel block
   survives), inside try/catch — it never throws into generation and never alters the HTML. When off /
   block absent / build fails, behavior is unchanged.
6. **Persist write** (`persist-move-generated-artifact.ts`): stores the governed record under
   `structured_data.roadmap_governed_record` ALONGSIDE the existing HTML deliverable.
7. **Download route** (`…/deliverables/[deliverableId]/roadmap/[format]`): thin adapter — tenancy →
   requester, loader → target, composer → Response.
8. **Loader** (`load-persisted-roadmap-record.ts`): the single DB read seam (`azureRead.query` over
   `deliverable_versions`/`deliverables_v2`), returning null (→ non-enumerating 404) when no governed
   record exists.

## Layer Impact

- **global-control-lane** (flag-gated): governed persistence + a new download route. No migration —
  the record lives in the existing `deliverable_versions.structured_data` JSON column.

## Client Applicability

- Gated behind a **feature flag** (`moves_governed_roadmap_downloads`, default off). Specific clients
  receive it — Meridian first (`includeTenants: ["meridian"]`), then broader once live-proven. All
  other clients receive no change (flag off → byte-for-byte identical behavior).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: verify after deploy.
- Live signed-in proof required: **yes** — this PR's live behavior is unproven until the post-deploy
  Meridian regeneration + download + parity + PowerPoint proof (steps 5–7 below).

## Changes Included

- New: `roadmap-artifact-persistence.ts`, `roadmap-download-service.ts`,
  `load-persisted-roadmap-record.ts`, the `…/roadmap/[format]/route.ts` handler, and tests
  `roadmap-artifact-persistence.test.ts` (11) + `roadmap-download-service.test.ts` (5).
- Edited: `generate-artifact.ts` (flag-gated governed-roadmap hook + optional result field),
  `persist-move-generated-artifact.ts` (store the record), `features/registry.ts` (the flag).

## QA / Validation

- Status: **pass** for all local checks; the live/app-level checks are **not-run** (deferred to the
  post-deploy proof).
- `npx jest` roadmap suites — **pass**, 51/51 (27 new in PR10). Full `src/lib/deliverables` — pre-existing
  6-failure baseline **unchanged**; PR10 adds zero new failures.
- `npx eslint` — clean. `tsc --noEmit` — 0 errors.
- **NOT proven here** (requires the running app + Postgres + Anthropic + Anand's Mac): the DB
  read/write, the route over HTTP, live model emission of a valid block, cross-pipeline parity, and
  the PowerPoint round trip.

## Audit Evidence

- PR: to be opened. Builds on PR8 #5625 (extractor) and PR9 #5628 (governed structured-output engine).
- Local evidence: 51/51 roadmap tests pass; `tsc` 0 errors; `eslint` clean; deliverables baseline
  (6 pre-existing failures) unchanged.
- Live evidence: **pending** — the post-deploy Meridian regeneration + download + parity + PowerPoint
  round trip will supply run ids, artifact ids, content hashes, route captures, and the exported PDF.

## Rollout Plan

Squash-merge to `main`. Deploy via the ACA workflow. Enable the flag for Meridian only, then run the
live proof before broadening. Stacks on PR9 (#5628).

## Rollback Plan

Disable the flag (instant, no deploy) → behavior reverts to pre-PR10. Or revert the merge. No schema
or data migration to unwind; persisted records are additive JSON on existing versions.

## Known Gaps

The roadmap pilot **stays OPEN**. Remaining before closure (all post-deploy / on Anand's Mac):

- **Live Meridian regeneration** through the golden-bar path with the flag on; capture run id,
  persisted contract id/version, artifact ids, content hash, lifecycle-state version, validation
  result, and the HTML/DOCX/PPTX routes.
- **Orchestrator pipeline persist parity** — this PR wires the golden-bar (`/generate`) path; the
  orchestrator ("Approve & Build") synthesis-pass hook is the symmetric follow-up (the builder is
  already pipeline-agnostic via its `pipeline` param).
- **Failure-path proof** (missing/malformed block, unsupported approval, lifecycle mismatch,
  prose/structure contradiction, invalid lineage, cross-tenant download, no-contract download) — the
  logic is unit-proven; capture the live responses too.
- **PowerPoint acceptance** on the stronger live-generated deck (open → edit title/outcome/gate/
  evidence-tag → save → reopen → confirm → export PDF → inspect), original and edited kept separately.
- **Final live artifact ZIP** — the actual persisted outputs (not the illustrative bundle), copied to
  a stable location outside `/tmp`.

**Closure language stays: "Story-first renderer and structured-output path proven; live persistence,
governed downloads, pipeline parity, and PowerPoint acceptance remain open."** The current
`/tmp/roadmap-artifacts.zip` is illustrative / pre-live / **not acceptance evidence**.
