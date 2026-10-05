# 2026-10-04-moves-charter-gate-assumption-disclosure — Moves: the P1 gate dialog discloses how much of the charter is assumed (flag OFF)

## Release ID

`2026-10-04-moves-charter-gate-assumption-disclosure`

## Status

`candidate`

## Release Lane

`experimental` — a flag-gated capability, off for every tenant on merge.

## Plain-English Summary

The charter capture flow already classifies each answer by how it is known —
backed by approved evidence, asserted in the workspace, or an open assumption
with a named owner and a plan for how Discover validates it — and already reads
the whole charter back on the hand-off screen.

What it did not do is tell the person **approving** the gate any of that.

That was a surface split, not an oversight of copy. The hand-off rollup is
rendered by the capture flow; the gate's confirm dialog is rendered by the
approval flow, several components away, and its wording is governed there.
Nothing the capture flow painted could reach it. So the one moment where the
distinction between "we know this" and "we are guessing this" actually carries
consequence — a person putting their name to the charter — was also the one
moment the product stayed silent about it.

This increment closes that. The gate confirm dialog now carries a short
disclosure above the approver line: how many of the answered questions are open
assumptions, how many still carry no declared basis at all, and for each open
assumption the owner and how Discover validates it.

Three properties are deliberate:

1. **It discloses; it does not gate.** The confirm button is never disabled by
   anything here. The existing gate (`src/lib/programs/p1-charter-evidence.ts`)
   decides pass/fail and is untouched — this slice reads counts and writes
   nothing. An assumption is a thing the approver is told about, not a thing the
   capture flow gets to veto.
2. **Silence is not allowed to read as "clean".** A charter with nothing assumed
   says so in words rather than rendering nothing, because in a dialog an absent
   disclosure is indistinguishable from a clean one. An unanswered charter is a
   third state and says nothing at all — empty is not clean, and claiming either
   would be a claim the counts do not support.
3. **The gate and the hand-off read from one computation.** Both surfaces now
   fold the same `summarizeCharterBasis` result. Two independent folds would be
   free to drift, and a gate that contradicted the read-back the author had just
   seen would be worse than a gate that said nothing.

An answered question with no declared basis is treated as unaccounted for, not
as backed: it pushes the disclosure amber even when nothing is formally an
assumption.

## Layer Impact

Lane: `experimental` — flag-gated, off for every tenant on merge.

Layer 4 (Products · Moves) only, and within it only the approval surface's
presentation. No change to layer 1 intake, layer 2 adapters, or layer 3 canonical
model. No schema change, no migration, no new persisted field — the bases this
reads were already persisted by `p1_charter_basis` on the capture state. No API
route changed. No metric, fact, or read-model value is computed or displayed.

## Client Applicability

None at merge. The disclosure is gated on the existing `moves_charter_basis_v1`
flag (`policy: "tenant"`, `includeTenants: []`), conjoined with P1 as the phase,
exactly as the per-field control and the rollup already are. With the flag off
the dialog renders byte-for-byte what it renders today, which is pinned by test
rather than asserted.

No new feature flag was introduced — this slice extends an existing flagged
capability to a second surface, so it does not touch the shared flag-declaration
seat.

## Changes Included

- `src/lib/programs/charter-gate-assumption-disclosure.ts` (new) — the whole
  decision, as a pure function. Takes the resolved basis-surface state and the
  basis counts, returns the disclosure or null. Declares its input structurally
  so the module does not depend on the component that produces the counts today.
- `src/components/strategic-moves/CharterBasisField.tsx` — adds
  `CharterGateAssumptionNotice`, the presentational half, co-located with the
  other basis UI so it shares the same design tokens. Adds the `.cgd-*` rules to
  the existing style block.
- `src/components/strategic-moves/GateApprovalConfirmDialog.tsx` — an optional
  `disclosure` slot between the summary and the approver line. Omitted ⇒
  unchanged dialog. It is a render slot only; a caller cannot use it to disable
  the confirm action.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — hoists the
  basis summary to one computation shared by the hand-off rollup and the gate,
  builds the disclosure node from the already-resolved `charterBasisActive`, and
  threads it through `PhaseBody` to the phase 1–5 gate confirm dialog.
- Tests: `charter-gate-assumption-disclosure.test.ts` (10) and
  `CharterGateAssumptionNotice.test.tsx` (6).
- `.github/workflows/ai-surface-control-catalog.yml` — both suites registered by
  exact path; census refreshed.

## Design Authority

Built from the approved design canvas (`Charter Evidence Basis`). The disclosure
reuses that canvas's established basis vocabulary and amber treatment — the same
three bases, the same "validate in Discover" framing, the same amber token —
rather than inventing a second visual language for the same concept on a second
surface. Design-locked tokens only: cream `#f5f1eb`, surface `#fff`, ink
`#2c2c2a`, amber `#ba7517`; Inter / JetBrains Mono.

## QA / Validation

- `jest src/components/strategic-moves/__tests__` — **PASS**: 27 suites, 318
  tests, including the 16 new ones. No existing suite changed behaviour.
- `tsc -p tsconfig.json --noEmit` — **PASS** (exit 0).
- `eslint` on all six changed files — **PASS**, 0 errors. Three
  `no-unused-vars` warnings in `MovesPhaseStandaloneClient.tsx` are
  byte-identical to `main` and pre-date this change; verified by diffing the
  file's imports against `origin/main`.
- **Mutation-checked**, three mutations against the new assertions, each run
  against the full new suite:
  - dropping the inactive-surface guard, so the disclosure renders with the
    flag off — **caught** (1 failure).
  - letting the neutral "none is an open assumption" branch be reached while
    answers still carry no declared basis — **caught** (1 failure).
  - counting assumptions against the section total instead of against the
    answered count — **caught** (1 failure).
  The suite returns to 10/10 with each mutation reverted, so the three failures
  are the assertions biting and not collateral breakage.
- **Suite registration proven by census delta**, not by grep: `coveredTestFiles`
  2518 → 2520 with `uncoveredTestFiles` unchanged at 164.
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**, all
  gates.
- **Signed-in live walk: NOT RUN**, and not claimable. See Known Gaps.
- **Phone-width layout: NOT RUN.** jsdom does not lay out.

## Rollout Plan

Merge to `main` with the flag off for every tenant; the merged code is inert at
runtime. Enabling the first tenant is a separate controlled change, and the
signed-in walk is the gate on that change rather than a step in this one. When a
tenant is enabled, the walk should confirm the disclosure appears in the P1 gate
dialog, that it agrees with the hand-off rollup on the same charter, and that
confirm remains clickable with assumptions open.

## Rollback Plan

Two levers. The flag is the fast one: setting `moves_charter_basis_v1` back to no
tenants returns the gate dialog to its current copy with no deploy, since the
disclosure is null-rendering when inactive. Failing that, revert the squash
commit — the slice adds one module, one component, one optional dialog prop and
one threaded prop, persists nothing, and migrates nothing, so the revert is
self-contained.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`. This change shifts no shared Product/Lab web traffic,
mutates no revision weights, and touches no Container App template, env var, or
secret. With the flag off for all tenants the merged code is inert at runtime
until a separate controlled change enables a tenant.

## Known Gaps

- **No signed-in proof, and none is claimable.** `moves_charter_basis_v1` is
  `includeTenants: []`, so the disclosure renders for nobody and there is
  nothing to walk. This record does not claim `live-proven`.
- **Only the phase 1–5 gate-only dialog carries the disclosure.** The P0 gate
  dialog and the "Approve & build" dialog do not. P0 is correct to omit it —
  there is no charter basis at P0 — but the build-authorization dialog is a
  deliberate omission: it authorizes a document build rather than the gate, and
  loading it with charter provenance would blur what that button does. If the
  build is later judged consequential enough, the slot already exists.
- **The disclosure counts; it does not reconcile.** It reports how many answers
  are assumed. It does not check whether an answer's declared basis is still
  true — an answer edited after its basis was declared clears that basis and
  then shows up as unrecorded, which is correct but is explained at neither the
  field nor the gate.
- **The approver cannot act on an assumption from the dialog.** They can read
  the owner and the validation plan but not reassign, dispute, or defer it
  without leaving the dialog and returning to capture.
- **Phone-width layout unmeasured.** jsdom does not lay out, so the disclosure's
  behaviour inside the confirm dialog at narrow widths is unverified; the block
  is a single column by construction, which is the reason to expect it holds,
  not evidence that it does.

## Audit Evidence

- Branch: `feat/moves-charter-gate-assumption-disclosure`.
- Pure decision isolated in `src/lib/programs/charter-gate-assumption-disclosure.ts`
  so the gate's copy is testable without rendering a modal.
- Flag-off behaviour pinned by test (`renders exactly as before when no
  disclosure is passed`, and the inactive-surface case in the logic suite)
  rather than asserted in prose.
- Mutation results recorded above with the failure count for each.
