# 2026-07-01-intelligence-executive-visual-contract — Intelligence Executive Visual Contract

## Release ID

`2026-07-01-intelligence-executive-visual-contract`

## Status

`candidate`

## Plain-English Summary

The Intelligence companion canvas now supports AbarVa-native executive exhibits. Claude can choose a governed `abarva-canvas` payload for sequencing, value/readiness, gate-to-value, or proof-boundary visuals; the renderer draws the exhibit consistently and hides the machine payload from the UI. Markdown-table visuals remain as a fallback.

Follow-up premium exhibit hardening upgrades the native canvas from a compact card into a board-style exhibit. Investment sequencing now uses stronger column hierarchy, initiative cards, value/readiness/risk/owner/gate chips, decision-required treatment, and full-width prose-heavy decision cards. The prompt contract now tells Claude which native exhibit to choose for funding, tradeoff, prerequisite, and governance questions without allowing arbitrary HTML or raw JSON.

Production Industrial Demo smoke found that Claude sometimes emits the correct `canvasType` payload as bare JSON instead of the fenced `abarva-canvas` block. The renderer now defensively parses only supported bare executive-canvas payloads, removes them from visible prose, and renders the native exhibit; arbitrary or unsupported JSON remains ignored.

Production follow-up smoke on the final ACA image found no raw marker/JSON leakage, but exposed two remaining demo-quality gaps: the consultant synthesis path could accept a strategic answer with right-canvas tabs but no native `abarva-canvas` exhibit, and demo-safe tenant name replacement could stack aliases into duplicated labels such as `SkyHarbor Air Air` or `Lakeshore Holdings Holdings`. This correction applies the native-canvas repair gate to consultant synthesis and collapses duplicate canonical tenant names before display/prompt use.

Second production proof on the corrected ACA image passed SkyHarbor but found one Industrial/Morgan Street edge case: Claude returned the correct `investmentSequencingMap` object, but with a raw newline inside a JSON string and without the fenced `abarva-canvas` wrapper, so the object was visible in the Decision card. This follow-up makes the renderer boundary more defensive: supported bare canvas objects with raw control characters are repaired and rendered when safe, partial streaming canvas objects are hidden, and repeated canonical alias tails such as `Apex Retail Group Retail Group Group` are collapsed.

Third production proof on the corrected ACA image passed SkyHarbor and confirmed the Industrial leak was gone, but Industrial still sometimes fell back to a clean decision table with no native board exhibit. This correction adds a deterministic Industrial/Morgan Street native-canvas fallback from the curated V6 readiness packet when Claude still omits a governed payload after the repair prompt. The fallback is source-grounded, hidden from prose, and rendered by the existing `investmentSequencingMap` component.

This follow-up upgrades the native exhibits from compact cards into fuller board-style decision surfaces. The right canvas now uses the available width for sequencing lanes, value/readiness matrices, gate-to-value roadmaps, owner/gate chips, metric strips, and decision-required banners. The Industrial/Morgan Street fallback now selects the same exhibit family as the prompt contract: prioritization gets sequencing, portfolio tradeoff gets value/readiness, prerequisite questions get gate-to-value, and trust/governance questions get proof boundary.

Production signed-in proof after the board-exhibit deploy showed Industrial/Morgan Street rendering the new native sequencing board, but the SkyHarbor/Airline Demo suggested funding question still returned a clean plain decision card when Claude omitted the governed payload. This correction brings the same deterministic native-canvas safety net to the SkyHarbor CTO readiness source, grounded in the curated V6 CTO packet, so airline funding, tradeoff, prerequisite, and proof-boundary questions get the right executive exhibit even when the model does not fence the payload correctly.

Final production proof exposed the exact remaining mismatch: the live signed-in tenant chrome uses the demo-safe name `Airline Demo`, while the SkyHarbor CTO readiness source only matched `skyharbor*` tenant aliases. This follow-up treats `Airline Demo` aliases as the same curated SkyHarbor/Airline CTO readiness packet so the deterministic native canvas fallback is eligible in the live demo tenant.

Final signed-in browser proof then confirmed the Airline Demo native sequencing exhibit renders, but exposed two renderer-polish issues: the proof harness had no stable native-canvas DOM attribute to assert against, and the board exhibit could overflow horizontally in the right canvas because the native canvas width did not include padding in its box model. This follow-up adds the stable `data-native-canvas-type` attribute, makes native canvases border-box, tightens sequencing columns, and strips residual standalone `abarva-canvas` labels from visible content.

This research-grade exhibit follow-up keeps the same governed renderer contract but makes the investment sequencing canvas less busy and more visual. The right canvas now prioritizes a product-colored value/readiness plot, compact funding sequence, proof boundary, and small summary strip instead of showing every initiative as a large card. No tenant data, scoring logic, prompt policy, or native-canvas payload contract changes in this slice.

Signed-in visual QA on the research-grade deploy showed Industrial Demo presenting the native exhibit first, but Airline Demo sometimes displayed prose/table companion cards above the native exhibit when Claude emitted multiple tabs. This follow-up promotes any tab containing a governed native executive canvas to the top of the right canvas while preserving the tab content unchanged.

Chart-label polish removes the remaining white bordered label pills from value/readiness plots. Initiative names now render as plain annotation text over the chart with only a subtle readability shadow, keeping the exhibit closer to the AbarVa product style and less busy for CXO demos.

Chart collision guard shortens plotted initiative labels, reduces annotation type size, and places labels deterministically to the left, right, above, or below the point based on chart position. Full initiative names remain in the tooltip, accessibility label, and funding sequence.

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
- `src/lib/intelligence/executive-canvas-payload.ts`: repairs supported bare executive-canvas JSON so valid `canvasType` payloads render as native exhibits and do not leak raw JSON into the UI.
- `src/lib/intelligence/executive-canvas-payload.ts`: repairs raw newlines/tabs inside supported bare executive-canvas JSON strings and strips partial bare canvas payloads during streaming so malformed control payloads do not become visible prose.
- `src/lib/intelligence/intelligence-consultant-text-synthesis.ts`: adds the same native-canvas repair/validation path to consultant synthesis so strategic prioritization answers cannot pass with only Markdown/Table fallback cards.
- `src/lib/intelligence/ask/industrial-cio-backoffice-source.ts` and `src/lib/intelligence/ask/synthesizer.ts`: add a deterministic Industrial/Morgan Street native-canvas fallback from the curated readiness packet when the model still omits a governed native exhibit for the CIO demo question.
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`: upgrades native exhibits into board-style right-canvas surfaces with lane counts, metric strips, value/readiness/risk chips, owner/gate treatment, matrix cards, and roadmap gates.
- `src/lib/intelligence/ask/industrial-cio-backoffice-source.ts`: makes the deterministic Industrial/Morgan Street fallback choose sequencing, value/readiness, gate-to-value, or proof-boundary payloads based on the user question.
- `src/lib/intelligence/ask/skyharbor-cto-readiness-source.ts` and `src/lib/intelligence/ask/synthesizer.ts`: add the same deterministic native-canvas fallback for SkyHarbor/Airline Demo CTO readiness questions, including investment sequencing, value/readiness, gate-to-value, and proof-boundary payloads from the curated V6 packet.
- `src/lib/intelligence/ask/skyharbor-cto-readiness-source.ts`: recognizes the production demo-safe `Airline Demo` tenant aliases as the SkyHarbor/Airline CTO readiness source so the live signed-in demo path can trigger the native exhibit fallback.
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx` and `src/lib/intelligence/executive-canvas-payload.ts`: add stable native-canvas proof attributes, prevent right-canvas sequencing overflow, and remove residual standalone `abarva-canvas` language labels from visible prose.
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`: keeps four-lane sequencing boards readable by giving each lane a board-grade minimum width, adding horizontal exhibit scroll, and allowing long initiative names, owner chips, and gate chips to wrap cleanly instead of clipping.
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`: refines `investmentSequencingMap` into a quieter research-grade exhibit using the product palette: a value/readiness plot, compact funding-sequence spine, proof boundary, and executive metric strip.
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`: promotes companion cards with governed native executive-canvas payloads above prose/table companion cards so the decision exhibit is visible first when Claude emits multiple tabs.
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`: removes white bordered boxes from chart labels so initiative names render as plain text annotations on value/readiness plots.
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`: adds chart-only label shortening, smaller annotation typography, and deterministic label placement around plotted points to reduce real-world overlap risk.
- `src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx`: updates native sequencing coverage to assert the value/readiness exhibit and funding-sequence rendering.
- `docs/demo/intelligence-executive-canvas-demo-script-2026-07-01.md`: adds SkyHarbor and Industrial/Morgan Street prompts that exercise all native exhibit families for demo proof.
- `src/lib/client-config.ts`: collapses duplicate canonical tenant aliases after demo-safe text replacement so Intelligence chrome, prompts, and visible answers do not show stacked labels such as `Air Air`, `Holdings Holdings`, or repeated canonical tails such as `Retail Group Group`.
- `src/lib/intelligence/ask/industrial-cio-backoffice-source.ts`: updates Morgan Street / Industrial Demo guidance to the current canvas grammar and asks Claude to use the correct exhibit pattern for CIO shared-services AI questions.
- Focused parser and UI tests for payload extraction, tab preservation, native rendering, and no marker/payload leakage.

## QA / Validation

- `./node_modules/.bin/jest src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/lib/intelligence/__tests__/tabbed-response.test.ts src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx --runInBand` passed.
- `npx eslint src/lib/intelligence/executive-canvas-payload.ts src/lib/intelligence/tabbed-response.ts src/components/intelligence-v2/IntelligenceV2Surface.tsx src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/lib/intelligence/__tests__/tabbed-response.test.ts src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx` passed.
- Follow-up renderer-boundary validation: `./node_modules/.bin/jest src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/lib/intelligence/__tests__/tabbed-response.test.ts --runInBand` passed with Decision-tab native canvas coverage.
- Follow-up renderer-boundary validation: `npx eslint src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx` passed.
- Premium exhibit validation: `./node_modules/.bin/jest src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/lib/intelligence/__tests__/tabbed-response.test.ts src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/ask/__tests__/industrial-cio-backoffice-source.test.ts --runInBand` passed.
- Industrial raw-JSON repair validation: `./node_modules/.bin/jest src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx --runInBand` passed.
- Industrial raw-JSON repair lint: `npx eslint src/lib/intelligence/executive-canvas-payload.ts src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx` passed.
- Consultant-native repair and tenant-label validation: `./node_modules/.bin/jest src/lib/__tests__/client-config-canonical.test.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts --runInBand` passed. Jest still reports pre-existing duplicate manual mock warnings for Markdown mocks.
- Consultant-native repair and tenant-label lint: `npx eslint src/lib/client-config.ts src/lib/__tests__/client-config-canonical.test.ts src/lib/intelligence/intelligence-consultant-text-synthesis.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts` passed.
- Defensive canvas-parser and canonical-label validation: `./node_modules/.bin/jest src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/lib/__tests__/client-config-canonical.test.ts --runInBand` passed. Jest still reports pre-existing duplicate manual mock warnings for Markdown mocks.
- Defensive canvas-parser and canonical-label lint: `npx eslint src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/executive-canvas-payload.ts src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/lib/client-config.ts src/lib/__tests__/client-config-canonical.test.ts` passed.
- Industrial deterministic native-canvas fallback validation: `./node_modules/.bin/jest src/lib/intelligence/ask/__tests__/industrial-cio-backoffice-source.test.ts src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/__tests__/client-config-canonical.test.ts --runInBand` passed. Jest still reports pre-existing duplicate manual mock warnings for Markdown mocks.
- Industrial deterministic native-canvas fallback lint: `npx eslint src/lib/intelligence/ask/industrial-cio-backoffice-source.ts src/lib/intelligence/ask/__tests__/industrial-cio-backoffice-source.test.ts src/lib/intelligence/ask/synthesizer.ts` passed.
- Board-exhibit polish validation: `/Users/anand/Projects/nexus/node_modules/.bin/jest src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/__tests__/tabbed-response.test.ts src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/lib/intelligence/ask/__tests__/industrial-cio-backoffice-source.test.ts --runInBand` passed. Jest still reports pre-existing duplicate manual mock warnings for Markdown mocks.
- Board-exhibit polish lint: `/Users/anand/Projects/nexus/node_modules/.bin/eslint src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/tabbed-response.ts src/lib/intelligence/ask/industrial-cio-backoffice-source.ts src/lib/intelligence/ask/__tests__/industrial-cio-backoffice-source.test.ts` passed.
- SkyHarbor native-canvas fallback validation: `/Users/anand/Projects/nexus/node_modules/.bin/jest src/lib/intelligence/ask/__tests__/skyharbor-cto-readiness-source.test.ts src/lib/intelligence/ask/__tests__/industrial-cio-backoffice-source.test.ts src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/__tests__/executive-canvas-payload.test.ts --runInBand` passed. Jest still reports pre-existing duplicate manual mock warnings for Markdown mocks.
- SkyHarbor native-canvas fallback lint: `/Users/anand/Projects/nexus/node_modules/.bin/eslint src/lib/intelligence/ask/skyharbor-cto-readiness-source.ts src/lib/intelligence/ask/__tests__/skyharbor-cto-readiness-source.test.ts src/lib/intelligence/ask/synthesizer.ts` passed.
- Airline Demo alias validation: `/Users/anand/Projects/nexus/node_modules/.bin/jest src/lib/intelligence/ask/__tests__/skyharbor-cto-readiness-source.test.ts --runInBand` passed. Jest still reports pre-existing duplicate manual mock warnings for Markdown mocks.
- Final renderer polish validation: `/Users/anand/Projects/nexus/node_modules/.bin/jest src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx --runInBand` passed. Jest still reports pre-existing duplicate manual mock warnings for Markdown mocks.
- Final renderer polish lint: `/Users/anand/Projects/nexus/node_modules/.bin/eslint src/lib/intelligence/executive-canvas-payload.ts src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx` passed.
- Sequence-board readability validation: `/Users/anand/Projects/nexus/node_modules/.bin/jest src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx --runInBand` passed. Jest still reports pre-existing duplicate manual mock warnings for Markdown mocks.
- Sequence-board readability lint: `/Users/anand/Projects/nexus/node_modules/.bin/eslint src/components/intelligence-v2/IntelligenceV2Surface.tsx` passed.
- Research-grade sequencing validation: `/Users/anand/Projects/nexus/node_modules/.bin/jest src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx --runInBand` passed. Jest still reports pre-existing duplicate manual mock warnings for Markdown mocks.
- Research-grade sequencing lint: `/Users/anand/Projects/nexus/node_modules/.bin/eslint src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx` passed.
- Native-exhibit-first validation: `/Users/anand/Projects/nexus/node_modules/.bin/jest src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx --runInBand` passed. Jest still reports pre-existing duplicate manual mock warnings for Markdown mocks.
- Native-exhibit-first lint: `/Users/anand/Projects/nexus/node_modules/.bin/eslint src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx` passed.

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
