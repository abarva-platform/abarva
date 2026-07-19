# 2026-07-19-tower-mart-writer-candidate-entity-fix — Tower Mart Writer Candidate Entity Integrity

## Release ID

`2026-07-19-tower-mart-writer-candidate-entity-fix`

## Status

`candidate`

## Plain-English Summary

Fixes the Meridian Tower mart writer so candidate AI opportunities and benefits-ledger rows receive initiative entities before their facts are written to `cio_tower.facts`. The governed ACA data-build job correctly rejected the previous projection because a candidate value/usage fact referenced `meridian-health::initiative::cand-member-ai-assist` before that entity existed.

Follow-up: the writer also reuses existing candidate entities when repeated 10 AI use-case rows share the same displayed initiative name as an SA08 benefits-ledger row. This prevents duplicate `cio_tower.entities` rows from violating the tenant/type/display-name uniqueness constraint.

Second follow-up: the writer now canonicalizes projected entities by `(tenant, entity type, display name)` before any database write, remaps fact and relationship foreign keys to the canonical entity key, and fails local validation if duplicate display identities remain. This closes the case where SA04 and SA08 use different technical keys for the same business initiative.

## Layer Impact

- `client-data-lane`: Data projection layer adds candidate initiative entity creation for SA08 benefits-ledger rows and 10 AI automation use-case candidate rows.
- `client-data-lane`: Tower mart write path adds pre-write referential integrity validation so missing fact/relationship entities fail locally before the Azure/Postgres write.
- `global-control-lane`: Runtime UI has no direct behavior change in this PR. Tower can reflect refreshed mart data only after the approved ACA data-build job succeeds.

## Client Applicability

- All clients: No direct runtime behavior change.
- Specific clients: Meridian / Healthcare Demo Tower mart write path.
- Internal only: Operator data-build execution and validation.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/tower/project-meridian-v3-to-cio-tower.mjs`
  - Adds `addIfMissing` helper.
  - Adds display-name based entity reuse for repeated candidate opportunity rows.
  - Canonicalizes duplicate projected entity displays and remaps fact/relationship references before write.
  - Creates missing candidate initiative entities from SA08 and 10 source rows.
  - Validates all projected facts and relationships have known entities before write.
  - Validates projected entities do not violate the `cio_tower.entities` tenant/type/display uniqueness rule.

## QA / Validation

- `npm run project:meridian-v3-cio-tower` — passed locally; projection keeps the intended Meridian values: $650.0M total FY26 IT budget, $487.5M run, $162.5M change, $53.7M AI-tagged non-additive spend, $3.8M partial finance-validated value, $0 realized value allowed.
- Duplicate display check — passed locally; projection emits 270 entities and 0 duplicate `(tenant, entity type, display name)` identities.
- `npm run audit:ai-value-realization-day1` — passed locally with p0=0, p1=0, findings=0.
- `git diff --check` — passed locally.

## Rollout Plan

Merge through PR, let the repo-owned ACA main deploy workflow build and deploy a digest-pinned image, then rerun the approved private ACA operator job `project:meridian-v3-cio-tower:write-job` with the deployed digest and `DATABASE_URL` secret binding.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Only the repo-owned main deploy workflow may change web traffic.
- Approved image digest: Captured after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after the Tower mart write job succeeds.

## Rollback Plan

If the writer fix misbehaves, revert this PR and redeploy through the repo-owned ACA main deploy workflow. Do not run the Tower mart write job from the reverted image. Existing `cio_tower` rows remain governed by prior successful writes unless explicitly superseded by a later approved data-build job.

## Audit Evidence

- Failed governed ACA job before fix: `/tmp/meridian-v3-cio-tower-write-job-20260719T0028Z/04-logs.txt`
- Local projection proof: `reports/meridian-v3-cio-tower-projection/summary.md`
- Local AI value realization audit: `reports/ai-value-realization-day1/audit-report.json`

## Known Gaps

This PR only fixes the writer integrity failure. It does not itself write Azure/Postgres rows, promote candidate data, update Active Tenant Access, or prove the signed-in Tower UI.
