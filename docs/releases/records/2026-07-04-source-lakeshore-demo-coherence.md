# 2026-07-04-source-lakeshore-demo-coherence — Source Lakeshore Demo Coherence

## Release ID

`2026-07-04-source-lakeshore-demo-coherence`

## Status

`candidate`

## Plain-English Summary

This release makes the Lakeshore Source case-study demo coherent on screen. The prior backend fix made exports and aVa routing work, but the live page still looked confusing: the event opened on Strategy while downstream artifacts were visible, key artifacts looked like tiny markdown stubs, suggested questions were generic, and the first aVa overview sentence was awkward. This release keeps governance honest while making the demo path read like a real shared-services AMS sourcing event.

## Layer Impact

- `global-control-lane`: Source stage query normalization, Source File Cabinet projection, Source artifact display, and Source aVa overview wording are shared Source runtime/control-plane behavior.
- `public-demo`: Adds Lakeshore case-study display copy and contextual suggested questions for the demo event `LAKE-SHARED-SERVICES-AMS-2026`.

## Client Applicability

- All clients: Mixed-case Source stage links normalize correctly; export-ready Source artifact display is cleaner for shared File Cabinet/canvas surfaces.
- Specific clients: Lakeshore receives the demo-specific case-study banner, default Responses review stage, contextual suggested questions, and event-summary wording for `LAKE-SHARED-SERVICES-AMS-2026`.
- Internal only: None.
- Public/demo only: Lakeshore case-study banner and suggested questions are event-specific demo polish.
- Feature flag: None.

## Changes Included

- Source stage normalization accepts mixed-case values such as `Responses` and `RFP`.
- Lakeshore Shared Services AMS case-study event defaults to Responses review when no explicit stage is supplied.
- Universal Source canvas displays a demo-safe governance banner for the Lakeshore case-study event, explaining prepared artifacts versus formal gate state.
- Source suggested questions for the Lakeshore case-study event now focus on event summary, final RFP authority, vendor recommendation, BAFO, CIO/CFO concerns, and artifact lineage.
- Source event document shelf and File Cabinet display D09/D11/D16/D22/D24 as export-ready/client-final artifacts instead of raw parser/markdown stub details.
- Follow-up live-proof hardening: D09/D11 alternate render names now resolve (`d09_rfp_package`, `d11_response_control_pack`), and generated File Cabinet/canvas rows infer export-ready type from file names when persisted metadata is generic.
- Final live-proof hardening: D16 alternate render name now resolves (`d16_evaluation_scorecard`), and client-final passthrough downloads carry Source audit headers (`x-source-event-code`, canonical/requested artifact code) so export proof can verify event identity even when serving an authoritative uploaded file.
- Final aVa lineage hardening: artifact-lineage answers now explicitly name the File Cabinet authority chain, so client-final/download governance is explained in the same language users see in the Source UI.
- Follow-up UI polish: the Lakeshore case-study governance banner no longer renders the formal stage label against adjacent text, and the first suggested prompt names the shared-services AMS event directly.
- Source aVa event overview answer now opens with the approved CXO-facing Lakeshore sourcing context.
- Focused tests added/updated for stage normalization, File Cabinet export-ready projection, and Lakeshore overview answer wording.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/source/exports/__tests__/format-router.test.ts src/lib/source/__tests__/source-answer-engine.test.ts src/lib/source/__tests__/source-event-row-mapping.test.ts src/app/api/v1/source/events/[eventId]/artifacts/__tests__/route.test.ts --runInBand` (`4` suites / `75` tests). Jest emitted pre-existing duplicate mock warnings but exited successfully.
- Pass: `npx eslint src/app/(maestro)/source/events/[eventId]/page.tsx src/app/api/v1/source/events/[eventId]/artifacts/route.ts src/app/api/v1/source/events/[eventId]/artifacts/__tests__/route.test.ts src/components/source/FileCabinetPanel.tsx src/components/source/canvas/UniversalCanvasShell.tsx src/components/source/canvas/workspace-tabs/DocumentTab.tsx src/lib/source/constants.ts src/lib/source/source-answer-engine.ts src/lib/source/__tests__/source-answer-engine.test.ts src/lib/source/__tests__/source-event-row-mapping.test.ts`.
- Pass: follow-up scoped ESLint for `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render/route.ts`, Source export spec builder, Source format-router test, Source File Cabinet, Universal Canvas shell, and Document tab.
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit`.
- Pass: `npm run release:check` locally.
- Partial live proof before follow-up: deployed revision `ca-abarva-web-lab-eastus--m8276983b` passed aVa 6/6 and D16/D22/D24 exports, but exposed D09/D11 alias 404s and raw generated File Cabinet rows. This follow-up closes those exact defects; final live proof is pending merge/deploy of the follow-up.
- Partial live proof after follow-up: deployed revision `ca-abarva-web-lab-eastus--mb29af449` passed default page and Responses stage checks and D09/D11/D22/D24 export checks, but exposed a missing D16 user-facing alias and missing client-final audit headers. This final follow-up closes those exact defects; final live proof is pending merge/deploy of the final follow-up.
- Partial live proof after final export follow-up: deployed revision `ca-abarva-web-lab-eastus--m9e209b93` passed page, File Cabinet, D09/D11/D16/D22/D24 export, and 5/6 aVa checks, but exposed that the artifact-lineage answer did not explicitly name the File Cabinet. This wording follow-up closes that exact defect; final live proof is pending merge/deploy.

## Rollout Plan

Merge to `main`, deploy through the approved Azure Container Apps main deploy workflow, then run signed-in Lakeshore browser proof against `https://app.abarva.ai/source/events/18439aee-9889-4e97-a444-4d9e43a85bd5`.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`.
- Shared runtime mutators: Azure Container Apps image update for `ca-abarva-web-lab-eastus`.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Verify active revision receives 100% ingress traffic.
- Worker image invariant: Not applicable; no worker/job image change.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the Source canvas, File Cabinet, stage normalization, and Source answer-engine changes, then redeploy the previous healthy ACA revision through the approved lane. No schema or data migration is included.

## Audit Evidence

- PR URL: To be created.
- CI run: To be recorded.
- Deployment URL: `https://app.abarva.ai` after ACA rollout.
- Smoke output: To be placed in Downloads after signed-in verification.

## Known Gaps

Live deploy and signed-in browser proof are pending for this candidate.
