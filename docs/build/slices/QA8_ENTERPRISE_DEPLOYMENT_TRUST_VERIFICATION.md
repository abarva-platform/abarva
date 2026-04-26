# QA8 - Enterprise Deployment + Trust Verification Runbook

Slice ID: QA8
Slice name: Enterprise Deployment + Trust Verification Runbook
Status: code_complete
Authored: 2026-04-26
Primary agent: Lane H (parallel build pack)
Depends on: TEN1, TEN2, TRUST1, TRUST2, CLOUD1, CLOUD2, PROD3

## Purpose

QA8 lands the founder-facing checklist for verifying that the
**enterprise deployment** and **client data trust** surfaces — the
SaaS tenancy architecture (TEN1), the tenant isolation data
boundary read model (TEN2), the optional dedicated-tenant blueprint
(TEN3), the dataset trust model (TRUST1), the agent data access
policy matrix (TRUST2), the optional Steward-setup TRUST surface
wiring (TRUST3), the four-tier deployment strategy (CLOUD1), the
Azure VNet reference lab blueprint (CLOUD2), the optional Docker
packaging path (CLOUD3), the optional local-lab boot (CLOUD4), the
optional Bicep starter (CLOUD5), the production readiness live
refresh API + panel (PROD3), the optional CI / Vercel ingestion
path (PROD4), and the optional users / access surface (ADM6) — hold
their contracts honestly before push or PR.

QA8 is the eighth founder-facing verification runbook, after
QA1 (Agentic Spine), QA2 (Solution / Workshop), QA3 (Solution
Intelligence), QA4 (Agent Mission / Persona), QA5 (Route Smoke
Inventory), QA6 (Golden Prompt Harness Contract + Seed), and
QA7 (Program Continuity + Deliverable Verification). It is
deterministic — does not exercise live retrieval or model calls —
and operates strictly in the documentation lane.

QA8 does NOT execute any smoke run, persona crawler, or browser
automation. It does NOT promote any production-readiness
component. `validation_qa` remains `tested`; `production_deployment`
remains `blocked`. The runbook only appends notes / nextAction
wording acknowledging that QA8 has landed.

## What Changed

- New runbook
  [docs/build/ENTERPRISE_DEPLOYMENT_TRUST_VERIFICATION_RUNBOOK.md](../ENTERPRISE_DEPLOYMENT_TRUST_VERIFICATION_RUNBOOK.md):
  - §A Scope · names TEN1 / TEN2 / TRUST1 / TRUST2 / CLOUD1 /
    CLOUD2 / PROD3 as required surfaces and TEN3 / TRUST3 / CLOUD3 /
    CLOUD4 / CLOUD5 / PROD4 / ADM6 as conditional surfaces.
  - §B Branch hygiene · worktree-per-slice rule, lane-agents-
    commit-only rule, integration-agent-merges rule, no
    `git add .`.
  - §C Validation commands · `npx tsc --noEmit --pretty false`,
    per-slice jest paths (TEN2, TRUST1, TRUST2, plus conditional
    PROD3 / PROD4 / ADM6 paths), `npm run build`, manifest JSON
    parse check, conflict-marker grep.
  - §D SaaS pilot readiness checks · multi-tenant data plane,
    tenant registry stub, tenant admin / platform admin
    separation, shared contract-only model gateway.
  - §E Dedicated tenant readiness checks · TEN3 blueprint coverage,
    onboarding / upgrade / backup paths, no production-ready
    claim. Conditional.
  - §F Private data plane readiness checks · CLOUD1 four-tier
    strategy, CLOUD2 Azure VNet architecture, CLOUD4 local lab
    boot (conditional), CLOUD5 Bicep parses (conditional).
  - §G Azure VNet lab verification · resource list match (VNet,
    subnets, Container Apps Env, Container App, Postgres Flexible,
    Storage, Key Vault, Log Analytics), Bicep lints, parameters
    file parses, no hardcoded secrets, README marks
    LAB / NOT PRODUCTION.
  - §H Docker packaging verification (CLOUD3 conditional) ·
    multi-stage Dockerfile, non-root user, no baked secrets,
    `.dockerignore` covers `node_modules` / `.env` / `.git` /
    `reports/`, `verify-docker-build.sh` exits 0 with or without
    Docker.
  - §I Dataset trust + agent access checks · 5 sharing levels
    L0–L4, 5 trust ladder states loaded → decision_grade, L4
    blocked unless explicit_approved, agent use requires explicit
    policy, approval workflow not derivable from summary, revoked
    / expired blocks use, TRUST3 surface wiring (conditional).
  - §J Users / access checks (ADM6 conditional) · deterministic
    seed, all 7 roles, no real names, no live auth mutation,
    risky permission flags, canonical theme imports.
  - §K Production readiness tracker checks (PROD3 / PROD4) · page
    renders, live panel polls every 60s, API returns honest
    `liveStatus: unavailable` when tokens absent, no fake green CI
    claim, blockers preserved, no false `production_ready`
    promotions.
  - §L No-fabrication checks · no fake `E-###` citations, no fake
    approvals, no fake dollar amounts, no live model claim, no
    fake live monitoring claim.
  - §M CI / Vercel status checks · ESLint passes,
    routes-and-disclaimers passes, Vercel abarva green, Vercel
    nexus green, Supabase Preview skipping acceptable.
  - §N Client data sharing trust ladder walk · L1 → L2 → L3 → L4
    transition, evidence required, reviewer, approver per step.
  - §O Security review checklist · regex audit for secrets, no
    hardcoded subscription/tenant IDs, auth not modified,
    future-only actions clearly disabled, hairline borders /
    canon-compliant chrome, dark surfaces only on Atlas Brief /
    pattern detail per canon §F.
  - §P Morning review · PR merge rules · merge gated on PROD2
    `passed: true`; conservative-status policy preserved;
    canonical cherry-pick path TEN1 → TEN2 → TEN3 → TRUST1 →
    TRUST2 → TRUST3 → CLOUD1 → CLOUD2 → CLOUD3 → CLOUD4 →
    CLOUD5 → PROD4 → ADM6 → QA8; exact four-line QA8 staged
    set.

- Build slice manifest update
  [docs/build/build-slices.json](../build-slices.json) appends the
  QA8 entry with status `code_complete`, risk `low`, the four-file
  allowlist, the standard forbidden-files list, and `lastUpdated`
  preserved at `2026-04-26`.

- Production readiness manifest update
  [docs/build/production-readiness.json](../production-readiness.json):
  - `validation_qa.notes` appends a row acknowledging that QA8
    adds the enterprise deployment + trust verification runbook
    covering TEN1 / TEN2 / TRUST1 / TRUST2 / CLOUD1 / CLOUD2 /
    PROD3 (and the conditional TEN3 / TRUST3 / CLOUD3 / CLOUD4 /
    CLOUD5 / PROD4 / ADM6 surfaces if installed). UNIONed
    conservatively; QA1–QA7 wording preserved verbatim.
  - `validation_qa.nextAction` appends a follow-up sentence about
    enterprise deployment and trust verification (UNION;
    conservative; never overwrites prior wording).
  - `production_deployment.notes` appends a row acknowledging that
    QA8 adds the founder-facing enterprise deployment + trust
    verification runbook and that no live cloud, no live model,
    no live CI / Vercel polling, and no real customer cloud are
    invoked. UNIONed conservatively.
  - `production_deployment.nextAction` appends a follow-up
    sentence (UNION; conservative; never overwrites prior wording).
  - The `validation_qa` and `production_deployment` component
    statuses are preserved (still `tested` and `blocked`
    respectively, NOT promoted) because runbook execution remains
    deferred (no browser, no automation, no real cloud).
  - No other component is promoted. `overallStatus`,
    `overallReadinessPercent`, and component statuses are
    unchanged.
  - `lastUpdated` is set to `2026-04-26`.

## What Is Explicitly Out Of Scope

- QA8 does not execute any HTTP request, does not start a server,
  does not open a browser, and does not use Playwright, Puppeteer,
  or Cypress.
- QA8 does not promote any production-readiness component or gate.
  `validation_qa` remains `tested` and `production_deployment`
  remains `blocked`.
- QA8 does not call Azure, GCP, AWS, GitHub, Vercel, Anthropic,
  OpenAI, Cohere, or any other external system.
- QA8 does not author or modify the underlying enterprise / cloud /
  trust surfaces (TEN1, TEN2, TEN3, TRUST1, TRUST2, TRUST3,
  CLOUD1, CLOUD2, CLOUD3, CLOUD4, CLOUD5, PROD3, PROD4, ADM6).
  Those are owned by their own lanes.
- QA8 does not modify auth, supabase, migrations, Nexus, Sentinel,
  Atlas, agent runtime, model gateway, or source product code.
- QA8 does not import any model provider, does not call the Model
  Gateway, and does not write any audit-ledger entry.
- QA8 does not push, merge, or open a PR. Lane agents commit only;
  the integration agent owns the cherry-pick step; the founder
  owns the merge decision.

## Why It Is Safe

- Documentation only. No application code, no runtime
  modification, no migrations, no model calls, no live retrieval,
  no browser automation, no live cloud calls.
- The runbook explicitly calls out conditional execution: any of
  TEN3 / TRUST3 / CLOUD3 / CLOUD4 / CLOUD5 / PROD4 / ADM6 may be
  missing in a given batch; the runbook records `deferred` rather
  than `failed`.
- The manifest update is append-only at the note / nextAction
  level and does not change any component status, dimension, gate
  status, or overall readiness percent.
- The build-slices.json edit is append-only and conforms to the
  same shape as QA1–QA7.

## How To Re-Run

1. Run TypeScript:
   `cd /Users/anand/Projects/nexus-enterprise-qa8 && npx tsc --noEmit --pretty false`
2. Re-parse manifest and slice JSON files:
   `cd /Users/anand/Projects/nexus-enterprise-qa8 && node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"`
3. Run the production build (the well-known Next.js worktree
   symlink panic is acceptable to mitigate by clearing `.next/`
   and re-running once):
   `cd /Users/anand/Projects/nexus-enterprise-qa8 && npm run build`

## Readiness Impact

- Tracker updated: yes.
- Components changed: `validation_qa` (notes append + nextAction
  UNION) and `production_deployment` (notes append + nextAction
  UNION).
- Readiness/status changes: none. `validation_qa` stays `tested`;
  `production_deployment` stays `blocked`.
- Blockers added or removed: none. The
  `prod-deploy-verification` and `qa-ci-gates` blockers are
  preserved verbatim.
- `nextAction` updated: yes (UNION; conservative; never overwrites
  prior QA1–QA7 / TEN1 / TEN2 / TRUST1 / TRUST2 / CLOUD1 / CLOUD2 /
  PROD3 wording).
- Notes added: one row each on `validation_qa` and
  `production_deployment` recording the QA8 runbook landing and
  that execution is still deferred.
