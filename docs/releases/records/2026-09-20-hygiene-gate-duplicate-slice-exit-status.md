# 2026-09-20-hygiene-gate-duplicate-slice-exit-status — Duplicate-slice check judges the exit status

## Release ID

`2026-09-20-hygiene-gate-duplicate-slice-exit-status`

## Status

`candidate`

## Plain-English Summary

The mandatory hygiene gate runs on every pull request. One of its checks looks for
duplicate ids in the build-slice manifest. It asked a small program to find
duplicates, then decided whether the check had passed by searching that program's
own output for the two letters `ok`.

That works until a duplicated id happens to contain those letters. A manifest
holding the same id `booking-flow` twice was detected correctly by the program,
which printed its finding and signalled failure — and the gate printed
`[PASS] No duplicate slice IDs`, because the word "booking" contains "ok".

The check now reads the program's exit status, which no id can spell. The three
neighbouring JSON-validity checks used the same construction; they were measured
first and were correct, and they have been converted to exit status as well so
the file has one reading rule rather than four separate arguments for safety.

No id in the manifest today contains those letters, so nothing was being missed
in practice. A check that is correct only because no subject has yet been named
with the wrong letters is not a check — the same finding as the four repaired
before it.

## Layer Impact

Release lane: `internal-admin`. This is AbarVa-only engineering tooling — a
pull-request gate and its test suite — and it ships to no client surface.

None of the four product layers. This is platform tooling: one shell script under
`scripts/integration/` and one behavioural test suite. No tenant data, canonical
model, adapter, product surface, prompt, schema, route or API is touched.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — a pull-request gate and its test suite
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/integration/hygiene_gate.sh` — the duplicate-slice check and the three
  JSON-validity checks judge process exit status instead of piping output into
  `grep -q ok`. The duplicate-slice program reports on stderr so its diagnosis is
  still captured for the failure line.
- `src/__tests__/behaviors/hygiene-gate-exit-codes.test.ts` — eight cases added,
  and the scratch-repository harness extended so a case can supply manifest
  content. The cases drive the real script in a scratch git repository; they do
  not read its source text.

## QA / Validation

- Failing test first, identical suite, same file both sides:
  **1 failed / 24 passed of 25 → 0 failed / 25 passed of 25.**
- Scope baseline `npm run test:behaviors`, measured on a pristine worktree at the
  same base SHA rather than assumed: **48 suites / 499 tests, 0 failing → 48 / 507,
  0 failing.**
- **Seven mutations, seven caught, plus a passing control.** Restoring the exact
  defect (judge by `grep -q ok`) fails 1; making the duplicate check unable to
  fail fails 3; making it unable to pass fails 2 — that is the negative control,
  a unique id containing the same letters must still pass; removing
  `process.exit(1)` from the duplicate program fails 2, which is what proves the
  exit status is genuinely the signal; disabling each of the three JSON-validity
  checks fails 1 each. A comment-only control edit stays green at 25/25.
- The real gate was run against this tree: all four repaired checks pass on the
  real manifests, and the gate's own typecheck reports clean.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`,
  `npx eslint`, and `node scripts/release-check.mjs` all judged by exit code.

## Rollout Plan

Merge to main. The gate takes effect on the next pull request that runs it. No
image build, migration, flag or data build is required, and the change cannot
alter product behaviour.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime image changes
- ACA runtime invariant: unaffected; will be confirmed after merge as routine
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: **no.** One shell script and one test suite; no
  route, component, prompt, schema, API or data-plane path is reachable from it

## Rollback Plan

Revert the commit. The gate returns to its previous behaviour, which includes the
defect described above. No migration or data rollback applies.

## Audit Evidence

- The pull request and its CI run, including the hygiene gate job executing the
  repaired script
- The before/after suite counts and the seven-mutation table recorded above
- `docs/build/build-slices.json` is unchanged; the manifest itself was not edited

## Known Gaps

- The warning verdict the gate can now print is still read by no CI job — recorded
  separately as a follow-up, and deliberately not solved here by promoting
  warnings to failures.
- `src/__tests__/integration/ops/hygiene-gate-contract.test.ts` is a source-text
  scanner over this same script and is **red on the base commit of this branch**,
  independently of this change: it forbids the substring `git stash pop`, and the
  script's own warning text advises an operator not to run it. Measured identical
  on a pristine tree at the base SHA and on this branch — 1 failed / 11 passed of
  12 both sides. It is not repaired here because that suite's future is an open
  decision coupled to its directory, and because narrowing a scanner is a
  different change from the one this record describes.
