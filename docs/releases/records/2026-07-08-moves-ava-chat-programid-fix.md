# 2026-07-08-moves-ava-chat-programid-fix — Fix programId propagation for Moves phase chat

## Release ID

`2026-07-08-moves-ava-chat-programid-fix`

## Status

`candidate`

## Plain-English Summary

Live browser proof of the Moves aVa chat hardening (release `2026-07-08-moves-ava-chat-hardening`) found that on the real `/strategic-moves/<id>/phase/<n>` chat panel, aVa answered "No active Move session is visible in this conversation" even on the Move's own phase page. Root cause, confirmed by tracing the exact request: `StrategicMovePhaseClient.tsx`'s chat `send()` callback sent `surface: "strategic-moves-workspace"` (a semantic key) with the Move id only under `surfaceContext.moveId` — but `canonicalizeSurface`/`canonicalizeFromBody` (`src/lib/agent/surface.ts`) only ever looked for `surfaceContext.programId`. Because the id never matched that expected key, the canonicalizer fell back to the bare `/strategic-moves` surface with no id, `programId` stayed `undefined`, and the entire `if (programId) { ... }` branch in `/api/chat/agent` — which holds both the pre-existing basic "Active program" context/phase pack AND the newly-added Moves aVa chat hardening packet — never executed. This bug predates today's session; the hardening release's live-proof pass is what surfaced it, since no test previously asserted the real payload shape.

Three-part fix:

1. **Client fix** (`StrategicMovePhaseClient.tsx`): the chat `send()` call now sends the already-correct URL-shaped surface (`/strategic-moves/{moveId}/phase/{phaseNum}` — the exact same string the neighboring `AgentDock` component prop already used, just never passed to `fetch`) plus a top-level `programId` and `surfaceContext.programId`, alongside the existing `surfaceContext.moveId` for backward compatibility with any other reader of that field.
2. **Canonicalizer fix, defense-in-depth** (`src/lib/agent/surface.ts`): `canonicalizeSurface`'s `"strategic-moves-workspace"` case and `canonicalizeFromBody`'s `programId` derivation both now also accept `surfaceContext.moveId` as a fallback when `programId` is absent, so any other caller using the same historical naming is covered too.
3. **Regression tests**: pure-function tests in `surface.test.ts` locking in the exact bug (moveId-only payload → previously lost, now resolves) and the fix; a render-based test in `StrategicMovePhaseClient.operating-layer.test.tsx` that drives the real chat UI (restores the collapsed dock, types a message, submits) and asserts the actual fetch body sent to `/api/chat/agent` includes `programId` and the URL-shaped surface.

## Layer Impact

- **global-control-lane**: `src/lib/agent/surface.ts` is shared canonicalization logic used by every chat surface (Home, Intelligence, Source, Tower, Moves, Setup) — the change is additive-only (a new fallback branch), so it cannot regress any surface that already sends `programId` correctly; it can only newly resolve surfaces that were previously silently losing their id via `moveId`.
- Client-only change in `StrategicMovePhaseClient.tsx` — the Moves phase-workspace chat request payload. No schema, migration, or new route.

## Client Applicability

- All clients: Yes — this is a bug fix in shared code (not a new feature), so it applies to every tenant using Moves phase chat, not gated behind `moves_ava_chat_hardening`. It also restores the pre-existing basic "Active program"/phase-pack grounding that predates the hardening flag and was never tenant-gated.
- Specific clients: N/A (fix applies universally).
- Internal only: No.
- Public/demo only: No.
- Feature flag: None — this is not itself flagged. (The Moves aVa chat hardening *content* this unblocks remains behind `moves_ava_chat_hardening`, tenant-gated to Lakeshore, per the prior release.)

## Changes Included

- `src/components/strategic-moves/StrategicMovePhaseClient.tsx` — chat request body: URL-shaped `surface`, top-level `programId`, `surfaceContext.programId`.
- `src/lib/agent/surface.ts` — `moveId` fallback in `canonicalizeSurface`'s `"strategic-moves-workspace"` case and in `canonicalizeFromBody`'s `programId` derivation.
- `src/lib/agent/__tests__/surface.test.ts` — 6 new regression tests.
- `src/components/strategic-moves/__tests__/StrategicMovePhaseClient.operating-layer.test.tsx` — 1 new render-based regression test asserting the real chat payload shape; also added a `@clerk/nextjs` mock (`useUser`) and completed the `next/navigation` mock (`useSearchParams`, `usePathname`), which incidentally fixed 4 pre-existing tests in this file that were failing in isolation with "useUser can only be used within a ClerkProvider" (confirmed via `git stash` — identical failure before this change, unrelated to it).

## QA / Validation

- `npx jest src/lib/agent/__tests__/surface.test.ts src/components/strategic-moves/__tests__/StrategicMovePhaseClient.operating-layer.test.tsx --runInBand` — 2 suites / 24 tests passed.
- `NODE_OPTIONS='--max-old-space-size=6144' ./node_modules/.bin/tsc --noEmit --pretty false --incremental false` — 0 errors, full repo.
- `npx eslint` on all touched files — 0 errors/warnings.
- Broader sweep `npx jest src/lib/agent src/components/strategic-moves src/app/api/chat/agent/__tests__ src/lib/programs/ava-chat --runInBand`, compared via `git stash`: **before** 13 failed suites / 19 failed tests / 891 passed; **after** 12 failed suites / 15 failed tests / 902 passed. Net improvement, zero regressions (the remaining 12 failed suites are pre-existing and unrelated — confirmed identical between before/after).
- Live signed-in browser re-proof on Lakeshore for the 6 specified prompts: pending, to be captured after deploy (see Known Gaps).

## Rollout Plan

Standard Code-lane PR → squash-merge to `main` → `aca-main-deploy.yml` auto-builds and deploys. No flag, no migration — the fix takes effect for every Moves phase-workspace chat request immediately on the new revision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: None — deploy only via the repo-owned workflow on merge.
- Approved image digest: whatever `aca-main-deploy.yml` produces for this merge commit (verify post-merge per the workflow's own runtime-invariant check, same pattern as prior releases today).
- ACA runtime invariant: to be confirmed post-deploy.
- Worker image invariant: N/A — no worker-job code touched.
- Feature/env flag update path: N/A — this is an unflagged bug fix.
- Live signed-in proof required: Yes — re-run the same 6 prompts on Lakeshore `RETAIL-LEGAL-2026`/P2 that surfaced the bug, confirming grounded answers this time.

## Rollback Plan

Revert the commit, merge, redeploy. No data migration, no flag to unwind. Because the canonicalizer fallback is purely additive (accepts a second key name it didn't before), a partial rollback (client fix reverted, canonicalizer fix kept, or vice versa) is also safe if ever needed — though a full revert is simpler and preferred.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4599 (merged as `227c28929bf6d1986d1b4ca275e666195b801378`)
- CI run (all 21 checks passed): https://github.com/abarva-platform/abarva/pull/4599/checks
- Deploy run (success, runtime invariant verified — digest `sha256:4f3f31d51692655fed855356a654cd305248dc5147262274d62f9bcca60befe9`): run `28973931514`
- Live smoke-test proof: **CONFIRMED WORKING** — `proof/moves-ava-chat-programid-fix-live-2026-07-08/README.md`. All 6 specified prompts, on a fresh conversation on the exact Move/phase page that previously said "No active Move session is visible," now ground correctly: references to P2, real gate-criterion IDs (e.g. "GC-P2-1"), the real evidence ledger, and appropriate Source/Tower mentions. "Can we move to the next phase?" correctly answered "No — P2 cannot close yet" without claiming to advance anything. Zero mentions of the unrelated-program contamination (Kyriba/SOX/Treasury) seen before the fix. One pre-existing, unrelated React hydration warning on initial page load; no errors on any of the 6 chat turns; no network 5xxs.
- Root-cause trace: `proof/moves-ava-chat-hardening-live-2026-07-08/README.md` (the pass that discovered this bug).

## Known Gaps

- This fix restores grounding for the Moves phase-workspace chat surface specifically. The broader "does every agentic surface correctly bind to its product-surface context" audit the user proposed (Intelligence/Source/Tower/Home) is out of scope for this fix and not started.
- Now that grounding is confirmed live, the deferred items from the original hardening release (full packet richness via `buildPhaseWorkflow`/`buildFeedForwardPack`/`buildApprovedInputsPack`; quality-gate wired into the live streaming response) are the next real quality work — now actually reachable and worth prioritizing since the base grounding is proven sound.
