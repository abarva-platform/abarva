# 2026-08-13-wire-tenant-input-quality-gate-to-ci — Run the tenant input quality gate in CI

## Release ID

`2026-08-13-wire-tenant-input-quality-gate-to-ci`

## Status

`candidate`

## Plain-English Summary

`npm run audit:tenant-input-quality` was never invoked by any workflow. It existed as an npm script
and nothing else, so it only ever ran when a person chose to run it by hand. The single reference to
it anywhere in CI is a path string inside a legacy-path allowlist, which does not execute it.

That means the tenant input quality gate has not been gating anything. It also means the column
contract conformance check added earlier today
(`2026-08-12-tenant-input-column-contract-gate`) shipped without teeth: the release record for that
change described it as a CI gate and claimed new drift would fail immediately. That claim was wrong at
the time it was written, and this release makes it true.

The audit now runs as a step in the existing Canonical Tenant Drift workflow, which is already a
required branch-protection context. That workflow also runs on a daily schedule, which matters
specifically for the dated waiver mechanism: a waiver that expires will now start failing on its
expiry date on its own, rather than waiting for somebody to open a pull request that happens to touch
the right paths.

`datasets/tenant-inputs/**` is added to the workflow's path filter so that a change to tenant input
data — the exact thing this audit inspects — actually triggers it.

## Layer Impact

Release lane: `client-data-lane`. The change is a CI wiring fix for a Layer 1 validation script. No
`global-control-lane` behaviour, product surface, data plane, or runtime path is affected.

- **Layer 1 (Client Intake):** the existing quality/depth/column-contract audit now executes on pull
  requests, on merge queue, and on the daily schedule.
- **Layers 2-4:** unaffected.

## Client Applicability

- All clients: no. CI-only change.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/canonical-tenant-drift.yml` — adds a `Verify tenant input quality, depth, and
  column contract` step running `npm run audit:tenant-input-quality`, and adds
  `datasets/tenant-inputs/**` to the pull-request path filter.

No script logic changed. The audit itself is unmodified by this release.

## QA / Validation

| Check | Command | Result |
| --- | --- | --- |
| Audit runs with no network or database | `npm run audit:tenant-input-quality` | passed, 7 active tenants audited |
| Audit exits non-zero on a real defect | waiver removed, then run | exit code `1` |
| Audit exits zero when restored | waiver restored, then run | exit code `0` |
| Workflow structure | structural assertions on the YAML | job name preserved, step present, npm script invoked, datasets path added, schedule intact, no tabs, step indentation consistent |
| Release control | `npm run release:check` | passed |

The exit-code behaviour is the part that matters: a workflow step only gates if the command it runs
fails. Both directions were confirmed against real repository state.

## Rollout Plan

Merge to `main`. The step takes effect on the next pull request that matches the workflow's path
filter, and on the next scheduled run. No runtime rollout.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: not applicable — no runtime image contract change.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: not used.
- Live signed-in proof required: no — no signed-in surface changes.

## Rollback Plan

Revert the squash commit. The workflow returns to its previous two steps and the audit goes back to
being manual-only. Nothing else is affected.

## Audit Evidence

- Workflow file: `.github/workflows/canonical-tenant-drift.yml`, step `Verify tenant input quality,
  depth, and column contract`.
- Report the step produces: `reports/canonical-tenant-inputs/latest/tenant-input-quality-depth.md`.
- The check appears on pull requests under the existing required context
  `Verify canonical tenant allowlist`.

## Known Gaps

- The audit is added as a step inside an existing required check rather than registered as its own
  branch-protection context. That was deliberate — it needs no branch-protection change and therefore
  takes effect immediately — but it does mean the failure surfaces under a check whose name talks
  about the tenant allowlist rather than tenant input quality.
- The audit writes its report into `reports/canonical-tenant-inputs/latest/` when it runs, so CI
  working trees will be dirty after this step. No job in this workflow asserts a clean tree, but a
  future job that does would need to account for it.
- Path filters do not cover every route to a violation. A change that leaves both `datasets/**` and
  `scripts/**` untouched but invalidates the audit some other way would only be caught by the daily
  schedule.
- This release fixes the wiring, not the underlying finding. The one nonconforming package is still
  nonconforming and still waived until 2026-09-30.

## Wider Finding: This Is Not An Isolated Case

A sweep of every `audit:* / validate:* / verify:* / check:*` npm script was run while preparing this
release, because finding one unwired gate by accident suggested there would be others.

| Measure | Count |
| --- | ---: |
| Such scripts defined in `package.json` | 187 |
| Invoked by a workflow (including this release's addition) | 14 |
| Whose target script is capable of failing a build (`process.exit(1)`, `exitCode = 1`, or a thrown error) | 174 |

Read carefully, because the headline number overstates the problem: many of these are deliberately
on-demand evidence generators — proof packages, readiness previews, dry runs — that nobody intends to
run on every pull request, and several entries are sub-commands of a parent that *is* wired
(`validate:context-corpus` runs all five of its sub-gates, so those are covered in practice).

The real finding is not "173 broken gates." It is that **nothing in the repository distinguishes a
gate from a report generator.** They share a naming convention, they mostly share the ability to fail
a build, and the only way to tell whether any given one actually protects anything is to grep the
workflow directory by hand. That is how the tenant input quality gate went unwired without anyone
noticing, and the same conditions still hold for everything else on that list.

This release deliberately does not attempt to wire the rest. Deciding which of those scripts should
block a merge is a judgment call per script, several would fail today for reasons unrelated to this
work, and turning them on in bulk would be reckless.

## Follow-ups

1. Decide, per script, which of the 187 are gates and which are on-demand evidence. Then make the
   distinction explicit — a naming split, a manifest, or a test asserting that every script declared
   as a gate appears in a workflow — so this class of failure becomes visible rather than silent.
2. Resolve `GATE-08` and remove the column contract waiver before 2026-09-30.
