# u582 — Evidence-basis evaluability is decided by the component that owns the phase bounds

## Release ID

`2026-10-07-evidence-basis-phase-scope`

## Status

`candidate`

## Plain-English Summary

Before a governed document can be approved, the product checks whether the approved evidence it was
built from is still the current evidence. That check can only run for the phases the evidence
snapshot actually models; outside that range the underlying function does not compare anything — it
returns "not current" for every input, because there is no revision there to compare against.

Each write path therefore has to confine the phase itself before it may read that answer as a
comparison. The deliverable sign-off route confined only the lower end of the range. A document
whose type resolved to a phase above the modelled range passed that check, so the route reported the
basis as comparable and handed the refusal classifier a "not current" that nothing had established.
The classifier then produced the refusal those inputs call for: *approved evidence changed after this
document was generated — rebuild it from the current evidence set*, marked as something a rebuild can
satisfy.

Both halves of that were wrong. No comparison had run, so nothing was known to have changed; and the
rebuild re-reads the same out-of-range phase and gets the same answer, so the suggested remedy could
never clear the refusal. Refusing with an action that cannot succeed is the specific failure the
refusal component was built to prevent, and its own tests prove that property over every refusal it
can construct — but whether the basis is comparable at all is supplied by the caller, so a caller
that decides it with half the range reintroduces the defect behind a passing suite.

This change moves that decision into one shared rule that asks the component already holding the
bounds, and keeps the two distinct reasons apart: a deliverable type the registry does not carry,
versus one it carries at a phase the snapshot does not model. A refusal now names which of the two
applies and states plainly that regenerating will not change the answer.

Scope, stated plainly: the shipped deliverable registry carries P1–P5 only, so no shipped deliverable
type reaches the out-of-range branch today. This is a guard against a future registration — a P0
brief, a P6 handoff — not the repair of a currently firing fault. What it secures now is that such a
registration can no longer silently convert "this could not be checked" into "this document is
stale". The behaviour for every deliverable type shipping today is byte-for-byte unchanged, which the
suite asserts spec by spec rather than assuming.

## Layer Impact

Release lane: `global-control-lane` — shared application behaviour in the Moves sign-off route,
reaching all clients and not feature-gated.

- **Layer 4 (Products — Moves):** the deliverable sign-off route's approved-evidence refusal path.
  The refusal a caller receives changes only for a deliverable type registered outside the modelled
  phase range; no such type ships. No gate criterion, phase transition, capture field, or deliverable
  generation path is altered.
- **Layer 3 (Canonical model):** unchanged. No schema, migration, read model, or stored value is
  touched. The phase a sign-off stamps onto a saved artifact is deliberately left as it was — this
  change addresses only whether an evidence-currency comparison may run, which is a separate
  question from which phase the artifact belongs to.

## Client Applicability

- All clients: yes — shared control-lane behaviour in the Moves sign-off route, not feature-gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is confined to a branch no shipped deliverable type reaches, so it
  needs no gate.

## Changes Included

- `src/lib/programs/approved-evidence-basis-phase-scope.ts` — **new.** The single write-side rule for
  whether an approved-evidence currency comparison can run, and at which phase. It does not restate
  the bounds; it delegates to `resolveDeliverableApprovalCurrencyScope`, which owns them, and maps
  that component's two unevaluable reasons onto the write-side refusal causes. Its final branch is
  the refusing one, so a reason added to the read-side union later cannot arrive as comparable.
- `src/lib/programs/approved-evidence-basis-refusal.ts` — a fourth unevaluable cause,
  `deliverable_phase_outside_evidence_basis_range`, with its own operator text. The existing three
  causes, their text, and the fallback branch are unchanged.
- `src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/route.ts` — the
  generated-version approval path gates comparability on the shared rule instead of a lower-bound
  comparison of its own, and takes its refusal cause from the same answer. The file-upload approval
  path and the phase used for artifact stamping are untouched.
- `src/lib/programs/__tests__/approved-evidence-basis-phase-scope.test.ts` — **new**, 14 cases.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__/approved-evidence-basis-phase-scope.test.ts`:
  14 of 14. Covers both range edges, the unregistered-key reason, the distinctness of the two
  unevaluable causes, agreement with the predicate for every shipped registry spec, and the route
  wiring.
- **PASS** — non-vacuity. The out-of-range branch is unreachable through the shipped registry, so the
  suite exercises it through a registry constructed in the test, and asserts separately that
  `isApprovedMoveEvidenceBasisCurrent` really does decline to compare at those phases — the fact that
  makes the branch necessary. One case reconstructs the old lower-bound-only inputs and asserts they
  still produce the stale-document refusal, so the regression itself is pinned, not just its fix.
- **PASS** — mutation testing: **7 mutations, 7 killed.** Out-of-range branch deleted; final branch
  returning comparable; the comparable branch losing its phase; the reason comparison flipped to the
  other reason; the refusal text branch deleted; and the two route reverts (the lower-bound-only
  comparability guard, and the old cause ladder). Each mutation was applied under an assertion that
  its pattern occurred exactly once.
- **PASS** — route revert check: with the route restored to its base revision and the suite kept,
  exactly 3 of 14 cases fail (the three wiring cases) and the other 11 still pass.
- **PASS** — `npx jest src/lib/programs`: 347 suites, 5165 tests.
- **PASS** — `npm run test:behaviors`: 202 suites, 2102 tests.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`, exit 0.
- **PASS** — `npx eslint` over all four changed/added source files, exit 0.
- **PASS** — census regenerated against the current base after merging it: test files 2828 → 2829,
  covered 2664 → 2665, PR-covered 2663 → 2664, uncovered flat at 164. The +1 is this change's one
  new suite; the flat uncovered count is the evidence that the suite is CI-wired rather than dark.
  (The earlier figures on this record, 2661 → 2663, were measured against a base that has since
  moved and that has repaired a one-file census drift of its own.)
- **NOT RUN** — live signed-in walk. No runtime rollout is required and the changed branch is
  unreachable through any shipped deliverable type, so there is no live behaviour to observe.

## Rollout Plan

Squash merge to `main`. The change is library and route code with no migration, no flag, no env var,
and no worker payload change; it becomes active with the next ordinary ACA image build and deploy
through the repo-owned main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path permitted to
  shift shared Product/Lab web traffic.
- Shared runtime mutators: none in this change.
- Approved image digest: not applicable — no runtime update is requested here.
- ACA runtime invariant: unchanged; no `az containerapp update` is performed or implied.
- Worker image invariant: unchanged. No worker job payload, contract, or image is touched.
- Feature/env flag update path: not applicable — no flag.
- Live signed-in proof required: no. This record does not claim `live-proven`.

## Rollback Plan

Revert the squash commit. The change adds one module, one suite, one enum member with its text, and
three lines of route wiring; nothing is persisted, migrated, or cached, so a revert restores the
prior refusal behaviour immediately with no data consequence.

## Audit Evidence

- PR URL and its CI run on this branch.
- The mutation-testing results and the route revert check recorded under QA / Validation above.
- `docs/architecture/test-ci-coverage-census.json` diff for the covered/uncovered counts.

## Known Gaps

1. **The deliverable queue worker's two refusal sites still pass a phase they do not confine.**
   `src/scripts/process-deliverable-queue.ts` supplies `payload.phase` to the same predicate with no
   range check at its premium-artifact site, and its orchestrator site checks only for an absent
   phase. Both therefore have the same unguarded upper edge this change closed in the sign-off route.
   They are deliberately out of scope here because that file is being rewritten by an open pull
   request; routing both sites through the new shared rule is a direct follow-up, and the rule was
   written parameterised so that needs no further design.
2. **The generated-artifact persistence path stamps an unregistered deliverable key at phase 0.**
   `src/lib/deliverables/orchestrator/persistence.ts` resolves its key through a fallback typed as a
   plain string and then derives a phase with the same inline registry lookup, defaulting to 0. An
   artifact saved that way is subsequently refused by the approval routes. The honest fix constrains
   the key at generation rather than widening a phase lookup, so it is a separate change.
3. **Three independent inline copies of the registry phase lookup remain** (the sign-off route for
   artifact stamping, the artifact client-approval route, and the persistence path). This change did
   not consolidate them: only the evidence-basis comparability decision is shared, because the phase
   an artifact is stamped with and the phase a currency check may run at are different questions and
   collapsing them would change what is stored.
4. **Out-of-scope and unchanged:** the deliverable types the registry does not carry still resolve no
   phase and are still refused on the generated approval path. That is the correct answer for an
   unregistered type; registering them is a product decision, not a defect in this rule.
