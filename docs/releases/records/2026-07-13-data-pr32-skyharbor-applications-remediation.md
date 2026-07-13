# 2026-07-13-data-pr32-skyharbor-applications-remediation — SkyHarbor Applications Candidate Regeneration

## Release ID

`2026-07-13-data-pr32-skyharbor-applications-remediation`

## Status

`candidate`

## Plain-English Summary

DATA-PR32 fixes the first source-rich/candidate-thin gap found by DATA-PR31. It selects the authoritative SkyHarbor applications/systems source, maps it through a canonical applications/systems adapter profile, regenerates an inactive candidate preview for that one domain, attaches evidence references, plans relationship candidates, and surfaces the result in the Admin Data Layer Explorer.

This is not an active data promotion. It does not change default Home, aVa, Intelligence, Moves, Source, Tower, or the Active Tenant Access Layer.

## Layer Impact

- Release lane: `client-data-lane` for SkyHarbor inactive candidate proof metadata and reports; `internal-admin` for Admin Data Layer Explorer visibility.
- Evidence Registry: every accepted application/system candidate carries source file and row provenance.
- Canonical Fact Store: canonical application/system records are generated as dry-run candidate objects only.
- Enterprise Relationship Graph: relationship candidates are planned for business function, platform, owner, vendor, and source evidence links.
- Derived Intelligence Store: no active derived intelligence is updated; only inactive preview/remediation summaries are produced.
- Active Tenant Access Layer: unchanged.
- Module Context APIs: unchanged; modules do not read candidate data by default.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: SkyHarbor Air inactive candidate remediation only.
- Internal only: Admin Data Layer Explorer visibility and deterministic audit reports.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `applications-systems-estate/v1` mapping profile.
- Adds `scripts/audit/build-skyharbor-applications-candidate.ts`.
- Adds `npm run audit:skyharbor-applications-candidate`.
- Adds SkyHarbor applications/systems candidate regeneration library.
- Adds deterministic reports under `reports/data-remediation/skyharbor-applications/latest/`.
- Adds Admin Data Layer Explorer section for DATA-PR32 remediation status.
- Adds focused regression tests for source selection, evidence attachment, relationship planning, guardrails, and Admin visibility.
- Adds the 412-app supporting portfolio source under repo-backed supporting evidence so deployed Admin fallback proof does not depend on a local Downloads path.

## QA / Validation

- Pass: `npm run audit:skyharbor-applications-candidate`
- Pass: applications/systems adapter tests
- Pass: evidence attachment tests
- Pass: relationship candidate tests
- Pass: quarantine tests
- Pass: source conflict tests
- Pass: `npm run audit:data-quality:all-tenants`
- Pass: `npm run audit:tenant-manifest-completeness`
- Pass: `npm run audit:source-projection:all-tenants`
- Pass: `npm run audit:home-ava-representation`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false`
- Pass: `git diff --check`

## Rollout Plan

Merge by PR into `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow. The runtime change is read-only Admin visibility plus deterministic report generation. No production tenant data write, candidate promotion, or Active Tenant Access update is part of rollout.

## Deployment Authority

- Repo-owned deploy workflow: required for `app.abarva.ai` after merge.
- Shared runtime mutators: none in this PR.
- Approved image digest: captured after ACA main deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required by deploy workflow when applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: `/admin/data-layer-explorer`, default `/home`, and optional `/home?candidatePreview=true` guardrail check.

## Rollback Plan

Revert the PR and redeploy the previous known-good ACA image through the repo-owned main deploy workflow. Because this PR does not write production data, promote a candidate, or alter Active Tenant Access, rollback is code/report visibility only.

## Audit Evidence

- PR URL: to be added.
- Deterministic report bundle: `reports/data-remediation/skyharbor-applications/latest/`.
- Admin route proof: to be captured after deploy.
- ACA revision, digest, traffic, health, and runtime invariant: to be captured after deploy.

## Known Gaps

- This remediates only SkyHarbor applications/systems.
- It does not remediate all SkyHarbor domains.
- It packages the 412-app supporting source for deployed proof parity, but does not fully align Admin upload landing paths; that remains DATA-PR33.
- It does not promote candidate data.
- It does not update default Home or runtime module reads.
