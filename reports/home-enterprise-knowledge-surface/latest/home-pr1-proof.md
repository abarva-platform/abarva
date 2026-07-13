# Home Enterprise Knowledge Surface — PR1 Proof

## Scope

HOME-PR1 converts the current Home context browser into an Enterprise Knowledge surface while preserving the existing workflow boundary:

- Home reads the current Home context browser by default and displays setup-control caveats when the active tenant access pointer is not available.
- Home renders known facts, source-backed evidence, gaps, ready areas, and relationships.
- aVa remains scoped to the selected Home context.
- Candidate preview language appears only when explicitly enabled.
- No data writes, candidate promotion, or module runtime behavior changes are included.

## Implemented

- Data Status header with setup-control active-access state when supplied.
- Candidate Preview banner gated behind explicit `candidatePreview=true`.
- Enterprise Knowledge Snapshot on the default Summary view.
- Evidence Coverage, Answerability, Top Gaps, Ready Areas, and Relationship Overview panels.
- Focused Home rendering tests for the redesigned default surface and candidate-preview boundary.
- Setup-control active tenant access and candidate-version caveats are visible instead of hidden.

## Validation

- Pass: `npm test -- --runTestsByPath src/components/home/__tests__/HomeSurface.test.tsx --runInBand`.
- Pass: `npx eslint 'src/app/(maestro)/home/page.tsx' src/components/home/HomeSurface.tsx src/components/home/__tests__/HomeSurface.test.tsx`.
- Pass: `npm run audit:enterprise-naming`.
- Pass: `npm run audit:architecture-rules`.
- Pass: `npm run release:check`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pass: `git diff --check`.

Default `npx tsc --noEmit --pretty false` exhausted the local Node heap before producing type diagnostics. The larger heap run completed cleanly.

## Truth Split

- Code implemented: yes.
- PR opened: yes, https://github.com/abarva-platform/abarva/pull/4732.
- Merged to main: no.
- Deployed to ACA: no.
- Signed-in browser proof: pending after deploy.
