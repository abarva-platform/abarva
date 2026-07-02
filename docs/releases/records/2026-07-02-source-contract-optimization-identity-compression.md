# 2026-07-02-source-contract-optimization-identity-compression — Source Contract Optimization Identity + Executive Answer Compression

## Release ID

`2026-07-02-source-contract-optimization-identity-compression`

## Status

`candidate`

## Plain-English Summary

This release tightens the Source existing-contract optimization demo so it presents as its own use case, not as the net-new RFP event. SkyHarbor contract optimization pages preserve the `SKYH-AMS-CONTRACT-OPT-2026` event code and `SkyHarbor Air AMS Contract Optimization` title. aVa contract optimization answers now lead with a compact executive structure and include a deterministic annualized exposure range before showing evidence drivers.

## Layer Impact

- `global-control-lane`: adjusts shared Source event display normalization, Source contract optimization answers, and the contract optimization brief export route.
- `public-demo`: improves the signed-in SkyHarbor Source contract optimization demo path and exported brief evidence story.

## Client Applicability

- All clients: only contract optimization answer/exposure formatting and tenant-pinned export lookup behavior.
- Specific clients: SkyHarbor Source contract optimization demo event.
- Internal only: no.
- Public/demo only: yes for the synthetic SkyHarbor proof path.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/UniversalCanvasShell.tsx`: preserves contract optimization event identity instead of rewriting SkyHarbor contract optimization to the RFP title.
- `src/components/source/canvas/EventIdStrip.tsx`: preserves the contract optimization event code/title in the visible Source canvas header.
- `src/lib/source/source-answer-engine.ts`: compresses contract optimization answers into direct answer, top reasons, financial exposure, action, and evidence note.
- `src/lib/source/contract-optimization/exposure.ts`: adds a shared deterministic exposure roll-up helper.
- `src/lib/source/contract-optimization/brief.ts`: uses the shared exposure range in the brief.
- `src/components/source/canvas/contract-optimization/ContractOptimizationProfilePanel.tsx`: shows the identified exposure range in the Source UI.
- `src/app/api/v1/source/[eventId]/contract-optimization/brief/route.ts`: pins export event lookup to the active tenant key.
- Tests updated for identity, exposure range, answer structure, panel rendering, and tenant-pinned export lookup.

## QA / Validation

- Pass: Focused Jest for Source answer engine, contract optimization MVE, Source canvas render, profile panel, and tenant-scope route tests (`5` suites / `98` tests).
- Pass: Scoped ESLint on touched files.
- Pass: Full TypeScript check.
- Pass: `git diff --check`.
- Pass: `npm run release:check`.
- Not run: Post-deploy signed-in Source browser/API proof against `https://app.abarva.ai/source/events/SKYH-AMS-CONTRACT-OPT-2026?stage=responses`, including DOCX/PDF visual/export checks and aVa question checks.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, confirm 100% traffic on the merged SHA, then rerun signed-in Source proof on the SkyHarbor contract optimization event.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the approved ACA deploy workflow.
- Approved image digest: assigned by the ACA deploy workflow after merge.
- ACA runtime invariant: verify active revision, 100% traffic, image digest, and `/api/health`.
- Worker image invariant: handled by the ACA deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the same ACA main workflow. No schema or data-plane migration is included.

## Audit Evidence

To be added after merge/deploy: PR URL, CI run, ACA deploy run, active revision/digest, signed-in proof folder, screenshots, and exported DOCX/PDF/Markdown files.

## Known Gaps

DOCX/PDF endpoint success still requires visual inspection in live proof before external demo use. This slice does not broaden contract optimization beyond the existing SkyHarbor synthetic evidence profile.
