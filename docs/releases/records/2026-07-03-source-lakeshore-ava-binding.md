# 2026-07-03-source-lakeshore-ava-binding — Source Lakeshore aVa Binding

## Release ID

`2026-07-03-source-lakeshore-ava-binding`

## Status

`candidate`

## Plain-English Summary

Source aVa now keeps Lakeshore vendor-advisory questions on the vendor evaluation and BAFO evidence path instead of letting client-final RFP governance answers take over. Specialized Source answers are preserved through the live answer-quality layer, the ask route uses the authenticated Source tenancy context for deterministic client binding, and the Source File Cabinet listing surfaces generated/uploaded registry artifacts when durable cabinet projections are absent.

Follow-up live proof found one remaining binding gap: the vendor MVE profile builder only recognized the SkyHarbor AMS event shape, so the Lakeshore shared-services AMS event did not receive Vendor A/B/C profiles, challenge logs, BAFO instructions, or evaluation summaries in the aVa context packet. This release now recognizes the shared-services AMS event shape and adapts the synthetic vendor profile language so Lakeshore answers use corporate shared-services wording rather than airline wording.

Second follow-up live proof confirmed the main vendor-advancement answer, then exposed two demo-risk edges: plain-English questions such as "Which vendor is riskiest?" and "Why is Vendor B conditional?" were still falling through to the generic AMS answer lane, and a long signed-in run intermittently returned `not_found` after earlier successful event reads. This release widens the evaluation-answer classifier for risk/conditional vendor phrasings and retries the same tenant-scoped Source event read briefly at the ask boundary before returning the existing safe `not_found` response.

Third follow-up live proof reached 20/20 HTTP 200 and zero `not_found`, but still found demo-script phrasing gaps for event overview, procurement review before release, artifact inventory, Vendor C rationale, Vendor-B-before-scoring BAFO asks, stage blockers, and final sourcing recommendation. This release adds deterministic Source answer lanes for event overview and stage readiness, routes Vendor C/final recommendation language to the evaluation scorecard, routes before-scoring vendor asks to BAFO, and narrows artifact authority so "final recommendation" is not mistaken for "final RFP version."

Fourth follow-up live proof confirmed the demo routing fixes for the early questions, but a longer signed-in run still returned intermittent `not_found` after 11 successful aVa calls. This release now resolves persisted Source events at the ask boundary from the already-authenticated active client key and tenant alias family before falling back to the broader generic resolver. The change keeps the cross-tenant fence intact while avoiding a duplicate active-client/policy lookup that could make a valid same-tenant event disappear during a long demo crawl.

## Layer Impact

- `global-control-lane`: shared Source answer routing and Source File Cabinet API behavior change for all clients.
- `client-data-lane`: no schema or data mutation; the File Cabinet API reads existing generated artifact-state rows and Source artifact registry rows for the active tenant/event.

## Client Applicability

- All clients: yes, for Source aVa routing and Source File Cabinet visibility.
- Specific clients: Lakeshore proof is the target validation case.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/source-answer-engine.ts`: prioritizes evaluation and BAFO answers before artifact-governance answers; artifact governance no longer hijacks vendor advancement questions.
- `src/lib/source/nexus-api.ts`: preserves specialized evaluation, BAFO, artifact-authority, and contract-optimization Source answers through the live answer-quality layer so the user-visible response stays advisory-specific.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`: uses the richer authenticated Source tenancy context and stable client key when resolving the active Source event.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`: retries the same tenant-scoped event lookup briefly for Source aVa asks so transient read misses do not become false `not_found` responses.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`: resolves persisted Source events from the already-known active client key/name before falling back to the broader resolver, preventing long-run advisor sessions from losing a valid same-tenant event.
- `src/lib/source/queries.ts`: exports a tenant-keyed persisted Source event resolver that checks the row's `client_key` against the active tenant alias family before converting it to the Source event detail shape.
- `src/app/api/v1/source/events/[eventId]/artifacts/route.ts`: bridges linked generated artifact-state rows and tenant-scoped Source artifact registry rows into the File Cabinet generated/upload/session groups when durable File Cabinet rows are absent.
- `src/lib/source/source-answer-engine.ts`: routes risk/conditional vendor questions to the evaluation scorecard answer instead of the generic AMS answer lane.
- `src/lib/source/source-answer-engine.ts`: adds event-overview and stage-readiness answers for Lakeshore demo questions, routes Vendor C/final sourcing recommendation to evaluation, routes vendor-before-scoring asks to BAFO, and keeps artifact authority limited to real RFP/artifact finality questions.
- `src/lib/source/proposal-intelligence/mve-profile.ts`: recognizes Lakeshore shared-services AMS events as valid vendor-response MVE events and adapts the Vendor A/B/C profile text to corporate shared-services scope.
- `src/lib/source/proposal-intelligence/__tests__/proposal-intelligence.test.ts`: regression proving Lakeshore gets three MVE vendor profiles without airline/IROPS language.
- `src/lib/source/__tests__/source-answer-engine.test.ts`: regression for vendor advancement vs. final RFP authority, plus risk/conditional/Vendor C/final recommendation phrasing.
- `src/lib/source/__tests__/nexus-api-live-context.test.ts`: regression that the live API response preserves Vendor A/B/C evaluation answers through the quality gate.
- `src/app/api/v1/source/events/[eventId]/artifacts/__tests__/route.test.ts`: regression for generated artifact-state and Source artifact registry File Cabinet visibility.

## QA / Validation

- Pass — focused Jest: `source-answer-engine.test.ts` and `queries-tenant-scope.test.ts`, 61 tests passed for the latest resolved-client event lookup patch.
- Pass — touched-file ESLint.
- Pass — TypeScript: `npx tsc --noEmit`.
- Pass — release check: `npm run release:check`.
- Pending — live signed-in Lakeshore Source aVa/browser proof after deployment.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps lane, then run the signed-in Lakeshore Source proof against `LAKE-SHARED-SERVICES-AMS-2026`.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`.
- Shared runtime mutators: Azure Container Apps web image only.
- Approved image digest: pending deployment.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` receives 100% ingress traffic on the deployed revision.
- Worker image invariant: no worker change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Redeploy the previous healthy ACA web image/revision. No database rollback is required because this release is read-path and answer-routing only.

## Audit Evidence

- PR and deployed revision after merge.
- Focused Jest output, TypeScript output, ESLint output.
- Signed-in Lakeshore 20-question aVa proof report after deployment.
- File Cabinet API payload showing generated artifacts plus client-final artifact.

## Known Gaps

Live signed-in proof is pending until the candidate is deployed.
