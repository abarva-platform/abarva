# 2026-07-31-skyharbor-air-foundation-v2-phase1-iac — Author skyharbor-air's Phase 1 Azure boundary IaC (plan-only)

## Release ID

`2026-07-31-skyharbor-air-foundation-v2-phase1-iac`

## Status

`candidate`

## Plain-English Summary

`docs/ops/skyharbor-air-foundation-v2-extension-scope.md` scoped Phase 1 (zero-data infrastructure) as
requiring a dedicated Azure boundary for skyharbor-air — not shared with `airline-demo-new`'s existing
`rg-abarva-airdn-lab-eus2-001`. This release authors that boundary's Infrastructure-as-Code by adapting
airline-demo-new's real, working Bicep templates (`clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/`)
to skyharbor-air's own naming, address space, and Postgres database — matching the existing pattern
file-for-file rather than inventing a new shape.

This release is **file-authoring only**. No `az` command has been run against real Azure, no resource
group, storage account, Postgres server, Key Vault, managed identity, or Container App job exists for
skyharbor-air as a result of this PR. The templates compile offline (`bicep build` / `bicep build-params`)
but have not been deployed, what-if'd, or validated against a live subscription.

## Layer Impact

**Release lane: `client-data-lane`.**

- Infrastructure-as-Code only. No Layer 1 source data changed, no Layer 3 canonical model touched, no
  database write, no Azure resource created or modified.

## Client Applicability

- All clients: No.
- Specific clients: `skyharbor-air` only.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

Adds `clients/skyharbor-air/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/`:

- `main.bicep` — subscription-scope orchestrator (resource group + 3 module deployments).
- `skair-lab-foundation.bicep` — Log Analytics, VNet (`10.76.0.0/22`, 3 subnets), 6 managed identities
  (ingest/review/publish/read/evaluator/admin), operational + evaluator storage accounts with container
  sets, Key Vault, private DNS zones + links, Postgres Flexible Server + database, Container Apps
  environment, private endpoints.
- `skair-acr-pull.bicep` — grants the 6 managed identities `AcrPull` on the shared `acrabarvalab001`
  registry.
- `skair-lab-jobs.bicep` — 14 ACA job definitions, one per `hcdn-job-runner.mjs` process/stage pair
  (source-register through home-readmodel), matching the Phase 1-8 stage names in the extension-scope
  document.
- `skair.lab.bicepparam` — deployment parameters for the `lab` environment: resource group
  `rg-abarva-skair-lab-eus2-001`, `phase: 'phase1-zero-data-plan-only'` tag, image/password sourced from
  environment variables (not hardcoded).

Deliberate departures from the airline-demo-new source templates (not blind find-replace):

- Address space `10.76.0.0/22` (airline-demo-new uses `10.75.0.0/22`) — a distinct block in case these
  VNets are ever peered under the same subscription, even though nothing currently peers them.
- Dropped the `ABARVA_AIRDN_*`-prefixed "compatibility only" env var block in the jobs file. That block
  exists for `airline-demo-new`'s own legacy naming history; skyharbor-air has no equivalent legacy
  consumer, and the file's own comment confirms `ABARVA_HCDN_*` (kept, unchanged) is what the standard
  job runner and preflight checks actually read.
- `tenantId` (the Azure AD tenant, not an AbarVa client identifier) is intentionally identical to
  airline-demo-new's value — it's the same Azure AD tenant across the whole subscription, not a
  per-client value.

## QA / Validation

- `bicep build` on all 4 `.bicep` files — passed (only the same 3 linter warnings present in the
  unmodified airline-demo-new source templates: `no-hardcoded-env-urls`, 2x `use-resource-symbol-reference`
  — pre-existing style warnings, not new).
- `bicep build-params skair.lab.bicepparam` with dummy placeholder env values — passed.
- No `az deployment ... --what-if` or `az deployment ... create` was run — that requires the separate,
  explicit go-ahead this document's own "Immediate next step" section still withholds.
- `node scripts/release-check.mjs` — passed.

## Rollout Plan

Merge to `main` via the standard squash-merge path. No runtime rollout — these are unexecuted templates.
Actual deployment (Phase 1 execution) requires its own PR/release record once Azure provisioning is
explicitly authorized.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable — these templates are not wired into any deploy workflow.
- Shared runtime mutators: None. Nothing in this PR can affect `app.abarva.ai` or any existing ACA
  revision, image, or traffic split.
- Approved image digest: Not applicable — no image is built or deployed by this PR.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No.

## Rollback Plan

Revert the merge commit. No live infrastructure, data, or runtime behavior exists yet, so there is
nothing to roll back beyond the file change itself.

## Audit Evidence

- PR (this change) — see PR description for link.
- Offline `bicep build` / `bicep build-params` output captured in this record's QA section.
- `docs/ops/skyharbor-air-foundation-v2-extension-scope.md` — the Phase 1 scope this IaC implements.

## Known Gaps

- Templates are authored and compile offline but have never been run against real Azure — no
  `--what-if`, no `create`. That is the deliberate next checkpoint, not an oversight.
- Phase 1 execution (actually provisioning this boundary) is real, billable, hard-to-reverse
  infrastructure creation and requires its own explicit go-ahead before any `az` command runs — not
  authorized by this PR.
- No evaluator hidden-truth/crosswalk package exists for skyharbor-air yet (carried over from the
  Phase 0 freeze's known gap) — irrelevant to this IaC layer but still open before Phase 1 data would
  ever flow into the evaluator storage account these templates create.
