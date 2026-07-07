# Azure Container Apps Cutover - Candidate Image Refresh Checkpoint

Date: 2026-06-07
Status: HISTORICAL - candidate refresh superseded by merged-main runtime proof

## Candidate image

| Field         | Value                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| Source        | PR #3240 head branch plus Docker context manifest exception                            |
| Source commit | `7c0f682d0bbd65acfe62277f390b12b68a6a4454`                                             |
| Image         | `acrabarvalab001.azurecr.io/abarva/web:cutover-pr3240-20260607-7c0f682d-manifestfix`   |
| ACR build     | PASS                                                                                   |
| Merged main?  | NO - PR #3240 is green/mergeable but still draft and could not be merged by this agent |

## Docker context fix

The first ACR build failed because `.dockerignore` excluded
`docs/enterprise-context/templates/*/manifest.json`, which is imported by
`src/lib/admin/setup-data-load-center.ts` during `next build`. The candidate
build includes a narrow context exception for those manifest files.

## Planned refresh

Refresh these Azure resources to the candidate image:

- `ca-abarva-web-lab-eastus`
- `job-supa-drain-apply-eus`
- `job-supa-recon-eus`
- `job-a24-search-canon-eus`
- `job-a24-azure-soak-eus`
- `job-supa-final-eus`

The web app command-level Supabase boot guard must remain in place.

## Non-actions

- Do not change DNS.
- Do not remove Vercel production.
- Do not pause or delete Supabase.
- Do not claim sunset-ready before signed-in QA and soak pass.

## Refresh result

| Resource                         | Result                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Web app                          | PASS: `ca-abarva-web-lab-eastus--0000050`, 100% traffic, healthy, boot guard passed                           |
| Drain apply job                  | PASS: `job-supa-drain-apply-eus` image updated                                                                |
| Reconcile job                    | PASS: `job-supa-recon-eus` image updated                                                                      |
| Search canonical job             | PASS: `job-a24-search-canon-eus` image updated                                                                |
| Search verify/count/rebuild jobs | PASS: `job-a24-search-verify-eus`, `job-a24-search-count-eus`, and `job-a24-search-rebuild-eus` image updated |
| Azure soak job                   | PASS: `job-a24-azure-soak-eus` image updated                                                                  |
| Supabase final backup job        | PASS: `job-supa-final-eus` image updated                                                                      |

## Runtime/job proof after refresh

| Step                   | Evidence                                                                                                                                                                                                              | Status |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Candidate web revision | `ca-abarva-web-lab-eastus--0000050` on image `cutover-pr3240-20260607-7c0f682d-manifestfix`; boot guard event `supabase_boot_guard_passed`                                                                            | PASS   |
| Public health          | `/api/health` returned HTTP 200 with `ok=true`, `postgres=true`, `direct_postgres=true`, `azure_graph=postgres`                                                                                                       | PASS   |
| DB proof               | Runtime connected to Azure Postgres `abarva_control` at `10.43.1.4/32`; key counts: `clients=9`, `enterprise_context_chunks=21967`, `corpus_patterns=9026`, `genome_patterns=43436`, `intelligence_graph_edges=93743` | PASS   |
| Signed-in QA           | Apex CDO and Meridian CDAO authenticated sessions loaded Home, Intelligence/Sentinel, Moves, Source, Tower, Setup/Admin with HTTP 200                                                                                 | PASS   |
| App log deny-list      | Candidate revision tail had no `supabase.co`, `pooler.supabase.com`, `NEXT_PUBLIC_SUPABASE_URL`, or `SUPABASE_SERVICE_ROLE_KEY` matches                                                                               | PASS   |
| Anthropic proof        | Azure runtime Anthropic request succeeded with `provider=anthropic`, `requestedModel=claude-opus-4-7`, `responseModel=claude-opus-4-7`, `matched=true`                                                                | PASS   |
| Azure-only smoke job   | `job-a24-azure-soak-eus-4pn97f4` succeeded; runtime smoke `9 pass / 0 fail`; retrieval smoke passed for six tenants                                                                                                   | PASS   |

## Remaining blocker

This checkpoint is superseded by the merged-main runtime proof captured in
`06-merged-main-runtime-proof.md`. Do not change DNS, remove Vercel, pause
Supabase, or delete Supabase until the required soak and sunset gates pass.
