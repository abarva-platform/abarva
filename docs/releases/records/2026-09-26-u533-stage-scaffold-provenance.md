# 2026-09-26-u533-stage-scaffold-provenance — Declare which stage beats are exemplar content

## Release ID

`2026-09-26-u533-stage-scaffold-provenance`

## Status

`candidate`

## Plain-English Summary

When a Source event stage is displayed, part of what you see is computed from that
event's own recorded facts and part of it is placeholder copy from a worked
example that ships with the product. The value numbers are computed. The task
checklist and the approval gate are not — they are copied, word for word, from the
example for that stage.

Until this change nothing said so. The copied text was handed to the AI assistant
inside a block of context that introduced it as *authoritative* for this event, so
the assistant could repeat an example task as though the client had been asked for
it, and could name an approver who exists only in the example file and not on the
event.

This change does three things and deliberately stops there.

1. **It measures the split, field by field and stage by stage**, and commits the
   measurement as `docs/architecture/u533-stage-scaffold-provenance.json` so the
   before-state is data rather than a claim in a pull request.
2. **It labels the copied parts where they are produced.** The stage view now
   carries a per-beat provenance declaration, and the AI context block reads that
   declaration and tells the model, before it shows the content, that the task
   titles and the gate are example copy — and specifically not to name the
   approver as a person. The real parts of that block (which evidence is actually
   present, whether the checklist is complete) are unchanged and still stated as
   fact.
3. **It pins the current behaviour with tests that go red when it changes**, so
   the follow-up work that replaces one stage's checklist with computed values has
   something real to measure against.

It does **not** make any beat computed. No task title, gate, approver or confirm
box changes. What changes is that copied content now says it is copied.

Measured: on all ten stage exemplars both intake beats are carried. Five fields
are carried verbatim (`tasks`, `purpose`, `gate.approver`, `gate.confirms`,
`gate.generates`); two are computed (`intel`, `waterfall`). Four of the ten
exemplars carry an approver written as a person's name rather than a role.

## Layer Impact

Release lane: `global-control-lane`. Shared app behaviour for all clients, not
feature-gated: any stage whose beats are carried now declares it, and the
grounding block discloses it. No client-scoped schema, seed, RLS or private
data-plane change, so this is not `client-data-lane`.

- **Layer 4 · Products (Source, and the agent surface that reads Source).** The
  event stage view now declares per-beat provenance, and the chat grounding
  builder discloses it. No product gains or loses a number.
- **Layer 3 · Canonical model — not touched.** Nothing is read differently, no
  fact is recomputed, and no value, ROI or risk metric changes. The value
  waterfall and the intel beat were already fact-derived and are untouched.
- **Layers 1–2 · Intake and adapters — not touched.**

Governance relevance: an unlabelled fixture reaching an agent's grounding context
is a context/corpus honesty defect independent of the content gap. This closes the
labelling half. It does not make any object `agent_ready` that was not before.

## Client Applicability

- All clients: yes — the disclosure is unconditional for any stage whose beats are
  carried, which today is every stage.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The stage builder already runs behind the existing
  `source_analytics` path; this adds no new flag and no new branch a flag selects.

## Changes Included

- `src/components/source/canvas/analytics/view-model.ts` — new
  `StageBeatProvenance` / `StageBeatProvenanceView` types and an optional
  `beatProvenance` field on `StageAnalyticsView`.
- `src/lib/source/facts/view/stage-analytics-builder.ts` — `buildLiveStageView`
  now declares per-beat provenance at the point where the exemplar's `tasks` and
  `gate` are carried; adds the exemplar name table and `liveStageScaffoldSourceFor`.
- `src/lib/source/ava/mode-grounding.ts` — the `evidence_readiness` and
  `stage_gate` grounding blocks disclose carried content to the model, driven by
  the declaration and failing closed when a view declares nothing.
- `docs/architecture/u533-stage-scaffold-provenance.json` — the committed
  measurement (generated, not hand-written).
- `src/__tests__/behaviors/u533-stage-scaffold-provenance.test.ts` — the
  measurement, the grounding-path known positives, and the disclosure cases.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.u533ScaffoldProvenance.test.tsx`
  — the render-path known positive.

No migration, no route change, no data-plane change, no new dependency.

## QA / Validation

**Clean baseline, same scope, measured in a separate worktree at `cbe32f46f`** —
not inferred from a stash, and not quoted as an absolute count.

| Scope | Before | After |
|---|---|---|
| `jest src/lib/source/facts src/components/source/canvas src/lib/source/ava` | 95 suites / 911 tests, **0 failing** | 96 suites / 914 tests, **0 failing** |
| `npm run test:behaviors` | (recorded below) | 140 suites / 1399 tests, **0 failing** |

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit
0**, judged by exit code rather than by grepping for `error TS`, because a bare
run exits 134 on a developer machine with no diagnostics at all.

`npx eslint` over the five changed/added files — 0 errors, 0 warnings.

**One real regression was caused and fixed, not worked around.** The first draft
of the gate disclosure contained the words `MET/UNMET`, and
`src/lib/source/ava/__tests__/mode-grounding-phase-c.test.ts` asserts
`not.toContain("UNMET")` over the whole `general_advisory` block to prove the
task-derived gate signal has not regressed to unmet. That existing assertion is
blunt rather than stale — it means "the evidence box is not reported unmet" and
says "these five letters are absent from the block" — so it was left exactly as it
is and the new prose moved instead. The constraint is recorded in a comment beside
the disclosure text so the next person adding a line to those blocks meets it.

**Mutation proof — 8 mutations, each verified to have changed the file before the
suite was run (a no-op mutation reads exactly like a killed one), and each by
RE-SPELLING rather than deletion where the acceptance asks for it.**

| # | Mutation | Cases killed |
|---|---|---|
| M1 | task disclosure marker re-spelled | 3 |
| M2 | exemplar name re-spelled in the builder's name table | 5 |
| M3 | fail-closed condition inverted (`!==` → `===`) | 3 |
| M4 | a carried exemplar task title re-spelled | 1 (artifact drift) |
| M5 | a carried approver re-spelled so it stops reading as a person | 2 |
| M6 | gate disclosure moved *after* the line that prints the approver | 1 |
| M7 | gate disclosure marker extended to `SCAFFOLD CONTENTS` | **0 at first — see below** |
| M8 | task disclosure marker extended to `SCAFFOLD CONTENTS` | 3 |

**M7 initially SURVIVED and that is reported rather than quietly fixed.**
`toContain("SCAFFOLD CONTENT")` passes against `SCAFFOLD CONTENTS`, because the
asserted string is a prefix of the mutant. All 42 cases stayed green. The
assertions were re-anchored to `/^SCAFFOLD CONTENT -- /m`, and M7 and M8 then kill
3 cases each. A substring assertion on a marker cannot tell a marker from a word
that begins with it.

**Two things the item stated that measurement corrected, both recorded in the
artifact rather than inherited.**

- The item names **two** reachable consumers of `buildLiveStageView`. There are
  **three**: `src/lib/source/facts/view/ava-grounding-context.ts` imports it as
  well, so exemplar content reaches the grounding path by two routes.
- The carried approver reaches the **model's prompt only, not any reader.** The
  sole component that renders `gate.approver` is `ScopeGate`, whose only mounter
  `ScopeAnalyticsStage` is imported by no route. The render path and the grounding
  path leak *different* carried fields, so a fix aimed at one does not close the
  other. The first draft of the render test asserted the approver onto the page
  and was wrong; the case now proves the carried view is in play (its exemplar
  task titles are on the page) before asserting the approver's absence, so the
  negative is not vacuous.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow builds the
digest-pinned image and shifts Product/Lab web traffic; no manual Azure command,
no flag, no migration, no data build. Active for all clients on the new revision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on merge to
  `main`. No other path is used and none is needed.
- Shared runtime mutators: none. This PR runs no `az` command and changes no
  Container App template, env var, flag, secret or scale setting.
- Approved image digest: produced by the deploy workflow for the merge SHA;
  recorded in the claim register and the pulse entry after the run completes.
- ACA runtime invariant: to be proved read-only after the deploy — Container App
  template image digest == 100%-traffic revision image digest, and both worker job
  images on the same digest. Not claimed until read from Azure.
- Worker image invariant: unchanged by this release; verified as part of the
  invariant check above.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no, and this is a decision rather than an
  omission.** U-533's acceptance (5) says a mounted-route render test is a render
  and not an acceptance, and forbids a signed-in claim unless a signed-in run is
  performed. None was performed, so none is claimed. Nothing here changes what a
  signed-in reader sees: the only new rendered output is an additive optional
  field the canvas does not display. The one behaviour that did change — the text
  of the model's grounding block — is not observable by signing in to a page.

## Rollback Plan

`git revert` the squash commit and let the same deploy workflow ship the revert.
There is no migration, no persisted state and no flag, so the revert is complete
in one step. Reverting restores the previous behaviour exactly: the grounding
blocks lose the disclosure lines and the stage view loses an optional field no
consumer requires.

## Audit Evidence

- PR URL and its CI run (recorded on merge).
- `docs/architecture/u533-stage-scaffold-provenance.json` — the measurement, and
  regenerable on demand:
  `ABARVA_UPDATE_U533_PROVENANCE=1 npx jest --runTestsByPath src/__tests__/behaviors/u533-stage-scaffold-provenance.test.ts`.
  The suite fails when the committed artifact and the live measurement disagree,
  so the artifact cannot silently go stale.
- The before/after table above, measured in a clean worktree at `cbe32f46f`.
- The mutation table above, including the one mutation that survived first.
- ACA deploy run for the merge SHA and the digest read-back (recorded after the
  run completes).

## Known Gaps

- **U-533 acceptance (3) is NOT done and the backlog item is released back for
  it.** No stage's `tasks`/`gate` is replaced with fact-derived values. This
  release labels carried content; it does not reduce it. Ten of ten stages are
  still carried, which is what the artifact records.
- The disclosure lands in the `evidence_readiness` and `stage_gate` grounding
  blocks. Other modes that read `stageView.tasks` for a count — the compact
  `general_advisory` roll-up reuses the two blocks above and so inherits the
  disclosure, but a mode that reads the tasks without going through them would
  not. Not surveyed exhaustively in this change.
- `src/lib/source/ava/__tests__/mode-grounding-phase-c.test.ts` asserts
  `not.toContain("UNMET")` over a whole grounding block. It is correct today and
  will collide with any future prose in those blocks that contains those letters.
  Left as-is here on purpose — narrowing someone else's assertion is not this
  item's scope — and filed separately.
- No signed-in run was performed and none is claimed. See Deployment Authority.
