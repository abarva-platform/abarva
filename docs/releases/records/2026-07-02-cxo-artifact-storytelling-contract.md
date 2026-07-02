# 2026-07-02-cxo-artifact-storytelling-contract — CXO Artifact Storytelling Contract

## Release ID

`2026-07-02-cxo-artifact-storytelling-contract`

## Status

`candidate`

## Plain-English Summary

Adds a shared CXO artifact storytelling standard and typed contract so AbarVa
client artifacts do more than present evidence. The standard requires executive
message, value movement, why-it-happened explanation, action timeline,
opportunity map, do-nothing scenario, business-impact mapping and evidence
caveats. It also implements the first Source runtime consumer for the AMS
contract optimization brief so the Source page and exports follow the new
consulting-grade advisory story pack.

## Layer Impact

- `global-control-lane`: adds shared artifact standards and a typed validation
  helper for future generators across Source, Moves, Intelligence and Tower.
- `public-demo`: upgrades the SkyHarbor contract optimization demo artifact,
  Source page panel and aVa structured response parts to use advisory story
  framing.

## Client Applicability

- All clients: applies as a standard for future CXO/client artifact generators.
- Specific clients: Source contract optimization runtime path is currently the
  SkyHarbor AMS demo event.
- Internal only: Source backlog and standards continue to guide future slices.
- Public/demo only: SkyHarbor AMS contract optimization demo artifact.
- Feature flag: none.

## Changes Included

- Added `docs/strategy/CXO-ARTIFACT-STORYTELLING-CONTRACT.md`.
- Updated `docs/strategy/CXO-ARTIFACT-EXCELLENCE-FRAMEWORK.md`.
- Updated `docs/strategy/SOURCE-BOARD-GRADE-DELIVERABLE-BLUEPRINT.md`.
- Updated `docs/strategy/MOVES-ARTIFACT-GOLD-STANDARD.md`.
- Added `src/lib/artifacts/cxo-storytelling-contract.ts`.
- Added `src/lib/artifacts/__tests__/cxo-storytelling-contract.test.ts`.
- Added `src/lib/source/contract-optimization/story-pack.ts`.
- Updated Source contract optimization markdown/DOCX/PDF body source to the
  five-page advisory story pack.
- Updated Source contract optimization page panel to show executive message,
  opportunity map, why-it-happened, do-nothing scenario and decision timeline.
- Updated Source aVa contract optimization structured response parts to include
  a business-impact lens.
- Hardened the markdown/DOCX/PDF source body so Page 4 explicitly labels the
  executive action table as `Decision Timeline`.
- Preserved the curated deterministic contract optimization aVa answer instead
  of letting the generic Source Sentinel chat LLM rewrite it into citation-first
  prose.
- Broadened the contract optimization aVa intent trigger so business-impact and
  value-leakage questions use the advisory story composer instead of generic
  AMS sourcing evidence prose.
- Added Source backlog item `SRC46 — Contract optimization advisory story pack`.

## QA / Validation

- PASS: Targeted Jest for the typed CXO storytelling contract.
- PASS: Focused Source contract optimization Jest covering story pack, export
  markdown, page panel and aVa response parts.
- PASS: Scoped ESLint for the new typed contract, Source story pack, runtime
  consumers and tests.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npm run release:check`.
- PASS: `git diff --check`.
- PASS: live signed-in Source page/export smoke on `app.abarva.ai` confirmed the
  story-pack path is active on the Source event; follow-up label hardening
  keeps the export language aligned to the page.

## Rollout Plan

Merge to `main`, then deploy through the approved ACA main lane. The change is
deterministic and reversible; no migration is required.

## Deployment Authority

- Repo-owned deploy workflow: required before claiming live Source page/export proof.
- Shared runtime mutators: Source contract optimization page/export/aVa response shape only.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes before claiming `app.abarva.ai` visibility.

## Rollback Plan

Revert the PR. No migration, runtime data, feature flag or environment rollback
is required. Exports fall back to the prior contract optimization brief shape.

## Audit Evidence

- PR diff.
- Jest, ESLint, TypeScript and release-check output.

## Known Gaps

Full visual inspection of the generated DOCX/PDF pages remains recommended
before an external board-pack review.
