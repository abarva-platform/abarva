# 2026-09-19-agent-test-suite-triage — Repair five agent-control test suites that could not pass

## Release ID

`2026-09-19-agent-test-suite-triage`

## Status

`candidate`

## Plain-English Summary

Five test files under `src/lib/agent` had been failing for weeks and no build reported it,
because no CI job names that directory. This change repairs all five. No product code changes.

Four of the sixteen failures looked like tenant-isolation failures, which would be serious. They
were not. Each of those cases asserted a hard-coded display label *before* it checked the
isolation property, so when the product moved to its cover labels the first assertion threw and
the isolation check — the only reason those suites exist — stopped running at all for the
affected tenants. The suites were not reporting a leak; they were aborting before they could look
for one. Every expected label is now derived from the tenant registry in code rather than typed
into the test, which is what the repository's own rule requires, so a label change can no longer
take an isolation check offline.

The remaining failures were stale in the ordinary way. One asserted that a prompt-version token
still contains the name of a change from May; that token names the most recent prompt change, so a
June change renamed it and the case became impossible to satisfy — it is replaced by the control
the comment actually describes, which is that the version must move whenever the prompt text
moves. Seven more pinned prompt copy that a July change deliberately replaced, and pinned it by
reading the source file off disk and matching text, an instrument that cannot tell a live
instruction from a comment. Those now run against the exported prompt values themselves.

## Layer Impact

Release lane: `global-control-lane`. The change is shared repository tooling with no client-scoped
data, no internal-admin capability, no public surface and no feature flag.

- **Layer 4 (Products)** — test and control coverage over agent context resolution, admin editorial
  copy, and the Intelligence advisor prompt. No runtime behaviour is changed; no product module is
  modified.

## Client Applicability

- All clients: no behaviour change.
- Specific clients: none.
- Internal only: yes — developer-facing test coverage.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/agent/__tests__/context-bundle-tenant-resolve.test.ts` — expectations derived from
  `CANONICAL_TENANT_KEYS` and `TENANT_KEY_ALIASES`; adds distinctness, cross-tenant and alias
  isolation cases, and pins the unknown-key default guard.
- `src/lib/agent/__tests__/editorial-tenant-aware.test.ts` — tenant list and labels derived from
  code; isolation assertions now execute for every tenant.
- `src/lib/agent/__tests__/admin-editorial-tenant-isolation.test.ts` — repointed from a duplicate of
  the above onto the alias surface, where an unrecognised key would actually mislabel.
- `src/lib/agent/__tests__/system-prompt-guardrails.test.ts` — version-token literal replaced with a
  version-to-prompt-digest pairing that fails when the prompt changes without a version bump.
- `src/lib/agent/voice-doctrine/__tests__/sentinel.test.ts` — the superseded prompt-copy block now
  asserts the surviving posture controls against the exported prompt constants instead of scanning
  a source file.

## QA / Validation

Baseline measured on the exact base commit before any edit, and again after, over the same scope.

- The five suites: **16 failed / 180 passed / 196 total before → 0 failed / 267 passed / 267 total
  after.**
- Directory-wide `npx jest src/lib/agent`: **5 suites / 16 tests failing before → 0 failing after**;
  passing 946 → 1033. No suite in that directory fails either side.
- Mutation checks — eleven applied, each reverted after measurement, every one caught:
  - tenant display-name guard for unrecognised keys removed → 2 cases fail (3 including the
    editorial suites, after those were strengthened).
  - two tenants collapsed onto one identity → 4 cases fail.
  - editorial body hard-coded to one tenant, the original defect these suites were written for →
    36 cases fail.
  - prompt edited without a version bump → 1 case fails, naming the new digest to record.
  - version and prompt bumped together → passes, confirming the gate is not simply always-red.
  - honesty-discipline section label removed → 2 cases fail.
  - no-corpus-refusal prohibition, peer-statistics prohibition, arithmetic guard each removed → 1
    case fails per mutation.
  - evidence-priority list reordered so the corpus outranks tenant evidence → 1 case fails.
  - a prohibition moved from the live prompt into a comment → 1 case fails. This is the mutation the
    previous source-scanning instrument could not have caught, and the reason the instrument changed.
- One mutation initially survived and a second proved to be a bad mutation; both exposed real
  weaknesses in the new cases, which were tightened until the mutations were caught. Details in the
  pull request.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit 0, build-info
  removed first, exit code judged rather than the output grepped.
- `npx eslint` over the five files — 0 errors, 0 warnings.

## Rollout Plan

Merge to main. No runtime rollout: no product module, migration, flag, image or environment value
changes. The repo-owned deploy workflow will build the merge commit as it does for any change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none.
- Approved image digest: not applicable — no runtime change is required by this record.
- ACA runtime invariant: unchanged by this release; the post-merge readback still applies to the
  merge commit.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: no. Nothing a signed-in user can observe changes.

## Rollback Plan

Revert the merge commit. No migration, no data, no runtime state is involved, so the revert is
complete on its own.

## Audit Evidence

- The pull request, its diff and its CI run.
- Before and after test output quoted in the PR body with the commands that produced it.
- The mutation table above, each entry reproducible by applying the named mutation and running the
  suite.

## Known Gaps

- **CI wiring is deliberately not taken here.** None of these five suites runs in any workflow, so
  the repair does not yet protect anything automatically. Three open items — one for this directory,
  one for `src/lib/programs/__tests__` and one for `src/lib/source/__tests__` — ask the same
  question, and answering them separately risks three different answers. The workflow files that
  would carry the wiring are also held by other in-flight work. Recorded as owed, not done.
- **One canonical tenant key resolves to its raw slug at the shell-only tier** in the agent context
  bundle, so an admin surface prints an identifier where a name belongs. It is filed as its own
  item rather than fixed here: which tenant keys are authoritative is an open decision, and the
  repair depends on that answer.
- The context bundle and the client registry disagree on the label for three tenants. Both
  vocabularies are now treated as tenant labels for isolation purposes, which is correct for the
  safety property but does not reconcile them. Recorded, not resolved.
