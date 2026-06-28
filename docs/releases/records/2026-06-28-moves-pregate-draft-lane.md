# 2026-06-28-moves-pregate-draft-lane — Moves Pre-Gate Review Drafts

## Release ID

`2026-06-28-moves-pregate-draft-lane`

## Status

`candidate`

## Plain-English Summary

Moves can now generate clearly labeled review drafts before formal phase gate approval, while final generation remains blocked until hard gate conditions are satisfied. This supports sponsor review, workshop preparation, discovery preparation, and feedback collection without weakening governance.

## Layer Impact

- `global-control-lane`: Adds shared Moves generation behavior for draft-mode artifacts and metadata.
- `client-data-lane`: Persists generated draft artifacts with `review_required` status and pre-gate caveats in the existing Moves artifact store. No schema or tenant-data migration is included.

## Client Applicability

- All clients: The API contract is shared across Moves tenants.
- Specific clients: Lakeshore CIO demo uses this for pre-gate P1/P2 working artifacts.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/programs/assert-phase-ready.ts`: adds explicit `generationMode: "final" | "draft"` readiness behavior.
- `src/lib/deliverables/generate-artifact.ts`: carries draft-only caveats through prompt generation and force-inserts a visible pre-gate caveat into draft HTML.
- `src/lib/deliverables/solution-prompt-factory.ts`: instructs Claude to write draft artifacts as pre-gate review drafts, not final/board-ready artifacts.
- `src/app/api/v1/programs/[programId]/generate/route.ts`: accepts `generationMode: "draft"` and persists pre-gate drafts as `review_required` with caveated quality metadata.
- Focused regression tests for gate behavior and the route persistence contract.

## QA / Validation

Pending local and live validation for this candidate:

- Focused Jest for phase-readiness and generation route behavior.
- Scoped ESLint on touched files.
- TypeScript `tsc --noEmit`.
- `npm run release:check`.
- Live Lakeshore proof after ACA deployment:
  - P1/P2 final generation remains 409 blocked.
  - P1/P2 draft generation succeeds as review-required.
  - Draft artifacts appear in File Cabinet/artifact inventory with caveats.
  - Review/regenerate works on one draft.
  - Wrong-tenant access remains blocked.

## Rollout Plan

Merge to `main`, build an Azure Container Apps image from the exact commit SHA, deploy through the approved `ca-abarva-web-lab-eastus` ACA lane, shift 100% traffic to the healthy revision, then run signed-in Lakeshore proof.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps deploy runbook.
- Shared runtime mutators: `az acr build`, `az containerapp update`, traffic assignment.
- Approved image digest: To be recorded at deploy time.
- ACA runtime invariant: `app.abarva.ai` must resolve to the new healthy `ca-abarva-web-lab-eastus` revision.
- Worker image invariant: No worker image change required.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Reassign ACA traffic to the previous healthy web revision. No destructive data changes or schema migrations are included, so rollback is runtime-only.

## Audit Evidence

Pending PR URL, CI output, ACA revision/digest, signed-in Lakeshore draft/final proof, and wrong-tenant negative proof.

## Known Gaps

This release does not create fake sponsors, fake charter signoff, or final artifacts. Draft generation is intentionally review-required and does not advance phases or satisfy gates.
