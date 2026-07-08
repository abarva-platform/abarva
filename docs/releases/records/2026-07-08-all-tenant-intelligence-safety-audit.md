# 2026-07-08-all-tenant-intelligence-safety-audit — All-Tenant Intelligence Safety Audit

## Release ID

`2026-07-08-all-tenant-intelligence-safety-audit`

## Status

`candidate`

## Plain-English Summary

Adds an all-tenant Intelligence API safety audit that checks whether retired
facts, stale display aliases, synthetic-only markers, and cross-tenant facts
appear in model-visible source packets or final Intelligence answers. The audit
keeps the existing Lakeshore retired-fact gate permanently in place and expands
the operator evidence layer across all active Intelligence tenants.

The report explicitly separates runtime safety from data hygiene. A final-answer
leak is a hard failure. A model-visible source-packet finding is a cleanup item
when it does not reach the final answer or is blocked by the runtime gate.

## Layer Impact

- `global-control-lane`: Extends the QA harness for `/api/intelligence/ask`.
  No runtime answer code changes are included.
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
    persona email, industry/domain, banned aliases, stale fact patterns,
    synthetic-only markers, cross-tenant forbidden terms, and known retired
    facts.
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

## QA / Validation

| Test | Command | Environment | Expected Result | Actual Result | Status | Evidence |
|---|---|---|---|---|---|---|
| Syntax | `node --check scripts/qa/intelligence-extensive-api-audit.mjs && node --check scripts/qa/intelligence-safety-tenant-registry.mjs` | Local clean worktree | Scripts parse. | Passed. | `PASS` | Console output |
| CLI help | `node scripts/qa/intelligence-extensive-api-audit.mjs --help` | Local clean worktree | New CLI options render. | Passed. | `PASS` | Console output |
| ESLint | `npx eslint scripts/qa/intelligence-extensive-api-audit.mjs scripts/qa/intelligence-safety-tenant-registry.mjs` | Local clean worktree | No lint errors. | Passed. | `PASS` | Console output |
| Diff whitespace | `git diff --check` | Local clean worktree | No whitespace errors. | Passed. | `PASS` | Console output |
| Single-tenant live smoke | `node scripts/qa/intelligence-extensive-api-audit.mjs --tenant lakeshore --sample-size 1 --base-url https://app.abarva.ai` | Deployed ACA runtime | Runner signs in, calls live API, writes per-turn safety diagnostics. | Passed: `1 pass / 0 watch / 0 fail`, retired-fact gate `1 passed / 0 blocked / 0 failedUnblocked`, safety findings `0`. | `PASS` | `/Users/anand/Downloads/AbarVa_lakeshore-holdings_Intelligence_Extensive_API_Audit_2026-07-08T05-45-48-458Z.html` |
| All-tenant live smoke | `node scripts/qa/intelligence-extensive-api-audit.mjs --all-tenants --sample-size 1 --base-url https://app.abarva.ai` | Deployed ACA runtime | One safety question runs for all active tenants and writes rollup. | Completed with expected nonzero findings: First Capital final answer emitted `First Capital Financial`; Apex, Meridian, First Capital, and SkyHarbor have model-visible source alias cleanup findings. | `FAIL_EXPECTED_FINDING` | `/Users/anand/Downloads/AbarVa_All_Tenant_Intelligence_Safety_Audit_2026-07-08T05-47-13-649Z.html` |

## Rollout Plan

Merge to `main`. No ACA web deployment is required for the harness itself unless
operators want the script available in the deployed image. To run the full
all-tenant safety pack live:

```bash
node scripts/qa/intelligence-extensive-api-audit.mjs \
  --all-tenants \
  --sample-size 8 \
  --base-url https://app.abarva.ai
```

## Deployment Authority

- Repo-owned deploy workflow: Not required for local operator use.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Live smoke targeted the deployed ACA runtime at
  `https://app.abarva.ai`.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes for acceptance; one-question all-tenant
  live smoke completed. Full eight-question all-tenant run remains the final
  acceptance pass.

## Rollback Plan

Revert this PR to remove the expanded harness and registry. No production data,
runtime flags, or app behavior changes need rollback.

## Audit Evidence

- Single-tenant Lakeshore smoke report:
  `/Users/anand/Downloads/AbarVa_lakeshore-holdings_Intelligence_Extensive_API_Audit_2026-07-08T05-45-48-458Z.html`
- Single-tenant Lakeshore smoke bundle:
  `/Users/anand/Downloads/abarva-intelligence-api-audits/2026-07-08T05-45-48-458Z-lakeshore-holdings-lakeshore-extensive-api-audit/`
- All-tenant one-question smoke rollup:
  `/Users/anand/Downloads/AbarVa_All_Tenant_Intelligence_Safety_Audit_2026-07-08T05-47-13-649Z.html`
- All-tenant one-question smoke summary:
  `/Users/anand/Downloads/AbarVa_All_Tenant_Intelligence_Safety_Audit_2026-07-08T05-47-13-649Z_summary.json`

## Known Gaps

- Full eight-question all-tenant live run was not completed in this PR. The
  harness is implemented and smoke-proven; the full run is expected to take
  materially longer because it calls the live Intelligence API for every tenant.
- The one-question all-tenant smoke found a real hard failure for First Capital:
  final answer emitted `First Capital Financial`, with the same alias present in
  model-visible source packets.
- Source cleanup is required for model-visible alias findings in Apex,
  Meridian, First Capital, and SkyHarbor. The current PR does not mutate data.
