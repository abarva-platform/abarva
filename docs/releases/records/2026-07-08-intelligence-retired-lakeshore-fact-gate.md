# 2026-07-08-intelligence-retired-lakeshore-fact-gate — Intelligence Retired Fact Gate

# Intelligence Retired Lakeshore Fact Gate — Test Results

## Date

`2026-07-08`

## Scope

Backend truth-control validation for retired Lakeshore facts in the Intelligence API.

## Objective

Prove that retired Lakeshore facts cannot enter model-visible context or be emitted in final Intelligence answers, canvas payloads, sources, or follow-up questions.

## Current Status

| Area | Status | Meaning |
|---|---|---|
| Local backend safety gate | `PROVEN` | Controlled stale-fact injection was blocked before DB retrieval and before model invocation. |
| Local quality audit | `BLOCKED BY DATA-PLANE REACHABILITY` | Laptop dev server could not resolve/reach Azure Postgres lab hostname. |
| Stale source inventory | `COMPLETED` | Local stale-marker inventory generated and classified. |
| Data/index purge | `OPEN` | Stale material remains in source packs/scripts and must be purged, quarantined, or marked inactive. |
| Live Azure runtime | `NOT YET PROVEN` | Needs PR/merge/ACA deploy and live API audit on `https://app.abarva.ai`. |
| Production readiness | `PENDING LIVE ACA AUDIT` | Do not claim production fixed until the live audit passes. |

## Changed Areas

- Retired-fact runtime gate
- Intelligence ask shared path
- Alternate `/api/intelligence/ask` branches
- Audit diagnostics
- Controlled injection testing
- Stale-source inventory
- Lakeshore display-name canonicalization
- `agent_ready` fact governance enforcement

## Release ID

`2026-07-08-intelligence-retired-lakeshore-fact-gate`

## Status

`candidate`

## Plain-English Summary

The Lakeshore Intelligence API audit found retired profile facts still reaching model-visible context and generated answers. This release adds a hard retired-fact gate around the Intelligence answer path so retired Lakeshore revenue, employee, plant, budget, alias, and old portfolio-company claims are blocked before they can be emitted to the user.

This is not a prompt-polish fix. It is a governed enterprise-context safety control while the underlying Postgres/Search/cache/source-pack cleanup is completed.

## Layer Impact

- `global-control-lane`: Adds a shared Intelligence API safety gate, route-level circuit breaker, advisory bundle strictness option, client-name canonicalization fix, API audit runner, and stale-source inventory runner. The retired-fact gate is tenant-scoped, with Lakeshore retired-fact patterns only applying to Lakeshore aliases.
- `client-data-lane`: Blocks known retired Lakeshore facts from model-visible packets and final answer packets. It does not yet purge stale source rows from Azure/Postgres/Search.
- `internal-admin`: Adds an extensive API-first audit runner that records raw streams, parsed answers, flags, scores, retired-fact gate diagnostics, CSV, JSON, and HTML evidence bundles. Adds a repeatable stale-source inventory script.

## Client Applicability

- All clients: The Intelligence route-level safety plumbing is shared.
- Specific clients: Lakeshore retired-fact rules are active for Lakeshore tenant keys and aliases only.
- Internal only: The audit runner is an operator QA script.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/retired-fact-gate.ts`: Canonical scanner and error builder for known retired Lakeshore facts.
- `src/lib/intelligence/ask/index.ts`: Early surface-context scan before DB retrieval, pre-model scan of selected sources/context packets, post-generation scan before streaming answer deltas, and scans for canvas/followups.
- `src/app/api/intelligence/ask/route.ts`: Route-level circuit breaker for early surface context, Home Know, Sentinel IT-productivity, and composed agent-answer packets that bypass or wrap the shared generator.
- `src/lib/intelligence/ask/__tests__/retired-fact-gate.test.ts`: Focused unit coverage for Lakeshore blocking, non-Lakeshore non-blocking, and generated-output/followup scanning.
- `src/lib/client-config.ts`: Removes the duplicate stale Lakeshore client option and ensures retired Lakeshore Industries names canonicalize to Lakeshore Holdings in user-visible display.
- `src/lib/__tests__/client-config-canonical.test.ts`: Locks retired Lakeshore alias canonicalization to Lakeshore Holdings.
- `src/lib/governance/agent-context-bundle.ts`: Adds `requireAgentReady` so advisory/model-visible bundles can enforce active `agent_ready` facts only while diagnostic surfaces can still inspect warn-level context.
- `src/lib/governance/__tests__/agent-context-bundle.test.ts`: Proves retired candidates are blocked and advisory bundles can require `agent_ready`.
- `scripts/qa/intelligence-extensive-api-audit.mjs`: Tenant-scoped API-first audit runner for extensive Intelligence response recording and scoring, now with retired-fact gate diagnostics and a controlled stale-fact injection mode.
- `scripts/qa/lakeshore-stale-source-inventory.mjs`: Repeatable local stale-source inventory with remediation classification.
- `docs/releases/records/2026-07-08-intelligence-retired-lakeshore-fact-gate.md`: Release evidence, validation status, live acceptance checklist, and known gaps.

## QA / Validation

| Test | Command | Environment | Expected Result | Actual Result | Status | Evidence Artifact |
|---|---|---|---|---|---|---|
| Release gate | `npm run release:check` | Local repo | Release, deploy-authority, and pilot-loader gates pass. | Passed. | `PASS` | Console output from local run. |
| Focused ESLint | `npx eslint src/app/api/intelligence/ask/route.ts src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/retired-fact-gate.ts src/lib/intelligence/ask/__tests__/retired-fact-gate.test.ts src/lib/client-config.ts src/lib/__tests__/client-config-canonical.test.ts src/lib/governance/agent-context-bundle.ts src/lib/governance/__tests__/agent-context-bundle.test.ts scripts/qa/intelligence-extensive-api-audit.mjs scripts/qa/lakeshore-stale-source-inventory.mjs` | Local repo | No lint errors. | Passed. | `PASS` | Console output from local run. |
| Focused Jest | `npx jest src/lib/intelligence/ask/__tests__/retired-fact-gate.test.ts src/lib/governance/__tests__/agent-context-bundle.test.ts src/lib/__tests__/client-config-canonical.test.ts --runInBand` | Local repo | Retired-fact, governance, and canonical-name tests pass. | Passed, `22/22` tests. Jest emitted pre-existing duplicate manual mock warnings for mdast/micromark mocks. | `PASS` | Console output from local run. |
| QA script syntax | `node --check scripts/qa/intelligence-extensive-api-audit.mjs && node --check scripts/qa/lakeshore-stale-source-inventory.mjs` | Local repo | Both QA scripts parse. | Passed. | `PASS` | Console output from local run. |
| Diff whitespace | `git diff --check -- <changed files>` | Local repo | No whitespace/check issues. | Passed. | `PASS` | Console output from local run. |
| Controlled retired-fact injection | `INTEL_AUDIT_BASE_URL=http://localhost:3000 INTEL_AUDIT_TENANT=lakeshore INTEL_AUDIT_LIMIT=1 INTEL_AUDIT_INJECT_RETIRED_FACT=1 node scripts/qa/intelligence-extensive-api-audit.mjs` | Local dev server | Injected retired fact is blocked before DB/model. | `retiredFactGate.blocked=1`; `failedUnblocked=0`; `preModelGateStatus=fail_blocked`; `postModelGateStatus=pass`; violation location `surfaceContext`. | `PASS` | `/Users/anand/Downloads/AbarVa_lakeshore-holdings_Intelligence_Extensive_API_Audit_2026-07-08T02-43-51-133Z.html` |
| Local non-injected quality audit | `INTEL_AUDIT_BASE_URL=http://localhost:3000 INTEL_AUDIT_TENANT=lakeshore INTEL_AUDIT_LIMIT=8 node scripts/qa/intelligence-extensive-api-audit.mjs` | Local dev server | Quality audit should reach data plane and score answers. | Could not complete quality scoring because local dev server could not resolve Azure Postgres: `getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com`. Retired-fact diagnostics showed `failedUnblocked=0`. | `BLOCKED` | `/Users/anand/Downloads/AbarVa_lakeshore-holdings_Intelligence_Extensive_API_Audit_2026-07-08T02-41-19-914Z.html` |
| Stale-source inventory | `node scripts/qa/lakeshore-stale-source-inventory.mjs` | Local repo | Generate inventory of stale Lakeshore markers without mutating files. | Completed. Found `7,568` stale-marker hits across `80` files, mostly superseded generated V7 holdco packs, retired/superseded V4 packs, or generator scripts. | `PASS` | `/Users/anand/Downloads/AbarVa_Lakeshore_Stale_Source_Inventory_2026-07-08T02-38-59-900Z.html` |
| Live full Lakeshore API audit | `INTEL_AUDIT_BASE_URL=https://app.abarva.ai INTEL_AUDIT_TENANT=lakeshore node scripts/qa/intelligence-extensive-api-audit.mjs` | Deployed ACA runtime | Full audit completes; no unblocked retired facts in raw stream/final answer/canvas/followups. | Not run yet. Requires PR/merge/ACA deploy. | `NOT RUN` | To be attached after live deployment. |
| Live injected retired-fact audit | `INTEL_AUDIT_BASE_URL=https://app.abarva.ai INTEL_AUDIT_TENANT=lakeshore INTEL_AUDIT_LIMIT=1 INTEL_AUDIT_INJECT_RETIRED_FACT=1 node scripts/qa/intelligence-extensive-api-audit.mjs` | Deployed ACA runtime | Injected stale fact deterministically returns `retired_fact_violation`. | Not run yet. Requires PR/merge/ACA deploy and safe operator approval for injection against live. | `NOT RUN` | To be attached after live deployment. |

## Controlled Injection Test

Command:

```bash
INTEL_AUDIT_BASE_URL=http://localhost:3000 \
INTEL_AUDIT_TENANT=lakeshore \
INTEL_AUDIT_LIMIT=1 \
INTEL_AUDIT_INJECT_RETIRED_FACT=1 \
node scripts/qa/intelligence-extensive-api-audit.mjs
```

Result:

- `retiredFactGate.blocked`: `1`
- `failedUnblocked`: `0`
- `preModelGateStatus`: `fail_blocked`
- `postModelGateStatus`: `pass`
- violation location: `surfaceContext`
- blocked terms: `old_revenue_54_2b`, `old_employee_count_72000`, `old_plant_count_89`, `old_tech_budget_1_8b`, `old_alias_lakeshore_industries`

Conclusion:

The stale-fact gate blocks known retired Lakeshore facts before DB retrieval and before model invocation.

## Local Non-Injected Quality Audit

Result:

Could not complete from laptop dev server because the Azure Postgres lab hostname was not reachable:

```text
getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com
```

Conclusion:

This is an environment/data-plane reachability limitation, not a failed validation of the retired-fact gate. Full quality scoring requires execution from an environment with Azure Postgres access or against the deployed ACA runtime.

- Note: Jest prints existing duplicate manual mock warnings for mdast/micromark mocks, but the focused test suite passes.

## Rollout Plan

Merge through PR to `main`, let the repo-owned ACA main deploy workflow build and deploy the image, then rerun the extensive API audit against `https://app.abarva.ai` for Lakeshore. The live audit must prove retired fact claims return `retired_fact_violation` or are absent from model-visible answers before this can be considered live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this release candidate.
- Approved image digest: To be captured by the ACA deploy workflow.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Not applicable to this API-only release candidate.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, rerun API audit and representative browser UX proof on `app.abarva.ai`.

## Rollback Plan

Revert the PR or redeploy the previous ACA image digest. The rollback removes the hard retired-fact block but does not change source data.

## Audit Evidence

- Extensive Lakeshore API audit report: `/Users/anand/Downloads/AbarVa_lakeshore-holdings_Intelligence_Extensive_API_Audit_2026-07-08T00-09-54-917Z.html`
- Reviewed critical findings: `/Users/anand/Downloads/AbarVa_lakeshore-holdings_Intelligence_Extensive_API_Audit_2026-07-08T00-09-54-917Z_reviewed-critical-findings.html`
- Audit output directory: `/Users/anand/Downloads/abarva-intelligence-api-audits/2026-07-08T00-09-54-917Z-lakeshore-holdings-extensive-api-audit/`
- Local injected gate proof report: `/Users/anand/Downloads/AbarVa_lakeshore-holdings_Intelligence_Extensive_API_Audit_2026-07-08T02-43-51-133Z.html`
- Local injected gate proof directory: `/Users/anand/Downloads/abarva-intelligence-api-audits/2026-07-08T02-43-51-133Z-lakeshore-holdings-extensive-api-audit/`
- Local non-injected blocked quality audit report: `/Users/anand/Downloads/AbarVa_lakeshore-holdings_Intelligence_Extensive_API_Audit_2026-07-08T02-41-19-914Z.html`
- Stale-source inventory report: `/Users/anand/Downloads/AbarVa_Lakeshore_Stale_Source_Inventory_2026-07-08T02-38-59-900Z.html`
- Stale-source inventory directory: `/Users/anand/Downloads/abarva-lakeshore-stale-source-inventory/2026-07-08T02-38-59-900Z/`

## Stale Source Inventory Finding

Stale Lakeshore source material still exists in local packs/scripts, including old V4/V7 Lakeshore data and `scripts/v7/build-lakeshore-holdco-v7.mjs`.

Current risk:

Runtime gate reduces answer risk, but stale material remains in the codebase/data pipeline and must be purged, quarantined, or marked inactive.

## Live Validation Checklist

After PR / merge / ACA deploy:

- [ ] Verify deployed image/version and ACA runtime invariant.
- [ ] Confirm 100% traffic points to the new ACA revision.
- [ ] Run full Lakeshore API audit against `https://app.abarva.ai`.
- [ ] Run injected retired-fact audit against live if approved as safe.
- [ ] Confirm `failedUnblocked=0`.
- [ ] Confirm `0` retired facts in raw stream.
- [ ] Confirm `0` retired facts in final answer.
- [ ] Confirm `0` retired facts in canvas payload.
- [ ] Confirm `0` retired facts in followups.
- [ ] Confirm retired-fact diagnostics appear in HTML report.
- [ ] Attach live report path/artifact.
- [ ] Update this release record with final live result.

## Known Gaps

- Stale Lakeshore facts still need to be purged or retired in the underlying Azure/Postgres/Search/cache/source-pack layers.
- This gate blocks the known retired Lakeshore claims from API output; it is not a substitute for source-of-truth cleanup.
- The inventory found 7,568 local stale-marker hits across 80 files. Most are superseded generated Lakeshore V7 holdco files, retired/superseded V4 packs, or generator scripts; these must be marked retired/quarantined or repaired before any rebuild/index job.
- Azure live proof is not complete. The deployed app must be rebuilt/deployed through the ACA main workflow and then re-audited against `https://app.abarva.ai`.
- A follow-up data job should report `loaded`, `indexed`, `retrievable`, and `cited` states separately after cleanup.

## Open Remediation

1. Purge or quarantine retired Lakeshore packs.
2. Rebuild Azure/Postgres/Search indexes after cleanup.
3. Enforce active `agent_ready` facts in all advisory/model-visible packets.
4. Extend generic fact-status lifecycle mapping for source data:
   - `active`
   - `retired`
   - `superseded`
   - `disputed`
   - `synthetic_only`
   - `test_fixture_only`
5. Deploy through ACA.
6. Rerun full Lakeshore API audit against `https://app.abarva.ai`.

## Live Release Acceptance Criteria

- Full API audit completes against `https://app.abarva.ai`.
- `0` unblocked retired Lakeshore facts.
- `0` retired Lakeshore facts in raw stream.
- `0` retired Lakeshore facts in final answer.
- `0` retired Lakeshore facts in canvas payload.
- `0` retired Lakeshore facts in followups.
- Audit report includes pre-model and post-model retired-fact diagnostics.
- Any injected retired fact deterministically fails with `retired_fact_violation`.
