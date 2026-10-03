# Source Proof Lane — Clerk Authentication and Private Operator Binding

## Release ID

`2026-09-28-source-proof-lane-auth`

## Status

`candidate`

## Plain-English Summary

The signed-in browser proof now sends Clerk's testing token only to the Frontend API host declared by the target application's public key. Authentication bootstrap failures fail the crawl even when their severity is below P0. The private operator's read-only proof runner gains its missing Key Vault-backed token binding, while preserving its existing managed identities and database environment aliases.

## Layer Impact

- `global-control-lane`: hardens shared browser-proof authentication and makes incomplete signed-in crawls fail closed. No customer-facing product behavior or tenant data changes.
- `internal-admin`: adds a token reference to the private operator job used for controlled browser proofs. The job remains manually triggered; the default command is read-only.

## Client Applicability

- All clients: no product behavior change; this only affects automated proof tooling.
- Specific clients: none.
- Internal only: private operator proof-runner configuration.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Derive the exact Clerk Frontend API host from `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and restrict testing-token attachment to that host or the target app's Clerk proxy routes.
- Treat `auth-bootstrap` and `candidate-preview-auth-bootstrap` findings as blocking crawl outcomes regardless of P0 count.
- Add focused Jest and executable smoke coverage to the pull-request workflow.
- Remove the newly CI-wired crawl test directory from the dark-directory ratchet baseline.
- Add a preflight check for the private operator's Key Vault secret and environment binding.
- Update the private operator infrastructure definition to preserve its deployed managed identities, database URL alias, timeout, and workload profile while adding the proof-token reference.

## QA / Validation

- Pass: focused crawl-guard Jest suite, 17 tests.
- Pass: `npm run smoke:p21-post-deploy-crawl`.
- Pass: ESLint on changed TypeScript files.
- Pass: repository `npm run typecheck`.
- Pass: `npm run audit:test-ci-coverage:check` and `git diff --check`.
- Pass: Azure subscription what-if shows only the intended private operator job changes; web app and unrelated resources are unchanged.
- Pass: the dark-directory ratchet test passes 4/4 after reconciling the newly wired test directory.
- Not run: the full behavior-coverage gate after baseline reconciliation; its first run passed 153 suites and failed only because the newly wired directory remained in the dark-set baseline. The focused ratchet test passes on the corrected tree.
- Not run: post-deploy signed-in crawl and private operator product proof; these require merge/deployment and are release exit criteria.

## Rollout Plan

Merge through the protected `main` PR path. Let the repo-owned ACA main deploy workflow build and deploy the exact merged SHA. Apply the private operator configuration using `infra/azure/database-migration-foundation.bicep` and `infra/azure/parameters/private-operator.lab.bicepparam`, with the approved digest-pinned image. Then run the exact-SHA post-deploy crawl and the ECL product live proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` for the shared web and worker runtimes.
- ACR build policy: shared web images are built only by the repo-owned Buildx workflow with GitHub Actions cache on Premium ACR; no ad-hoc ACR build is used.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: resolve from the exact merged-SHA deploy run; the private operator uses that same digest.
- ACA runtime invariant: verify web template, 100%-traffic revision, and both worker jobs use the exact approved digest.
- Worker image invariant: verify both delivery-worker jobs match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; crawl must reach product routes, and the private operator proof must complete.

## Rollback Plan

Revert the code PR through a follow-up PR and redeploy through the repo-owned ACA main deploy workflow. If the private operator binding causes a proof-runner issue, restore its prior Bicep parameter/configuration state through the documented private-operator runbook. The job is manually triggered and no client data is modified by this release.

## Audit Evidence

PR, CI run, exact-SHA ACA deploy run, runtime-invariant proof artifact, post-deploy crawl artifact, private operator execution logs, and ECL product live-proof artifact will be recorded here after rollout.

## Known Gaps

Signed-in and private-operator proof remain pending until the merged code and token binding are deployed and exercised. No end-to-end synthetic sourcing event is claimed by this release record.
