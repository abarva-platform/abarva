# 2026-10-03-moves-title-identifier-corpus — Count identifier-bearing move titles instead of asserting one example

## Release ID

`2026-10-03-moves-title-identifier-corpus`

## Status

`candidate`

## Plain-English Summary

The Moves board shows each move by name. Some of those names were created by
automated test runs, so they carry a build or run stamp — a date, a time, or a
run number — that means nothing to a client and should never appear on a client
screen. A previous change added one rule to strip that stamp and proved it with
one hand-written example. On the names that actually render, most still carried
a stamp.

This change replaces that single rule with a rule set covering each stamp shape
that appears in the real titles, and replaces the single-example test with a
test that counts: it runs every title in an enumerated corpus through the
cleaner and requires the number still carrying a stamp to be zero. It also
keeps the opposite guarantee — a real title that happens to contain a year, a
date or the word "Evidence" must come through untouched — so the cleaner cannot
pass by being blunt.

One finding is worth stating plainly, because it changes what the defect was.
The earlier rule did not merely miss a shape; it created one. Given a real title
of the form `<tenant> Synthetic Rich Evidence E2E <YYYY>-<MM>-<DD>T<HH>-<MM>`,
its "digits after the token" pattern matched only the four-digit year, so it
removed `E2E <YYYY>` and rendered
`<tenant> Synthetic Rich Evidence-<MM>-<DD>T<HH>-<MM>`. The stamp survived with
the token that identified it as a stamp removed, which means no later pass
looking for that token could ever have cleaned it. A stamp has to be consumed
whole.

## Layer Impact

Release lane: **`global-control-lane`** — shared app behaviour for all clients,
with no feature gate.

- **Layer 4 — Products (Moves).** Presentation only. The client-facing text
  transform `demoSafeClientText` changes; no move, title, record or identifier
  is written, migrated or deleted. The stored title is unchanged — only what is
  rendered from it changes.
- Layers 1–3 (client intake, source adapters, canonical model) are untouched.
  No loader, adapter, projection, schema or dataset is modified.

## Client Applicability

- All clients: yes — the transform runs on every client surface that renders a
  move title. Behaviour changes only for titles containing the harness token
  `E2E`; every other title renders byte-identically, which the suite asserts.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The transform has no flag and this change does not add
  one.

## Changes Included

- `src/lib/client-config.ts` — the single run-identifier rule in
  `DEMO_SAFE_TEXT_REPLACEMENTS` becomes two: one that consumes the token plus a
  whole stamp (ISO build vintage, compact run stamp, or bare run integer —
  longest shape first, which is the part the old rule got wrong), and one that
  consumes the bare token when no stamp follows it.
- `src/__tests__/behaviors/moves-title-identifier-corpus.test.ts` — new. Twelve
  cases over an enumerated corpus, asserting a count rather than an example,
  plus a per-shape necessity table (see QA).
- `.github/workflows/coverage-threshold.yml` — names the new suite as its own
  step inside `Behavior coverage floor`, which is a required check. The
  directory sweep in the same job already runs it; the named step exists so the
  line anyone quotes belongs to the run that can block a merge.

No migration, no route, no script, no dataset.

## QA / Validation

**Re-verification before any code was written.** The item was re-verified on
`main` at `6ef989aced` by executing `demoSafeClientText` on the two raw titles
recoverable on disk, captured from the live board at
`reports/moves-e2e-operating-smoke/20260923T222629Z/raw/live-phase-0-text.txt`
and `.../live-files-evidence-loaded-text.txt`:

| raw title shape | rendered before | rendered after |
|---|---|---|
| `<tenant> Synthetic Rich Evidence E2E <YYYY>-<MM>-<DD>T<HH>-<MM>` | `<tenant> Synthetic Rich Evidence-<MM>-<DD>T<HH>-<MM>` — stamp kept, token eaten | `<tenant> Synthetic Rich Evidence` |
| `Synthetic <tenant> E2E Smoke - <YYYYMMDD>T<HHMMSS>Z` | unchanged — token followed by a word, not a digit | `Synthetic <tenant>` |

The exact strings are in the captures named above and in the suite's corpus;
the shapes are what this record states, per the repository's public-artifact
disclosure rule.

**Red first, measured with the final test against the unfixed cleaner:**
1 failed / 6 passed / 7 total → 12 passed / 12 total after the fix and after the
per-shape table was added. The one red case was the corpus count, which is the
acceptance.

**Mutation — six mutations, six caught, each by a distinctly named case.** Each
mutation was checked for being a real behaviour change before being judged (a
no-op mutation reads exactly like a caught one):

| # | Mutation | Result | Case that failed |
|---|---|---|---|
| 1 | drop the ISO-vintage alternative | caught, 2 failed | corpus count + the Rich Evidence row |
| 2 | drop the compact-stamp alternative | caught, 2 failed | corpus count + the E2E Smoke row |
| 3 | drop the bare-integer alternative | caught, 2 failed | the `Claude E2E 1002` and `E2E 42` rows |
| 4 | drop `Smoke` from the stamped rule | caught, 2 failed | corpus count + the E2E Smoke row |
| 5 | delete the bare-token rule entirely | caught, 2 failed | corpus count + the `E2E Smoke` row |
| 6 | restore the original single rule | caught, 3 failed | corpus count + two rows |

**One escape, found and reported rather than quietly patched.** Mutation 3 at
first *survived*: the corpus count stayed green when the bare-integer
alternative was deleted, because a bare trailing run number is the same shape as
a trailing year, so no count-based detector can separate `… Claude E2E 1002`
from `Revenue Integrity Program 2028` without eating the second. The response
was not to broaden the detector — that would have broken the opposite guarantee
— but to add a per-shape expectation table that proves necessity for each rule
by name. The reason is written into the suite so the next reader does not
re-derive it.

**The detector is independent of the fix.** The test's identifier detector is
written from the observed stamp grammar (a run token, an ISO build vintage, a
compact run stamp, and the truncated-vintage residue the old rule manufactured),
not from the sanitizer's regexes. Sharing expressions would have measured the
fix against itself.

**Baseline comparison, same base, separate clean worktree at `6ef989aced`:**

| scope | clean baseline | this branch |
|---|---|---|
| `src/__tests__/behaviors` (the gated directory) | 185 suites / 1912 tests / 0 failing | 186 / 1924 / 0 failing |
| `src/components/strategic-moves`, `src/components/tenant`, `src/app/api/chat/agent`, `src/app/api/tower/ask` | 34 suites / 351 tests / **1 failing** | 34 / 351 / **1 failing** |
| `client-config-canonical`, `home-demo-safe-response`, `retired-fact-gate` | 3 suites / 27 tests / 0 failing | 3 / 27 / 0 failing |

The twelve added tests are the whole difference in the first scope. **The one
failure in the second scope is a condition of `main`, not of this change** — it
reproduces identically on the clean baseline worktree. It is
`TenantIdentityStrip › renders the canonical tenant name for crawl-visible
identity checks`, which expects a cover name the configuration does not carry.
Filed, not fixed here, because which string is correct is a naming decision.

Other checks: `npm run audit:named-suite-requiredness` OK;
`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exit
**0** with `tsconfig.tsbuildinfo` deleted first and the exit code judged rather
than the output grepped; `npx eslint` exit 0; `npx prettier --check` clean;
`node scripts/release-check.mjs --base origin/main --head HEAD` — see Audit
Evidence.

## Rollout Plan

Merge to `main` through the repo-owned squash path. The repo-owned
`aca-main-deploy` workflow builds the image from the merge SHA and deploys it;
no manual Azure command is run by this change and no runtime template, flag,
env var, scale setting or traffic weight is mutated by hand.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`. No other path is used.
- Shared runtime mutators: none. This change issues no `az` command.
- Approved image digest: produced by the deploy run keyed to the merge SHA; read
  from that run, not assumed.
- ACA runtime invariant: to be proven after merge by comparing the Container App
  template image, the 100%-traffic revision image and the worker job images
  against the approved digest, reading the **newest** deploy run at or after the
  merge SHA, because concurrency can cancel the run keyed to it.
- Worker image invariant: same digest check; no worker job changes here.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes, and it is owed, not claimed.** See Known
  Gaps.

## Rollback Plan

Revert the commit and merge the revert; the deploy workflow redeploys from the
reverted SHA. There is no migration, no data write and no stored state, so
rollback restores the previous rendering exactly. Reverting reinstates the
earlier defect, which is the trade a reviewer should see stated.

## Audit Evidence

- PR URL and its required checks.
- The two on-disk live captures named under QA, which are the provenance of the
  raw titles in the corpus.
- `docs/acceptance/signed-in-wave-acceptance-matrix.md` — the signed-in reading
  that filed this item (5 of 8 names on `44b50dcd3d`) and the independent second
  reading on `e085442776` that reproduced the same count and the same two
  shapes.
- CI job `Behavior coverage floor`, step *Count identifier-bearing move titles
  on the client surface*.
- `node scripts/release-check.mjs --base origin/main --head HEAD`.

## Known Gaps

- **The board itself is the acceptance, and it has not been re-walked.** The
  item's acceptance asks for a signed-in re-walk recording the new count in the
  wave acceptance matrix. An agent must not perform a signed-in acceptance, so
  that half is owed. A green suite is not the proof here; the suite proves the
  cleaner handles the enumerated shapes, not that the live board is clean.
- **The corpus is reachable evidence, not the live table.** Two titles are exact
  strings captured from the live board; the remaining rows instantiate the two
  shapes the signed-in matrix recorded across the tenants whose names the
  cleaner maps, because the live database is not reachable from this lane. The
  shapes are measured; the tenant spread is enumerated, and the suite says so in
  a comment rather than implying a reading it did not take.
- **A third identifier shape is out of scope and filed.** A trailing
  `-canary-<14-digit stamp>` survives the cleaner today and is enshrined as the
  expected output of an existing case in
  `src/lib/__tests__/client-config-canonical.test.ts`. It is not in the observed
  board corpus, so it is filed rather than folded into this change.
- **An uppercase programme code still prints beneath every move name** and was
  deliberately not filed as a leak by the walk that found this one: it may be a
  reference a client uses on purpose. That is a product call, unchanged here.
- The pre-existing `TenantIdentityStrip` failure described under QA is a
  condition of `main` and is filed, not fixed.
