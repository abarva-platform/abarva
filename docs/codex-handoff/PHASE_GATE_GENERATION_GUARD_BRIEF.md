# Codex Brief — Enforce "no approved gate, no generation" (shared, all phases, all entry points)

## 0. Product contract (restore it)

**Gate approval triggers artifact generation for every phase. No approved gate → no generation;
approved gate → generation happens automatically.** This is product design + the UI flow (save →
approve → generate/build), but it is **not enforced server-side at every generation entry point** —
contract drift. Live regression: the `generate-phase` path enqueued generation when P3 showed
`0 of 4` capture complete.

Fix is **global, not SkyHarbor-only.** Same enforcement for every tenant and every phase P1–P5.

## 1. The shared guard

Add one route-agnostic guard (place in `src/lib/programs/` or `src/lib/deliverables/`):

```ts
export interface GenerationBlocker { code: string; phase: number; reason: string; severity: 'hard' | 'soft'; }
export interface PhaseGenerationReadiness { ready: boolean; phase: number; blockers: GenerationBlocker[]; }

export async function assertPhaseReadyForGeneration(
  ctx: TenancyCtx, moveId: string, phase: number,
  opts?: { supabase?: SupabaseClient; allowApprovedRetry?: boolean },
): Promise<PhaseGenerationReadiness>;
```

It must require, before any enqueue:
1. **Phase capture complete** — the phase's capture criteria are met (the `N of M` capture state must
   be `M of M`). Reuse the same source the UI reads for "P3 CAPTURE — 0 of 4".
2. **Gate approved** — the phase's gate is approved (`phase_snapshots.approval_status === 'approved'`
   for this engagement/phase; the approval flow in `deliverable-approval-flow.ts` /
   `governance.ts:decideApproval`).

Build on the existing model — do NOT invent a parallel one:
- `governance.ts` → `evaluateGate(ctx, programId, fromPhase, toPhase)` returns
  `GateCheck { pass, failedChecks[], requiresApproval, approverRole }`; `gateCriteriaForPhase(phase)`.
- `phase_snapshots` (engagement_id + approval_status) for the approval state.
- Map `moveId` → `engagement_id`/`programId` via the existing resolver used by the generation routes.

Return `ready:false` with a **structured blocker list** (capture-incomplete items + not-approved) when
either condition fails. `allowApprovedRetry:true` lets a *re-generation* proceed for a phase that is
already approved (so "retry generation" still works) but never bypasses an unapproved gate.

## 2. Wire it into EVERY generation entry point (before enqueue)

Each of these must call the guard and refuse to enqueue when `!ready`:
- **Phase build:** `src/app/api/v1/deliverables/generate-phase/route.ts` (on PR #3816).
- **Single deliverable:** `src/app/api/v1/deliverables/generate/route.ts` (on PR #3816).
- **Retry generation:** the retry path — pass `allowApprovedRetry:true` (only for approved phases).
- **Worker requeue/enqueue:** the deliverable-queue enqueue (`process-deliverable-queue` /
  `runDeliverableForTenant` enqueue seam) — re-check at enqueue so no path bypasses the guard.

On block, return **HTTP 409 (or 422)** with the structured blocker list — do **not** generate. On an
approved+complete gate, the route **auto-enqueues** the phase's artifacts (the positive side of the
contract).

## 3. CI tests (P1–P5, the acceptance)

For each phase P1..P5:
- **Incomplete/unapproved gate → 409/422** with blockers; **nothing enqueued** (assert the enqueue
  seam / `deliverable_runs` insert was NOT called).
- **Complete + approved gate → auto-enqueues** the phase artifacts (assert the enqueue happened).
- **Retry on an approved phase → allowed**; **retry on an unapproved phase → blocked.**
- Unit tests for `assertPhaseReadyForGeneration`: capture-incomplete → not ready + capture blockers;
  approved+complete → ready; approved-but-incomplete → not ready.

Reuse the route test pattern in `src/lib/deliverables/orchestrator/__tests__/` and the governance
tests in `src/lib/programs/__tests__/` (note: the pre-existing `governance-evaluate-gates.test.ts` mock
missing `.in(...)` is unrelated — fix or leave noted, don't let it mask the new tests).

## 4. TEST · VALIDATE · DEPLOY

- **Test:** `npx tsc --noEmit -p tsconfig.json` clean; `npx jest src/lib/programs src/lib/deliverables
  src/app/api/v1/deliverables` green incl. the new P1–P5 matrix.
- **Validate:** `node scripts/release-check.mjs --base origin/main --head HEAD` + a release record
  (`internal-admin` or `global-control-lane` lane); `npm run audit:control-plane-purity:check` (keep
  tenant strings out of non-fixture control-plane code). No fabricated approval state in tests.
- **Deploy:** squash-merge when CI green → `aca-main-deploy` auto-deploys (rerun on ACR
  ConnectionReset); verify the new revision carries 100% traffic and the worker jobs reference the new
  image. No flag needed — this is a correctness guard, on for all tenants by design.

## 5. Constraints

- **Global/shared** — one guard, used by every generation entry point; no per-tenant, no per-route
  re-implementation, no SkyHarbor-specific code.
- **Structured blockers, not silent generation** — a blocked gate returns the reasons; it never
  produces an artifact.
- Don't break the positive path: an approved+complete gate must **auto-enqueue** generation (that is
  the product contract, not just the negative guard).
- Report honestly per phase: guard result + HTTP status + whether enqueue happened.
