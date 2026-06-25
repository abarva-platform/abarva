# Deployment State

Status: not deployed in this run.

## Local Validation

- `npx tsx scripts/qa/home-dossier-crawl.ts`: passed, 54/54.
- `npx jest src/lib/home/know/__tests__/home-know-engine.test.ts tests/home-know/home-org-answer-quality.test.ts tests/home-know/home-answer-forbidden-language.test.ts src/lib/semantic-dossiers/__tests__/universal-dimension-dossier.test.ts --runInBand`: passed, 36/36.
- `npx eslint scripts/qa/home-dossier-crawl.ts src/lib/semantic-dossiers src/lib/home/know src/app/api/home/know/ask/route.ts src/components/home/know src/components/home/HomeSurface.tsx`: passed.
- `npm run release:check`: passed.
- `npm run audit:control-plane-purity:check`: passed.
- `NODE_OPTIONS=--max-old-space-size=8192 node node_modules/typescript/lib/tsc.js --noEmit --pretty false --incremental false --skipLibCheck`: failed locally on unrelated cross-worktree Playwright type mismatch in `tests/accessibility/public-axe.spec.ts`; clean CI TypeScript is required before merge.

## Browser/Auth State

- Existing production auth states are valid for SkyHarbor and Lakeshore.
- Local Clerk ticket sign-in is blocked by redirect/access-denied behavior in this environment.
- Full signed-in production crawl must run after ACA deployment of this code.

## Deployment Required Before GO

1. Stage only the Home/dossier/crawl/doc files.
2. Add a release record.
3. Run `npm run release:check`.
4. Merge through the approved branch path.
5. Deploy through ACA, not Vercel.
6. Re-run the signed-in SkyHarbor/Lakeshore browser crawl against `https://app.abarva.ai/home`.
