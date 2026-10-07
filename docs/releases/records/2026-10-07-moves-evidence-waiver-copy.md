# 2026-10-07-moves-evidence-waiver-copy — A phase stops offering an evidence waiver it cannot record

## Release ID

`2026-10-07-moves-evidence-waiver-copy`

## Status

`candidate`

## Plain-English Summary

When a Move phase is held because a required piece of client evidence has not
been approved yet, the workspace told the reader that a sponsor or accountable
owner could record a waiver instead. No screen, route, or chat tool in Moves can
record one. The evidence need status has a `waived` member and three readers
treat it as satisfying, but nothing produces it — the only waiver controls in the
product belong to a different module's gate-criteria and artifact-acceptance
surfaces, and the one Moves-side waiver control sits under a route subtree that
is redirected away.

So a reader who was already blocked was sent looking for a control that is not
there, and away from the two that are: upload the source file, and have an
authorized owner approve it in the Files & Evidence review queue. Six sentences
carried the offer — the phase build refusal, the phase-advance refusal, the gap
register's per-item remediation line, the capture header's completion rule, and
two boundary labels on the evidence need packet.

This release does not change what is allowed. Waiving required evidence is
exactly as unavailable as it was before. Only what the product claims about it
changes: each of those six sentences now names the path that exists. The
availability is declared in one new module, and the waiver wording is kept there
behind that declaration rather than deleted, so if a waiver producer is ever
built the wording returns in a single edit instead of silently going missing.

## Layer Impact

Release lane: `global-control-lane` — shared control-plane display behavior for
all clients, not feature-gated and not client-scoped.

- **Layer 4 (Products — Moves):** display and refusal copy on the phase
  workspace, the phase build endpoint, and the phase-advance endpoint. No gate
  rule, criterion severity, readiness computation, or stored value changes.
- Layers 1–3 unaffected: no intake, adapter, or canonical-model change, and no
  schema or migration.

## Client Applicability

- All clients: yes — shared control-plane display behavior, not gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. `MOVE_EVIDENCE_WAIVER_AVAILABLE` is a declared constant
  describing whether a producer exists, not a rollout switch.

## Changes Included

- `src/lib/programs/evidence-readiness/evidence-waiver-availability.ts` (new) —
  declares the availability and owns all eight sentence variants.
- `src/lib/programs/evidence-readiness/move-evidence-need-packet.ts` —
  `waiverOption`, both `canDraftBoundary` labels, the preliminary-generation
  caveat, and the unauthored-family ask now come from that module.
- `src/app/api/v1/deliverables/generate-phase/route.ts` — the
  held-by-required-evidence refusal detail.
- `src/app/api/programs/phase-gate/route.ts` — the P2→P3 precondition message.
- `src/lib/programs/discovery/evidence-readiness.ts` — the gap register's
  `remediation` line.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the capture
  header's "saved inputs are not phase completion" rule.
- `src/lib/programs/evidence-readiness/__tests__/evidence-waiver-availability.test.ts`
  (new) — the guard suite.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** `npx jest src/lib/programs/evidence-readiness/__tests__` — 3 suites,
  55 tests.
- **PASS** `npx jest src/lib/programs/evidence-readiness/__tests__
  src/lib/programs/discovery/__tests__
  src/app/api/v1/deliverables/generate-phase/__tests__
  src/app/api/programs/phase-gate` — 16 suites, 170 tests.
- **PASS** `npx jest src/components/strategic-moves/__tests__` — 43 suites, 608
  tests (the host of the edited header).
- **PASS** Mutation check, 17 mutations, 17 killed. Twelve against the new
  module (flag flipped, each sentence reverted to its waiver variant, the
  singular/plural subject collapsed, each actionable clause dropped, the
  close-path constant blanked) and five reverting individual call sites back to
  the literal they replaced. The two call sites that are not observable through
  a packet are killed by a source-scan case, which is why it is there.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit` — exit 0.
- **PASS** `npx eslint` on every touched path — 0 errors. Two pre-existing
  unused-import warnings in the edited component were confirmed present on
  `origin/main` before this change.
- **PASS** `node scripts/audit/lib-orphan-report.mjs` — no change against the
  baseline; the new module is product-reached (product count 2303 → 2304).
- **PASS** `npm run audit:test-ci-coverage:write` — testFiles 2772 → 2773,
  covered 2608 → 2609, uncovered flat at 164 (the new suite is CI-reached).
- **PASS** `npm run audit:tenancy-fence-coverage` — no drift.
- **NOT RUN** Live signed-in walk. No runtime proof is claimed; this is copy on
  surfaces that require a signed-in session with a held phase to observe.

## Rollout Plan

Merge to `main` by squash. Reaches the shared runtime through the repo-owned ACA
main deploy workflow on its next run. No migration, no flag change, no env
change, no worker job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: whatever the main deploy workflow produces for the
  merge commit; this record pins no digest.
- ACA runtime invariant: unchanged by this release; the standard
  template/traffic/worker digest match applies at the next deploy.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: not for correctness, since the guard suite
  asserts the rendered sentences directly. A walk is still the only way to see
  the sentences in place, and is listed as NOT RUN above.

## Rollback Plan

Revert the squash commit. The change is display and refusal text plus one new
pure module; nothing is written, migrated, or cached, so a revert restores the
prior sentences immediately with no data consequence. Reverting alone would
reintroduce the offer, so the guard suite reverts with it.

## Audit Evidence

- The PR for this branch and its CI run.
- `src/lib/programs/evidence-readiness/__tests__/evidence-waiver-availability.test.ts`,
  whose source-scan case enumerates every file permitted to contain the waiver
  wording.
- The orphan-report and census outputs quoted under QA.

## Known Gaps

- **No waiver producer exists, and this change does not add one.** A required
  evidence family that a client genuinely cannot supply still holds the phase,
  and the product now says so plainly instead of naming an unavailable escape.
  Whether Moves should be able to record a waiver — who may, what caveat the
  resulting artifacts must carry, and how it is audited — is a product and
  governance decision, not a copy fix, and is deliberately left open.
- The three readers that treat `status: "waived"` as satisfying
  (`phase-progress-readiness`, `phase-templates/phase-workflow`,
  `phase-templates/p3-option-assembler`) are therefore still unreachable
  branches. They are left in place because they are the correct behavior the day
  a producer lands; they are not dead code to remove, they are code with no
  caller yet.
- The source-scan case allows the waiver wording in the other module's own
  surfaces and in agent voice doctrine, because those are a different control.
  If that module's waiver vocabulary is ever reused for a Move's evidence, the
  allowance would need narrowing.
- Committed census arithmetic: three other open branches each assert the
  pre-existing committed counts and each add one test file, so once they land
  `main` will read short again and owes one census-only regeneration. Not
  something this branch can fix without being clobbered.
