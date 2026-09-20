# 2026-09-19 Journey Manifest Evidence Resolves

## Release ID

`2026-09-19-journey-manifest-evidence-resolves`

## Status

`candidate`

## Plain-English Summary

A QA manifest recorded deterministic route and component coverage by citing files, and nothing ever resolved those citations. Three of the four files it named no longer exist. Its own suite did try to read them and has been failing since the July shell retirement, unseen, because no workflow runs the directory it lives in. This resolves every cited path, repairs the manifest to the surfaces that actually exist, and records the rest as removed rather than quietly dropping them.

## Layer Impact

- Release lane: `global-control-lane`.
- QA manifest and its suites. No product runtime behavior changes.
- No schema change, no migration, no route change.

## Client Applicability

- All clients: no client-facing change.
- Internal release assurance only.

## Changes Included

- Add a resolver that reads every path-shaped evidence entry and reports the ones that do not resolve. Marker tokens are excluded by design, because a marker can never resolve and a rule nothing can satisfy gets switched off.
- Repair the landing checkpoint to the route that exists and the component it renders.
- Mark the nine checkpoints whose subjects the July retirement removed, each carrying a note saying what went, and strip the dead file paths from them. A retired checkpoint that cites a resolvable file is refused, because that is how a retired claim starts looking supported again.
- Record the pattern-detail route as absent rather than naming one, and say in the manifest's own caveats that nine of eleven checkpoints are not coverage.
- Replace the drifted suite case that held its own hardcoded copy of the same four paths, so there is one list of evidence and it is the one the manifest publishes.

## QA / Validation

- PASS: new behavior suite passes 6 of 6, repaired manifest suite passes 6 of 6.
- FAIL, before the change, on clean `origin/main`: the manifest suite reports 1 failing case of 5, reading a file deleted in July. Verified from a detached worktree at `origin/main` rather than inferred.
- PASS: mutation harness catches 9 of 9 seeded defects, including both directions of the path-shape rule, marking a removed checkpoint as present, restoring a deleted path, and dropping the caveat.
- PASS: TypeScript (`npx tsc -p tsconfig.json --noEmit`, Node 24 with an 8 GB heap), exit code 0.
- PASS: scoped ESLint on all three files, exit code 0.

## Rollout Plan

Merge through the protected pull-request lane. Deploy only through the repository-owned ACA main workflow. QA tooling only; nothing rendered changes.

## Rollback Plan

Revert the three files. No runtime, data, or schema rollback is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending repository-owned deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: No. QA tooling only.

## Audit Evidence

- Before-state run from a detached worktree at `origin/main`.
- New and repaired suite output.
- Mutation harness output.
- TypeScript and lint exit codes.

## Known Gaps

**The directory this suite lives in is still not run by any workflow.** Running it for the first time found 37 suites and 915 assertions, of which 6 suites and 9 assertions are red — all tracing to the same July retirement and to brand-asset enforcement. Wiring it needs a quarantine ratchet like the one the sibling admin directory already has, and that is deliberately a separate change rather than an extra 900 assertions bolted onto this one. The measurement is recorded in the backlog so the next change starts from it rather than rediscovering it.
