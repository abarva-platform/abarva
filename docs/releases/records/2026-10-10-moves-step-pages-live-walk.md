# 2026-10-10 — Moves step pages signed-in read-only walk

## Release ID

`2026-10-10-moves-step-pages-live-walk`

## Status

`candidate`

## Plain-English Summary

A Playwright suite opens every declared Moves step view on the signed-in shared
app, captures desktop and mobile screenshots, and writes a per-view proof file.
It also records each phase's default landing and checks that `?legacy=1` still
opens capture. The suite blocks product-origin write requests and never clicks
save, approval, build, or submission controls. A workflow runs it after a
successful main ACA deploy or by manual request. Pull requests discover the
spec with Playwright `--list` without contacting the app.

The existing gate-walk suites explicitly request `?legacy=1` because their
assertions concern the capture flow.

## Layer Impact

- Release lane: `internal-admin` quality control.
- Layers 1–3: no intake, adapter, canonical model, or tenant-data change.
- Layer 4: no product behavior change. This adds browser observation and
  evidence capture around existing Moves projections.

## Client Applicability

- All clients: no product change.
- Specific clients: the signed-in walk is restricted to the synthetic demo
  tenant by workflow configuration.
- Internal only: the workflow and its artifacts are operator QA.
- Public/demo only: no public page changes.
- Feature flags: unchanged.

## Changes Included

- `tests/e2e/moves-step-pages-live-walk.spec.ts`: signed-in read-only walk,
  phase landings, legacy hatch, every registered view, screenshots, and
  `proof.json`.
- `.github/workflows/moves-step-pages-live-walk.yml`: PR discovery, post-deploy
  and manual execution, deploy-evidence readback, artifact upload.
- Existing gate-walk helper and three specs: open capture with `?legacy=1`.

## QA / Validation

- Playwright spec discovery (`--list`): Pass, one spec discovered.
- Focused ESLint and workflow YAML parse: Pass.
- Typecheck: Pass, including the new Playwright spec.
- Library-orphan audit: Pass, no new orphan.
- Route and export reachability: Pass, no new unreachable code.
- Test CI coverage census: Pass, unchanged against the updated base at 2,814
  covered Jest files.
  The new Playwright spec is outside this `src/` Jest census and is named by
  the workflow discovery job.
- Tenancy-fence census write and check: Pass, unchanged; no API route added.
- Nexus manual generation and check: Pass, no generated change.
- Mutation check: Not run for the live assertions without a deployed signed-in
  run. A local test-discovery pass cannot kill runtime assertion mutations.
- Live signed-in execution: Not run. The first qualifying deploy or authorized
  manual dispatch must produce the first per-view proof artifact.
- Release check: Pass, all 11 gates.

## Rollout Plan

Merge through a pull request. The next successful repo-owned ACA main deploy
triggers the read-only walk. The workflow requires an existing synthetic demo
Move that can open P0–P5 and a configured operator, client key, and displayed
tenant name. No fixture creation or data job is part of this rollout.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` alone
  controls shared runtime traffic.
- Shared runtime mutators: none in this release.
- Approved image digest: read from the successful deploy workflow's ACA
  evidence artifact, alongside its revision and 100% traffic holder.
- ACA runtime invariant: the read-only workflow checks the target revision
  image against that deploy evidence before recording its commit SHA.
- Worker image invariant: unchanged; the deploy workflow owns it.
- Live signed-in proof required: the walk must complete and upload a passing
  per-view table and screenshots before any step view is called proven.

## Rollback Plan

Disable or revert this workflow through a pull request. Existing product
routes and data remain unchanged. The gate-walk URLs can be restored by
reverting their small test-only edits.

## Audit Evidence

- Pull request and CI results.
- Playwright `--list` discovery and local quality-check output.
- After deploy, the `moves-step-pages-live-walk` artifact contains
  `proof.json`, screenshots, and the ACA deploy evidence used to identify the
  served revision.

## Known Gaps

- No live signed-in artifact exists for this candidate. Local discovery and
  type checks do not establish deployed behavior.
- The workflow requires repository variables for a reusable synthetic demo
  Move ID and its displayed tenant name. If either is absent, the run fails
  preflight without claiming proof.
- P2 has only a partial step-page set, so its default phase address is
  expected to remain on capture while direct P2 step views are checked.
