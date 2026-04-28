# CLOUD1 - Enterprise Private Deployment Strategy Contract

Slice ID: CLOUD1
Slice name: Enterprise Private Deployment Strategy Contract
Status: code_complete
Authored: 2026-04-26
Primary agent: Lane E (parallel build pack)
Depends on: ARCH1, ARCH2 (architecture spine), TEN1 / TEN2 (tenant
isolation), TRUST1 / TRUST2 (client data trust), MG2 (model gateway
contract)
Forward-references: CLOUD2 (Azure VNet lab path), CLOUD3 (GCP VPC
lab path)

## Purpose

CLOUD1 lands the canonical, founder-facing contract for **how
AbarVa is sold, deployed, and operated across four enterprise
deployment tiers**:

1. **AbarVa SaaS** — shared multi-tenant on AbarVa-owned
   infrastructure (today's default).
2. **Dedicated Tenant** — single-tenant stack on AbarVa-owned
   infrastructure (data and compute still live in AbarVa's cloud,
   but isolated to one client).
3. **Private Data Plane** — control plane stays in AbarVa cloud,
   data plane (Postgres, blob, retrieval, model egress) runs in
   the **client's own cloud subscription / project**.
4. **Fully Self-Managed** — the client operates the entire stack
   in their own cloud and owns upgrades, backups, rotations, and
   model contracts.

CLOUD1 is the **strategy contract**. It does not deploy anything,
does not provision a cloud subscription, does not change
production-readiness status for `production_deployment`, and does
not make any live cloud claim. It defines the **vocabulary** every
later cloud / tenant / trust slice inherits.

CLOUD1 is the first deployment-strategy contract in the series:
- CLOUD2 will land the Azure VNet lab path (terraform plan, Azure
  AD B2C / Container Apps / Postgres Flexible Server / Blob /
  Private Link / VNet integration).
- CLOUD3 will land the GCP VPC lab path (terraform plan, Cloud Run
  / Cloud SQL / GCS / Identity Platform / VPC Service Controls).

CLOUD1 is **documentation only**. No application code, no
migrations, no infrastructure-as-code, no Vercel / Supabase /
Clerk wiring. CLOUD1 does not promote `production_deployment`
beyond `blocked`; it only records that the deployment-tier
vocabulary is now contractually defined.

## What Changed

- New strategy contract
  [docs/build/slices/CLOUD1_ENTERPRISE_PRIVATE_DEPLOYMENT_STRATEGY.md](./CLOUD1_ENTERPRISE_PRIVATE_DEPLOYMENT_STRATEGY.md)
  (this file) — slice purpose, tier vocabulary, MVP/V1/V2 path,
  testable-outside-client / requires-client environment split,
  cross-references to TEN1/TEN2/TRUST1/TRUST2/CLOUD2.

- New architecture document
  [docs/architecture/CLOUD1_ENTERPRISE_DEPLOYMENT_MODELS.md](../../architecture/CLOUD1_ENTERPRISE_DEPLOYMENT_MODELS.md):
  - §1 Tier vocabulary (SaaS / Dedicated / Private Data Plane /
    Self-Managed) with one-line elevator definition each.
  - §2 Control plane vs data plane separation contract — what
    AbarVa runs centrally, what the client cloud owns, and the
    explicit trust boundary between them.
  - §3 Dependency replacement matrix — Vercel → Container Apps /
    Cloud Run; Supabase → Azure Postgres Flexible / Cloud SQL;
    Vercel Blob → Azure Blob / GCS; Clerk → Azure AD B2C / OIDC /
    Identity Platform; Anthropic / OpenAI direct → tenant model
    gateway with allowlisted egress.
  - §4 Client data trust implications per tier (cross-references
    TRUST1 / TRUST2 / TEN1 / TEN2).
  - §5 Model gateway strategy per tier — which providers are
    acceptable and where calls originate (AbarVa egress vs client
    egress vs client-owned model contract).
  - §6 Operational responsibilities per tier — upgrades, backups,
    secret rotation, observability, incident ownership.
  - §7 Azure VNet lab path (forward-reference CLOUD2) — what the
    Azure CLOUD2 slice will exercise end-to-end.
  - §8 GCP VPC lab path (forward-reference CLOUD3) — what the GCP
    slice will exercise end-to-end.
  - §9 MVP / V1 / V2 path — order of capability and the
    deferred-state contract.
  - §10 What can be tested outside the client environment vs what
    requires a client subscription.
  - §11 Cross-references (TEN1 / TEN2 / TRUST1 / TRUST2 / CLOUD2 /
    CLOUD3 / MG2 / ARCH1 / ARCH2).

- Build slice manifest update
  [docs/build/build-slices.json](../build-slices.json) appends the
  CLOUD1 entry with status `code_complete`, risk `low`,
  `dependsOn: ['ARCH1', 'ARCH2']`, the four-file allowlist, the
  standard forbidden-files list, and bumps `lastUpdated` to
  `2026-04-26`.

- Production readiness manifest update
  [docs/build/production-readiness.json](../production-readiness.json):
  - `production_deployment.notes` appends a row acknowledging
    that CLOUD1 lands the four-tier deployment strategy
    contract (SaaS / Dedicated / Private Data Plane / Self-
    Managed) plus control-plane / data-plane separation, the
    dependency replacement matrix, the per-tier model gateway
    posture, the per-tier operational responsibility split, and
    the forward-reference Azure (CLOUD2) and GCP (CLOUD3) lab
    paths. UNIONed conservatively. PROD1 / PROD2 / PROD3 /
    OPS1 wording preserved verbatim.
  - `production_deployment.nextAction` is UNIONed with a
    follow-up sentence noting that CLOUD2 (Azure VNet lab) and
    CLOUD3 (GCP VPC lab) must land and pass the lab-path
    acceptance before any private-deployment promotion. The
    prior Vercel build / DNS / observability / PROD4 wording is
    preserved verbatim.
  - `production_deployment.status` is **preserved** at
    `blocked`. CLOUD1 is documentation only and does not
    deploy anything in any cloud.
  - No other component is promoted. `overallStatus`,
    `overallReadinessPercent`, and component statuses are
    unchanged.
  - `lastUpdated` is bumped to `2026-04-26`.

## Tier vocabulary (one-line each)

- **AbarVa SaaS** · One control plane, one shared data plane,
  many tenants, isolated at the read-model layer (TEN1 / TEN2).
  AbarVa owns every dependency and every model contract.
- **Dedicated Tenant** · One control plane, one tenant-dedicated
  data plane, both inside AbarVa's cloud. Same code path as SaaS;
  the dedicated-tenant tag changes deployment topology, not
  product surface.
- **Private Data Plane** · AbarVa control plane in AbarVa cloud;
  data plane (Postgres + blob + retrieval + model egress) in the
  **client's** cloud. Client-owned encryption keys, client-owned
  egress, AbarVa-owned product upgrades.
- **Fully Self-Managed** · Client owns everything: control plane,
  data plane, model contracts, backups, rotations. AbarVa ships
  releases and runbooks; client operates the stack.

## What Is Explicitly Out Of Scope

- CLOUD1 does not author Terraform, Bicep, ARM templates,
  Pulumi, or any other infrastructure-as-code.
- CLOUD1 does not provision an Azure subscription, GCP project,
  AWS account, Container App, Cloud Run service, Postgres
  instance, blob container, identity tenant, or DNS record.
- CLOUD1 does not modify auth, Clerk, Supabase, Vercel,
  migrations, model gateway code, agent runtime code, source
  product code, or any tenant surface.
- CLOUD1 does not import any model provider, does not call the
  Model Gateway, and does not write any audit-ledger entry.
- CLOUD1 does not promote `production_deployment` beyond
  `blocked`. The component stays blocked until CLOUD2 (Azure
  VNet lab) and CLOUD3 (GCP VPC lab) land and a founder-
  approved private deployment is verified.
- CLOUD1 does not push, merge, or open a PR. Lane agents commit
  only; the integration agent owns cherry-pick; the founder owns
  the merge decision.

## Why It Is Safe

- Documentation only. No application code, no runtime
  modification, no migrations, no live cloud calls, no live
  monitoring claim, no browser automation.
- The manifest update is append-only at the note / nextAction
  level and **does not** change `production_deployment.status`,
  any dimension, any testing gate, or `overallReadinessPercent`.
- The build-slices.json edit is append-only and conforms to the
  same shape as PROD1 / PROD2 / PROD3 / QA5–QA7.
- The contract explicitly carves Private Data Plane and Self-
  Managed as forward-reference work (CLOUD2 / CLOUD3) and does
  not claim any of that work is done.
- No tier description fabricates a customer name, a contract
  value, a deploy date, or a region SLA. Every cross-reference
  is a relative path.

## How To Re-Run

1. Run TypeScript:
   `cd /Users/anand/Projects/nexus-big-cloud1 && npx tsc --noEmit --pretty false`
2. Run the production build (symlink panic on darwin is a known
   Next.js worktree-symlink quirk and is mitigated the same way
   in the other lanes — re-run from the worktree root or unlink
   `node_modules/.cache` if the panic recurs):
   `cd /Users/anand/Projects/nexus-big-cloud1 && npm run build`
3. Re-parse manifest JSON:
   `node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"`

## Readiness Impact

- Tracker updated: yes.
- Components changed: `production_deployment` (notes append +
  nextAction UNION).
- Readiness / status changes: none. `production_deployment`
  stays `blocked`.
- Blockers added or removed: none. The
  `prod-deploy-verification` blocker is preserved unchanged.
- `nextAction` updated: yes (UNION; conservative; never
  overwrites PROD1 / PROD2 / PROD3 / PROD4 wording).
- Notes added: one row on `production_deployment` recording the
  CLOUD1 strategy contract landing, the four-tier vocabulary,
  the control-plane / data-plane separation, the dependency
  replacement matrix, the per-tier trust / model gateway /
  operational posture, and the forward-reference Azure (CLOUD2)
  and GCP (CLOUD3) lab paths.

## Cross-references

- `docs/architecture/ARCH1_AGENTIC_PLATFORM_ARCHITECTURE_CONTRACT.md`
  — non-negotiable platform principles (gateway chokepoint,
  evidence trace, tenant isolation).
- `docs/architecture/ARCH2_NEXUS_END_TO_END_EXECUTION_FLOW.md` —
  the runtime flow that every deployment tier must preserve.
- `docs/architecture/CLOUD1_ENTERPRISE_DEPLOYMENT_MODELS.md` —
  this slice's architecture document.
- TEN1 / TEN2 (forward) — tenant isolation contract for shared
  vs dedicated data planes.
- TRUST1 / TRUST2 (forward) — client data trust contract for
  the four tiers.
- CLOUD2 (forward) — Azure VNet lab path.
- CLOUD3 (forward) — GCP VPC lab path.
- MG2 — model gateway stub; CLOUD1 §5 names which providers are
  acceptable per tier and where calls originate.
- PROD1 / PROD2 / PROD3 — production readiness tracker, update
  rules, and live-refresh API. CLOUD1 records its impact on
  `production_deployment` per PROD2.
