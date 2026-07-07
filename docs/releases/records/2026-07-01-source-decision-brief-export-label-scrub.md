# 2026-07-01-source-decision-brief-export-label-scrub — Source Decision Brief Export Label Scrub

## Release ID

`2026-07-01-source-decision-brief-export-label-scrub`

## Status

`candidate`

## Plain-English Summary

The live Source D24 decision-brief proof found one remaining export-label leak after the title-page polish: the unified narrative export wrapper and one evidence-note sentence could still render the old `Airline Demo` label in the HTML/DOCX/PDF artifact body. This release carries the sanitized tenant label through the Source deliverable spec and blocks `Airline Demo` in the D24 decision-brief quality gate.

## Layer Impact

- `global-control-lane`: Updates the shared Source narrative spec wrapper so generated narrative payload labels survive into DOCX/PDF/HTML rendering.
- `public-demo`: Scrubs the D24 AMS outsourcing demo decision brief so exported artifacts use `Aviation Client` / `AMS RFP Decision Brief` instead of implementation-shaped demo labels.

## Client Applicability

- All clients: Narrative Source exports now preserve payload-level tenant metadata instead of falling back to the raw source event tenant label.
- Specific clients: Source P1 AMS demo path is the live proof target.
- Internal only: None.
- Public/demo only: Demo label hygiene for the D24 decision brief.
- Feature flag: None.

## Changes Included

- `src/lib/source/exports/spec-builder.ts`: Carries `tenantName` and `generatedAt` from narrative payloads into the unified Source deliverable spec.
- `src/lib/source/exports/payloads/decision-brief-payload.ts`: Adds `Airline Demo` to the D24 forbidden-pattern gate and removes the old display label from the evidence/source note.
- `src/lib/source/exports/__tests__/decision-brief-payload.test.ts`: Asserts the generated D24 body does not contain `Airline Demo`.

## QA / Validation

- Focused Source export Jest — passed locally: `45 passed`.
- Focused ESLint — passed locally.
- `npm run release:check` — pending rerun after this record.
- Live signed-in DOCX/PDF/HTML export proof — pending after merge and ACA deployment.

## Rollout Plan

Merge to `main`, deploy through the repo-owned `aca-main-deploy` workflow, confirm ACA revision/traffic/image digest, then rerun the signed-in Source D24 export proof.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`.
- Shared runtime mutators: No direct ACA mutation from this branch.
- Approved image digest: Pending ACA deploy.
- ACA runtime invariant: Verify active revision, traffic allocation, image digest, and health after deployment.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. No data-plane changes or migrations are included.

## Audit Evidence

- PR URL: pending.
- CI checks: pending.
- Signed-in export proof bundle: pending.
- Previous proof bundle that caught the issue: `/Users/anand/Downloads/source-p1-board-pack-final-proof-20260701T175658Z`.

## Known Gaps

The Source event page chrome may still reflect its own event display state outside the D24 exported artifact. This release is scoped to exported D24 DOCX/PDF/HTML artifacts and their unified narrative render path.
