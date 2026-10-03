# 2026-09-28-t495-source-contract360-synthesis-context — Rewrite one source-text scanner suite as behaviour, and wire it

## Release ID

`2026-09-28-t495-source-contract360-synthesis-context`

## Status

`candidate`

## Plain-English Summary

One test suite checked that the Contract 360 context reaches the Intelligence
answer path by reading the answer module's source code as text and checking
that one word appeared before another. It passed. It would also have passed if
the context had been built from the wrong input, removed before it was sent, or
sent on every question whether a contract was selected or not — all three were
tried, and it stayed green each time.

That case is deleted, not repaired with a tighter pattern, and replaced by four
cases that run the real answer path and read what actually reached the model:
the selected contract's context is sent (from both places a contract can be
selected), it is sent ahead of the caller's own conversation context, and
nothing is sent when no contract is selected.

The suite also now runs in CI. It never did.

## Layer Impact

Release lane: `internal-admin` — test and CI governance. No product surface,
tenant dataset or runtime artifact is touched.

- **Layer 4 (Products) — no behaviour change.** No product file changed.
- **Test and CI governance.** One suite changes classification from
  source-text scanner to behavioural, declared in a new triage record so the
  repository's scanner-wiring control resolves it from the latest record
  rather than from the historical draw.

## Client Applicability

- All clients: no runtime change reaches any client.
- Specific clients: none.
- Internal only: yes — CI and test governance.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/ask/__tests__/source-contract360-synthesis-context.test.ts`
  — the byte-scanning case deleted; four behavioural cases over the real
  `askIntelligence`, with retrieval and the audited model client mocked at
  their own boundaries.
- `.github/workflows/intelligence-library-suites.yml` — the suite named in the
  reachable Intelligence library step, in the same change as the rewrite. Named
  individually because its directory still holds one suite left red on purpose
  behind an owner decision.
- `docs/architecture/t495-source-contract360-synthesis-context-triage.json` —
  the triage record declaring the rewrite, its mutations and its residuals.
- `docs/architecture/test-ci-coverage-census.json` — refreshed with the repo's
  own writer. It also absorbs one unrelated file of drift that was already on
  the base (see Known Gaps).

## QA / Validation

- Suite: 1 of 1 passing on the base (the scanner); 4 of 4 passing after.
- `src/lib/intelligence/ask/__tests__`, from a separate clean worktree at the
  base: 1 failed suite of 24, 1 failed test of 178 before; 1 of 24, 1 of 181
  after. The one failure is the same deliberately red suite on both sides.
- The wired CI step, run locally with its exact arguments: 23 suites / 157
  tests / 0 failing before, 24 / 161 / 0 after.
- `src/__tests__/behaviors`: 154 suites / 1671 tests / 0 failing on both sides.
- Scanner-wiring control: with the workflow step added and the triage record
  absent, `t770-scanner-wiring-refusal` fails and names this suite; with the
  record present it passes.
- Five mutations against `src/lib/intelligence/ask/index.ts`, each confirmed to
  have changed the file first: all five caught by the new suite. The deleted
  scanner, run against the same five, caught two and missed three.
- `tsc --noEmit` exit 0; eslint clean; `audit:test-ci-coverage:check`,
  `audit:triage-record-reconciliation`, `test:integration:ci-visibility` and
  `audit:named-suite-requiredness` all exit 0.

## Rollout Plan

Merge through the normal PR path. The suite runs in the Intelligence library
workflow on the next pull request that touches its paths.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on
  merge as usual; nothing here changes what it builds.
- Shared runtime mutators: none. No `az` command, Container App, revision,
  traffic weight, flag or environment variable is touched.
- Approved image digest: not applicable — no runtime image change.
- ACA runtime invariant: unchanged by this release; it is read after merge and
  reported with the deploy, not claimed here.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing reaches a product surface.

## Rollback Plan

Revert the squash commit. That restores the byte-scanning case and removes the
workflow line; no data, schema or runtime state is involved.

## Audit Evidence

- Triage record: `docs/architecture/t495-source-contract360-synthesis-context-triage.json`
  (mutation table, including what the deleted scanner missed).
- Backlog item: `T-495`, claimable half, suite 4 of 11.

## Known Gaps

- `src/lib/intelligence/ask/__tests__` still cannot be wired as a directory:
  `ask-guardrails.test.ts` is red on purpose behind an owner decision.
- The committed coverage census on the base was one test file behind the tree.
  Its `--check` reports count drift without failing, by design. The refresh
  here includes that unrelated +1 as well as this change's own movement.
- The model-input cleaner rewrites internal contract ids before any model call,
  so the suite anchors on the vendor name. That cleaner is a separate control
  and is neither changed nor asserted here.
- Seven suites remain in T-495's claimable half; the gated rows are untouched.
