# TEN1 - SaaS Tenancy Architecture Contract

Slice ID: TEN1
Slice name: SaaS Tenancy Architecture Contract
Status: code_complete
Authored: 2026-04-26
Primary agent: Lane A (controlled multi-agent build)
Depends on: ARCH1

## Purpose

TEN1 lands the canonical statement of how AbarVa is delivered as a
multi-tenant SaaS product. It defines:

- the **four canonical tenancy tiers** (AbarVa SaaS Pilot, AbarVa
  Enterprise SaaS / Dedicated Tenant, AbarVa Private Data Plane,
  AbarVa Self-Managed),
- the **four canonical runtime planes** (control plane, tenant
  runtime plane, data evidence plane, model gateway plane),
- the **three canonical tenant isolation modes** (shared, dedicated,
  private),
- the **tenant registry** as the source of truth for tier,
  isolation mode, data namespace, gateway profile, IdP profile, and
  governance posture,
- the **tenant data namespace** as the unit of isolation inside the
  data evidence plane,
- the **per-tier expectations** for SSO, RBAC, audit, and the model
  gateway,
- the **capability × tier feasibility matrix** that names which
  capabilities are safe at which tier,
- the **MVP / V1 / V2 architecture progression**,
- the **risks and explicit non-goals**, and
- the **cross-references** to TEN2 (isolation enforcement), CLOUD1
  (deployment topology), and TRUST1 (data trust posture).

TEN1 is the **architecture peer** to ARCH1. It does not displace
ARCH1, ARCH2, ADM1, MG2, or AUD2 — it sits above them and names
which planes, isolation modes, and data namespaces apply per tier
so every later tenancy / cloud / trust slice can be evaluated
against a single contract.

TEN1 is **documentation only**. It does not add infrastructure,
provisioning code, or runtime modification. It does not promote any
production-readiness component.

## What Changed

- New architecture contract
  [docs/architecture/TEN1_SAAS_TENANCY_ARCHITECTURE.md](../../architecture/TEN1_SAAS_TENANCY_ARCHITECTURE.md):
  - §A Purpose and scope.
  - §B The four AbarVa tenancy tiers (Tier 1 Pilot, Tier 2
    Enterprise / Dedicated, Tier 3 Private Data Plane, Tier 4
    Self-Managed).
  - §C The four runtime planes (control plane, tenant runtime
    plane, data evidence plane, model gateway plane) with the
    canonical composition diagram.
  - §D Tenant isolation modes (shared, dedicated, private) with the
    mode + tier matrix.
  - §E Tenant registry contract — required fields, consumers,
    residency, change discipline.
  - §F Tenant data namespace contract — per-mode shape matrix
    (relational, object, vector, graph, audit) and cross-namespace
    rules.
  - §G Per-tier expectations — SSO, RBAC, audit, model gateway
    tables.
  - §H Capability × tier feasibility matrix.
  - §I MVP / V1 / V2 architecture progression.
  - §J Risks (cross-tenant leak, misclassified tier, provider
    lock-in, customer-cloud drift, implicit tenancy in code,
    knowledge fabric maturity).
  - §K Non-goals (no multi-region active-active, no real-time
    cross-tenant analytics, no tenant-content visibility from
    control plane, no sub-tenant hierarchy in MVP / V1, no on-prem
    in MVP / V1, no model-training over tenant content, no silent
    tier downgrade, no surface differences between tiers).
  - §L Cross-references (ARCH1, ARCH2, ADM1, TEN2, CLOUD1, TRUST1,
    MG2, AUD2, EVID2 / EVID3).
  - §M Acceptance criteria.
  - §N / §O Status and verification rules.

- Build slice manifest update
  [docs/build/build-slices.json](../build-slices.json) appends the
  TEN1 entry with status `code_complete`, risk `low`,
  `dependsOn: ['ARCH1']`, the four-file allowlist, the standard
  forbidden-files list, and bumps `lastUpdated` to `2026-04-26`.

- Production readiness manifest update
  [docs/build/production-readiness.json](../production-readiness.json):
  - `production_deployment.notes` appends a row acknowledging that
    TEN1 lands the SaaS tenancy architecture contract naming the
    four tiers, the four planes, the three isolation modes, the
    tenant registry, the tenant data namespace, the per-tier
    SSO / RBAC / audit / gateway expectations, the capability × tier
    feasibility matrix, the MVP / V1 / V2 progression, and the
    cross-references to TEN2, CLOUD1, and TRUST1. UNIONed
    conservatively; PROD1 / PROD2 / PROD3 / OPS1 wording preserved
    verbatim.
  - `production_deployment.nextAction` appends a follow-up sentence
    naming TEN2 (isolation enforcement), CLOUD1 (deployment
    topology), and TRUST1 (data trust posture) as the next slices
    that must follow the TEN1 contract before any production
    promotion. UNION; conservative; never overwrites prior wording.
  - `data_evidence_knowledge_fabric.notes` appends a row recording
    that TEN1 names the data evidence plane as one of the four
    canonical runtime planes, names the tenant data namespace as
    the unit of isolation inside it, names the per-mode shape
    matrix (relational, object, vector, graph, audit), and explains
    why the data evidence plane separation remains partial in MVP.
    UNION; conservative.
  - `data_evidence_knowledge_fabric.nextAction` is left **untouched**
    (HEAD wins) because the existing wording covers the live EVID2
    ingest binding which remains the load-bearing next action.
  - **No component status is promoted.** `production_deployment`
    stays `blocked`. `data_evidence_knowledge_fabric` stays
    `scaffolded`. `overallStatus`,
    `overallReadinessPercent`, and component statuses are
    unchanged.
  - `lastUpdated` is bumped to `2026-04-26`.

## What Is Explicitly Out Of Scope

- TEN1 does **not** implement tenant isolation enforcement. That is
  TEN2.
- TEN1 does **not** implement deployment topology, region selection,
  network egress, or DNS. That is CLOUD1.
- TEN1 does **not** define data trust posture, classification,
  retention, DPA, BAA, sub-processor list, or residency
  commitments. That is TRUST1.
- TEN1 does **not** add provisioning automation, IaC, the tenant
  lifecycle state machine, or the tenant-scoped client factory.
  Those are TEN3+ / CLOUD1 concerns.
- TEN1 does **not** add billing, metering, contract terms, or
  pricing.
- TEN1 does **not** modify auth, supabase, migrations, Nexus,
  Sentinel, Atlas, agent runtime, model gateway, or source product
  code.
- TEN1 does **not** import any model provider, does **not** call the
  Model Gateway, and does **not** write any audit-ledger entry.
- TEN1 does **not** push, merge, or open a PR. Lane A commits only;
  the integration agent owns any later cherry-pick step; the
  founder owns the merge decision.

## Why It Is Safe

- Documentation only. No application code, no runtime modification,
  no migrations, no model calls, no live retrieval, no browser
  automation.
- The architecture contract describes a target architecture and
  honestly names the **MVP / V1 / V2 progression**: it does **not**
  claim that Tier 2, Tier 3, or Tier 4 are currently provisionable;
  it does **not** claim that the four planes are currently
  separately deployed; it does **not** claim that BYOK, customer
  IdP federation, customer-controlled gateway, or HIPAA / SEC posture
  exist today.
- The `production_deployment` and `data_evidence_knowledge_fabric`
  manifest edits are append-only at the note / nextAction level
  (UNION; conservative) and do **not** change any component status,
  dimension, gate status, or overall readiness percent. PROD1 /
  PROD2 / PROD3 / OPS1 / EVID2 / CTX2 / CTX3 / CTX4 / EVID3 / I6 /
  PDEL8 wording is preserved verbatim.
- The build-slices.json edit is append-only and conforms to the
  same shape as ADM1 / ARCH1 / ARCH2 and the QA1–QA7 series.
- TEN1 explicitly defers Tier 2 provisionability behind the
  production-grade data evidence plane (§I.2 V1 acceptance) so the
  contract cannot be read as a promise that we are ready to onboard
  regulated tenants today.

## How To Re-Run

1. Run TypeScript:
   `cd /Users/anand/Projects/nexus-big-ten1 && npx tsc --noEmit --pretty false`
2. Run the production build:
   `cd /Users/anand/Projects/nexus-big-ten1 && npm run build`
3. Re-parse manifest and slice JSON files:
   `node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"`

## Readiness Impact

- Tracker updated: yes.
- Components changed: `production_deployment` (notes append +
  nextAction UNION); `data_evidence_knowledge_fabric` (notes
  append; nextAction left untouched, HEAD wins).
- Readiness / status changes: none. Both components keep their
  prior status.
- Blockers added or removed: none.
- `nextAction` updated: yes on `production_deployment` (UNION;
  conservative; never overwrites prior PROD1 / PROD2 / PROD3 / OPS1
  wording); no on `data_evidence_knowledge_fabric` (HEAD wins).
- Notes added: one row on `production_deployment` and one row on
  `data_evidence_knowledge_fabric` recording the TEN1 contract
  landing and the cross-references to TEN2, CLOUD1, and TRUST1.

## Validation

- `cd /Users/anand/Projects/nexus-big-ten1 && npx tsc --noEmit --pretty false`
- `cd /Users/anand/Projects/nexus-big-ten1 && node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"`
- `cd /Users/anand/Projects/nexus-big-ten1 && npm run build` —
  known issue: Turbopack may panic on the worktree's symlinked
  `node_modules`; if so, replace the symlink with a real copy
  temporarily, run the build, and restore the symlink. TSC and
  JSON validity are the primary gates for a documentation-only
  slice.

## Status

Code complete. Pending founder review for promotion to `verified`.

## What `verified` requires

- Founder confirms the four-tier model reflects the intended
  commercial / operational shape of the product.
- Founder signs off on the four-plane decomposition, the three
  isolation modes, the tenant registry fields, the tenant data
  namespace shape, the per-tier expectations, the feasibility
  matrix, and the MVP / V1 / V2 progression named in
  `docs/architecture/TEN1_SAAS_TENANCY_ARCHITECTURE.md`.
- Founder confirms the risks and non-goals reflect intent.
- Founder confirms TEN2, CLOUD1, and TRUST1 are the correct peers
  in the correct order.
