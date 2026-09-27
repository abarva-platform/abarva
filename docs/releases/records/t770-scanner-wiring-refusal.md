# 2026-09-27-t770-scanner-wiring-refusal — Refuse a CI invocation that reaches a declared source-text scanner

## Release ID

`2026-09-27-t770-scanner-wiring-refusal`

## Status

`candidate`

## Plain-English Summary

This repository has a standing rule that a test which asserts against the *text of source files*
— a "source-text scanner" — is never wired into CI. Those suites go green on a comment or a rename
and are meant to be rewritten as behavioural tests first.

Until now that rule was only checked inside triage documents: a control asserted that a triage
record did not *claim* to have wired a scanner. Nothing read `.github/workflows`, a package script,
or a test ratchet baseline, so nothing connected the rule to the artefacts it is a rule about.

This change adds a behavioural control that answers the question against CI itself, using the
repository's own coverage resolver rather than a text search of the workflow files. It also makes
two pre-existing breaches visible for the first time, in a closed list that can only shrink.

## Layer Impact

Release lane: `internal-admin` — AbarVa-only CI/test tooling. No client-facing surface and no
data-plane object is touched, so neither `global-control-lane` nor `client-data-lane` applies, and
the control is on by default rather than flagged, so it is not `experimental`.

- **Tests / CI tooling only.** One new behavioural suite and one committed baseline under
  `src/__tests__/behaviors`. No product code, no route, no schema, no adapter, no prompt, no
  workflow file changed.
- No layer of the data operating model is touched: nothing here reads tenant data or a canonical
  object.

## Client Applicability

- All clients: no behaviour change.
- Specific clients: none.
- Internal only: yes — this is a CI control.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/__tests__/behaviors/t770-scanner-wiring-refusal.test.ts` (new, 7 cases).
- `src/__tests__/behaviors/t770-scanner-wiring-refusal.baseline.json` (new) — the closed,
  dated list of declared scanners a CI invocation already reaches, each naming the item that
  owns its rewrite.

No workflow was edited: the new suite sits in `src/__tests__/behaviors`, which
`scripts/ci/check-behavior-coverage.mjs` names as a directory, so it runs on the commit that adds
it. Confirmed through the coverage resolver rather than by reading YAML — `collectReachableCommands`
reports the new file selected by that script, `pullRequest: true`.

## QA / Validation

Baseline and result over the same scope, from a clean worktree at `be3c7dc27e` (not a stash):

| scope | before | after |
|---|---|---|
| `npx jest src/__tests__/behaviors --no-coverage --ci` | 150 suites / 1620 tests / **0 failing** | 151 suites / 1627 tests / **0 failing** |

**The gap this closes, measured on a real known positive rather than argued.** Wiring
`src/lib/integrations/ai-egress/__tests__` as a directory reaches a suite whose triage row is
declared `sourceTextScanner: true`, `textIsTheSubject: true`, verdict `rewrite_as_behavior`, and
whose disposition is an owner-gated decision. With that wiring applied on `be3c7dc27e`:

| check | before this change | with this change |
|---|---|---|
| `src/__tests__/behaviors` | 150 suites / 1620 tests / 0 failing | 1 suite / **3 cases failing** |
| `audit:test-ci-coverage:check` | exit 0 | exit 0 |
| `audit:triage-record-reconciliation` | exit 0 | exit 0 |
| `test:integration:ci-visibility` | exit 0 | exit 0 |
| `audit:named-suite-requiredness` | exit 0 | exit 0 |

The only objection before this change was census staleness, and its own printed remedy
(`npm run audit:test-ci-coverage:write`) cleared it — so the prescribed flow ended green with the
rule broken. The failure message now names the suite, the item that owns its rewrite, and the exact
invocation that reaches it.

**Three deliberate mutations of the control itself, each verified to change behaviour and each
caught:**

1. Classification resolved by "any record ever called it a scanner" instead of the latest record —
   3 of 7 cases fail, including the supersession case.
2. The live scanner set blinded to empty — 3 of 7 fail, including the vacuity floor. This is the
   mutation that would otherwise leave every remaining case passing over an empty list.
3. The reach resolver forced to answer "not reached" for everything — 3 of 7 fail, including the
   in-suite positive control.

Restored to the shipped form afterwards: 7 of 7 passing, 0.64s.

**Two pre-existing breaches found and declared.** `src/app/api/tower/synthesis/route.invariants.test.ts`
and `src/lib/tower/__tests__/case-attribute-widening.test.ts` are declared scanners that CI already
runs, selected by `scripts/ci/test-ratchet.mjs` from `docs/ci/tower-test-baseline.json` — which no
workflow command names, which is why a text search of the workflows reports zero. Both are owned by
an existing backlog item for rewrite. They are in the committed baseline, and the control asserts set
equality in both directions, so a third breach fails and a line whose suite has been rewritten must
be deleted in the same change.

Other validation:

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit **0** (judged by
  exit code; a bare `npx tsc --noEmit` exits 134 on the operator host and emits no diagnostics).
- `npx eslint src/__tests__/behaviors/t770-scanner-wiring-refusal.test.ts` — exit **0**, no output,
  so no warnings either.
- `npm run audit:test-ci-coverage:check` — exit 0 (no census drift; this change wires no directory).
- New suite cost 0.64s, in-process, no child process — it reads the resolver directly rather than
  spawning the census CLI, which matters because the gate that runs this directory runs it under
  `--coverage`.

## Rollout Plan

Merge to `main` through the repo-owned squash path. No runtime rollout: this is a test-only change
and no image, flag, environment variable or workflow is touched.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on merge as it does for
  any commit. This change contributes nothing to the image contents beyond test files.
- Shared runtime mutators: none.
- Approved image digest: unchanged by this release; nothing here alters the runtime template.
- ACA runtime invariant: not affected by this change. The post-merge deploy run is still read and
  reported, as a routine check rather than as this release's evidence.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: **No.** There is no product surface, route, or rendered output in
  this change; nothing a signed-in session could observe differs.

## Rollback Plan

Revert the single commit. Two new files are added and nothing existing is modified, so a revert
restores the prior state exactly and cannot leave a half-applied control. No migration, no data
change, no flag.

## Audit Evidence

- The pull request and its check run.
- The before/after tables above, each reproducible with the command named in its row.
- `src/__tests__/behaviors/t770-scanner-wiring-refusal.baseline.json`, which records the commit and
  instant of measurement and the resolver used.
- The suite's own header, which quotes the rule it enforces and names the record it comes from.

## Known Gaps

- **Two declared scanners still run in CI** and are baselined rather than fixed. Rewriting them
  belongs to the backlog item named against each entry; this change makes them visible and stops a
  third from being added, and it does not repair them. Un-wiring them instead would reduce coverage
  on a decision that is not this change's to make.
- **The control reads triage records, so a scanner nobody has triaged is invisible to it.** It
  enforces the rule over declared rows; it does not itself classify suites.
- **Two triage rows name suite files that no longer exist on disk.** They are asserted and reported
  as stale record rows rather than silently counted as compliant, and repairing those records is not
  in scope here.
