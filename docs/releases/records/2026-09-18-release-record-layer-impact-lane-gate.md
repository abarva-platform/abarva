# Release Record — Layer Impact must name a declared release lane

## Release ID

2026-09-18-release-record-layer-impact-lane-gate

## Status

merged-pending-deploy

## Plain-English Summary

The release-record gate is supposed to make an author state which release lane a
change ships in. The rule it used was the regular expression `/lane\b/` over the
`Layer Impact` section. That expression is satisfied by the substring inside the
word `plane`, so a section reading `Data plane: no schema changes` passed a check
meant to require a lane. The same expression also refused three of the five lanes
AGENTS.md declares, because `internal-admin`, `public-demo` and `experimental` do
not contain the word `lane` — so naming a lane correctly and on its own failed.

The rule now requires the section to name one of the lanes AGENTS.md declares.
The vocabulary is read out of AGENTS.md at run time rather than restated in code,
so a rename in the governing document cannot leave the gate checking a stale list.

## Layer Impact

- Lane: `global-control-lane`. Shared control-plane tooling; every author of a
  release record is affected, no client-scoped behavior changes.
- Release control: `scripts/release-control/check-release-record.mjs` now
  delegates the lane rule to a new `release-record-lane-guard.mjs`.
- CI: a new `pr-gate` step runs the guard's own suite on every pull request.
- No product surface, no route, no data-plane or migration change.

## Client Applicability

Internal only. This is repository tooling. No client-facing surface, no tenant
data and no runtime code path is touched by this change.

## Changes Included

- `scripts/release-control/release-record-lane-guard.mjs` — new. Derives the
  declared lanes from AGENTS.md and decides whether a `Layer Impact` body names
  one. Fails closed if the derivation yields nothing.
- `scripts/release-control/check-release-record.mjs` — uses the guard instead of
  `/lane\b/`; the refusal message now lists the lanes an author may choose from.
- `scripts/release-control/__tests__/run-release-record-lane-guard-tests.mjs` —
  new suite. Eleven unit cases plus three that drive the real checker end to end
  inside a scratch git repository.
- `package.json`, `.github/workflows/release-control.yml`,
  `docs/architecture/ci-gate-registry.json` — wire the suite as a declared
  `pr-gate` so it runs rather than merely existing.

## QA / Validation

- Suite measured before the checker was touched: **2 failed, 12 passed, 14
  total**. The two failures were the end-to-end pair, and they failed in opposite
  directions — the real gate accepted a record that named no lane, and refused a
  record that named `internal-admin`. After the fix: **0 failed, 14 passed**.
- Six mutations, each re-run against the suite, each caught: restoring the old
  expression (2 failures), dropping the trailing word boundary (1), removing the
  fail-closed branch on an empty derivation (1), making the guard accept every
  body (3), dropping the lane list out of the refusal message (1), and narrowing
  the AGENTS.md parse to bullets ending in `-lane` (4).
- Corpus measurement over all 4,163 records in `docs/releases/records`: 4,138
  satisfied the old expression. **228 of them satisfied it without the word
  `lane` appearing as a word anywhere in their `Layer Impact` section** — they
  passed on a substring. A further 280 wrote the word without naming a lane. Five
  records named a declared lane and were refused by the old rule.
- `npm run check:release-record-tenant-narrative-guard` passed; the neighbouring
  guard is unaffected.
- `node scripts/release-check.mjs --base origin/main --head HEAD` passed.
- ESLint over the changed scripts: exit 0.

## Rollout Plan

Merges to `main` and takes effect on the next pull request that changes a release
record. Nothing is deployed; the runtime image is unaffected by this change.

## Deployment Authority

None required. No Container App revision, no traffic shift, no image build is
involved. The repo-owned ACA deploy workflow will build on merge as it does for
any commit, and this change contributes nothing to the running image.

## Rollback Plan

Revert the pull request. The gate returns to its previous expression; no data,
schema or deployed artifact has to be undone, and no record already merged is
re-validated by anything.

## Audit Evidence

- The pull request diff and its CI run, in which the new `pr-gate` step appears
  and executes.
- The suite itself is the evidence for the rule: its two end-to-end cases drive
  the real `check-release-record.mjs` rather than asserting on its source text.
- `docs/architecture/ci-gate-registry.json` records the new script as a
  `pr-gate`, so it cannot sit in `package.json` reporting to no one.

## Known Gaps

- 528 of the 4,163 existing records would now be refused **if a future pull
  request edits one of them**; the gate only validates records a pull request
  changes, so nothing already merged is re-checked. Under the old expression the
  equivalent figure was 25. Adding the lane to a record that is being edited
  anyway is a one-line correction, and it is the statement the gate was always
  meant to require.
- `experimental` is a single ordinary English word. A section using it
  incidentally would satisfy the rule without the author intending a lane. That
  is weaker than the other four, and it is still strictly stronger than the
  expression it replaces. Narrowing it means changing the declared vocabulary in
  AGENTS.md, which is an owner decision and deliberately not taken here.
- The rule proves a lane is named, not that the lane named is the right one. No
  static check can do the latter.
