# 2026-10-07-discovery-upload-can-declare-its-evidence-family — A discovery-phase upload can state which required evidence family it covers

## Release ID

`2026-10-07-discovery-upload-can-declare-its-evidence-family`

## Status

`candidate`

## Plain-English Summary

A Move's discovery phase shows a checklist of the evidence families it needs and
an upload control beside it. The control could not say which family a file
covered: its family picker was rendered only on the Charter phase, and on the
discovery phase the panel was not even handed the list of families to offer. So
the screen asked for named evidence through a control that could not name it.

Identity then fell to the keyword matcher that runs only when nothing was
declared. That matcher carries a keyword list per family, and for archetypes
whose families have no list it decides on an exact phrase match against the
family's id-as-words or its full label — a phrase real documents rarely contain.
Measured against one archetype's own eleven required families, uploading
eleven matching documents with no declaration covered four of them, filed three
separate documents under a single wrong family, and matched nothing at all for
four. Readiness stayed short of the discovery gate, and because the remediation
sentence asks for exactly the family the user had just supplied, repeating the
upload could not clear it.

The picker is now offered on every phase that has families to declare, and the
discovery panel is handed the same list the checklist beside it prints. The
upload route already accepted any of a Move's discovery families at any phase,
so nothing about what the server trusts has changed.

Declaring a family routes review and nothing else. Coverage still counts only
evidence a human has approved, so this cannot clear a gate, advance a phase, or
substitute for review.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients, not
feature-gated.

- `4 PRODUCTS` — Moves phase workspace. The evidence upload control on a phase
  surface can declare the evidence family a file covers, on every phase that has
  one to declare rather than only the Charter phase.
- No change to `1 CLIENT INTAKE`, `2 SOURCE ADAPTERS`, or `3 CANONICAL MODEL`.
  No schema change, no migration, no change to what the upload route accepts,
  and no change to how coverage or any gate is evaluated.

## Client Applicability

- All clients: yes — the control is part of the Moves phase workspace for every
  tenant that reaches a phase with required evidence families.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is a render condition and a prop on an existing
  control; it is not gated.

## Changes Included

- `src/lib/programs/evidence-readiness/upload-family-declaration.ts` — new leaf
  module. `declarableEvidenceUploadFamilies` is the single statement of which
  families an upload may declare, deduplicated by family id in need-packet
  order. `evidenceUploadDeclarationState` reports the required families a
  surface asks for while offering no way to declare them — the condition that
  made this defect invisible.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the family
  picker's render condition no longer requires the Charter phase; the discovery
  panel is passed the declarable family list; the inline deduplication now
  reads from the new module.
- `src/lib/programs/evidence-readiness/__tests__/upload-family-declaration.test.ts`
  — new suite, 10 tests.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — one case: a discovery-phase upload declares a family and the route receives
  it.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No routes, scripts, migrations, flags, or deployment files changed.

## QA / Validation

- PASS `npx jest src/components/strategic-moves/__tests__ src/lib/programs/evidence-readiness/__tests__ src/lib/programs/discovery/__tests__` — 59 suites, 812 tests.
- PASS mutation sweep, 9 of 9 killed. The two that prove the fix is load-bearing
  rather than decorative: restoring the Charter-phase gate on the picker, and
  removing the family list from the discovery panel, each fail the new
  render case.
- PASS `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- PASS `npx eslint` on all four changed files — 0 errors. Two pre-existing
  unused-import warnings in the component are untouched by this change.
- PASS `npm run audit:moves-gate-consistency`.
- PASS `npm run audit:moves-evidence-lifecycle`.
- PASS `npm run audit:test-ci-coverage:write` — testFiles 2796 to 2798,
  coveredTestFiles 2632 to 2634, uncoveredTestFiles flat at 164. One file in each
  delta is this change's; the other is an earlier change's file that main's
  committed census had not yet counted.
- PASS `npm run audit:tenancy-fence-coverage:write` — no change; this adds no
  route.
- PASS `npm run release:check -- --base origin/main --head HEAD`.
- NOT RUN — live signed-in walk. This changes a client-rendered control, so the
  render case above is behavioural proof of the wiring, but the screen itself is
  unproven until someone signed in uploads a file on a discovery phase and sees
  the picker. Flagged below.

## Rollout Plan

Merge to main by squash. Reaches users on the next ACA web image built and
deployed by the repo-owned main deploy workflow. No migration, no flag, no
worker job, no data-plane step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. This change runs no Azure command and does not
  touch the web Container App template, revision weights, env vars, or secrets.
- Approved image digest: not applicable — no runtime update is performed here.
- ACA runtime invariant: unchanged by this release; the next main deploy asserts
  it as usual.
- Worker image invariant: unchanged; no worker job is touched.
- Feature/env flag update path: none required.
- Live signed-in proof required: yes, before this is called live-proven. See
  Known Gaps.

## Rollback Plan

Revert the squash commit. The change is a render condition, a prop, and one new
leaf module with no other callers; nothing persists state and no schema or
stored value changes, so a revert returns the picker to Charter-phase-only with
no data to migrate back. Any family a user declared while this was live stays
recorded and stays valid — the upload route already accepted those values — so a
rollback loses the ability to declare, not the declarations already made.

## Audit Evidence

- The PR for this record, its CI run, and the mutation results quoted above.
- `src/lib/programs/evidence-readiness/__tests__/upload-family-declaration.test.ts`
  for the module's behaviour, including the dead-end reading.
- The discovery-phase case in
  `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  for the wiring and the value the upload route receives.
- `src/lib/programs/discovery/evidence-readiness.ts` for the unchanged rule that
  a declaration outranks inference and that coverage counts approved evidence
  only.

## Known Gaps

- **No live signed-in proof yet.** The picker's presence on a discovery phase is
  proven behaviourally, not on the running product. This record does not claim
  `live-proven`.
- **The keyword matcher is still thin for several archetypes.** This change makes
  declaration reachable; it does not improve inference. An undeclared upload on
  an archetype whose families have no keyword list is still placed by an exact
  phrase match, and can still be placed wrongly rather than not at all. Widening
  or retiring that fallback is a separate decision, because a wrong family is
  worse than no family and the matcher currently cannot tell the two apart.
- **The picker stays optional and is labelled so.** A user may still upload
  without declaring. Whether a discovery upload should require a declaration —
  and what the control should say about the consequence of skipping it — is a
  product decision, not settled here.
- **Census ordering.** Main's committed census was already one test file behind
  the truth when this branch was rebased onto it, independently of this change.
  The counts here are a full regeneration on top of current main, so they absorb
  that lag; no separate regeneration is owed behind this PR. A census count
  merges with no conflict, so any PR that lands between this one and main will
  leave main behind again and owes its own regeneration.
