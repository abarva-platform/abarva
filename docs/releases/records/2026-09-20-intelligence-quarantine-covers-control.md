# 2026-09-20-intelligence-quarantine-covers-control — Declare and re-measure what a quarantined suite covers

## Release ID

`2026-09-20-intelligence-quarantine-covers-control`

## Status

`candidate`

## Plain-English Summary

A list of excluded test suites now has to say what each exclusion would cost to clear, and a CI
check re-measures that claim on every run.

Sixteen Intelligence integration suites are excluded from CI because they assert the shape of a
component tree that was deliberately replaced. An earlier batch of nine was cleared, and clearing
them the fast way — delete the one stale block, keep the rest — would have turned all nine green
while asserting the behaviour of code no product path reaches. That lesson was written down as
prose in the list. Prose is not a control: the next person has to read it, believe it, and redo the
measurement by hand.

So each entry now declares the modules it actually imports and what happens to each when the suite
goes: nothing else reaches it, a suite that still runs in CI covers it, or a surviving non-test file
imports it. The check recomputes all of it against the real tree and fails when a recorded
classification stops being true.

Measuring the remaining sixteen before repairing them is what this change is for, and the
measurement found the earlier rule does not generalise. Two of the modules are covered by suites the
same workflow runs green today. Applying batch one's rule unchanged would have deleted live,
executing coverage.

## Layer Impact

Release lane: `global-control-lane` — shared repository CI tooling, no client-scoped data or
schema. Nothing is feature-gated because nothing is served.

- **Layer 4 — Products:** none. No product surface, route, API, prompt or dataset changes.
- **Tooling / CI:** `scripts/quality/check-intelligence-integration-quarantine.mjs` gains a fifth
  control and a sibling unit-test file; the npm script runs the unit cases before the check.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — repository CI tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/quality/check-intelligence-integration-quarantine.mjs` — control 5 (`covers`
  classification, recomputed), one-hop import reader covering alias *and* relative specifiers, and
  the `main()` guard that makes the helpers importable. The bulk of the line count is the mechanical
  re-indent from wrapping the existing body in `main()`.
- `scripts/quality/check-intelligence-integration-quarantine.test.mjs` — new. Twelve `node --test`
  cases, four of them mutations.
- `scripts/quality/intelligence-integration-quarantine.json` — a `covers` block on all sixteen
  entries (24 distinct modules), plus `coversNote` and `batch2Triage` recording the measurement.
- `package.json` — `check:intelligence-integration-quarantine` now runs the unit cases first.
- `.github/workflows/integration-suites.yml` — step renamed and the directory comment updated to
  state what the list now guarantees.

No suite was deleted, no module was deleted, and no exclusion was cleared in this change.

## QA / Validation

Baseline and after, same scope:

| check | before | after |
|---|---|---|
| `node --test check-intelligence-integration-quarantine.test.mjs` | 0 passed / 1 failed (the module had no exports and ran on import) | **12 passed / 0 failed** |
| `node check-intelligence-integration-quarantine.mjs` | exit 0 | exit 0 |
| the sixteen quarantined suites | 16 failed, 73 assertions failed, 283 passed | unchanged — none was touched |

Four mutations, all confirmed failing, two of them against the real tree rather than a fixture:

1. Flip a `kept-other-importer` module to `goes-with-the-suite` in the list → exit 1, naming both
   entries that record it.
2. Drop two lines from one entry's `covers` → exit 1, naming each unlisted module.
3. Add a route under `src/app/` importing a module recorded as going with its suite → exit 1,
   `measures as "kept-other-importer" today`.
4. Add a non-quarantined sibling suite importing that same module → exit 1, `measures as
   "kept-live-test" today`.

Removing each mutation returns the check to exit 0.

A false negative was caught by that mutation discipline and not by review: the first draft read
`@/`-prefixed specifiers only, and classified one seed module as going with its suite while three
surviving modules import it relatively. The reader now resolves relative specifiers, and a unit case
pins that path.

Other gates: `npx tsc --noEmit` **exit 0** judged by exit code with a 6144 MB heap, zero
diagnostics. `npx eslint` on both changed scripts exit 0. The three sibling quarantine checks
(source, admin, QA) unchanged and clean. `test:integration:ci-visibility` clean.

## Rollout Plan

Merge to main. No runtime rollout: nothing here is served, and no image, flag, env var, migration or
worker job changes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime change
- ACA runtime invariant: unaffected; will be verified on the merge SHA as standard practice
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: no — no user-visible surface, route, flag or migration

## Rollback Plan

Revert the PR. The check returns to its previous four controls; no data or runtime state is
involved.

## Audit Evidence

- The PR and its CI run
- `npm run check:intelligence-integration-quarantine` output in the Integration suites workflow,
  which now reports the classified-module count alongside the exclusion count
- `batch2Triage` in `scripts/quality/intelligence-integration-quarantine.json`

## Known Gaps

- **The sixteen exclusions are not cleared.** This change measures and locks the measurement; the
  deletions are the next batch and can now be done a few entries at a time against a check that
  argues back.
- **Control 5 is a one-hop reader and says so in the file.** It does not follow transitive chains,
  dynamic `import()`, or a `require` built from a variable. Where one hop is not enough the answer
  is `kept-*`, which refuses a deletion rather than waving one through.
  `docs/architecture/orphaned-lib-modules.json` remains the reachability answer; this is the
  narrower question of what clearing an entry would cost.
- `src/__tests__/integration/ops/hygiene-gate-contract.test.ts` is red (1 failed / 11 passed) on
  current `main` and runs in no workflow. Untouched here and unrelated — it is a source-text scanner
  failing on a phrase in its own subject's comments. Recorded against the existing backlog item for
  that scanner.
