# 2026-07-01-intelligence-executive-visual-contract — Intelligence Executive Visual Contract

## Release ID

`2026-07-01-intelligence-executive-visual-contract`

## Status

`candidate`

## Plain-English Summary

The Intelligence companion canvas now supports AbarVa-native executive exhibits. Claude can choose a governed `abarva-canvas` payload for sequencing, value/readiness, gate-to-value, or proof-boundary visuals; the renderer draws the exhibit consistently and hides the machine payload from the UI. Markdown-table visuals remain as a fallback.

Follow-up premium exhibit hardening upgrades the native canvas from a compact card into a board-style exhibit. Investment sequencing now uses stronger column hierarchy, initiative cards, value/readiness/risk/owner/gate chips, decision-required treatment, and full-width prose-heavy decision cards. The prompt contract now tells Claude which native exhibit to choose for funding, tradeoff, prerequisite, and governance questions without allowing arbitrary HTML or raw JSON.

## Layer Impact

- `global-control-lane`: Updates the shared Intelligence v2 answer contract and right-canvas renderer for all tenants using the executive canvas.

## Client Applicability

- All clients: Yes, for tenants using the Intelligence v2 canvas.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Intelligence v2 routing only; no new flag.

## Changes Included

- `src/lib/intelligence/tabbed-response.ts`: documents the governed `abarva-canvas` payload, requires one native exhibit for strategic prioritization / sequencing / gate / value-readiness questions when structured content exists, and preserves Chart tabs that contain structured canvas data.
- `src/lib/intelligence/ask/synthesizer.ts`: adds a native-canvas repair loop for strategic answers that satisfy the right canvas with fallback Markdown tables but omit the governed payload.
- `src/lib/intelligence/executive-canvas-payload.ts`: adds parser/normalizer for supported executive canvas payloads.
- `src/lib/intelligence/intelligence-consultant-text-synthesis.ts`: allows the governed `abarva-canvas` payload as the only JSON exception, avoiding a prompt conflict that pushed Claude back to plain Markdown tables.
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`: renders native sequencing, value/readiness matrix, gate-to-value roadmap, and proof-boundary exhibits while hiding raw payload JSON; native payloads are honored from any companion card allowed by the prompt contract, including Decision and Evidence, not only Chart/Table.
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`: upgrades native exhibits with premium board styling, tone-coded sequencing columns, initiative owner/gate chips, roadmap status/owner/dependency treatment, matrix quadrant labels, and full-width Decision/Evidence companion cards when content is prose-heavy or carries a native payload.
- `src/lib/intelligence/tabbed-response.ts`: adds explicit canvas-selection guidance so prioritization questions choose sequencing, portfolio tradeoff questions choose value/readiness, prerequisite questions choose gate-to-value, and governance/trust questions choose proof boundary while preserving the strict renderer contract.
- `src/lib/intelligence/executive-canvas-payload.ts`: extends initiative items with optional `owner` and `gate` fields for board-ready exhibit cards.
- `src/lib/intelligence/ask/industrial-cio-backoffice-source.ts`: updates Morgan Street / Industrial Demo guidance to the current canvas grammar and asks Claude to use the correct exhibit pattern for CIO shared-services AI questions.
- Focused parser and UI tests for payload extraction, tab preservation, native rendering, and no marker/payload leakage.

## QA / Validation

- `./node_modules/.bin/jest src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/lib/intelligence/__tests__/tabbed-response.test.ts src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx --runInBand` passed.
- `npx eslint src/lib/intelligence/executive-canvas-payload.ts src/lib/intelligence/tabbed-response.ts src/components/intelligence-v2/IntelligenceV2Surface.tsx src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/lib/intelligence/__tests__/tabbed-response.test.ts src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx` passed.
- Follow-up renderer-boundary validation: `./node_modules/.bin/jest src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/lib/intelligence/__tests__/tabbed-response.test.ts --runInBand` passed with Decision-tab native canvas coverage.
- Follow-up renderer-boundary validation: `npx eslint src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx` passed.
- Premium exhibit validation: `./node_modules/.bin/jest src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/lib/intelligence/__tests__/tabbed-response.test.ts src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/ask/__tests__/industrial-cio-backoffice-source.test.ts --runInBand` passed.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow, then run signed-in SkyHarbor and Industrial/Lakeshore Intelligence smoke proof against `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Repo-owned ACA main deploy only.
- Approved image digest: To be captured after ACA deployment.
- ACA runtime invariant: Template image and 100% traffic revision must match the approved digest.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this UI/contract release and redeploy the prior approved ACA image. No data migration or tenant data rollback is required.

## Audit Evidence

- PR URL, CI result, ACA revision, image digest, signed-in browser proof, and screenshots to be added after rollout.

## Known Gaps

- This slice adds four native exhibit families. Additional exhibit families such as vendor concentration maps and process reinvention maps remain future extensions of the same contract.
