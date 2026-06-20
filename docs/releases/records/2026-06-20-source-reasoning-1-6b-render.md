# 2026-06-20-source-reasoning-1-6b-render — Source Reasoning Spine: Envelope Prose Render (Slice 1.6b)

## Release ID

`2026-06-20-source-reasoning-1-6b-render`

## Status

`candidate`

## Plain-English Summary

After "Generate with Sentinel" completes on a Source artifact canvas, a compact inline
banner now appears showing what the reasoning spine concluded: the event archetype, rigor
level, confidence, and whether the system found usable evidence or is withholding
gate-defining claims.

For Meridian (the first tenant with the reasoning flag ON), the banner will show amber:
"Reasoning · AMS · strategic · high confidence — no gate-defining evidence yet:
it_landscape, it_financials, …" until real evidence is loaded. Once evidence is loaded
and the spine produces grounded claims, the banner turns muted and shows "N claims
grounded."

For all other tenants (flag OFF), the banner does not appear. The artifact canvas looks
and behaves exactly as before.

## Layer Impact

**Lane:** `global-control-lane`

- **Source canvas UI** (`UniversalCanvasShell.tsx`, `DocumentTab.tsx`): additive only;
  new `reasoningByCode` state is populated only after a generate call returns with
  `reasoningStatus !== "disabled"`. No schema change. No API change.

## Client Applicability

- Specific clients: `meridian` (flag `source_reasoning_spine` ON). `arcturus` if enabled.
- All other clients: flag OFF → no visible change.
- Feature flag: `source_reasoning_spine` (registry key in `src/lib/features/registry.ts`)

## Changes Included

- `src/components/source/canvas/UniversalCanvasShell.tsx`: `reasoningByCode` state;
  extended generate payload type to include `generation.reasoningStatus / .reasoningEnvelope`;
  capture on success; pass prop to `DocumentTab`.
- `src/components/source/canvas/workspace-tabs/DocumentTab.tsx`: `reasoningByCode` prop;
  thread to `ArtifactBodyEditor`; new `ReasoningBanner` component; four new style constants.
- `docs/releases/records/2026-06-20-source-reasoning-1-6b-render.md`: this record.

## QA / Validation

Status: **pass (TypeScript) / live proof pending (ACA banner render)**

- `tsc --noEmit`: **PASS** — zero `error TS` diagnostics (worktree with symlinked node_modules).
- Slice 1.6 live proof (2026-06-20, session 845383f4):
  - Route `POST /api/v1/source/cb6ffbb1.../artifacts/d01_strategy_memo/generate`
  - Response: `generation.reasoningStatus = "ok"`, full envelope with `archetype: "ams"`,
    `confidence.label: "high"`, `refusal.missingEvidence: [it_landscape, it_financials, …]`.
  - Banner input data confirmed correct; banner render requires ACA deploy + signed-in QA.
- Behavior when flag OFF: `reasoning` prop is `undefined` → banner JSX not rendered.

## Rollout Plan

1. Merge PR to `main`.
2. ACA auto-deploys `ca-abarva-web-lab-eastus` on push (aca-main-deploy workflow).
3. Sign in as `cdio@meridian-health` → navigate to Source event strategy canvas →
   click "Generate with Sentinel" → verify amber reasoning banner appears below the
   generation error area.
4. Verify no banner for `cio@firstcapital` or `cio@apexretail` (flag OFF).

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` (triggers on push to main)
- Shared runtime mutators: none
- Approved image digest: set at merge time by ACR build
- ACA runtime invariant: `ca-abarva-web-lab-eastus` single active revision post-deploy
- Worker image invariant: N/A (UI-only change)
- Feature/env flag update path: `ABARVA_FEATURE_SOURCE_REASONING_SPINE_TENANTS=meridian`
  (already set in ACA env from Slice 1.6 deploy)
- Live signed-in proof required: yes — sign in as `cdio@meridian-health` and confirm banner

## Rollback Plan

Revert to previous ACR image digest via `az containerapp update --image <prev-digest>`.
No DB migration involved. No data loss. Banner disappears; everything else unchanged.

## Audit Evidence

- Branch: `codex/source-reasoning-1-6b`
- Slice 1.6 live proof transcript: session 845383f4 (2026-06-20)
- tsc output: zero errors (confirmed via grep of `error TS`)
- Stale worker job fix (same session): `job-abarva-db-migrate-lab-eastus` and
  `job-abarva-db-copy-lab-eastus` pinned to `sha256:11b3eac1d7c42...` (current main digest)

## Known Gaps

- ACA signed-in banner render not yet verified (requires deploy + browser QA).
- Slice 1.7 (grounded refusal live enforcement — block/annotate generation when refusal
  fires) not yet built.
- Slice 1.8 (`reasoning_envelopes` persistence table) not yet built.
