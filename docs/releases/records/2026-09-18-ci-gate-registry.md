# 2026-09-18-ci-gate-registry - Say Whether A Script Gates A PR

## Release ID

`2026-09-18-ci-gate-registry`

## Status

`candidate`

## Plain-English Summary

`package.json` carries 206 `audit:` / `validate:` / `check:` scripts. Before this
change, **14** were invoked by a workflow. The other 192 were a mix of two very
different things — policy gates that should fail a PR, and operator tools meant
to be run by hand against a live data plane — and nothing in the repo said which
was which.

That matters because the two look identical from outside: **a gate nobody runs
looks exactly like a tool nobody needs to run.** The route-reachability audit sat
unwired and failing for an unknown period for precisely that reason.

Six unwired code-policy gates were run against current `main` to see how common
that is. **Four of the six fail.**

This change does not decide the classification for all 206 — that is a judgment
per script. It requires the decision to be written down, enforces the one
consequence that follows from it, and records the four failing gates instead of
leaving them invisible.

## Layer Impact

Audit tooling and CI only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## The six gates that were run

| Script | Result on `main` |
|---|---|
| `audit:enterprise-naming` | **passes** — now wired |
| `audit:agent-substrate` | **passes** — now wired |
| `audit:nexus-navigation` | **fails** — the canonical top nav no longer carries the compact mobile menu treatment its contract pins |
| `audit:candidate-invisibility` | **fails**, 2 failures — this guard keeps candidate-tenant data off default runtime surfaces, so a failure is a disclosure question |
| `audit:legacy-context-retirement` | **fails**, 7 failures |
| `audit:legacy-dataset-sunset` | **fails**, 19 failures |

The four failures are recorded as `quarantined` with what would clear each. They
are deliberately **not** wired: wiring a red gate blocks every PR, and none of the
four has been triaged to know whether the failure is a real regression or a stale
expectation. Quarantine makes them visible and refuses to let them be relabelled
`pr-gate` without also being wired.

## Changes Included

- `docs/architecture/ci-gate-registry.json`: every audit script and its kind —
  `pr-gate`, `operator`, `report`, `quarantined`, or `unclassified`.
- `scripts/audit/ci-gate-registry-check.mjs`: refuses a script with no entry, an
  unknown kind, a `pr-gate` no workflow invokes, a `quarantined` entry a workflow
  does invoke, and a `quarantined`/`operator`/`report` entry without a reason.
- `.github/workflows/architecture-boundary.yml`: runs the registry check, plus the
  two gates verified passing.
- `package.json`: `audit:ci-gate-registry`.

Current state: **17 pr-gate, 4 quarantined, 185 unclassified.** The unclassified
185 are the backlog, not an exemption — new scripts are refused.

## QA / Validation

Five mutations, each applied and reverted:

| Mutation | Result |
|---|---|
| A new audit script lands with no registry entry | caught |
| A `pr-gate`'s workflow step is deleted | caught |
| A `quarantined` gate given a one-word reason | caught |
| A failing gate relabelled `pr-gate` without being wired | caught |
| An invented `kind` | caught |

Status: **pass**.

Every step of the `architecture-boundary` job run locally:
`audit:architecture-boundaries` **exit 0**, `audit:route-reachability` **exit 0**,
`audit:ci-gate-registry` **exit 0**, `audit:enterprise-naming` **exit 0**,
`audit:agent-substrate` **exit 0**. Status: **pass**.

ESLint on the new script: **exit 0**. `release-check`: **exit 0**. Both captured as
exit statuses, not read off a pipe. No TypeScript changed. Status: **pass**.

Signed-in acceptance: **not applicable** — no product behavior changes.

## Rollout Plan

Squash-merge after required checks pass. No deploy required; it rides the next ACA
main deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: None.

## Rollback Plan

Revert through a new PR. No runtime effect either way.

## Audit Evidence

PR link, the five mutation results, the six gate runs above, and the registry's
own summary counts.

## Known Gaps

- **185 scripts are unclassified.** Classifying them is judgment work, and a
  wrong `operator` label would hide a real gate exactly as effectively as no
  registry at all. The check refuses new scripts and counts the backlog; it does
  not shrink it.
- **Only six unwired scripts were actually run.** The other 186 have not been
  executed against `main`, so the real number of failing-and-invisible gates is
  at least four and unknown above that. Nothing here runs them.
- `unclassified` scripts are not required to be wired, so a real gate can sit in
  that state indefinitely.
- The check reads workflow YAML as text. A gate invoked through an indirection
  the text scan misses would read as unwired; a step that is present but
  conditioned off would read as wired.
