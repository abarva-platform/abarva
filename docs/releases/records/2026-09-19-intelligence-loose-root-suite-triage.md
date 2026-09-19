# 2026-09-19-intelligence-loose-root-suite-triage — Triage the two swept-in Intelligence root suites

## Release ID

`2026-09-19-intelligence-loose-root-suite-triage`

## Status

`candidate`

## Plain-English Summary

When the Intelligence integration directory was wired into CI, the workflow command's path
argument also picked up two test files sitting one level above it, because Jest reads that
argument as a pattern rather than as a folder name. Both were failing, so both were switched off
by name and left untriaged. This change triages them and switches them back on.

The first was a stale contract twice over. It asserted a rule about the pattern catalogue that
was true when the catalogue held 17 entries and stopped being true when it grew to 3,569 by
merging three further sets of source material — two of which use the same field to mean
something different. The rule is now asserted on the set where it means what it says, and the
disagreement between the other sets is asserted explicitly rather than left to fail silently.

The second was asserting that a chat surface still gets a templated bullet layout, which a
deliberate earlier fix had already stopped doing because it was mangling real answers. That
assertion could only have been satisfied by undoing that fix, so it has been replaced with a
two-sided check: the advisory surfaces must not get the template, and the form surface that
should get it still does.

The same file also caught something real, which is **not** repaired here: an advisor answer that
is comfortably within the length budget still gets taken apart and reduced to an opening line
plus a single bullet, because the code that decides "this answer is too long" counts every line
break as a new paragraph. Roughly three quarters of the sample answer is discarded, and the
opening line it chooses is the closing question. Changing that is a product decision about how
agent answers are rendered, so it is filed as a backlog item and pinned by a self-clearing marker
that will fail the day the behaviour changes — rather than by switching the file off again.

No product code changed.

## Layer Impact

- `global-control-lane`: test and CI tooling only. Two integration suites now execute on every PR
  that runs the Integration suites workflow, and the exclusion list that held them gained a
  validator. No product code, route, component, prompt, schema, migration or data-plane path
  changes.

## Client Applicability

- All clients: No behaviour change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/__tests__/integration/intelligence-pattern-manifest.test.ts` — replaced one assertion that
  is false of the current catalogue with three that are true and load-bearing.
- `src/__tests__/integration/intelligence-chat-shape.test.ts` — replaced a reverted-fix assertion
  with a two-sided adjacent-surface guard; isolated the live-path failure into an `it.failing`
  marker naming the owning backlog item.
- `scripts/quality/intelligence-integration-quarantine.json` — both entries cleared from
  `alsoIgnored`; the list's contract and a ceiling recorded.
- `scripts/quality/check-intelligence-integration-quarantine.mjs` — `alsoIgnored` is now
  validated at all. Before this it was read by the argument generator and by nothing else: no
  shape, no stated reason, no owner, and no check that the file it named still existed.
- `scripts/quality/intelligence-integration-ignore-args.mjs` — reads the entry's `path`.
- `.github/workflows/integration-suites.yml` — both files are named in the Intelligence step's
  command. Being selected by a path pattern is not the same as being registered: the CI-visibility
  gate matches by ancestor directory, so without these two tokens the files would run while the
  gate reported them as owned by nothing.
- `src/__tests__/behaviors/integration-directory-ci-coverage.test.ts` — the enumeration for this
  directory is now empty, because nothing is excluded.

## QA / Validation

Baseline and after, over the same scope, by execution:

- `intelligence-pattern-manifest.test.ts`: **1 failed / 4 passed → 0 failed / 8 passed**.
- `intelligence-chat-shape.test.ts`: **2 failed / 6 passed → 0 failed / 10 passed**.
- Wired workflow command (`npx jest src/__tests__/integration/intelligence … $(node
  scripts/quality/intelligence-integration-ignore-args.mjs)`): **8 suites / 131 tests → 10 suites
  / 149 tests**, all passing.
- `node scripts/quality/check-intelligence-integration-quarantine.mjs` — exit 0.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — judged by exit code.
- `npx eslint` on the changed files — exit 0.
- `npm run test:behaviors` — **37 suites / 372 tests, exit 0**. This suite is what caught the
  gap: clearing the exclusions without naming the files in the workflow left them selected by the
  pattern and invisible to the gate, and the enumeration case refused exactly that state. It was
  found by running the control, not by reading it.
- `npm run test:nav` — 26 tests, exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — exit 0.

**Nine mutations, nine caught.** Three on the catalogue data (drift one entry's count in the set
where the rule holds; give one entry an unclassified source; make the disagreement disappear
entirely). Three on product code (re-add the advisory surface to the compaction gate; remove the
form surfaces from it; make the line-counting code count paragraphs — which makes the marker fail,
proving it clears itself rather than hiding the finding). Three on the validator (a bare string
entry, the shape that existed before; an entry naming a file that is gone; a list over its
ceiling).

## Rollout Plan

Merge to main through the repo-owned PR flow. No runtime rollout: nothing in the web image
changes.

## Deployment Authority

- Repo-owned deploy workflow: Normal app rollout only; no runtime behaviour changes.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not affected.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: No — no product behaviour, route, component, prompt, schema or
  data-plane path changes.

## Rollback Plan

Revert the PR. The two suites return to the exclusion list and the validator reverts with it.
No migration, data or runtime rollback.

## Audit Evidence

- PR and its CI run, including the Integration suites job log showing the two suites executing on
  a real runner rather than being inferred from the workflow file.
- The quarantine checker's step output, which reports the excluded counts and the ceiling.

## Known Gaps

- The rendering finding described above is recorded and pinned, not fixed. It affects every
  surface whose answers render through the shared agent stream, not only the one this suite
  covers, and the fix is a product decision.
- The catalogue's generator no longer exists in the repository (`intel:patterns:generate` points
  at a deleted file, already recorded as an inherited missing target), so the catalogue cannot
  currently be regenerated. That is unchanged by this PR and is not what made the assertion fail.
