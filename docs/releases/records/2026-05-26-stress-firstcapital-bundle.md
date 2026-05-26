# 2026-05-26-stress-firstcapital-bundle — First Capital Stress Test + STRESS-P0-007 Fix + Runner Parameterization

## Release ID

`2026-05-26-stress-firstcapital-bundle`

## Status

`candidate`

## Plain-English Summary

Adds tenant-parameterization to the full-module stress runner so the same script can drive Apex Retail, Meridian Health, or First Capital Financial via a `STRESS_TENANT` env var. Then runs it against First Capital (tenant key `arcturus`) on production and patches STRESS-P0-007 — a hardcoded "in scope for Apex Retail" agentQuote on `/intelligence/solutions` that surfaced cross-tenant content to non-Apex users. Same class of defect as STRESS-P0-001..006 but in a deterministic fixture rather than the synthesizer pipeline.

## Layer Impact

- `agent-reasoning-lane`: replaces the Apex-named agentQuote in `shell-solutions-fixture.ts` with tenant-agnostic phrasing. The Solution Archetypes catalog itself is still retail-flavored (CDP Activation, Demand Forecasting, Loyalty Intelligence) but no longer claims to be "in scope for Apex Retail" when rendered for a Meridian or First Capital user.
- `ops-release-lane`: stress runner now reads `STRESS_TENANT` and `TENANT_PROFILES` registry — per-tenant persona email, identity markers, wrong-tenant terms, leakage regex, grounding regex+flag, and 10 vertical-specific agent questions. AUDIT_DIR auto-derives from tenant + ISO timestamp. Same runner can drive all three composite tenants.
- No schema change. No tenant data write.

## Client Applicability

- All clients: yes — the agentQuote fix removes Apex content from a page seen by every signed-in client.
- Specific clients: First Capital Financial (arcturus) and Meridian Health benefit immediately; Apex Retail sees the same generic phrasing on its own /intelligence/solutions surface.
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/intelligence/shell-solutions-fixture.ts` — agentQuote rewritten to drop "Apex Retail" naming
- `scripts/audit/run-full-module-stress.mjs` — tenant parameterization, three TENANT_PROFILES (meridian / arcturus / apexretail), per-tenant scoring, per-tenant question banks, auto-derived AUDIT_DIR, uploads-in seeding
- First Capital stress report: `audit-artifacts/full-module-stress-arcturus-2026-05-26T00-49/FULL_MODULE_STRESS_TEST_REPORT.html`

## QA / Validation

- `node --check scripts/audit/run-full-module-stress.mjs`: **passed**.
- Initial First Capital stress run against `https://nexus-vert-kappa.vercel.app`: **passed** (10/10 turns completed, 80 routes captured, 80 ai_egress_audit rows written, 0 P0 leakage in agent transcripts, agent correctly confessed empty substrate rather than fabricating).
- Cross-tenant defects in UI pages: **passed detection** — runner flagged 10 pages with cross-tenant refs (Apex Retail / Meridian Health) appearing on First Capital surfaces, of which /intelligence/solutions is fixed by this PR.
- Lint on changed files: **passed** (no warnings).
- Verification re-run after this PR merges will confirm the agentQuote regression closes.

## Rollout Plan

Merge to `main`, allow the production post-deploy crawl to pass, then re-run the First Capital stress test via `STRESS_TENANT=arcturus node scripts/audit/run-full-module-stress.mjs` and confirm:
- /intelligence/solutions no longer contains "Apex Retail" in its agentQuote
- No regression on Meridian or Apex runs

## Rollback Plan

Revert the merge commit. The agentQuote change is pure-text in a deterministic fixture; the runner change is dev-tooling only. No schema, no policy, no tenant-data write.

## Audit Evidence

- Pre-fix stress report: `audit-artifacts/full-module-stress-arcturus-2026-05-26T00-49/FULL_MODULE_STRESS_TEST_REPORT.html`
- Pre-fix transcripts: `audit-artifacts/full-module-stress-arcturus-2026-05-26T00-49/transcripts/`
- Post-merge re-run report will be attached.

## Known Gaps

- 9 other pages still leak Apex Retail or Meridian content to non-tenant users (`/home/learn`, `/source/learn`, `/intelligence/context-demo`, `/admin/invite`, `/admin/production-readiness`, `/admin/tenant`, `/admin/releases`, `/product`, `/evidence-ledger`). Most are intentional cross-tenant comparison surfaces (learn pages, marketing /product, admin/releases ledger). Fixing the ones that aren't intentional is broader than this PR.
- 7 routes return 404 in production (`/tower/lens`, `/tower/pressures`, `/tower/programs`, `/admin/agents`, `/admin/programs`, `/admin/atlas`, `/admin/segments`) because they have sub-directories but no top-level `page.tsx`. The runner spec still lists them. Fix is either trim the runner spec further or add stub redirect pages — deferred.
- First Capital substrate is still empty (same gap as Meridian was before PR #2348). Sentinel correctly confesses missing data rather than fabricating, but agent turns can't be substantive until the Packet 20 data pack lands.
- Tasks #17 (third-generation tenant-bleed source via `ai_egress_audit` inspection) remains open.
