# Meridian / PHS Demo — Known Gaps & How to Close Them

Honest status of what is proven in this PR versus what requires an environment
this agent cannot reach.

## Proven in this PR (repo-side, validated locally)

- **Dataset enrichment**: 10 new governed-loader-compatible templates (246 rows)
  wired into the registry + catalog. `npm run verify:meridian-context-showcase`
  passes (36 templates, 34 dimensions); `tsc --noEmit` and `eslint` pass.
- **Golden questions**: 112 Meridian hard questions; `curriculum.test.ts` passes.
- **Agent formatting**: additive Options/Assumptions CXO sections;
  `response-policy` / `prompt-contract` / `sentinel` tests pass (189).
- **Hero Move seed**: dry-run validates the full six-phase deliverable model.
- **Artifacts**: DOCX/PDF/XLSX/HTML/MD generated and verified as valid file types.
- **Embedding evidence**: 873/0/0 re-verified against Azure Log Analytics.

## Blocked from Cursor Cloud (environment, not code)

### 1. Live load of the enrichment pack into Azure Postgres

- Why: the private Azure Postgres (`pg-abarva-context-lab-001`,
  `publicNetworkAccess=Disabled`) is **network-unreachable from Cursor Cloud** —
  its private FQDN does not resolve publicly (verified via DNS + TCP probes).
- Close it: run the governed admin context-loader upload + `embed:pending-chunks`
  - Azure AI Search backfill from **inside the Azure VNet** (Container Apps
    private-worker path), exactly as the existing `job-phs-meridian-*` jobs do.
    The new templates are loader-compatible and require no code change to load.

### 2. Creating the hero Move in the live database

- Why: creating an engagement + deliverables requires DB writes to the same
  private Postgres.
- Close it: `npx tsx scripts/demo/seed-meridian-hero-move.ts --apply` with
  `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (or Azure data-plane
  equivalents) set, run from inside the VNet / private worker. Dry-run is proven.

### 3. Browser QA (screenshots + persona crawl)

- Why: the app needs valid Clerk keys **and** Azure data-plane reachability to
  render Meridian data pages; neither is available from Cursor Cloud (only the
  homepage renders without real Clerk; data pages need the private DB).
- Close it: run from an onboarded environment (real Clerk + in-VNet DB) — see
  `SCREENSHOTS.md` for the exact capture plan and the existing crawl harness:
  `npm run crawl:post-deploy -- --persona meridian-cdio,meridian-cdao
--surface intelligence-ask --question-set phs-meridian`.
  To enable manual testing, complete onboarding at https://cursor.com/onboard
  so a future agent has Clerk + data-plane access.

## Validation checklist still owed (when an in-VNet env is available)

- [ ] Admin Context Layer shows Meridian `873 embedded, 0 pending, 0 failed`.
- [ ] Enterprise Context no longer shows an unloaded-context message.
- [ ] Sentinel/Nexus answers cite Meridian evidence and avoid cross-tenant bleed.
- [ ] No giant unreadable paragraphs (Options/Assumptions sections render).
- [ ] Hero Move visible at `/strategic-moves` with all six phases.
- [ ] All six artifacts download and open from the Move.

## Out of scope (intentionally)

- No changes to `engagements`/`program_*` table names (naming doctrine).
- No new runtime dependency on Supabase/Neo4j/Pinecone.
- No `--gold` token, no signal-blue in-app primary CTAs (token discipline).
