# 2026-06-25-home-know-dimension-dossiers — Home KNOW Dimension Dossier Answer Path

## Release ID

`2026-06-25-home-know-dimension-dossiers`

## Status

`candidate`

## Plain-English Summary

Home/aVa now has a dossier-first answer path for broad enterprise questions. Instead of answering from a few matched fragments, the new path classifies the question, assembles the relevant dimension binder plus adjacent dimensions, computes rollups, binds gaps/citations, composes an executive-readable answer, and quality-gates the visible prose.

Follow-up live proof found that the first ACA deployment fixed the SkyHarbor false-refusal case but exposed a validator regression for Lakeshore: grounded dossier prose that contained harmless operating-decision wording was replaced with the generic fallback "Here is what is loaded in Home context." This release record now includes the live-quality fix that narrows that validator, improves gap synthesis, and adds explicit active-tenant boundary language when a Home question names another tenant.

Second follow-up audit found a hidden proof/configuration failure mode: valid
dossiers could be mis-scored when `factsBound = 0` even though tables, charts,
graphs, citations, source coverage, rollups, relationship paths, or sourced gaps
were present. This release now includes a shared usable-dossier-evidence standard
and evidence-channel trace so validators, frontend tripwires, and proof scripts
do not rely on `factsBound` alone.

Third follow-up added the optional Home Consultant Claude synthesis layer. The
first version required strict JSON output; live proof showed that good consultant
prose could be discarded when Claude did not return a parseable JSON object. The
current follow-up replaces that brittle JSON-only selection with text-first
Claude synthesis: the dossier builder remains the source of truth, Claude writes
only user-facing prose, and deterministic dossier composition remains the
fallback whenever Claude is disabled, unavailable, times out, or fails text
validation.

## Layer Impact

- `global-control-lane`: Adds shared Home KNOW routing, quality gate, answer composition, and UI wiring.
- `client-data-lane`: Reads local tenant-scoped V4 evidence and enrichment files for SkyHarbor/Lakeshore dossier proof; no production data is mutated.

## Client Applicability

- All clients: the Home KNOW answer path and quality gate are shared.
- Specific clients: the proof crawl covers SkyHarbor Air and Lakeshore Holdings.
- Internal only: crawl scripts and proof reports.
- Public/demo only: not applicable.
- Feature flag: none.

## Changes Included

- `src/app/api/home/know/ask/route.ts`
- `src/lib/home/know/*`
- `src/lib/features/registry.ts`
- `src/lib/semantic-dossiers/*`
- `scripts/qa/home-dossier-crawl.ts`
- `scripts/qa/eval-home-know-quality.mjs`
- `scripts/qa/home-live-gate.mjs`
- `proof/home-dossier-crawl-20260625/*`
- `proof/home-dossier-live-20260625/*`
- `proof/home-consultant-synthesis/*`
- `docs/home-know/*`

## QA / Validation

- `npx tsx scripts/qa/home-dossier-crawl.ts`: passed, 54/54 questions.
- `npx jest src/lib/home/know/__tests__/home-know-engine.test.ts tests/home-know/home-org-answer-quality.test.ts tests/home-know/home-answer-forbidden-language.test.ts src/lib/semantic-dossiers/__tests__/universal-dimension-dossier.test.ts --runInBand`: passed, 39/39 after the live-quality fix.
- Evidence-channel audit validation to run before merge: `npx jest src/lib/home/know/__tests__/has-usable-dossier-evidence.test.ts src/lib/home/know/__tests__/home-know-engine.test.ts src/components/home/know/__tests__/HomeKnowAnswerRenderer.test.tsx --runInBand`.
- Home Consultant text synthesis validation to run before merge: `npx jest src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts src/lib/features/__tests__/is-feature-enabled.test.ts --runInBand`.
- Trace hardening validation after live proof exposed deterministic fallback: `npx jest src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts src/lib/home/know/__tests__/home-know-engine.test.ts --runInBand`.
- `npx eslint scripts/qa/home-dossier-crawl.ts src/lib/semantic-dossiers src/lib/home/know src/app/api/home/know/ask/route.ts src/components/home/know src/components/home/HomeSurface.tsx`: passed.
- `npx eslint src/lib/semantic-dossiers src/lib/home/know`: passed after the live-quality fix.
- `npx eslint src/lib/home/know/home-consultant-text-synthesis.ts src/lib/home/know/home-know-engine.ts src/lib/home/know/evaluate-home-consultant-synthesis.ts src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts`: to run before merge.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false --skipLibCheck`: passed after the consultant synthesis trace patch.
- `NODE_OPTIONS=--max-old-space-size=8192 node node_modules/typescript/lib/tsc.js --noEmit --pretty false --incremental false --skipLibCheck`: failed locally on unrelated cross-worktree Playwright type mismatch in `tests/accessibility/public-axe.spec.ts`; clean CI TypeScript is required before merge.
- `npm run release:check`: passed.
- `npm run audit:control-plane-purity:check`: passed.
- Initial live ACA proof on digest `sha256:b430b7bc802dbd00c32475755ea8e4fe2646c55e3a28a116ec21f0834c7847ef`: SkyHarbor exact regression passed; Lakeshore endpoint/tenant fence passed but answer prose quality failed due to the validator regression above.
- Deployed commit `8d4238c1c46fe86e0fa888afec8c9d7623f29d1f` to ACA revision `ca-abarva-web-lab-eastus--m8d4238c1`, 100% traffic. Signed-in Playwright proof passed for SkyHarbor and Lakeshore `/home`; the answer path returned usable dossier evidence, typed table/chart/graph exhibits, and no false no-data refusal. It also proved the Claude consultant path was attempted but fell back to deterministic synthesis, so this release adds safe fallback tracing to expose the exact reason in the response/logs.

## Rollout Plan

Merge to main, deploy through the Azure Container Apps runbook, and re-run the signed-in SkyHarbor/Lakeshore browser crawl against `https://app.abarva.ai/home`. Record the ACA revision, image digest, traffic split, and health response after deployment.

## Deployment Authority

- Repo-owned deploy workflow: Required for production/lab rollout.
- Shared runtime mutators: No manual ACA mutation outside the approved deploy lane.
- Approved image digest: To be recorded after build.
- ACA runtime invariant: Template image, active revision image, and 100% traffic revision must match.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: No new flag or env var.
- Live signed-in proof required: Yes, SkyHarbor and Lakeshore Home/aVa crawl after deploy.

## Rollback Plan

Revert this release commit and redeploy the previous known-good ACA image. No destructive DB migration is included.

## Audit Evidence

- `proof/home-dossier-crawl-20260625/crawl-results.json`
- `proof/home-dossier-crawl-20260625/endpoint-audit.json`
- `proof/home-dossier-crawl-20260625/tenant-fence-results.json`
- `proof/home-dossier-crawl-20260625/transcripts/skyharbor.md`
- `proof/home-dossier-crawl-20260625/transcripts/lakeshore.md`
- `proof/home-dossier-crawl-20260625/screenshots/skyharbor/live-auth-smoke.png`
- `proof/home-dossier-crawl-20260625/screenshots/lakeshore/live-auth-smoke.png`
- `proof/home-dossier-live-20260625/evidence-channel-report.json`
- `proof/home-dossier-live-20260625/proof-criteria.md`
- `proof/home-dossier-live-20260625/side-by-side-report.md`
- `proof/home-consultant-live-20260625/signed-in-proof.json`
- `proof/home-consultant-live-20260625/skyharbor-home.png`
- `proof/home-consultant-live-20260625/lakeshore-home.png`
- `docs/home-know/HOME_CONSULTANT_TEXT_SYNTHESIS_PROMPT.md`
- `docs/home-know/HOME_CLAUDE_TEXT_OUTPUT_CONTRACT.md`
- `docs/home-know/HOME_JSON_CONTRACT_DEPRECATION.md`
- `docs/home-know/HOME_CONSULTANT_SYNTHESIS_EVALUATION.md`
- `docs/home-know/HOME_CONSULTANT_DIMENSION_STYLE_GUIDE.md`

## Context Ingestion Evidence

Not applicable. This change does not load, mutate, stage, parse, or embed client context. It reads already-generated local tenant evidence files for dossier proof.

## Known Gaps

- The follow-up live-quality fix must be redeployed through ACA and re-proven with signed-in SkyHarbor/Lakeshore browser proof before this can move from candidate to proven.
