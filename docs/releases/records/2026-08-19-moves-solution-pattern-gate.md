# 2026-08-19-moves-solution-pattern-gate — Solution-pattern gate + risk-tier finalize on P3

## Release ID

`2026-08-19-moves-solution-pattern-gate`

## Status

`candidate`

## Plain-English Summary

Moves gains a new "Solutioning" step on the P3 Design Future State phase — a
5-pattern classification of how a Move's AI capability actually runs (on the
platform itself, as point automation on an already-approved system, embedded
in something already licensed, native to the core clinical system, or a new
third-party platform). A named owner picks the pattern and states why, rather
than the system guessing. The panel also shows each pattern's routing
implication (standard review, check coverage first, or challenge by
default) as context. Separately, the Risk Assessment panel from the prior
release (previously only visible on P2) now stays available on P3 too, so the
risk score can be refined once the actual solution design exists. Both are off
by default and only reachable today for `meridian-health`.

**Process note:** this release record was originally intended to ship as its
own separate PR, cleanly split from the prior risk-tier-scoring release. It
ended up committed onto the same branch as that still-open PR (#6529) before
that PR merged, so the two are bundled together in one PR/deploy rather than
two. Functionally this changes nothing — both pieces are independently
flagged, independently tested, and this record stands on its own for audit
purposes — but it's a process deviation from the "one increment per PR"
discipline used for every other release in this series, and it's recorded
here rather than smoothed over.

## Layer Impact

Release lane: `client-data-lane` (tenant-scoped Moves capability, new feature
flag, no global schema or shared-behavior change).

- **Layer 4 (Products) — Moves.** A new top-level workspace view on the P3
  phase page (`moves_pricing_engine` pattern, additive). The existing Risk
  Assessment view's phase gating changes from P2-only to P2-or-P3.
- **Layer 3 (Canonical Model) — additive only.** The pattern + rationale are
  stored in the existing `engagements.charter` JSONB under a new namespaced
  key (`p3_solution_pattern_v1`). No migration, no new table.

## Client Applicability

- All clients: no change (flag defaults off).
- Specific clients: `meridian-health` (enrolled in
  `moves_solution_pattern_gate_v1`).
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_solution_pattern_gate_v1` (tenant policy, default off).

## Changes Included

- PR: https://github.com/abarva-platform/abarva/pull/6529 (bundled with the
  prior risk-tier-scoring release — see Process note above).
- Commit: `feat(moves): solution-pattern gate + risk-tier finalize on P3`
- New files: `src/lib/programs/solution-pattern.ts`,
  `src/app/api/v1/programs/[programId]/solution-pattern/route.ts`,
  `src/components/strategic-moves/solutioning/` (panel + index).
- Modified: `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  (new WorkspaceView, Risk Assessment gating extended to P2/P3),
  `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`,
  `src/lib/features/registry.ts`, plus new/updated tests.

## QA / Validation

- `npx tsc -p tsconfig.json --noEmit` — 0 errors, full project.
- `npx eslint` on every touched file — 0 errors, 0 warnings.
- 107/107 tests passing across the combined P2+P3a touched area, including:
  9 solution-pattern charter-module tests, 4 `SolutioningPanel` component
  tests, and 63 `MovesPhaseStandaloneClient` tests (56 pre-existing + 7 new:
  3 from the prior release plus 4 new this pass covering Solutioning's
  gating and Risk Assessment's extended P2/P3 availability).
- Broader regression sweep: `src/lib/programs/__tests__/`,
  `src/components/strategic-moves/`, `src/app/api/v1/programs/` —
  894/896 passing. All 3 failing suites confirmed pre-existing and unrelated
  (same 2 from prior releases plus the 1 Clerk/Jest ESM config issue
  identified in the risk-tier-scoring release, all confirmed to fail
  identically with this branch's changes stashed out).
- Live signed-in browser click-through was not captured — same pre-existing
  local infra gap recorded in the prior three release records.

## Rollout Plan

Merge to `main`. `.github/workflows/aca-main-deploy.yml` builds and deploys
the shared Product/Lab web image automatically on merge. The flag is off by
default, so the deploy itself carries no behavior change for any tenant
beyond `meridian-health`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
  (existing, unmodified).
- Shared runtime mutators: none.
- Approved image digest: n/a — standard deploy workflow builds and pins as
  usual.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Feature/env flag update path: `src/lib/features/registry.ts` (in-repo,
  code reviewed via this PR).
- Live signed-in proof required: yes, deferred — see Known Gaps.

## Rollback Plan

Revert the relevant commit(s) and merge to `main`; the next
`aca-main-deploy` run redeploys the prior image. No migration to reverse —
the solution-pattern fields are an additional key inside the charter JSONB,
ignored by all existing readers. No tenant needs to be un-enrolled since only
`meridian-health` was ever enrolled.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/6529
- Local typecheck/lint/test output captured in this session's transcript.
- `git log` on `feat/moves-p1-classify-fast-lane` for the exact commit.

## Known Gaps

- **No governance.ts gate consequence is wired for non-Platform patterns
  yet.** The source model's "check coverage first" (patterns 3, 4) and
  "challenge by default" (pattern 5) routing is surfaced as UI context
  (a colored chip) only — it does not yet block or require additional
  approval on the P3→P4 gate. A future pass could wire this once the exact
  approval requirement is clearer.
- **The pattern is a human-entered classification, not an auto-derived
  score.** The source model's real calculation formula (from Discovery
  answers) isn't available from the source material, so this doesn't invent
  one — consistent with how Complexity Tier is handled for the same reason.
- **Live signed-in browser proof is not yet captured**, for the same reason
  recorded in the prior three releases.
- **Process deviation**: this release shipped bundled with the prior
  risk-tier-scoring release rather than as its own PR — see the Plain-English
  Summary's Process note.
