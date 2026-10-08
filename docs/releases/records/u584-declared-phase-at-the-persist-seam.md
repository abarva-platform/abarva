# U-584 — The declared phase decides where a generated companion is filed

## Release ID

`2026-10-07-declared-phase-at-the-persist-seam`

## Status

`candidate`

## Plain-English Summary

When the product generates a phase document, it also saves an editable Office copy of
it ("the companion") so a reviewer can mark it up and sign it off. Each saved artifact
records which phase it belongs to, and the phase workspace shows an artifact only if
that recorded phase matches the phase being viewed.

The phase was already **declared** by the request that asked for the generation — it is
the same phase the request used to decide which approved evidence the generation was
allowed to see. But the save step ignored that declared phase and worked the phase out a
second time, by looking the document's key up in the deliverable registry. When that
lookup found nothing, it recorded phase `0`.

That is a problem for two reasons. The registry declares no phase `0` at all, so `0` was
not a real answer — it was "I could not tell", written in the same field and the same
shape as a genuine Originate artifact, with nothing to tell the two apart. And 15 of the
36 deliverable keys that have a generation profile are not registry keys, so for those
the lookup could never answer.

This change makes the declared phase win. The key lookup stays as the fallback for when
no phase was declared, and when neither answers, the saved companion now also records
*what decided its phase* (`declared`, `registry_key`, or `unresolved`), so an unresolved
phase can no longer be read back as Originate.

No stored phase value that was previously correct changes. For the Moves phase-build
path the two answers already agreed, so this fixes nothing visible there today and
instead pins that agreement, which nothing checked. The behaviour that does change today
is for generations that declare no phase: their companion still carries the same numeric
value it carried before, but it now says that value was unresolved rather than chosen.

## Layer Impact

Release lane: `global-control-lane` — shared generation/persistence behaviour for all
clients, not feature-gated.

- `4 PRODUCTS` — Moves. Which phase a generated document's editable companion is filed
  under, and therefore whether the phase workspace lists it. No projection of layer 3
  changes, and no deliverable content changes.

No change to layers 1, 2, or 3. No schema change: the artifact's phase column and its
metadata already exist and already accept these values.

## Client Applicability

- All clients: yes — this is shared generation/persistence behaviour.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is a correction to which of two already-computed values
  is used, and it is byte-identical for every key/phase pair where they agreed.

## Changes Included

- `src/lib/deliverables/orchestrator/generated-companion-phase.ts` (new) — resolves the
  companion's phase and returns the basis alongside it. Declared phase wins when it is a
  canonical Moves phase (integer 0–5); else the registry phase for the key; else the
  pre-existing `0` fallback, labelled `unresolved`.
- `src/lib/deliverables/orchestrator/persistence.ts` — `PersistDeliverableOptions` gains
  `phase?: number`; the local `phaseForDeliverableType` re-derivation is deleted in favour
  of the shared resolver; the companion records `metadata.companionPhaseBasis`.
- `src/lib/deliverables/orchestrator/generate-service.ts` — forwards the caller's declared
  `phase` into the persist options. It was already forwarded to evidence assembly and
  dropped at this seam.
- `src/lib/deliverables/orchestrator/__tests__/generated-companion-phase.test.ts` (new) — 11 cases.
- `src/lib/deliverables/orchestrator/__tests__/persistence-companion-phase.test.ts` (new) — 3 cases
  driving the real `persistDeliverable` with the companion save injected.
- `src/lib/deliverables/orchestrator/__tests__/surface.test.ts` — 2 cases pinning the
  forward through the generation service.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No migration, no route contract change, no workflow change.

## QA / Validation

- `npx jest src/lib/deliverables/orchestrator` — **PASS** (59 suites, 857 tests).
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — **PASS** (exit 0).
- `npx eslint` over the six changed/added files — **PASS** (exit 0).
- `npm run audit:lib-orphans` — **PASS**, "No change against the baseline". The new module
  has a production caller (`persistence.ts`), so it is not test-only.
- `npm run audit:test-ci-coverage:write` — regenerated; both new suites are CI-wired.
  Counts moved `2830/2665/2664` → `2833/2668/2667` with `uncoveredTestFiles` unchanged at
  `165`. **Of that `+3`, only `+2` is this change**: regenerating on the unmodified base
  tree yields `2831/2666/2665`, so main's committed census was already one file behind its
  own tree when this branch was cut.
- `npm run audit:tenancy-fence-coverage:write` — run; no drift attributable to this change.
- Mutation testing — **8 of 8 mutations killed**, each applied with an asserted
  single-occurrence anchor and reverted to a re-verified green baseline:
  1. declared arm disabled → 4 failed
  2. phase upper bound `5`→`6` → 1 failed
  3. `>= 0` → `> 0` (declared P0 lost) → 2 failed
  4. `unresolved` basis relabelled `registry_key` → 2 failed
  5. integer check dropped → 1 failed
  6. persistence ignores `opts.phase` → 2 failed
  7. `companionPhaseBasis` metadata dropped → 3 failed
  8. the generation service's forward deleted → 1 failed
  Mutation 8 is the one that matters most: without the two `surface.test.ts` cases, the
  resolver and persistence could both be correct while the declared phase never reached
  them, and every other suite would still pass.
- Reachability measured before writing any code, against this base:
  the registry carries 23 keys at phases 1–5 and **no phase 0**; 15 of the 36 profiled
  deliverable keys are not registry keys; and for the Moves route that declares a phase,
  all 22 accepted orchestrator types already agreed with the key derivation (0 mismatches).
  **So the previously-wrong value was not reachable on the Moves phase-build path**, and
  this change is a guard there rather than a visible repair. Stated plainly rather than
  claimed as a live Moves fix.
- Live signed-in walk: **NOT RUN** — requires Anand. Not claimed as live-proven.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow then builds and
deploys in the normal lane. No migration, no flag, no env change, no worker job change,
and no manual runbook step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — unchanged.
- Shared runtime mutators: none. This branch runs no Azure command and mutates no shared
  traffic, revision weight, or Container App template.
- Approved image digest: not applicable to this record; the main deploy workflow sets it.
- ACA runtime invariant: to be proven by the main deploy workflow in its normal lane, not
  by this record.
- Worker image invariant: unchanged; no worker job contract changed.
- Feature/env flag update path: none required.
- Live signed-in proof required: yes for the phase-workspace listing, and **not yet
  performed**. This record claims `merged`-grade status only.

## Rollback Plan

Revert the squash commit. The change is additive and stateless at the decision layer, so
reverting restores the prior key-derived phase immediately with no data repair:

- No migration to roll back.
- No stored phase needs rewriting. Every phase value this change writes is either equal to
  what the old code wrote (the agreeing cases, and the `unresolved` fallback, which keeps
  the old `0`) or newly correct from a declared phase.
- `metadata.companionPhaseBasis` becomes a field no reader requires; it is additive
  metadata and a revert simply stops writing it on new artifacts. Artifacts already
  carrying it stay readable.

## Audit Evidence

- PR URL: recorded on the pull request for this branch.
- CI: the required checks on that PR.
- Mutation log: the eight mutation runs and counts transcribed under QA / Validation above.
- Census delta and its base-drift split: under QA / Validation above.
- Reachability measurements (registry phase histogram, profiled-vs-registry key split,
  declared-vs-inferred comparison across the 22 accepted types): under QA / Validation above.

## Known Gaps

- **Not live-proven.** No signed-in walk was performed. The phase-workspace listing
  consequence is argued from the code path (`artifact.phase !== parsedPhase`), not observed.
- **The repaired value is currently unreachable on the Moves phase-build path.** All 22
  accepted orchestrator types already agreed with the key derivation, so on that path this
  is a guard against future drift, not a visible fix. The behaviour that changes today is
  confined to generations that declare no phase, where the companion now records that its
  phase was `unresolved` instead of silently presenting the fallback as a phase.
- **`metadata.companionPhaseBasis` has no reader yet.** Nothing in the product
  distinguishes an `unresolved` companion from a declared one in the UI; this record adds
  the fact, not a surface for it. A follow-up could make the phase workspace or the file
  cabinet say so rather than listing an unresolved artifact under Originate.
- **The save contract still requires a number.** `SaveMoveArtifactInput.phase` is
  `number`, while the stored row allows null. Representing "no phase" as null end-to-end
  would be the fuller fix; it touches 16 call sites and the blob path layout
  (`generated/p${phase}/…`), so it was deliberately left out of scope here.
- Non-Moves modules (`source`, `tower`, `intelligence`) declare no phase through this
  route, so their companions resolve `unresolved`. That is now stated rather than
  presented as phase 0, but giving those modules a meaningful phase (or no phase at all)
  is out of scope.
