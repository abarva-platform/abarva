# 2026-07-08-all-tenant-intelligence-safety-audit — All-Tenant Intelligence Safety Audit

## Release ID

`2026-07-08-all-tenant-intelligence-safety-audit`

## Status

`candidate`

## Plain-English Summary

Adds an all-tenant Intelligence API safety audit and extends runtime
retired/stale safety enforcement beyond Lakeshore. The audit checks whether
retired facts, stale display aliases, synthetic-only markers, and cross-tenant
facts appear in model-visible source packets or final Intelligence answers. The
runtime gate now resolves tenant-specific safety policy before synthesis and
after model output so hard safety terms are blocked before final answer
emission.

The report explicitly separates runtime safety from data hygiene. A final-answer
leak is a hard failure. A model-visible source-packet finding is a cleanup item
when it does not reach the final answer or is blocked by the runtime gate.

## Layer Impact

- `global-control-lane`: Extends the QA harness for `/api/intelligence/ask`
  and generalizes the existing Intelligence retired-fact gate from
  Lakeshore-only to tenant-policy-driven runtime enforcement.
- `client-data-lane`: No data mutation. The harness identifies tenant source
  cleanup requirements and offending source IDs.
- `internal-admin`: Adds operator-facing audit outputs: per-tenant HTML/CSV/JSON
  and an all-tenant rollup HTML/CSV/JSON.

## Client Applicability

- All clients: The audit can run against every active Intelligence tenant.
- Specific clients: Registry includes Apex Retail, Meridian Health, First
  Capital, Northstar Clinical Technologies, SkyHarbor Air, Lakeshore Holdings,
  and the Morgan Street equivalent as a non-separate Lakeshore-shape registry
  entry.
- Internal only: The audit runner is an operator QA tool.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/qa/intelligence-safety-tenant-registry.mjs`
  - Adds the all-tenant safety registry with canonical key, display name,
    persona email, industry/domain, retired aliases, stale fact patterns,
    synthetic-only markers, cross-tenant forbidden terms, source-only cleanup
    terms, and known retired facts.
- `scripts/qa/intelligence-extensive-api-audit.mjs`
  - Adds CLI support for `--all-tenants`, `--tenant <key>`,
    `--sample-size <n>`, `--inject-retired-fact`,
    `--cross-tenant-contamination`, and `--base-url <url>`.
  - Adds the shared eight-question safety pack.
  - Adds per-turn tenant-safety diagnostics alongside the existing
    retired-fact gate diagnostics.
  - Adds all-tenant rollup HTML/CSV/JSON output with tenants tested, clean,
    safe-failed, unblocked violations, source cleanup required, top stale source
    IDs, and recommended purge order.
- `src/lib/intelligence/ask/tenant-safety-policy.ts`
  - Adds runtime tenant safety policy for Apex, Meridian, First Capital,
    Northstar, SkyHarbor, and Lakeshore.
  - Separates hard blocking terms (`retiredAliases`, `staleFactPatterns`,
    `syntheticOnlyTerms`, `crossTenantForbiddenTerms`) from
    `sourceOnlyCleanupTerms`.
- `src/lib/intelligence/ask/retired-fact-gate.ts`
  - Replaces Lakeshore-only matching with tenant-policy-driven scanning of
    surface context, selected sources, assembled packets, model output,
    followups, and companion canvas payloads.
- `src/lib/intelligence/ask/__tests__/retired-fact-gate.test.ts`
  - Adds First Capital regression coverage proving `First Capital Financial`
    is blocked in source packets and model output.

## QA / Validation

| Test | Command | Environment | Expected Result | Actual Result | Status | Evidence |
|---|---|---|---|---|---|---|
| Syntax | `node --check scripts/qa/intelligence-extensive-api-audit.mjs && node --check scripts/qa/intelligence-safety-tenant-registry.mjs` | Local clean worktree | Scripts parse. | Passed. | `PASS` | Console output |
| CLI help | `node scripts/qa/intelligence-extensive-api-audit.mjs --help` | Local clean worktree | New CLI options render. | Passed. | `PASS` | Console output |
| ESLint | `npx eslint scripts/qa/intelligence-extensive-api-audit.mjs scripts/qa/intelligence-safety-tenant-registry.mjs` | Local clean worktree | No lint errors. | Passed. | `PASS` | Console output |
| Runtime gate tests | `npx jest src/lib/intelligence/ask/__tests__/retired-fact-gate.test.ts --runInBand` | Local clean worktree | Lakeshore retired facts and First Capital retired aliases are blocked in source packets/model output. | Passed: `5 passed / 0 failed`. Jest emitted pre-existing duplicate manual mock warnings for markdown test mocks. | `PASS` | Console output |
| Runtime/safety lint | `node --check scripts/qa/intelligence-extensive-api-audit.mjs && node --check scripts/qa/intelligence-safety-tenant-registry.mjs && npx eslint src/lib/intelligence/ask/retired-fact-gate.ts src/lib/intelligence/ask/tenant-safety-policy.ts src/lib/intelligence/ask/__tests__/retired-fact-gate.test.ts scripts/qa/intelligence-extensive-api-audit.mjs scripts/qa/intelligence-safety-tenant-registry.mjs` | Local clean worktree | Runtime policy, gate, tests, and audit scripts parse and lint. | Passed. | `PASS` | Console output |
| Diff whitespace | `git diff --check` | Local clean worktree | No whitespace errors. | Passed. | `PASS` | Console output |
| Release control | `npm run release:check` | Local clean worktree | Release-control gates pass. | Passed. | `PASS` | Console output |
| Single-tenant live smoke | `node scripts/qa/intelligence-extensive-api-audit.mjs --tenant lakeshore --sample-size 1 --base-url https://app.abarva.ai` | Deployed ACA runtime | Runner signs in, calls live API, writes per-turn safety diagnostics. | Passed: `1 pass / 0 watch / 0 fail`, retired-fact gate `1 passed / 0 blocked / 0 failedUnblocked`, safety findings `0`. | `PASS` | `/Users/anand/Downloads/AbarVa_lakeshore-holdings_Intelligence_Extensive_API_Audit_2026-07-08T05-45-48-458Z.html` |
| All-tenant live smoke | `node scripts/qa/intelligence-extensive-api-audit.mjs --all-tenants --sample-size 1 --base-url https://app.abarva.ai` | Deployed ACA runtime | One safety question runs for all active tenants and writes rollup. | Completed with expected nonzero findings: First Capital final answer emitted `First Capital Financial`; Apex, Meridian, First Capital, and SkyHarbor have model-visible source alias cleanup findings. | `FAIL_EXPECTED_FINDING` | `/Users/anand/Downloads/AbarVa_All_Tenant_Intelligence_Safety_Audit_2026-07-08T05-47-13-649Z.html` |
| All-tenant full live baseline | `node scripts/qa/intelligence-extensive-api-audit.mjs --all-tenants --sample-size 8 --base-url https://app.abarva.ai` | Deployed ACA runtime before this runtime-policy patch is deployed | Generate the full report and expose every unsafe emission/source cleanup item. | Completed `48` questions. Rollup failed as expected: `0` failedUnblocked, `0` final cross-tenant emissions, `5` final retired-alias emissions, `0` final synthetic-only emissions. First Capital was the only unsafe final emitter: `0 pass / 3 watch / 5 fail`, average `4.9/10`; `23` retired-alias findings, including `5` final-answer emissions of `First Capital Financial` and `18` model-visible packet findings. | `FAIL_EXPECTED_FINDING` | `/Users/anand/Downloads/AbarVa_All_Tenant_Intelligence_Safety_Audit_2026-07-08T12-05-50-147Z.html` |

## Rollout Plan

Merge to `main` and deploy through the repo-owned ACA main deploy workflow so
the generalized runtime safety gate is active in the deployed lab runtime. To
run the full all-tenant safety pack live:

```bash
node scripts/qa/intelligence-extensive-api-audit.mjs \
  --all-tenants \
  --sample-size 8 \
  --base-url https://app.abarva.ai
```

## Deployment Authority

- Repo-owned deploy workflow: Required before claiming the runtime First Capital
  alias block is live on `https://app.abarva.ai`.
- Shared runtime mutators: None.
- Approved image digest: Captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: Live smoke targeted the deployed ACA runtime at
  `https://app.abarva.ai`.
- Worker image invariant: Not applicable for this web/API gate change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes for acceptance. The full eight-question
  baseline is running against the currently deployed runtime; after merge/deploy,
  rerun First Capital and the all-tenant rollup to prove `0` unsafe final-answer
  emissions and `0` failedUnblocked.

## Rollback Plan

Revert this PR to remove the expanded harness, runtime tenant safety policy, and
generalized retired-fact gate. No production data or runtime flags need
rollback.

## Audit Evidence

- Single-tenant Lakeshore smoke report:
  `/Users/anand/Downloads/AbarVa_lakeshore-holdings_Intelligence_Extensive_API_Audit_2026-07-08T05-45-48-458Z.html`
- Single-tenant Lakeshore smoke bundle:
  `/Users/anand/Downloads/abarva-intelligence-api-audits/2026-07-08T05-45-48-458Z-lakeshore-holdings-lakeshore-extensive-api-audit/`
- All-tenant one-question smoke rollup:
  `/Users/anand/Downloads/AbarVa_All_Tenant_Intelligence_Safety_Audit_2026-07-08T05-47-13-649Z.html`
- All-tenant one-question smoke summary:
  `/Users/anand/Downloads/AbarVa_All_Tenant_Intelligence_Safety_Audit_2026-07-08T05-47-13-649Z_summary.json`
- First Capital full-run baseline report:
  `/Users/anand/Downloads/AbarVa_first-capital_Intelligence_Extensive_API_Audit_2026-07-08T12-05-50-147Z.html`
- All-tenant full-run baseline rollup:
  `/Users/anand/Downloads/AbarVa_All_Tenant_Intelligence_Safety_Audit_2026-07-08T12-05-50-147Z.html`
- All-tenant full-run baseline summary:
  `/Users/anand/Downloads/AbarVa_All_Tenant_Intelligence_Safety_Audit_2026-07-08T12-05-50-147Z_summary.json`

## Full-Run Tenant Classification

Baseline was run against the pre-patch deployed runtime. The patch in this PR
changes future runtime behavior; after deployment, hard retired/stale,
synthetic-only, and cross-tenant packet findings should block rather than reach
the model or final answer.

| Tenant key | Display name | Total | Pass/Watch/Fail | Avg score | Retired/stale/source findings | Cross-tenant findings | Final-answer emissions | Model-visible packet findings | Blocked | FailedUnblocked | Status |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `apexretail` | Apex Retail | 8 | `0/8/0` | 7.5 | 39 | 7 | 0 | 46 | 0 | 0 | Source Cleanup Required |
| `meridian` | Meridian Health System | 8 | `0/8/0` | 7.4 | 16 | 0 | 0 | 16 | 0 | 0 | Source Cleanup Required |
| `firstcapital` | First Capital | 8 | `0/3/5` | 4.9 | 23 | 0 | 5 | 18 | 0 | 0 | Unsafe Emit |
| `northstar` | Northstar Clinical Technologies | 8 | `4/4/0` | 8.9 | 0 | 0 | 0 | 0 | 0 | 0 | Clean Pass |
| `skyharbor` | SkyHarbor Air | 8 | `0/8/0` | 7.8 | 42 | 0 | 0 | 42 | 0 | 0 | Source Cleanup Required |
| `lakeshore` | Lakeshore Holdings | 8 | `4/4/0` | 8.8 | 0 | 0 | 0 | 0 | 1 | 0 | Safe-Fail |

## Known Gaps

- The full eight-question all-tenant live run is in progress against the
  currently deployed runtime and is expected to fail before this patch is
  deployed because First Capital still emits the retired alias live.
- First Capital root cause: `First Capital Financial` was present in source
  packets, but the runtime retired-fact gate was Lakeshore-specific. The audit
  registry knew the alias was stale, but that finding was report-level only and
  did not feed runtime pre-model/post-model enforcement.
- First Capital affected packets in the baseline include:
  `first-capital:structured:client_profile:09d9a267-e89c-4fe1-831f-337a62787ec5`,
  `first-capital:enterprise_profile`, `first-capital:context:keyword:*`,
  `event:intelligence-dossier`, and `event:advisory-packet`.
- Source cleanup remains required for model-visible source findings in Apex,
  Meridian, First Capital, and SkyHarbor. This PR blocks hard safety terms at
  runtime but does not mutate deployed data/source/index rows.
