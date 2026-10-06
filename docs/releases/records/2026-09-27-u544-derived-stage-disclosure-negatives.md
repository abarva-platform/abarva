# 2026-09-27-u544-derived-stage-disclosure-negatives — Disclosure negatives assert over the derived set, not one pinned stage

## Release ID

`2026-09-27-u544-derived-stage-disclosure-negatives`

## Status

`candidate`

## Plain-English Summary

When a sourcing stage's checklist and gate are computed from a client's own committed facts,
the model grounding must stop announcing that the content is carried exemplar material — the
`SCAFFOLD CONTENT --` line. Two sibling test suites proved the switch-off for exactly one stage
each, by name, while the builder went on to compute five. **No test anywhere in the repository
asserted that two of those five — the RFP stage and the vendor-responses stage — had stopped
disclosing.** Both suites were green throughout.

This change makes each of those negatives assert over the set of derived stages read off the
builder itself, the same way their positive halves already do, so a stage is covered the moment
it is computed rather than when someone remembers to add a case. Tests only; no product code
changed.

## Layer Impact

**Release lane: `global-control-lane`** — the suites cover shared control behavior (the grounding
assembler every tenant's Source stage view passes through), and nothing here is tenant-scoped or
feature-gated. No runtime behavior ships, so the lane describes what the covered code governs
rather than a change reaching clients.

- **Layer 4 (Products) — test coverage only.** The two suites exercise the Source stage analytics
  builder and the grounding-block assembler that feeds the model. Their assertions changed; no
  builder, route, component, prompt, or dataset changed.
- Layers 1–3 unaffected: no intake, adapter, or canonical-model change.

## Client Applicability

- All clients: no behavior change reaches any client.
- Specific clients: none.
- Internal only: yes — governed-surface test coverage.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/facts/__tests__/u534-bafo-fact-derived-beats.test.ts` — added a derived-stage
  set read off `beatProvenance` (both intake beats), replaced the single-stage
  "STOPS disclosing on the flipped stage" case with an `it.each` over that set, and added a
  guard that the set has more than one entry and contains this suite's own stage.
- `src/lib/source/facts/__tests__/u535-evaluation-fact-derived-beats.test.ts` — the same, using
  `DERIVED_BOTH_BEAT_STAGES` beside the existing task-beat set the suite already computes.
- No non-test file changed.

## QA / Validation

**What was re-verified before any edit, on `origin/main` `79de04efa`, from the code rather than
from the backlog row.** The builder derives five stages through `FACT_DERIVED_BEATS` in
`src/lib/source/facts/view/stage-analytics-builder.ts`: `bafo`, `evaluation`, `responses`, `rfp`,
`selection`. `grep -rln "SCAFFOLD CONTENT" src/` returned four files: the producer
(`mode-grounding.ts`) and three suites (`u533`, `u534`, `u535`, plus `u542` which was added
later and carries its own). `u538-responses` and `u540-rfp` reference the marker nowhere.
So the uncovered set was **`rfp` and `responses` — two stages**. The row says three, counting the
stage `U-542` derived; `u542-selection` has since added its own negative, so that third is
covered and the row is one stage stale. Recorded rather than absorbed.

**Clean baseline, same scope, measured in a separate worktree at `origin/main` rather than by
stashing:** the five `*-fact-derived-beats` suites — **94 tests, 0 failing**. After: **104 tests,
0 failing**. Wider scope `src/lib/source` + `src/__tests__/behaviors`: **4 failing of 5008 before,
4 failing of 5038 after** — the same two suites (`pricing-submissions/parser`,
`vendor-proposals/governed-vendor-proposal-facts`), pre-existing on clean `origin/main` and
untouched here. No absolute failure count is quoted as if this change caused it.

**Red first, in the direction the acceptance names.** Mutation **M1** — the disclosure predicate in
`mode-grounding.ts` made to disclose for `rfp` regardless of its declared provenance, which is a
derived stage disclosing carried content to the model again:

- On this branch: **2 failing of 104**, and the failing cases **name the stage** —
  `U-534 · … › rfp STOPS disclosing its derived beats to the model — both modes` and the `U-535`
  equivalent. Failing on the stage, not merely failing.
- On **unmodified `origin/main` with the identical mutation**: the two suites are **75 passed / 0
  failed**, and the whole `src/lib/source/facts/__tests__` directory is **243 passed / 0 failed**.
  The gap was real and the entire directory was blind to it.

**A guard was built, measured, and removed rather than shipped — stated here because a silent
deletion would read as if it had never existed.** Because the disclosure is decided per beat
(`evidence_readiness` reads `beatProvenance.tasks`, `stage_gate` reads `beatProvenance.gate`),
a stage deriving one beat and not the other falls outside both the derived set and the
still-scaffold set. An `it.each(ARMED_STAGE_KEYS)` case asserting the two sets still reach every
armed stage was written and then tested against three mutations of exactly that shape:

| mutation | shape | caught on clean `origin/main` by |
|---|---|---|
| M2 | `rfp` declared `tasks: fact_derived, gate: scaffold` | `u533` (2 cases) and `u540` — 4 failing of 243 |
| M2′ | M2 with the committed `U-533` provenance artifact regenerated | `u533`'s hand-written cases — still red |
| M3 | `pricing` — a stage with **no sibling suite** — declared half-derived, artifact regenerated | `u533` — 5 failing of 240 |

All three were already caught next door by `u533-stage-scaffold-provenance.test.ts`, which pins
the partition by hand and per stage. The case was therefore a second reader of an asserted fact,
not a detector, and it was deleted. The dependency is written into both suites' doc comments:
if `U-533`'s per-stage expectations are relaxed, that guard goes with them.

**Vacuity guarded explicitly.** `expect(DERIVED_STAGES.length).toBeGreaterThan(1)` and
`toContain(DERIVED_STAGE)` run before the `it.each`. `> 1` rather than `> 0` on purpose: at one
entry the parameterised case is exactly the hardcoded case it replaced.

**No test was weakened or deleted to make a suite green.** The one case removed from each suite —
`"STOPS disclosing on the flipped stage — both modes"` — was checked assertion for assertion
against the parameterised form that replaces it: identical two `not.toMatch(DISCLOSURE_MARKER)`
expectations on the same two modes, now run for every derived stage including the one it named.
Every stage-specific case that carries an extra check the parameterised form would lose was kept
untouched: `names no exemplar constant in the flipped stage's blocks`
(`SAMPLE_BAFO_STAGE` / `SAMPLE_EVALUATION_STAGE`), the exemplar-approver cases, and
`prints no generates line, rather than an empty one`.

**Commands.** `npx jest --runTestsByPath <the six suites>` → 156 passed / 0 failed.
`rm -f tsconfig.tsbuildinfo && NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` → **exit 0**, judged on the exit code, with the build-info removed first so a
stale one could neither invent nor hide a diagnostic. `npx eslint` on both changed files →
exit 0.

## Rollout Plan

Merge to `main` via squash after all required checks pass. The repo-owned
`.github/workflows/aca-main-deploy.yml` builds and deploys on merge as it does for any commit;
this change alters no runtime behavior, so nothing becomes newly active in the product.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on merge to `main`. No
  branch, local, or ad-hoc Azure command was run against any shared runtime.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by the main deploy run for the squash SHA; recorded on the PR
  after merge.
- ACA runtime invariant: to be proven after merge by reading Azure directly — web Container App
  template image, the 100%-traffic revision, and both delivery worker jobs must carry the same
  digest-pinned `acrabarvalab001.azurecr.io/abarva/web@sha256:…`.
- Worker image invariant: same digest as the web template; no worker job template edited here.
- Feature/env flag update path: not applicable — no flag or env var touched.
- Live signed-in proof required: **no, with the reason rather than a blank.** This change is
  test-only and renders nothing. The behavior the tests assert — a derived stage not disclosing
  carried content in the model grounding block — is already covered by the signed-in proofs
  recorded for `U-534`, `U-535`, `U-538`, `U-540` and `U-542`; asserting it again signed in would
  add no evidence a test run does not already give, because no rendered surface changed.

## Rollback Plan

Revert the single squash commit. No migration, no data write, no flag, no runtime state to
unwind; reverting restores the two suites to their pinned-stage form.

## Audit Evidence

- PR URL and its check run (recorded on merge).
- The before/after test counts in **QA / Validation**, each measured over the same named scope.
- The M1 mutation result on this branch and on an unmodified `origin/main` worktree — the pair
  that establishes the gap rather than asserting it.
- The M2 / M2′ / M3 table, which is the evidence for the guard that was removed.
- `tsc` exit 0 with `tsconfig.tsbuildinfo` deleted first; `eslint` exit 0.

## Known Gaps

- **`u538-responses` and `u540-rfp` still carry no disclosure case of their own.** They are now
  covered by the two parameterised negatives, which is what `U-544` asked for; a reader looking
  for the assertion beside the stage it describes will not find it there. Not a defect — stated so
  the coverage's location is on the record.
- **The negatives are proved against the marker, not against every way carried content could
  reach the model.** `DISCLOSURE_MARKER` is anchored to the start of its own line per `U-533`'s
  finding that `toContain` could not tell `SCAFFOLD CONTENT` from `SCAFFOLD CONTENTS`. A future
  path that leaked exemplar text without that line would pass these cases.
- **The half-derived partition hole is guarded only by `u533-stage-scaffold-provenance.test.ts`,
  by measurement rather than by choice.** See the M2/M2′/M3 table above. Whoever relaxes `U-533`'s
  per-stage provenance expectations removes that cover and should restore a partition case in
  these two suites at the same time.
- The `U-544` row's own count is one stage stale (three named, two actually uncovered, because
  `u542-selection` added its own negative after the row was written). Recorded in **QA /
  Validation** rather than left for the next reader to rediscover.
