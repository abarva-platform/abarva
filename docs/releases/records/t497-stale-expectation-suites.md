# 2026-09-27-t497-stale-expectation-suites — Repair four never-passing library suites and wire them into CI

## Release ID

`2026-09-27-t497-stale-expectation-suites`

## Status

`candidate`

## Plain-English Summary

Four unit suites under `src/lib/intelligence` disagreed with the modules they test. None of them was
run by any workflow, so nothing reported it. Three of the four had never passed in their entire
history: the suite and its subject arrive in the same commit already disagreeing, so there was no
moment of drift to catch — the pair shipped broken.

In every case the product code was right and the expectation was stale, and this change moves the
expectation. Nothing was deleted to reach green, and no assertion was loosened.

What each one was:

- Two suites expected a broad industry band where the canonicaliser has always returned a narrower,
  equally canonical one. Both route through the same alias map, and that map, both suites, and the
  canonical enum arrive in one commit.
- One suite pinned tenant display names that a governance policy retired three months ago and now
  actively rewrites away. This one matters beyond tidiness: had the assertion passed, it would have
  been asserting that the surface emits a retired name — pinning the violation rather than the
  control. The expectation now reads the name from the registry constant the policy is defined in, so
  a future rename cannot leave it behind again, and a new negative case fails if the surface ever
  regresses to the old literal.
- One suite mocked a database seam its subject does not call. The subject uses the Azure/Postgres
  data-plane adapter, as `AGENTS.md` requires; the mock named the legacy client. Because the mock sat
  off the call path, the real client ran and asked for a database URL that unit CI does not set.
- One case in a fifth suite asserted two byte patterns against a module that no longer holds the
  control they describe. The control was relocated, not lost, and is stronger than the byte scan
  could see: the blocking path it gated now has no caller anywhere in `src`. The two dead byte
  assertions are replaced by one that *executes* the guard, since it is a pure function of the
  environment.

The same change wires these suites into CI, which is the half that keeps the repair from decaying.

## Layer Impact

Release lane: `internal-admin` — AbarVa-only test and CI tooling. No client-facing surface, no
data-plane object, and no product behaviour changes, so neither `global-control-lane` nor
`client-data-lane` applies; the change is on by default, so it is not `experimental`.

- **Tests and one workflow only.** Five test files and one workflow step. No product module, route,
  schema, adapter, prompt, or migration is modified. Product files were edited only temporarily, to
  mutation-check each repaired assertion, and every edit was reverted.
- No layer of the data operating model is touched.

## Client Applicability

- All clients: no behaviour change.
- Specific clients: none.
- Internal only: yes — test suites and one CI workflow.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/canonical/normalizers.test.ts` — two industry-band expectations corrected; one
  case added covering the sibling band the alias map resolves separately, which no case had held.
- `src/lib/intelligence/canonical/build-canonical-pattern.test.ts` — two expectations with the same
  root cause.
- `src/lib/intelligence/ask/__tests__/tenant-identity-pin.test.ts` — expected display name now read
  from the registry authority; four negative cases added pinning the retired literals as forbidden.
- `src/lib/intelligence/synthesis/__tests__/violationsSupabaseBackend.test.ts` — mock moved to the
  data-plane seam the subject actually calls.
- `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts` — one case's two dead byte assertions
  replaced by an executed guard check plus the current trace-marker name.
- `.github/workflows/intelligence-library-suites.yml` — wires two directories and one named file.
- `docs/architecture/test-ci-coverage-census.json` — regenerated; the gate requires it to match.

## QA / Validation

Baselines measured on a clean worktree at `origin/main` `83b3a384da` before any edit, over the same
scope after. Per suite, failing before → failing after:

| suite | before | after |
|---|---|---|
| `normalizers.test.ts` | 2 failed / 14 passed | 0 failed / 15 passed |
| `build-canonical-pattern.test.ts` | 2 failed / 5 passed | 0 failed / 7 passed |
| `tenant-identity-pin.test.ts` | 6 failed / 23 passed | 0 failed / 33 passed |
| `violationsSupabaseBackend.test.ts` | 3 failed / 1 passed | 0 failed / 4 passed |
| `ask-guardrails.test.ts` | 2 failed / 24 passed | 1 failed / 25 passed |

The five together: **15 failing before, 1 after.** The one remaining failure is the token-budget case
that is explicitly gated on an owner decision and was deliberately not touched.

Whole-directory, same scope:

| directory | before | after |
|---|---|---|
| `src/lib/intelligence/canonical` | 4 failed / 40 passed | 0 failed / 45 passed |
| `src/lib/intelligence/synthesis/__tests__` | 3 failed / 38 passed | 0 failed / 41 passed |
| `src/lib/intelligence/ask/__tests__` | 9 failed / 160 passed | 2 failed / 171 passed |

**Mutation checks — 14 mutations, 14 caught.** Because the repair here is to expectations rather than
to code, each mutation breaks the *product* and confirms the repaired assertion still fails. Three
are worth naming:

- Making the module leave the mocked data-plane seam turns 3 of 4 cases red — which is what proves
  the new mock is on the real call path, the exact property the old one lacked.
- Regressing the registry's demo-safe name back to the retired literal is caught by **one** case: the
  new negative control. The registry-derived positive assertion alone would have accepted it. That
  mutation is the reason the negative half exists.
- Reintroducing the original hardcoded-tenant defect in the identity pin turns 7 cases red, so the
  cross-tenant fence is demonstrably still asserted after the change.

Other gates:

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, run with
  `tsconfig.tsbuildinfo` removed first.
- `npx eslint` over the five changed test files — exit 0.
- `node scripts/quality/check-intelligence-library-quarantine.mjs` — passes; the quarantine list is
  unchanged and still names 5 suites. No suite was added to it.
- The wired command was run verbatim under `bash` so the `$(…)` ignore arguments word-split as they
  will in CI: **30 suites, 203 tests, all passing** — up from 18 suites / 84 tests before.
- `node scripts/quality/test-ci-coverage-census.mjs --check` — no drift, shape matches.

Coverage census delta, which measures the wiring rather than asserting it: covered test files
2170 → 2182, uncovered 356 → 344, fully covered directories 310 → 312, partially covered 24 → **25**.
That last number is the point: the partially covered directory is the one wired by named file, so the
gap stays visible in the census ranking instead of being silenced.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing under `src/` that ships to a runtime image changed, and
no flag, environment variable, or worker job is touched. The new CI coverage takes effect on the
merge commit.

## Deployment Authority

Not applicable to shared runtime. This change cannot affect Azure Container Apps, runtime images,
flags, environment variables, worker jobs, traffic, or DNS.

- Repo-owned deploy workflow: unchanged.
- Shared runtime mutators: none.
- Approved image digest: not applicable — no runtime image change.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** No product surface changes. This is stated as a conclusion,
  not as a proof that was skipped.

## Rollback Plan

Revert the squash commit. There is no migration, no data change, and no runtime state, so revert is
complete and immediate. Reverting restores four never-passing suites to an unrun state.

## Audit Evidence

- The pull request for this record, and its CI run.
- The `Intelligence library suites` job on this PR, which is where the newly wired paths first
  execute — that job passing on the commit that adds them is the wiring proof.
- The census diff in `docs/architecture/test-ci-coverage-census.json`.
- Per-suite and per-directory before/after numbers, and the 14 mutation results, in the QA section
  above.

## Known Gaps

- **One case is deliberately still failing.** The token-budget expectation in `ask-guardrails.test.ts`
  is gated on an owner decision about whether a previously removed ceiling still holds. It is outside
  this change and untouched.
- **One directory is wired by named file, not as a directory.** `src/lib/intelligence/ask/__tests__`
  holds two red suites that are not this item's to fix — the gated case above, and a source-text
  scanner owned by a separate open item. Wiring the whole directory is owed once both land, and the
  census reports it as partial until then.
- **Three of the four repairs cite no commit that moved anything**, because nothing did: suite and
  subject arrive in the same commit already disagreeing. The item's own acceptance asked for the
  commit that moved the behaviour, and for these the honest answer is that there was never a moment
  when the pair agreed.
- Pre-existing fixture prose in one of the touched suites carries long-form fixture tenant names in
  test data unrelated to this change. Not modified here; surfaced for a separate hygiene pass.
