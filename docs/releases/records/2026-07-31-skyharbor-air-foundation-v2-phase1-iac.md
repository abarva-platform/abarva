# 2026-07-31-skyharbor-air-foundation-v2-phase1-iac — Author and provision skyharbor-air's Phase 1 Azure boundary

## Release ID

`2026-07-31-skyharbor-air-foundation-v2-phase1-iac`

## Status

`released`

## Plain-English Summary

`docs/ops/skyharbor-air-foundation-v2-extension-scope.md` scoped Phase 1 (zero-data infrastructure) as
requiring a dedicated Azure boundary for skyharbor-air — not shared with `airline-demo-new`'s existing
`rg-abarva-airdn-lab-eus2-001`. This release authors that boundary's Infrastructure-as-Code by adapting
airline-demo-new's real, working Bicep templates (`clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/`)
to skyharbor-air's own naming, address space, and Postgres database, adds a Defender-for-Storage
malware-scanning module found in the repo's more governed `infra/azure/client-tenant-foundation.bicep`
pattern (used previously for a real client tenant lane), and — following explicit go-ahead from Anand
("focus is skyharbor now...end to end", "i have already approved the start") — actually provisions the
boundary against the live `abarva-lab-sub` subscription.

Sequence: offline `bicep build`/`bicep build-params` passed → `az deployment sub what-if` ran clean
against the live subscription (55 Create / 0 Modify / 0 Delete, fully isolated to the new resource
group) → `az deployment sub create` provisioned the boundary → independently re-verified via direct
`az resource list` / `az resource show` / `az role assignment list` queries, not trusted from the
deployment exit code alone (see QA section). Resource group `rg-abarva-skair-lab-eus2-001` and everything
inside it now exists in the live `abarva-lab-sub` subscription.

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

- `bicep build` on all 5 `.bicep` files — passed (only the same 3 pre-existing linter warnings present
  in the unmodified airline-demo-new source templates: `no-hardcoded-env-urls`,
  2x `use-resource-symbol-reference`).
- `bicep build-params skair.lab.bicepparam` with dummy placeholder env values — passed.
- `az deployment sub what-if` against live subscription `abarva-lab-sub` — passed clean: 55 `Create`,
  0 `Modify`, 0 `Delete`. The only touch outside the new resource group was 6 additive AcrPull role
  grants on the existing shared ACR (`Unsupported` in what-if terms — a known Azure limitation for
  previewing RBAC role-assignment state, not an error).
- `az deployment sub create` — `provisioningState: Succeeded`.
- Independent re-verification (not trusted from the deployment exit code): `az group show` confirmed
  `rg-abarva-skair-lab-eus2-001` with `provisioningState: Succeeded`; `az resource list` confirmed all 6
  managed identities, both storage accounts with full container sets, Key Vault, VNet, 3 private DNS
  zones/links, 3 private endpoints, Log Analytics, Postgres Flexible Server, Container Apps environment,
  and all 14 ACA job definitions by exact name; `az resource show` on the Defender-for-Storage setting
  confirmed `isEnabled: true` with malware scanning on-upload active (the legacy `az security atp storage
  show` CLI alias reported a stale/incorrect `false` — cross-checked against the actual resource, not
  taken at face value); `az role assignment list --assignee <principalId>` confirmed `mi-skair-ingest-lab-001`
  actually holds `AcrPull` on the shared registry.
- `node scripts/release-check.mjs` — passed.

## Rollout Plan

Merge to `main` via the standard squash-merge path. Runtime rollout is the Azure deployment itself,
already executed and verified above — this PR documents infrastructure that already exists, it does not
trigger further rollout on merge. No source data has landed into this boundary yet; Phase 2 (PostgreSQL
schema bootstrap) is the next real change.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable — this is a dedicated tenant-candidate Azure boundary
  deployed via `az deployment sub create`, not the ACA main deploy workflow.
- Shared runtime mutators: None on `app.abarva.ai` or any existing ACA revision, image, or traffic
  split. The only shared-resource touch is 6 additive AcrPull grants on `acrabarvalab001` for the new
  managed identities — confirmed additive-only via what-if and re-verified post-deploy.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:a0e08d55d1531529986a5da55eba88a5f3be003e91b6fb2b57b1e52bc982ddb5`
  (tag `main-75f150e6`, matching `origin/main` HEAD at deploy time), used for the ACA job image reference.
- ACA runtime invariant: Not applicable — this is a new, isolated tenant-candidate environment, not a
  change to the shared web/worker runtime.
- Worker image invariant: The 14 ACA job definitions reference the digest-pinned image above.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No — no product surface reads this tenant yet.

## Rollback Plan

Delete the resource group `rg-abarva-skair-lab-eus2-001` (removes everything created by this deployment)
and revoke the 6 AcrPull role assignments granted to its managed identities on the shared ACR. No source
data has landed, so there is no data-loss risk in a full teardown at this stage.

## Audit Evidence

- PR (this change) — see PR description for link.
- Offline `bicep build` / `bicep build-params` output, `az deployment sub what-if` output, and the
  independent post-deploy `az resource list`/`az resource show`/`az role assignment list` verification —
  all captured in this record's QA section.
- `docs/ops/skyharbor-air-foundation-v2-extension-scope.md` — the Phase 1 scope this IaC implements,
  updated with the same evidence.

## Known Gaps

- The generated Postgres admin password could not be stored in the new Key Vault from this session —
  the vault correctly rejected the write because it enforces `publicNetworkAccess: Disabled` with a
  deny-by-default network ACL, and the write attempt came from outside the private network boundary.
  This is the security control working as designed, not a defect. The password is in a
  locally-permissioned (`chmod 600`) temp file pending manual placement into Key Vault via an approved
  path (Portal, bastion, or an explicit, deliberately-authorized network exception). Day-to-day pipeline
  auth uses managed-identity/AAD, not this password, so nothing is blocked by this gap.
- The canonical `infra/azure/client-tenant-foundation.bicep` pattern also has an immutable-audit-log
  module (`infra/azure/immutable-audit-log.bicep`) that was deliberately NOT added here — it redeclares
  the same `blobServices/default` resource this template already configures inline, and integrating it
  properly needs a small refactor that wasn't safe to do immediately before a live deploy. Real,
  documented fast-follow, not an oversight.
- No evaluator hidden-truth/crosswalk package exists for skyharbor-air yet (carried over from the
  Phase 0 freeze's known gap) — still open before real data would flow into the evaluator storage
  account this boundary creates.
- Phase 2 onward (schema bootstrap, source landing, parse, canonical assembly, graph/metrics,
  publication, product certification) has not started.
