# Intelligence Surface Executive Briefing Proof

Date: 2026-07-06

## Code / Build

- Final code SHA: a59ce421e
- Image tag: acrabarvalab001.azurecr.io/abarva/web:intelligence-surface-a59ce421e
- Image digest: sha256:38e4a622862096d9b7f405aca909bfb72514d36dacdd9013d563b4e99e1a4383
- ACR build: ca14c, successful after 5m17s

## Deploy

- ACA app: ca-abarva-web-lab-eastus
- Final live revision: ca-abarva-web-lab-eastus--0000263
- Traffic: 100%
- Health: Healthy
- Running state: Running

## Focused Validation

- Pass: npx jest src/components/intelligence-advisory/__tests__/AdvisoryIntelligencePage.test.tsx --runInBand
- Pass: npx jest src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts --runInBand
- Pass: npx jest src/lib/agent/__tests__/display-text.test.ts --runInBand
- Pass: npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts --runInBand
- Pass: npx eslint src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx src/app/api/intelligence/ask/route.ts src/components/intelligence-advisory/__tests__/AdvisoryIntelligencePage.test.tsx src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts src/lib/agent/display-text.ts src/lib/agent/visible-answer-contract.ts src/lib/agent/__tests__/display-text.test.ts
- Pass: npx eslint src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts
- Pass: npm run release:check

## Prompt Accuracy Fix

The final deployed SHA includes the corrected Claude synthesis prompt:

- user-visible identity: aVa, not legacy Sentinel
- demo coverage: industrial holding companies, corporate shared services, and airlines
- concise prompt coverage: industrial/shared services and airline operations
- guardrail test asserts this prompt contract

## Browser/UI Evidence

Signed-in Chrome showed the deployed Intelligence page shape after the first deployment candidate:

- Active client: Lakeshore Holdings
- Route: /intelligence
- Left side: aVa Lakeshore Holdings Intelligence advisor
- Right side: Executive intelligence canvas
- Suggested Lakeshore/Morgan Street questions visible

Screenshots saved:

- 01-intelligence-initial.png
- 02-question-submitted.png
- 03-answer-settled.png
- 04-intelligence-reset.png
- 05-intelligence-tab-selected.png

Important limitation: after redeploying the corrected prompt image to revision 0000263, Chrome screenshot capture returned a black frame and browser automation could not reliably click the Intelligence question chip. Therefore, final live state is proven at ACA/image/revision level and source/test level, but the post-0000263 signed-in screenshot and live Claude response capture should be rerun from a clean Chrome window before calling the Claude-response proof complete.

## Known Side Effect

During browser automation, a Source intake draft was accidentally started in Chrome. It was not approved. This is unrelated to the Intelligence deploy.
