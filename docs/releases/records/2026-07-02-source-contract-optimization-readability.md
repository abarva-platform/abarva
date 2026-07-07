# 2026-07-02-source-contract-optimization-readability — Source Contract Optimization Readability

## Release ID

`2026-07-02-source-contract-optimization-readability`

## Status

`candidate`

## Plain-English Summary

This release makes the Source existing-contract optimization experience easier to review in a CXO demo. aVa contract-optimization answers now present exposure drivers and cure requirements as concise evidence-backed cards instead of dense repeated paragraphs. The AMS Contract Optimization Brief export now opens with a decision snapshot before detailed findings and negotiation levers. For the SkyHarbor contract optimization event, the Source top bar preserves the event-facing SkyHarbor Air label instead of reverting to generic demo chrome.

## Layer Impact

- `global-control-lane`: adjusts shared Source answer rendering for contract optimization questions and Source event chrome behavior.
- `public-demo`: improves the signed-in SkyHarbor Source demo path and exported brief readability.

## Client Applicability

- All clients: no broad behavior change outside contract optimization answer formatting.
- Specific clients: SkyHarbor Source contract optimization demo event.
- Internal only: no.
- Public/demo only: yes, for the SkyHarbor synthetic demo proof path.
- Feature flag: none.

## Changes Included

- `src/lib/source/source-answer-engine.ts`: formats contract optimization findings into concise issue / implication / action cards.
- `src/lib/source/contract-optimization/brief.ts`: adds a decision snapshot and numbered finding/lever sections to the AMS Contract Optimization Brief.
- `src/components/source/canvas/UniversalCanvasShell.tsx`: preserves event tenant naming for contract optimization events so the Source top bar matches the event.
- Tests updated for answer formatting, export readability, and signed-in Source chrome behavior.

## QA / Validation

- Pass: Focused Jest for Source answer engine, contract optimization MVE, profile panel, and Source event canvas render.
- Pass: Scoped ESLint on touched files.
- Pass: Full TypeScript check.
- Pass: `git diff --check`.
- Pending: `npm run release:check` after this record update.
- Not run yet: Post-deploy signed-in Source browser/API proof against the SkyHarbor contract optimization event, including DOCX/PDF export checks and aVa question checks.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, confirm 100% traffic on the merged SHA, then rerun signed-in Source proof on `https://app.abarva.ai/source/events/SKYH-AMS-CONTRACT-OPT-2026?stage=responses`.

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

To be added after merge/deploy: PR URL, CI run, ACA deploy run, active revision/digest, signed-in proof folder, and export files.

## Known Gaps

The answers are clearer but still deterministic and evidence-heavy by design. Further visual polish could move repeated evidence references into collapsible UI cards without changing the MVE logic.
