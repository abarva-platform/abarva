# 2026-06-20-source-reasoning-1-7-refusal — Source Reasoning Spine: Grounded Refusal Enforcement (Slice 1.7)

## Release ID

`2026-06-20-source-reasoning-1-7-refusal`

## Status

`candidate`

## Plain-English Summary

The reasoning spine now reports a distinct `"refusal"` status when it ran successfully
but found no gate-defining claims resting on usable evidence — replacing the previous
`"ok"` for both paths. This makes the spine's conclusion a first-class API signal:

- `"ok"` = claims are grounded on real loaded evidence (the spine recommends)
- `"refusal"` = spine ran, but no gate-defining claim has usable evidence; the refusal
  carries the specific missing-evidence requirements (`it_landscape`, `it_financials`, …)
- `"gate_failed"` / `"error"` = internal failure; spine degraded
- `"disabled"` = flag off

The artifact is still generated in all cases (annotation-only enforcement). Hard-blocking
generation when evidence is absent belongs in Phase 2, once evidence loading is reliable
for all pilot tenants.

The UI banner from Slice 1.6b now correctly keys off `status === "refusal"` for the amber
style, rather than inferring from `envelope.refusal` presence.

## Layer Impact

**Lane:** `global-control-lane`

- **`src/lib/source/reasoning/capture.ts`** (server): `CaptureStatus` adds `"refusal"`;
  the success path returns `"refusal"` when `envelope.refusal` is set, otherwise `"ok"`.
  Envelope is non-null for both "ok" and "refusal".
- **`src/lib/source/agent-generation/types.ts`** (shared): `reasoningStatus` union gains
  `"refusal"`. Updated JSDoc explains all five statuses.
- **`src/components/source/canvas/workspace-tabs/DocumentTab.tsx`** (client):
  `ReasoningBanner` now gates on `status === "refusal"` (explicit) rather than inferring
  from `env.refusal` presence (implicit). Functionally identical for existing callers.

## Client Applicability

- Specific clients: `meridian` (flag `source_reasoning_spine` ON). `arcturus` if enabled.
- All other clients: flag OFF → `reasoningStatus: "disabled"` → no UI change.
- Feature flag: `source_reasoning_spine`

## Changes Included

- `src/lib/source/reasoning/capture.ts`: `CaptureStatus` type; `CaptureResult` doc update;
  `return { envelope, status: envelope.refusal ? "refusal" : "ok" }`.
- `src/lib/source/agent-generation/types.ts`: `reasoningStatus` union + JSDoc.
- `src/components/source/canvas/workspace-tabs/DocumentTab.tsx`: `ReasoningBanner` gates
  on `reasoning.status` instead of `env.refusal`.
- `src/lib/source/reasoning/__tests__/capture.test.ts`: 6 tests updated/added; old test
  that asserted `status === "ok"` for the no-evidence case corrected to `"refusal"`.
- `docs/releases/records/2026-06-20-source-reasoning-1-7-refusal.md`: this record.

## QA / Validation

Status: **pass**

- Jest (`source/reasoning` suite): **28/28 PASS** — includes 6 capture-specific tests
  that cover disabled, refusal-on-no-evidence, envelope shape, invariants, and graceful
  degradation for malformed context.
- `tsc --noEmit`: **PASS** (zero `error TS` diagnostics).
- No existing test asserted `"ok"` with valid evidence; no passing test broke.

## Rollout Plan

1. Merge PR to `main`.
2. ACA auto-deploys `ca-abarva-web-lab-eastus`.
3. Sign in as `cdio@meridian-health` → Source event strategy canvas →
   "Generate with Sentinel" → confirm `reasoningStatus` in browser network response is
   now `"refusal"` (not `"ok"`) and the amber banner still shows correctly.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`
- Shared runtime mutators: none
- Approved image digest: set at merge time by ACR build
- ACA runtime invariant: single active revision post-deploy
- Worker image invariant: N/A
- Feature/env flag update path: `ABARVA_FEATURE_SOURCE_REASONING_SPINE_TENANTS=meridian`
  (already set)
- Live signed-in proof required: yes — confirm `reasoningStatus: "refusal"` in network
  response for a Meridian event with no loaded evidence

## Rollback Plan

Revert to previous ACR image digest. `"ok"` re-appears for the no-evidence path. No
DB change, no migration, no data loss.

## Audit Evidence

- Branch: `codex/source-reasoning-1-7`
- Jest 28/28: `node_modules/.bin/jest --testPathPatterns="source/reasoning"` (worktree)
- tsc: zero `error TS` diagnostics
- Slice 1.6 live proof still valid; 1.7 changes only the status string returned

## Known Gaps

- Hard-block enforcement (refuse to return a body when `status === "refusal"`) is
  explicitly deferred to Phase 2 (`source_reasoning_spine_v2` flag or similar).
- Slice 1.8 (`reasoning_envelopes` persistence table) not yet built.
- Slice 1.1 (classify-at-intake migration) not yet built.
