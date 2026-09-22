# 2026-09-22-named-suite-requiredness — A named test suite must sit in a job that can block a merge

## Release ID

`2026-09-22-named-suite-requiredness`

## Status

`candidate`

## Plain-English Summary

Some of our automated test checks were named individually in the CI log, and some ran
anonymously inside a sweep of a whole folder. That difference mattered more than it looks.
Three test suites were named by exact path in two CI jobs that are **not** required to pass
before a change can merge, while the job that **is** required already ran all three inside a
folder sweep, where they had no name to point at.

Nothing was unprotected: every one of those suites could block a merge, through the required
job. The problem was one of evidence. When someone writes "CI proves this control ran" and
links the named line, they are linking the run that cannot block anything, because that is
the line the log offers first. A true sentence about a real run gets read as proof of
something it does not establish.

This release settles the rule once and makes the repository enforce it: **a CI step may name
a test suite individually only inside a job that is a required check, whenever a required job
already runs that suite.** Three named steps moved into the required job, where the name and
the gate are the same run. A fourth instance that no backlog item had found — a Source
analytics suite named in a non-required smoke job while the required catalog job already swept
its directory — was removed, because that job runs browser harnesses and this suite needs no
browser.

No product behaviour changes. No client sees anything different. This is a truthfulness-of-
proof change to our own build pipeline.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only build and release-control capability. It
ships no product behaviour, so it is not `global-control-lane` despite touching files every
pull request runs.

- **Layer 4 — Products:** none. No product surface, route, read model, prompt or dataset is
  touched. No tenant data is read or written.
- **Layer 3 — Canonical model:** none.
- **Layers 1–2 — Intake and adapters:** none.
- **Build and release control (not a data layer):** the required `Behavior coverage floor` job
  gains four steps, two non-required jobs lose named steps, and a new control runs on every
  pull request.

## Client Applicability

- All clients: no change.
- Specific clients: none.
- Internal only: yes — CI configuration, one control script, one behavioral suite, two docs.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

Repaired instances:

- `.github/workflows/unit-suites.yml` — removed the named steps for
  `src/__tests__/behaviors/unit-directory-ci-coverage.test.ts` and
  `src/__tests__/behaviors/route-export-reachability.test.ts`; each departure carries a comment
  naming the rule and the new home.
- `.github/workflows/integration-suites.yml` — removed the named step for
  `src/__tests__/behaviors/integration-directory-ci-coverage.test.ts`, same treatment.
- `.github/workflows/coverage-threshold.yml` — the required `Behavior coverage floor` job now
  names all three, plus the new control.
- `.github/workflows/source-layout-smoke.yml` — removed the `qa:source-new-event-journey-smoke`
  step. The required `AI surface control catalog` job already sweeps
  `src/components/source/canvas/analytics` with the same `--runInBand`. The npm script stays
  for local use.

New rule and its enforcement:

- `docs/ci/README-suite-wiring.md` — states the rule, why it is about requiredness rather than
  duplication, and what it deliberately does **not** forbid.
- `docs/ci/required-status-checks.json` — new. Mirrors the `main` ruleset's required contexts,
  and declares the one directory sweep a required job performs inside a script rather than in
  YAML.
- `scripts/quality/check-named-suite-requiredness.mjs` — new control.
- `package.json` — `audit:named-suite-requiredness`.
- `docs/architecture/ci-gate-registry.json` — registers it `pr-gate`; it is invoked by the
  required floor job, which is what `pr-gate` asserts.
- `src/__tests__/behaviors/named-suite-requiredness.test.ts` — new behavioral suite, 7 cases.

## QA / Validation

Baseline on the same scope, before any change, on `origin/main` `613adced9`:

- `npx jest src/__tests__/behaviors --no-coverage --ci` → **101 suites passed, 844 tests
  passed, exit 0.**

Red first, on unmodified product/CI files — the control run against the real
`.github/workflows` before any repair:

- `node scripts/quality/check-named-suite-requiredness.mjs` → **exit 1, 4 violations.** Three
  are the instances the backlog item named; the fourth,
  `SourceAnalyticsCanvas.newEventJourneySmoke.test.tsx`, no item had found. This is the detector
  proved on real known positives, not on a fixture written to satisfy it.
- `npx jest --runTestsByPath src/__tests__/behaviors/named-suite-requiredness.test.ts` →
  **1 failed, 6 passed of 7**, the failure being the case that runs the control over the real
  repository.

Green after the repair:

- `npm run audit:named-suite-requiredness` → exit 0, "18 directories swept by a required job".
- `npx jest --runTestsByPath src/__tests__/behaviors/named-suite-requiredness.test.ts` →
  **7 passed of 7.**

Mutation-proved. Each mutation was applied to the real script or the real workflow, the suite
re-run, and the mutation reverted:

| mutation | cases failing |
|---|---|
| put one named step back in the non-required job | 1 of 7 |
| stop expanding `npm run` wrappers to the jest command they issue | 1 of 7 |
| drop the declared indirect sweep entirely | 3 of 7 |
| stop verifying that `provenBy` still passes the directory to jest | 1 of 7 |
| stop checking that a mirrored required context names a real job | 1 of 7 |
| treat every job as required | 2 of 7 |

Suite scope after:

- `npx jest src/__tests__/behaviors --no-coverage --ci` → see the PR body for the executed
  numbers; the directory gains one suite and seven cases and nothing else changes.
- `npx jest src/components/source/canvas/analytics --runInBand --no-coverage --ci` → the exact
  command the required catalog job issues, run to prove the removed smoke step took nothing with it.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`, judged by exit code.
- `node scripts/audit/ci-gate-registry-check.mjs` and
  `node scripts/audit/ci-gate-registry-order-check.mjs` → both pass, 223 entries.
- `node scripts/release-check.mjs --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. The change is CI configuration, one script, one suite and two docs; it takes
effect on the next pull request that runs those workflows. Nothing needs to reach a runtime for
it to be in force.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on merge as usual.
- Shared runtime mutators: none. No `az` command, image, env var, flag, scale or secret is
  touched by this change.
- Approved image digest: not applicable — no runtime image content changes. The merge triggers
  the ordinary main deploy; its digest invariant is proven in the pulse entry, not claimed here.
- ACA runtime invariant: unchanged by this release; verified after merge as routine.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** No product surface, route, prompt, read model or
  tenant-visible string is touched, so there is nothing a signed-in session could observe.

## Known Gaps

- **The mirror of the ruleset can still go stale in one direction.** A context **added** to the
  `main` ruleset and never written into `docs/ci/required-status-checks.json` is invisible to
  the control: a named step inside that newly-required job would be reported as a violation it
  is not. Requiredness lives in GitHub repository settings and nothing in the repository can
  derive it, so this is closed by discipline — update the mirror in the same pull request that
  changes the ruleset — not by a check. The two directions that **can** be checked are: a
  mirrored context that names no job in `.github/workflows` fails, and a declared indirect
  sweep fails unless the script performing it still passes the directory to jest.
- **The control reads jest arguments one and a half hops, not arbitrarily deep.** It expands
  `npm run <script>` to the script body, and it trusts a declared sweep only when the named
  script proves it. A workflow that reached jest through a third layer of indirection would be
  unread, and the control would say nothing rather than guess.
- **`qa:source-new-event-journey-smoke` now runs in no workflow.** The suite it names is swept
  by the required catalog job, so nothing is unrun, but the npm script itself is only a local
  convenience. It is a `qa:` script, so the CI gate registry does not cover it; if that
  registry is ever widened to `qa:` scripts, this one needs a classification.
- **This release proves the rule holds today; it does not backfill the closure notes that
  quoted a non-required run as CI proof.** Those notes remain as written in their own records.

## Rollback Plan

Revert the squash commit. The four workflow files return to their prior steps, the control and
its suite disappear, and no state of any kind needs unwinding — nothing was migrated, seeded or
deployed. A partial rollback is also safe: removing the control's step from
`coverage-threshold.yml` disables enforcement while leaving the repaired steps where they are.

## Audit Evidence

- PR URL and CI run: recorded in the pulse entry for backlog item T-595.
- The red-first control output naming four real violations, quoted in the PR body.
- The mutation table above, each row reproducible by the described edit.
- `docs/ci/README-suite-wiring.md` for the rule as the repository now states it, including the
  residual it does not close: a context added to the `main` ruleset and never mirrored is
  invisible to the control.
