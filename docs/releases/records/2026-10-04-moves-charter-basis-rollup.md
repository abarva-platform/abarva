# 2026-10-04-moves-charter-basis-rollup — Moves: charter-level basis rollup on the hand-off screen (flag OFF)

## Release ID

`2026-10-04-moves-charter-basis-rollup`

## Status

`candidate`

## Plain-English Summary

The per-field charter basis control landed the question — *how do you know
this?* — on every P1 Charter field, and its own record named the gap this
increment closes: **there was no charter-level read-back.** A reviewer could
inspect each field one at a time, but nothing said how much of the charter was
actually known.

Worse, the hand-off recap had a specific defect. It lists every question with
its answer and no basis at all, so an assumption rendered there in exactly the
same type, weight and colour as a fact backed by approved evidence. The control
exists to stop an assumption reading as evidence; the recap undid that two
screens later.

This increment adds two things to the hand-off screen, both from the approved
design canvas:

- **A rollup band above the recap.** One serif line — *"7 of 7 answered · 2
  assumptions carry into Discover"* — then a chip per basis (backed by evidence
  / asserted / assumptions open / without a basis yet), then each open
  assumption named with its **owner** and **how Discover validates it**. A
  reviewer learns the shape of the charter's evidence before reading a single
  answer.
- **A basis mark on every recap row.** Not only the amber case. An assumption
  keeps the same `Assumption · validate in Discover` badge it carries at the
  live question; evidence and assertions get their own quiet marks. The point is
  that *no row is unmarked*, because in a read-back list an unmarked row is
  indistinguishable from a backed one.

Two counting rules are deliberate and pinned by tests:

- **A declared basis is not an answer.** `answered` and the per-basis counts are
  tallied independently, so recording a basis on a blank field cannot make the
  field look complete.
- **"Without a basis yet" means answered-and-unexplained.** An unanswered field
  is not also reported as unrecorded — otherwise a blank charter would read as
  seven open problems instead of seven unanswered questions.

Counts only. The gate (`src/lib/programs/p1-charter-evidence.ts`) reads the
persisted basis and is untouched by anything here, as is the legacy
approved-evidence lock. Everything is behind `moves_charter_basis_v1`, **off for
every tenant** — no new flag was introduced.

## Layer Impact

Release lane: `experimental` — feature-flagged, non-default capability
(`moves_charter_basis_v1`, off for all tenants).

- `4 PRODUCTS` (Moves): the 3-step capture flow (`MovesCaptureFlow`) gains two
  more optional presentation slots — a band at the top of the hand-off screen
  and a per-row mark in the recap. Both default to absent. The phase workspace
  fills them only for P1 Charter fields in an evidence family, and only when the
  flag resolves on for the tenant.
- `3 CANONICAL MODEL`: unchanged. No new field, table, key, or write. The rollup
  is a pure fold over the basis map the phase page already resolves server-side.
  This increment persists nothing and calls no API.
- `1 CLIENT INTAKE` / `2 SOURCE ADAPTERS`: unchanged.

## Client Applicability

No client receives this change: it is gated by the existing
`moves_charter_basis_v1` feature flag, which has `includeTenants: []`, so
neither the rollup nor the recap marks render for any tenant, and the legacy P1
approved-evidence lock remains in force everywhere. The demo tenant that has
`moves_capture_v2`, `moves_capture_p0_v1` and `moves_home_v2` enabled is
explicitly *not* enabled on this flag.

## Changes Included

- `src/components/strategic-moves/CharterBasisField.tsx`: adds
  `summarizeCharterBasis` (the fold and its two counting rules),
  `CharterBasisRollup` (the hand-off band) and `CharterBasisMark` (the per-row
  mark). Kept in the same module as the control and the amber badge so the
  rollup's wording and the badge's can never drift apart. Design-locked tokens
  only (cream `#f5f1eb`, surface `#fff`, ink `#2c2c2a`, amber `#ba7517`;
  Fraunces / Inter / JetBrains Mono). The teal used for the evidence mark and
  chip is the darkened canon accent `#0f6e56`, not `#1d9e75`: these are small
  uppercase marks on a light fill, where the brighter accent does not clear
  4.5:1.
- `src/components/strategic-moves/MovesCaptureFlow.tsx`: two optional slots —
  `handoffSummary` (a band above the recap) and `renderSectionRecapMark` (a mark
  beside a recap row's label) — plus the recap `dt` becoming a wrapping flex row
  so a mark can sit beside a long label. Absent slots change nothing.
  `renderSectionRecapMark` is deliberately separate from the existing
  `renderSectionBadge`: the live question marks only the amber case, the recap
  marks every basis.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: computes the
  summary from the basis state it already holds and the same completeness
  predicate the step strip uses, so "answered" means one thing in both places.
  Null when no section is basis-eligible — which is every phase but P1, and
  every tenant while the flag is off.
- `docs/releases/records/2026-10-04-moves-charter-basis-rollup.md` (this
  record).

No new test file, so no CI catalog registration or census refresh is required:
the cases were added to
`src/components/strategic-moves/__tests__/CharterBasisField.test.tsx`, already
registered by exact path in `.github/workflows/ai-surface-control-catalog.yml`.
No feature-registry change, so no `docs:nexus-manual` regeneration.

## Design Authority

Built from the approved design canvas (`Charter Evidence Basis`), which gained a
second artboard — `Charter hand-off · basis rollup` — for this increment rather
than the layout being improvised in code. The rollup's structure, chip
treatment, open-assumption list and per-row recap marks follow that artboard.

## QA / Validation

- `jest src/components/strategic-moves/__tests__` + `src/lib/programs/__tests__`
  — **PASS**: 127 suites, 1206 tests. The basis suite itself is 24/24.
- **Mutation-checked**, three mutations against the new assertions:
  - assumption falling through to the plain mark (so it reads as a fact) —
    **caught**.
  - `unrecorded` counting unanswered fields — **caught** (it survived a first
    pass; no case had an unanswered *and* basisless field, which is the gap the
    rule is about, so a case was added).
  - the amber clause rendered unconditionally — **caught** (it also survived a
    first pass, because the negative assertion matched only the singular
    *"carries into Discover"* and the regression wording is the plural
    *"carry"*; the assertion was widened).
- `tsc -p tsconfig.json --noEmit` — **PASS**: real exit code 0, zero
  diagnostics.
- `eslint` on every changed file — **PASS**: 0 errors (3 pre-existing unused-var
  warnings in `MovesPhaseStandaloneClient.tsx`, none introduced here).
- `npm run release:check --base origin/main --head HEAD` — **PASS**.
- Signed-in visual walk — **NOT RUN**: the flag is off for every tenant, so
  there is no tenant on which the rollup renders and nothing to walk. Owed
  before any tenant is enabled — see Known Gaps.

## Rollout Plan

Merge to `main` via squash PR. The flag is off for all tenants, so there is no
runtime behaviour change on merge. Ships with the next ACA web image via the
repo-owned `aca-main-deploy` workflow. Enabling a tenant is a separate
controlled change and must be preceded by the signed-in walk below.

## Rollback Plan

Revert the PR, or leave `includeTenants: []` (already the state). Either returns
every tenant to a hand-off screen with no rollup band and an unmarked recap. No
data migration and no cleanup: this increment persists nothing, writes nothing,
and calls no API — it only reads a basis map that already existed.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`. This change shifts no shared Product/Lab web traffic,
mutates no revision weights, and touches no Container App template, env var, or
secret. With the flag off for all tenants the merged code is inert at runtime
until a separate controlled change enables a tenant.

## Known Gaps

- **No signed-in proof, and none is claimable.** With the flag off for every
  tenant neither the band nor the marks render anywhere, so this record claims
  `merged`, not `live-proven`. A signed-in walk — declare a mix of bases across
  a P1 Charter, submit, and confirm on the hand-off screen that the counts match
  the fields, that each open assumption shows its owner and validation step, and
  that no row is unmarked — is owed as the gate on enabling the first tenant.
- **Measured at one width only.** The band and the marks are asserted in jsdom,
  which does not lay out. The chips and the recap `dt` wrap by construction, but
  have not been rendered and measured at phone width. Owed with the signed-in
  walk.
- **Not in the gate dialog.** The rollup is on the hand-off screen only. A
  reviewer approving the gate sees the gate's own copy, which still says nothing
  about how much of the charter is assumed. That is the more consequential
  surface of the two, and it is a separate slice — the gate's copy is governed
  by the approval flow, not by the capture flow.
- **"Editing an answer clears its basis" is still unexplained.** Carried over
  from the control's own record: the field re-prompts but does not say why the
  basis went blank. The rollup now makes the consequence visible — the field
  moves into "without a basis yet" — but the cause is still not stated at the
  field.
- **No P0 case.** The rollup is P1-only by construction (`phase.phase === 1`),
  so the P0 mount is unaffected and no P0 case was added.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check` on the PR.
- `src/components/strategic-moves/__tests__/CharterBasisField.test.tsx` pins:
  the per-kind counts and the collected open assumptions; that an answered field
  with no basis is reported as unrecorded rather than as covered; that an
  unanswered field is *not* reported as unrecorded; that a declared basis cannot
  make a field count as answered; that the amber clause and the
  "not evidence" footnote appear only when something is assumed; that an
  assumption's recap mark is the same amber badge as the live question's while
  evidence and assertions are distinguishable from each other; and the flag-off
  case asserting the hand-off recap renders exactly as it does today when both
  slots are absent.
- Design canvas artboard `Charter hand-off · basis rollup` on the approved
  `Charter Evidence Basis` canvas.
