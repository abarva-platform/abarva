# 2026-06-26-aca-operator-job-wrapper — ACA Operator Job Lane Wrapper

## Release ID

`2026-06-26-aca-operator-job-wrapper`

## Status

`candidate`

## Plain-English Summary

This release turns the private Azure Container Apps operator runner into a repeatable job lane instead of a manual sequence of Azure CLI commands. Operators can now submit a digest-pinned image and npm script, wait for the execution, capture logs/proof bundles, and restore the runner to its idle image from one command.

## Layer Impact

- `internal-admin`: Adds an operator-only wrapper and runbook updates for private ACA Job execution.
- `global-control-lane`: Documents the rule that mutating data-build work must use ACA Jobs instead of production web requests or long-running interactive exec sessions.

## Client Applicability

- All clients: no direct product behavior change.
- Specific clients: none.
- Internal only: AbarVa operators and automation agents.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `scripts/ops/submit-aca-operator-job.mjs`.
- Adds npm scripts `ops:aca-job` and `ops:semantic2:l3-dossiers:proof`.
- Updates `docs/ops/aca-data-build-job-rule.md`.
- Updates `docs/runbooks/azure-private-operator-runner.md`.

## QA / Validation

- PASS: `node scripts/ops/submit-aca-operator-job.mjs --self-test`
- PASS: `node scripts/ops/submit-aca-operator-job.mjs --help`
- PASS: `npx eslint scripts/ops/submit-aca-operator-job.mjs`
- PASS: `npm run release:check`
- PASS: live ACA wrapper self-test against `job-abarva-private-operator-eus` execution `job-abarva-private-operator-eus-bj06f89`.
- PASS: wrapper captured request, start payload, poll log, execution JSON, logs, proof-extraction status, summary, and idle-restore JSON under `/Users/anand/Downloads/aca-operator-runner-selftest-20260627T001010Z`.
- PASS: post-run ACA job state restored to idle digest `sha256:918b6cbf298ebd5bd20782b15f7d1817111d94e438436d64f2ea64db543db8a9`, command `/bin/true`, CPU `0.5`, memory `1Gi`.

## Rollout Plan

Merge through the protected PR flow. No web deploy is required for the wrapper itself; it is an operator script. Use it from a checked-out repo with Azure CLI credentials whenever a data-build or proof job needs the private ACA runner.

## Deployment Authority

- Repo-owned deploy workflow: not required for this operator-only script.
- Shared runtime mutators: the script can mutate the private ACA Job definition by updating timeout and restoring idle image/command after a run.
- Approved image digest: every run requires a digest-pinned image unless `ALLOW_MUTABLE_ACA_IMAGE=true` is set for a documented exception.
- ACA runtime invariant: `app.abarva.ai` production web traffic is not touched by this script.
- Worker image invariant: not applicable to web/worker deploy; applies only to the private operator job invocation.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because this is operator infrastructure. Live ACA job proof is required before using the wrapper as release evidence for a data build.

## Rollback Plan

Revert the script and runbook changes. If a wrapper run is interrupted, manually restore `job-abarva-private-operator-eus` to the idle digest-pinned image and `/bin/true` command using the runbook.

## Audit Evidence

- Script self-test output proves parser, digest guard, script-name guard, proof marker extraction, and tar extraction.
- Live ACA self-test output, when run, is captured under the operator-provided `--out-dir` with `00-request.json`, `02-start.json`, `03-poll-log.json`, `04-logs.txt`, and `summary.json`.
- Live ACA self-test: `/Users/anand/Downloads/aca-operator-runner-selftest-20260627T001010Z`.
- Execution id: `job-abarva-private-operator-eus-bj06f89`.

## Known Gaps

The wrapper does not upload proof bundles to Blob yet. It captures local logs and extracts in-band proof bundles; scripts that need Blob proof locations should continue to write those locations themselves and include them in their job output.
