# 2026-10-05-moves-charter-basis-edit-notice — Moves: the charter field explains when an edit clears its basis (flag-gated)

## Release ID

`2026-10-05-moves-charter-basis-edit-notice`

## Status

`candidate`

## Plain-English Summary

A P1 Charter field records **how you know** its answer — backed by evidence, your
own assertion, or an owned assumption. That basis is recorded against the answer
**as saved**, so saving a changed answer without a new basis clears the one on
file. That is the right behaviour: a basis that was true of the previous wording
must not silently vouch for new wording nobody has re-checked.

Nothing at the field said so. Two people hit that silence from opposite
directions:

- someone records a basis, tightens the sentence, saves, and finds the basis gone
  with no account of why;
- someone fills an answer from pasted notes — which records its own
  "I'm asserting this" basis **before** the answer is saved — and then saves the
  answer, which clears exactly the basis the insert just recorded.

Both are the same rule, so one explanation covers both. The field now carries it:

- while the saved answer still matches its basis, a quiet line says the basis is
  recorded against the answer as saved and will clear if the answer changes;
- once the answer has been edited away from it, an **amber** line says saving
  will clear the basis and asks the person to record it again afterwards, so the
  basis describes what the answer now says.

This is explanation only. It never clears a basis, never saves, and changes
nothing the gate reads — the rule it describes was already in force. It extends
the existing `moves_charter_basis_v1` flag to a clearer field affordance and
introduces **no new flag**.

That flag's enrollment changed under this increment while it was being built:
its `includeTenants` list is no longer empty — **one synthetic demo tenant** is
now enrolled, for signed-in review. So this is not an inert flag-OFF change everywhere: once
deployed, that one synthetic tenant's P1 Charter fields will carry the new
sentence. Every other tenant has the flag off and the whole control, this line
included, renders nowhere for them.

## Layer Impact

Lane: `experimental` — feature-flagged, non-default capability
(`moves_charter_basis_v1`, enabled for one synthetic demo tenant only). No new
flag; this is the existing flag extended to a second explanation on a surface it
already owns.

- `4 PRODUCTS` (Moves): the per-field charter basis control gains one sentence.
  No other product surface changes, and the basis-to-answer rule it describes is
  unchanged in both the API and the gate.
- `3 CANONICAL MODEL`: unchanged. Nothing is written, no field is added, the
  capture revision hash is untouched, and no migration is involved. The decision
  is computed from state the client already holds (the persisted answer, the
  visible answer, and the recorded basis).

## Client Applicability

- All clients: No.
- Specific clients: one synthetic demo tenant, enrolled in
  `moves_charter_basis_v1` for signed-in review. No real client engagement is
  affected.
- Internal only: No.
- Public/demo only: Effectively yes — the only enrolled tenant is synthetic.
- Feature flag: `moves_charter_basis_v1` (tenant policy, one synthetic demo
  tenant enrolled) — pre-existing and **not changed by this increment**. Its
  enrollment was widened from empty to that one synthetic tenant by a separate
  controlled change that merged while this increment was in build.

## Changes Included

- `src/lib/programs/charter-basis-edit-notice.ts` (new) — the decision alone,
  pure: five ordered branches (`surface_off`, `not_a_charter_field`,
  `no_basis_recorded`, `basis_matches_answer`, `pending_clear`) and the
  `charterAnswerEditedSinceBasis` comparison. That comparison trims both sides
  and compares as strings, which is deliberately the **same** comparison
  `diffCaptureValues` makes in the phase-capture route — so the notice cannot
  promise a clear the server will not perform, or stay silent through one it
  will.
- `src/components/strategic-moves/CharterBasisField.tsx` — an optional
  `editNotice` prop, rendered above the save error. The warning case carries the
  existing amber note class; the standing explanation does not, because amber is
  reserved for what the person is about to lose. No new CSS and no new design
  token — it reuses the control's own note styles.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — computes the
  notice at the single existing basis call site from the persisted answer, the
  visible answer and the recorded basis. One call, no new state, no new effect.
- `src/components/strategic-moves/__tests__/charter-basis-edit-notice.test.ts`
  (new) — 11 cases over the decision, each branch pinned with the other
  conditions **satisfied**, so deleting any one guard turns a case red.
- `src/components/strategic-moves/__tests__/CharterBasisField.test.tsx` — 5
  render cases: the sentence renders, the amber class is on the warning case and
  off the standing one, an absent notice renders nothing extra, and an
  assumption's own wording is not suppressed by it.
- `.github/workflows/ai-surface-control-catalog.yml` — the new suite registered
  by exact path in the required check.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- `jest` (`charter-basis-edit-notice`, `CharterBasisField`,
  `capture-notes-basis-link`) — **PASS**: 48/48 across 3 suites.
- Mutation check on the new guards — **PASS** (each mutation killed):
  making the `pending_clear` branch unreachable failed 4 cases; dropping
  `warn: true` from it failed 2; dropping the amber class in the component
  failed 1. Run before claiming the cases guard anything.
- Suite registration proved by the census delta — **PASS**:
  `coveredTestFiles` 2519 → 2520 with `uncoveredTestFiles` unchanged at 164.
  (The script's own `census drift: committed census matches this run` line is
  printed on a successful write too and does not report the delta.)
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit code 0, whole project.
- `eslint` on all changed files — **PASS**: 0 errors (3 pre-existing unused-var
  warnings in untouched regions of `MovesPhaseStandaloneClient.tsx`).
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**: all
  gates.
- Signed-in visual walk — **NOT RUN**, and now **owed**. When this increment
  was designed, `moves_charter_basis_v1` was `includeTenants: []` and there was
  nothing to walk. A separate controlled change enrolled one synthetic demo
  tenant while this was in build, so the control — and this sentence — will
  render for that tenant once a deployed ACA revision carries this commit. This
  increment performs no deploy and claims nothing live-proven; the walk is owed
  against the first deployed revision that includes it, and belongs to the
  charter-basis family as a whole rather than to this sentence alone.
- Phone-width layout — **NOT RUN**: jsdom does not lay out. The notice is a
  single paragraph inside an existing block that already reflows, so no new
  layout risk is introduced, but it is unmeasured like the rest of the control.

## Rollout Plan

Merge to `main` via squash PR. Nothing changes at runtime on merge itself;
the change reaches a runtime only with the next ACA web image, built and
deployed by the repo-owned `aca-main-deploy` workflow. At that point the one
enrolled synthetic demo tenant sees the new sentence on its P1 Charter fields,
and every other tenant sees nothing, because the flag is off for them. This
increment adds no enablement step and widens no flag.

## Rollback Plan

Revert the PR. There is nothing to undo beyond the rendered sentence: no data is
written by this increment, no persisted record changes shape, and the
basis-clearing rule it explains is unchanged either way. Returning
`moves_charter_basis_v1` to `includeTenants: []` would also remove it — but that
withdraws the whole charter-basis control from the enrolled synthetic tenant, so
it is the family's rollback, not this increment's.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; this change shifts no shared Product/Lab traffic, mutates no
revision weights, and touches no Container App template, env var, or secret.
The merged code reaches a runtime only through that workflow, and then renders
for exactly the one synthetic demo tenant already enrolled in
`moves_charter_basis_v1`.

## Known Gaps

- **The explanation does not make the clear atomic.** A notes insert still
  records a basis before the answer is saved, and the following answer save
  still clears it. This increment makes that visible and tells the person what
  to do; it does not change what Insert means. Making the pair atomic would mean
  auto-persisting an inserted answer, which remains deliberately out of scope.
- **The host wiring itself is not under test.** The decision and the render are
  both pinned, but the one call site that joins them in
  `MovesPhaseStandaloneClient.tsx` is not — that component has no suite, and
  standing one up for a 3,000-line client is its own increment. A wiring mistake
  there (passing the wrong answer into the comparison, say) would be caught by
  neither suite.
- A signed-in walk of the charter-basis family is now claimable in principle —
  one synthetic demo tenant is enrolled — and has not been performed for this
  sentence or for the family. It is owed against a deployed revision.
- Nothing flag-gated here has been measured at phone width.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, the AI-surface control catalog (which now names
  the new suite by exact path), and `npm run release:check` on the PR.
- The claim that the notice agrees with the server is carried by the shared
  trimmed-string comparison and by the case that pins trailing whitespace as
  "no change", matching `diffCaptureValues`.
