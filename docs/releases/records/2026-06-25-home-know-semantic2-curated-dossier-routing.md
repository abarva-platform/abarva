# 2026-06-25-home-know-semantic2-curated-dossier-routing — Home KNOW Curated Dossier Routing

## Release ID

`2026-06-25-home-know-semantic2-curated-dossier-routing`

## Status

`candidate`

## Plain-English Summary

Home/aVa now attempts to answer from the curated Semantic2 dossier table before using older local dimension assembly. Broad "what context is loaded" questions render as a concise executive summary with evidence-backed branch choices, so the first answer guides the user instead of dumping every table, chart, graph, and source trail at once. QA can request an exact prompt snapshot through the existing Home KNOW debug trace path.

## Layer Impact

- `global-control-lane`: Shared Home KNOW answer routing, prompt synthesis, and response assembly changed for all clients.
- `client-data-lane`: The runtime reads tenant-scoped rows from `semantic2_dossiers`; no schema change and no data mutation are included.

## Client Applicability

- All clients: Yes, where `semantic2_dossiers` has tenant-scoped curated dossiers.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing `home_know_claude_synthesis` still controls Claude text synthesis; deterministic branch-first overview works without the flag.

## Changes Included

- `src/lib/home/know/home-know-engine.ts`: attempts Semantic2 curated dossier reads before local source fallback.
- `src/lib/semantic-dossiers/curated-dossier-store.ts`: DB reader for `semantic2_dossiers` plus tenant-level branch options.
- `src/lib/home/know/compose-dossier-answer.ts`: branch-first overview contract and first-turn artifact suppression for broad loaded-context questions.
- `src/lib/home/know/home-consultant-text-synthesis.ts`: v2 branch-first prompt and prompt snapshot trace.
- Follow-up hardening: broad `browse` answers now reject Claude output that collapses branch options into a wall of text, causing Home to fall back to the deterministic branch-first render while retaining prompt trace evidence.
- Follow-up render fix: text normalization now preserves paragraph and branch-list line breaks instead of flattening the final branch-first answer.
- Follow-up language guard: Claude output that exposes internal semantic/source mechanics such as "curated semantic," "typed facts," or "relationship paths" is rejected or normalized to client-facing language.
- Follow-up branch summary fix: deterministic fallback branch options no longer expose internal entity/fact/relationship/citation counts; they render dimension-specific exploration choices instead.
- `src/app/api/home/know/ask/route.ts`: debug-only trace payload includes the exact prompt snapshot.
- `src/lib/home/know/home-know-contract.ts` and `src/lib/semantic-dossiers/types.ts`: typed trace/branch option fields.

## QA / Validation

- Focused Jest: `./node_modules/.bin/jest src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts --runInBand` — Pass, 20 tests for the final language-guard follow-up.
- Touched-file ESLint: `./node_modules/.bin/eslint ...` — Pass.
- Full TypeScript: `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false --incremental false` — Pass.

## Rollout Plan

Merge to `main`, build the exact git SHA through ACR, update Azure Container Apps, assign 100% traffic to the new healthy revision, then run signed-in Home/aVa proof for SkyHarbor and at least one additional tenant.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps / ACA production lane.
- Shared runtime mutators: Home KNOW route and server-side answer engine.
- Approved image digest: Pending deployment.
- ACA runtime invariant: `app.abarva.ai` must run the image built from this release commit.
- Worker image invariant: No worker image change.
- Feature/env flag update path: Existing flags only; no new flag required.
- Live signed-in proof required: Yes, exact prompt trace plus visible branch-first Home/aVa answer.

## Rollback Plan

Revert this commit or redeploy the prior ACA image. No data-plane migration or destructive data change is included.

## Audit Evidence

- Focused Jest output: 20 passing Home consultant synthesis tests for the final language-guard follow-up.
- Touched-file ESLint output: pass.
- TypeScript output: pass.
- Post-deploy evidence to add: signed-in screenshot, `/api/home/know/ask` trace payload with prompt snapshot, and answer comparison for the SkyHarbor loaded-context question.

## Known Gaps

- Live signed-in browser proof and ACA deployment are pending.
