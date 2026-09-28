# 2026-09-28-t495-answer-length-depth — Rewrite one source-text scanner suite as behaviour, and wire it

## Release ID

`2026-09-28-t495-answer-length-depth`

## Status

`candidate`

## Plain-English Summary

One test suite checked the answer-length policy of the Intelligence answer path
partly by reading the synthesizer's source code as text: it cut the file at a
known phrase and looked for words after it, and grepped the file for a phrase
that must not appear. It passed. It would also have passed if the streaming
length instruction had never been sent to the model at all, or if a stale
length target had been assembled at run time and sent — both were tried, and it
stayed green each time.

Those three text cases are deleted, not repaired with tighter patterns. Five
cases replace them that run the real synthesizer down both of its paths — the
live streaming chat path and the ordinary rich-text path — and read exactly what
was handed to the model: the streaming path carries the deep-dive allowance
(roughly 400 words for a comparison, plan or portfolio review), every stated
90-160 word target the model reads also carries that allowance, and no stale
"200-word target" is sent. The two cases that check the exported policy text
were already sound and are kept unchanged.

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

- `src/lib/intelligence/ask/__tests__/answer-length-depth.test.ts` — three
  byte-scanning cases deleted; five behavioural cases over the real
  `synthesizeStream`, with only the audited model client mocked. The two
  exported-constant cases are kept byte-for-byte.
- `.github/workflows/intelligence-library-suites.yml` — the suite named in the
  reachable Intelligence library step, in the same change as the rewrite. Named
  individually because its directory still holds one suite left red on purpose
  behind an owner decision.
- `docs/architecture/t495-answer-length-depth-triage.json` — the triage record
  declaring the rewrite, its mutations and its residuals.
- `docs/architecture/test-ci-coverage-census.json` — refreshed with the repo's
  own writer. It also absorbs one unrelated file of drift that was already on
  the base (see Known Gaps).

## QA / Validation

- Suite: 5 of 5 passing on the base (three of them scanners); 7 of 7 passing
  after.
- The wired CI step, run locally with its exact arguments from a separate clean
  worktree at the base: 24 suites / 161 tests / 0 failing before, 25 / 168 / 0
  after.
- `src/__tests__/behaviors`: 154 suites / 1671 tests / 0 failing on both sides.
- Scanner-wiring control: with the workflow step added and the triage record
  absent, `t770-scanner-wiring-refusal` fails 2 of 7 and names this suite; with
  the record present it passes 7 of 7.
- Five mutations against `src/lib/intelligence/ask/synthesizer.ts`, each
  confirmed by `git diff --numstat` to have changed the file first: all five
  caught by the new suite. The deleted scanner, run against the same five,
  caught three and missed two.
- `tsc --noEmit` exit 0; `node scripts/release-check.mjs` exit 0.

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

Revert the squash commit. That restores the byte-scanning cases and removes the
workflow line; no data, schema or runtime state is involved.

## Audit Evidence

- Triage record: `docs/architecture/t495-answer-length-depth-triage.json`
  (mutation table, including what the deleted scanner missed).
- Backlog item: `T-495`, claimable half, suite 5 of 11.

## Known Gaps

- `src/lib/intelligence/ask/__tests__` still cannot be wired as a directory:
  `ask-guardrails.test.ts` is red on purpose behind an owner decision.
- The committed coverage census on the base was one test file behind the tree.
  Its `--check` reports count drift without failing, by design. The refresh
  here includes that unrelated +1 as well as this change's own movement.
- Observed and not changed here: the shape contract's "Pyramid Brief" paragraph
  reaches the model on both paths and permits "Answer", "Proof" and "Move" as
  labels, while the universal answer contract in the same system input forbids
  printing them as headers. That is a prompt-content decision, recorded in the
  triage record and filed to the backlog; this suite does not assert either
  side of it.
- Six suites remain in T-495's claimable half; the gated rows are untouched.
