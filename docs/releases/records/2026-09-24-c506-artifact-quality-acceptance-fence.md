# 2026-09-24-c506-artifact-quality-acceptance-fence — Artifact-quality answers cite accepted versions only

## Release ID

`2026-09-24-c506-artifact-quality-acceptance-fence`

## Status

`candidate`

## Plain-English Summary

When a user asks the Source assistant about file quality and readiness for a sourcing event, the
answer attaches citations to the files it is speaking from. Until now it attached a citation to
any file registered against the event, whether or not anyone had ever accepted that file — and it
did so under a stated caveat that citations attach only to accepted records. A file that had been
superseded by a newer accepted version was cited exactly like the current one, and so was a file
whose content had been measured as having drifted away from what was accepted.

This change routes that one answer mode through the acceptance-bound event-context fence that
already existed and was, until now, only measured rather than obeyed. A file is quotable when an
acceptance record names the version being shown as the authoritative one and its content is
recorded as current. Anything else is still counted in the deterministic quality and lifecycle
view — the table, the chart and the totals are unchanged — but it is no longer attributed. When
files are excluded for that reason the answer says so, in plain language, and tells the reader
that accepting the current version is what makes a file quotable again.

Only the artifact-quality mode is wired here. The other event answer modes still build their
evidence the previous way, by design: one mode per change, so each one can be judged on its own.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior for all clients, not feature-gated.

- **Layer 4 — Products (Source).** The artifact-quality answer's evidence path. The deterministic
  lifecycle projection it renders is untouched; only which files may be cited changes.
- **Layer 3 — Canonical model.** No schema, migration or write. The acceptance table is read
  through its existing repository function.

## Client Applicability

- All clients: yes — every tenant asking an artifact-quality question on a Source event.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is fail-closed on the evidence path and leaves the deterministic
  answer intact, so a flag would only make the ungoverned path the default.

## Changes Included

- `src/lib/source/ava/artifact-quality-governed-answer.ts` — reads the latest acceptance per file
  through `getLatestArtifactAcceptancesByArtifactIds`, builds the `acceptedArtifactVersions` map
  from `authoritative_version_id`, hands every registered file to
  `buildGovernedEventContextBundle` with the authenticated identity declared, and derives
  citations from what that fence admits. Adds a client-readable gap when this tenant's files are
  excluded.
- `src/lib/source/ava/__tests__/artifact-quality-governed-answer.test.ts` — the cases below.

No other mode, route or module changed. `buildGovernedEventContextBundle` itself is unmodified.

## QA / Validation

Baseline measured on a clean `origin/main` worktree over the same scope, not by stashing.

- `npx jest --runTestsByPath src/lib/source/ava/__tests__/*.test.ts`
  — **before: 26 suites, 376 tests, 0 failing. after: 26 suites, 383 tests, 0 failing.** (+7 tests.)
- Red first, with the two pure helpers present but the mode unwired: **3 failed, 11 passed** —
  a file with no acceptance, a superseded version, and a drifted file were each cited.
  After wiring: **14 passed, 0 failed.**
- Mutation proofs — each one applied alone, the suite run, then reverted and re-run green:
  - build the accepted-version map from the file's own id instead of `authoritative_version_id`
    → **2 tests fail** (superseded case, and the map helper's own case).
  - treat every registered file as accepted → **1 test fails** (no-acceptance case).
  - report content drift as `current` regardless of the acceptance record → **1 test fails**.
  - suppress the exclusion gap → **2 tests fail**.
  - look acceptances up for tenant-filtered files only, rather than all registered files
    → **1 test fails**.
  - One further mutation — pre-filtering candidates by tenant before the fence — is **not** killed
    by the suite, and is recorded here as what it is: it is output-equivalent. Both paths drop an
    opposite-tenant file; only the mechanism differs, and nothing the answer exposes can tell them
    apart. The fence's tenant and event rules are proved at the fence boundary instead, by a test
    that hands it an opposite-tenant and a cross-event candidate and asserts the refusal codes.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, judged by
  exit code.
- `npx eslint` on both changed files — exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see the PR.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the image. No
migration, no flag, no worker job, no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded on the PR after the deploy run completes.
- ACA runtime invariant: to be proven after deploy — template image digest equal to the
  100%-traffic revision's digest.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes, and it is owed, not claimed.** The item requires a
  signed-in check on the deployed SHA for each wired mode. An unattended run cannot perform one,
  so this record does not assert it.

## Rollback Plan

Revert the PR and redeploy through the same workflow. The change is read-only and additive to one
module, so a revert restores the previous citation behavior with no data consequence.

## Audit Evidence

- PR and CI run: on the PR.
- Test output before and after, including each mutation and its revert, quoted above.
- The fence module and its own suite, unchanged, as the contract this mode now obeys.

## Known Gaps

- **Signed-in acceptance for this mode is owed.** Nothing here may be read as live-proven.
- Nine other event answer modes still build evidence without the fence. Each is a separate change.
- A tenant with no acceptance records will see no citations on this answer and will see the
  exclusion gap instead. That is the intended fail-closed direction, and it is the behavior the
  signed-in check must judge: the deterministic answer must still read as useful without them.
- A registry file asserts a tenant key and no tenant id, so the fence's tenancy rule is decided
  here by the key. The id is carried through unchanged from the authenticated identity and decides
  nothing for this mode.
