# 2026-07-23-home-knowledge-v4-contract-repair — Home V4 Safe Packet Contract Repair

## Release ID

`2026-07-23-home-knowledge-v4-contract-repair`

## Status

`candidate`

## Plain-English Summary

Repairs the Home Knowledge Pack V4 candidate-generation contract after the all-tenant review bundle correctly failed closed. The fix prevents Claude writer prompts from seeing raw source filenames, template/table names, evidence IDs, and raw inventory-count language while preserving that lineage in a separate audit-only metadata file. It also separates content classification, evidence maturity, and business-object classification so use-case governance does not fight the generic claim-classification enum.

## Layer Impact

- **Generation/operator layer:** Updates `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`.
- **Runtime UI:** No direct runtime UI change.
- **Data plane:** No Postgres writes and no Home pack publication in this release.
- **Governance/review layer:** Candidate content remains fail-closed until validation and human approval pass.

## Client Applicability

- All clients: none directly; this does not alter any approved runtime Home content.
- Specific clients: synthetic/demo tenant candidate generation only.
- Internal only: Home V4 review-bundle generation and validation workflow.
- Public/demo only: no public route change.
- Feature flag: none.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`
  - Bumps the Home V4 prompt contract to `home-knowledge-v4-business-transformation-prompt-first-20260723-safe-packet-v3`.
  - Adds a writer-safe context packet that replaces source-file/table/evidence internals with business coverage areas.
  - Emits `source-lineage-metadata.json` per tenant for audit-only raw source provenance.
  - Splits closed enums into content classification, evidence maturity, and business-object classification.
  - Requires complete coherence-review responses with `approval_recommendation`, `reason`, `violations`, `source_sections_to_regenerate`, and `sections_to_regenerate`.
  - Makes visual validation schema-aware so relationship graphs are validated as relationship graphs, while normal executive prose is not failed for ordinary words such as “landscape.”
  - Adds `--packet-only` for fast preflight proof that prompt-visible packets are clean before spending Claude generation calls.
- `docs/releases/records/2026-07-23-home-knowledge-v4-contract-repair.md`
  - Records release scope, QA, rollout, and rollback.

## QA / Validation

- pass: `node --check scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`
- pass: `node scripts/knowledge/build-home-knowledge-v4-review-pack.mjs --tenant=all --packet-only --out-dir=/tmp/home-v4-packet-all-v3e`
- pass: packet scan confirmed all five prompt-visible tenant packets have no CSV/XLSX/JSON/parquet filenames, no evidence IDs, no raw rows/records/nodes/edges/files language, and no active-coverage counts.
- pass: audit-only lineage metadata still preserves raw filenames outside the Claude writer prompt.
- blocked locally: full Claude regeneration requires `ANTHROPIC_API_KEY`; this must run through the governed ACA operator job after merge/deploy.

## Rollout Plan

Merge through PR and deploy through the ACA main lane. After the deployed image contains this contract repair, run the governed ACA operator job with the Anthropic secret to regenerate a focused SkyHarbor candidate first. Candidate output remains review-only unless validation and human review pass.

## Deployment Authority

- Repo-owned deploy workflow: required before ACA operator regeneration uses this code.
- Shared runtime mutators: none in this change; no direct traffic mutation outside the ACA main deploy.
- Approved image digest: to be captured after ACA main deploy.
- ACA runtime invariant: required after deploy before running the operator job.
- Worker image invariant: required after deploy before running the operator job.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this script-only contract repair; required before any candidate Home content is published or claimed live.

## Rollback Plan

Revert this commit. Existing approved Home packs are unaffected because this release does not publish candidate content.

## Audit Evidence

- Prior failed bundle: `/Users/anand/Downloads/home-knowledge-v4-review-generated-2026-07-23-v2.zip`
- All-tenant packet proof: `/tmp/home-v4-packet-all-v3e`
- PR URL, CI, deploy run, deployed digest, and operator proof bundle to be added after PR/deploy.

## Known Gaps

- Full SkyHarbor candidate regeneration has not run locally because the local environment intentionally lacks `ANTHROPIC_API_KEY`.
- No candidate content has been loaded into Postgres or approved for Home runtime.
