# 2026-07-05-source-d24-decision-brief-autodraft — Decision brief auto-generates from the event chain

## Release ID

`2026-07-05-source-d24-decision-brief-autodraft`

## Status

`candidate`

## Plain-English Summary

The Atlas/aVa Decision Brief (`d24_decision_brief`) is the board-grade recommendation
that closes a sourcing event — and until now it was not generatable: someone had to
hand-author it. This adds a generation template so the decision brief drafts itself
from the whole event chain (strategy, value target, scope, evaluation scorecard,
pricing workbook, BAFO), and wires it into the stage-entry auto-draft so it produces
itself the moment the event enters the Executive Decision stage — no "Build" button.

It builds the finalist comparison from the real scorecard scores (d16) and pricing TCO
(d19); when those aren't authored yet it refuses to fabricate a comparison, names what's
missing, and recommends only to the extent the evidence supports.

## Layer Impact

- `global-control-lane`: shared Source generation behavior for all clients.
  `d24_decision_brief` becomes AI-generatable (`listSupportedGenerationCodes` 8 → 9) and
  is added to `AUTO_DRAFT_PRIMARY_CODES_BY_STAGE` for `executive_decision`, so entering
  that stage cascades its generation via the existing `autoDraftOnStageEntry` /
  `artifact-generation-queue` path. Binds only upstream artifacts already on the event's
  substrate + parsed uploaded evidence — no enterprise corpus, no cross-tenant data. No
  schema, seed, or migration.

## Client Applicability

- All clients: yes
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none (uses the existing stage-entry auto-draft path)

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts` — new `d24_decision_brief`
  template (aVa advisor voice, board-grade model, `upstreamRequired: []`,
  `upstreamOptional` = d01/d02/d05/d16/d19/d22, uploaded-evidence block via
  `formatDraftEvidenceContext`). System prompt forbids inventing vendors/scores/prices
  absent from the bound upstream and requires a counter-recommendation + sign-off list.
- `src/lib/source/stage-entry-autodraft.ts` — added `executive_decision:
  ["d24_decision_brief"]` to `AUTO_DRAFT_PRIMARY_CODES_BY_STAGE` so the brief
  auto-generates on stage entry.

## QA / Validation

- `listSupportedGenerationCodes()` → 9 codes, includes `d24_decision_brief`. **pass.**
- `prompt-registry.test.ts` + `section-conformance.test.ts` → **14/14 pass.**
- `stage-entry-autodraft.test.ts` → **8/8 pass.**
- `npx tsc -p tsconfig.json --noEmit` → no errors in changed files. **pass.**
- Not yet live-proven: brief quality against a real authored event chain needs the ACA
  deploy this record accompanies (localhost cannot reach the private DB). **verify on deploy.**

## Rollout Plan

Merge to `main` via PR + squash. Deploy through the Azure Container Apps runbook
(`az acr build` → `az containerapp update` on `ca-abarva-web-lab-eastus` → wait healthy →
100% traffic → verify `app.abarva.ai`). Record the ACA revision/image when deployed. No
migration, no feature flag.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md` (`az acr build` → `az containerapp update`
  on `ca-abarva-web-lab-eastus`).
- Shared runtime mutators: none — application-code only (a generation template + one
  auto-draft map entry). No worker jobs, DNS, or env mutation.
- Approved image digest: recorded on deploy.
- ACA runtime invariant: new revision healthy before 100% traffic shift; single deploy
  authority (no parallel feature-branch pipeline shifting lab traffic).
- Worker image invariant: n/a — no worker image change.
- Feature/env flag update path: none (uses the existing stage-entry auto-draft path; not
  flag-gated).
- Live signed-in proof required: yes — verify `d24_decision_brief` auto-drafts on entering
  Executive Decision on `app.abarva.ai` after the traffic shift.

## Rollback Plan

Revert the PR and redeploy the prior ACA revision. Removing the `d24_decision_brief`
template + the auto-draft map entry returns the brief to hand-authoring with no data
effect. No schema/migration to unwind.

## Audit Evidence

- PR URL (added on open).
- CI: `release:check`, jest, tsc.
- `body_generation_metadata` on generated `d24_decision_brief` artifacts records the
  prompt template id/version and the upstream codes bound at generation time.

## Known Gaps

- Grounding `d04_app_inv` in the tenant's structured application inventory
  (`data_inventory_records`) is a separate follow-up increment (main's d04 currently
  drafts from upstream artifacts + uploaded evidence, not the loaded app estate).
- The brief consumes upstream bodies whether or not they are approved; it does not gate on
  upstream approval status.
