# 2026-06-20-scb-activate-apex-intelligence — Activate the faculty on Apex Intelligence

## Release ID

`2026-06-20-scb-activate-apex-intelligence`

## Status

`candidate`

## Plain-English Summary

Activates the Shared Context Brain on the Intelligence ask for the `apexretail` demo tenant by adding it to the `scb_shared_engine_intelligence` includeTenants allowlist. With this on, an Apex Intelligence question routes to the relevant Consilium expert(s) — for a retail walkthrough that means loyalty/personalization + store-ops + the CIO/IT-estate experts — and their authored benchmarks/AI-plays/hedges are injected into synthesis, with contributing experts surfaced. This is the first live activation of the faculty (built + golden-eval'd but never before flipped on for any tenant). Every other tenant stays off.

## Layer Impact

- **global-control-lane (runtime activation, single tenant):** flips one tenant in the `scb_shared_engine_intelligence` flag allowlist. Changes the Intelligence answer-assembly path for `apexretail` only; all other tenants unchanged (flag still off).

## Client Applicability

- All clients: No — every other tenant stays off.
- Specific clients: Yes — `apexretail` (synthetic retail demo tenant) only.
- Internal only: No.
- Public/demo only: Demo tenant (`apexretail`).
- Feature flag: `scb_shared_engine_intelligence` includeTenants → `["apexretail"]`.

## Changes Included

- `src/lib/features/registry.ts` — `scb_shared_engine_intelligence` includeTenants `[]` → `["apexretail"]`.

## QA / Validation

Validation: Pass (flag resolution) + not run (signed-in answer proof — pending). `isFeatureEnabled` unit check confirms the flag now resolves TRUE for `apexretail` and FALSE for other tenants (`skyharbor`) and for a null client. The route-injection that consumes the flag (`src/lib/intelligence/ask/index.ts`) was shipped + golden-eval'd previously (35/35). The end-to-end signed-in proof — sign in as an `apexretail` user, ask an Intelligence question, confirm the answer grounds in the expert(s) and surfaces contributing experts with no cross-tenant leak — is NOT yet run; it requires the running app + real Clerk credentials and is the gating step before this is shown to anyone.

## Rollout Plan

Merge to `main`; `aca-main-deploy` auto-deploys on push. Activation takes effect for `apexretail` on that deploy. THEN run the signed-in parity proof before relying on it for any walkthrough. Staged: one demo tenant first; widen only after parity holds.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` (auto-deploys on push to `main`).
- Shared runtime mutators: none (no DB migration; static flag change).
- Approved image digest: built by the deploy workflow from this commit.
- ACA runtime invariant: web app serves the updated flag set after deploy.
- Worker image invariant: n/a.
- Feature/env flag update path: `scb_shared_engine_intelligence` includeTenants in `registry.ts` (this change).
- Live signed-in proof required: **Yes — pending.** Must verify an Apex signed-in Intelligence answer grounds in the expert(s) before showing it. Not yet done.

## Rollback Plan

Revert this PR (remove `apexretail` from includeTenants) and redeploy — instant, no data migration. The flag-off path is byte-identical to pre-activation.

## Known Gaps

- Signed-in answer proof not yet run (the gating step above).
- Cache/runtime parity (latency, citation render) unobserved live.
- Only Intelligence is activated for Apex; Source/Tower remain off.

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-activate-apex` → `main`.
- CI: `npm run release:check`; `isFeatureEnabled` resolution check (apex=true, others=false).
