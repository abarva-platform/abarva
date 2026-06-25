# 2026-06-25-home-dossier-answer-lane — Home Dossier Answer Lane Hardening

## Release ID

`2026-06-25-home-dossier-answer-lane`

## Status

`candidate`

## Plain-English Summary

Home/aVa now routes every Home question through the same dimension-context answer standard before it renders prose, tables, charts, graphs, gaps, or handoffs. The change removes weak alternate answer lanes that could lead with row counts, internal labels, fragment-style lookup language, or false no-data responses when loaded context exists.

## Layer Impact

- `global-control-lane`: Shared Home/aVa answer routing, answer validation, and UI rendering are hardened for all clients.
- `global-control-lane`: Stale Home subroutes are removed or redirected so the primary Home experience cannot fall back to older pages.
- `global-control-lane`: QA scripts now score answer relevance, requested artifacts, tenant safety, and user-facing language rather than only response shape.

## Client Applicability

- All clients: Yes, the shared Home/aVa path applies platform-wide.
- Specific clients: Local proof covers SkyHarbor and Lakeshore question banks.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home Claude synthesis flag behavior is preserved; deterministic dossier-first fallback remains available.

## Changes Included

- Added shared Home answer relevance gate for dimension fit, requested artifacts, handoff behavior, and forbidden user-facing language.
- Removed Home exact/graph bypass behavior so exact, table, chart, and graph requests still start from the same dimension context standard.
- Hardened semantic dimension routing for plural vendor, contract, integration, AI, risk, lineage, and operating-model questions.
- Cleaned Home answer renderer language and source labels so internal classes, IDs, and packet terminology do not appear in the primary answer UI.
- Deleted stale Home subpages for decision, source, training, and AI initiatives, with proxy redirects to supported destinations.
- Added prompt/response dump script for side-by-side inspection of the Home Claude prompt packet and response path.

## QA / Validation

- `NODE_OPTIONS='--require ./src/scripts/_mock-server-only-preload.cjs' npx tsx scripts/qa/home-dossier-crawl.ts` — passed `54/54` local SkyHarbor/Lakeshore dossier crawl questions with `0` critical failures.
- `NODE_OPTIONS='--require ./src/scripts/_mock-server-only-preload.cjs' HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED=false npx tsx scripts/qa/dump-home-claude-prompt-response.ts` — wrote prompt/response dump to Downloads for four representative questions.
- `npx jest src/lib/home/know/__tests__/home-know-engine.test.ts src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts src/lib/semantic-dossiers/__tests__/universal-dimension-dossier.test.ts src/components/home/__tests__/HomeSurface.test.tsx src/components/home/know/__tests__/HomeKnowAsk.test.tsx src/components/home/know/__tests__/HomeKnowAnswerRenderer.test.tsx tests/home-know/home-answer-relevance-gate.test.ts --runInBand` — passed `67/67`.
- `npx eslint ...` on touched Home, semantic dossier, QA, proxy, and test files — passed.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit` — blocked by pre-existing missing dependency/type declarations outside this lane: `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`.

## Rollout Plan

Merge to `main`, build the exact git SHA into Azure Container Registry, deploy through Azure Container Apps, assign 100% traffic to the healthy revision, then run signed-in Home/aVa browser proof against `https://app.abarva.ai/home`.

## Deployment Authority

- Repo-owned deploy workflow: ACA control-lane release path.
- Shared runtime mutators: Home/aVa shared answer route and renderer.
- Approved image digest: Pending deployment.
- ACA runtime invariant: `app.abarva.ai` must run through Azure Container Apps, not Vercel.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Existing Home synthesis flag behavior is preserved.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this release commit or redeploy the prior healthy ACA image. No database migration is included.

## Audit Evidence

- Local crawl report: `proof/home-dossier-crawl-20260625/crawl-results.json`
- Local endpoint audit: `proof/home-dossier-crawl-20260625/endpoint-audit.json`
- Prompt/response dump: `/Users/anand/Downloads/home-claude-prompt-response-dump-2026-06-25T11-50-57-387Z.html`
- Prompt/response JSON: `/Users/anand/Downloads/home-claude-prompt-response-dump-2026-06-25T11-50-57-387Z.json`

## Known Gaps

- Production is not updated until this candidate is merged and deployed through ACA.
- Live Claude synthesis was not called from this local shell because local `ANTHROPIC_API_KEY`, Clerk, and production DB environment variables were not available here.
- Repo-wide TypeScript remains blocked by pre-existing missing dependency/type declarations outside this Home answer lane.
