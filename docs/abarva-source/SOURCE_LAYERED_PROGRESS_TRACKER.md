# AbarVa Source Layered Progress Tracker

Date: 2026-04-26

Purpose: provide a layer-by-layer view of where AbarVa Source stands against MVP and production readiness. This tracker is intentionally candid. It separates strong deterministic foundations from runtime, UI, evidence, and enterprise-readiness work that has not started or is still early.

## Executive Read

- Source has a strong foundation in product architecture, deterministic context validation, workflow validation, pattern IP, deterministic multi-agent briefings, deterministic agent missions, and a platform Agent Mission Model.
- Source is not production-ready.
- MVP readiness is improving, but the product still needs authenticated UI review, persistence, evidence/upload pipeline, auth/tenant hardening, and production validation.
- Current foundation milestone: PR #264 merged deterministic Source dashboard route/component smoke for the mission preview path.
- Current recommended next slice: implement the Source event canvas shell as a bounded shell-only slice.

## Layer Summary

| Layer | Estimate | Status | Evidence | Next Recommended Slice |
|---|---:|---|---|---|
| Platform Design System | 65% | Foundation complete, adoption not wired | PR #220, `docs/platform-design/experience-system/**` | Token bridge or visual adoption bridge implementation plan |
| Source Product Foundation | 70% | Strong docs/types/seed foundation | PR #188, PR #201, `docs/abarva-source/build-pack/**`, `src/lib/source/**` | Keep foundation stable while runtime is planned |
| Pattern / Workflow IP | 75% | Strong authored IP, runtime sectioning not wired | PR #202, PR #222, PR #223, PR #224, PR #225 | Convert selected sections into runtime manifest plan later |
| Context Validation Harness | 85% | Deterministic foundation complete | PR #190, PR #192, PR #197 | Use as preflight for Source Nexus runtime |
| Workflow Validation Harness | 85% | Deterministic foundation complete | PR #204, PR #207, PR #210 | Preserve remaining defer until upload/evidence exists |
| Multi-Agent Intelligence | 57% | Deterministic briefings, mission read model, mission report, dashboard preview, review packet, and route/component smoke exist; no runtime queue/scheduler/persistence/model layer | PR #227, PR #248, PR #254, PR #255, PR #259, PR #262, PR #264, `src/lib/source/multi-agent-briefing.ts`, `src/lib/source/agent-missions.ts`, `src/lib/source/agent-mission-report.ts` | Use mission report in the event canvas shell |
| Source API / Runtime | 25% | Deterministic no-model API stub exists; production runtime not ready | PR #230, PR #245, `src/app/api/v1/source/[eventId]/nexus/ask/route.ts` | Keep route deterministic; do not add model calls until mission/readiness gates are ready |
| Source UI / User Experience | 43% | Dashboard exists with deterministic mission preview, review baseline, route/component smoke, and event canvas shell plan; broader UI early | PR #212, PR #213, PR #218, PR #259, PR #262, PR #264, PR #265, Experience System | Implement Source event canvas shell only |
| Data / Evidence / Upload Pipeline | 12% | Not started beyond contracts/placeholders, but data readiness panel plan is refreshed for event canvas consumption | Attachment/context contracts, validation defers, PR #266 | Define Admin/Setup readiness contract before implementation |
| Production Readiness | 12% | Deterministic Source route/component smoke is partial; authenticated/live production gates remain blocked | Production readiness tracker, PR #264 | Authenticated live route smoke and screenshot review remain required |

## Layer 1. Platform Design System

Purpose: make AbarVa feel consistent, premium, off-white by default, agent-centric, table-forward, and not like a generic dashboard or chatbot wrapper.

Current status: foundation complete, code adoption incomplete.

Percent complete estimate: 65%.

Evidence / PRs / Files:

- PR #220: AbarVa Experience System.
- `docs/platform-design/experience-system/**`
- `docs/platform-design/experience-system/ADOPTION_BRIDGE_CURRENT_APP.md`

Completed items:

- Brand and visual language canon.
- Agent identity system for Nexus, Sentinel, Atlas, and Steward.
- Design token guidance.
- Journey progress system.
- Page archetypes and state matrix.
- Agent response design system.
- Three choices plus custom pattern.
- Wireframes and component specs.

Remaining items:

- Code-level token bridge.
- Shared component implementation.
- Surface-by-surface adoption.
- Visual regression or screenshot review discipline.
- Agent mark visual exploration.

Blockers:

- Current UI can still diverge from the Experience System unless every UI slice cites the relevant design docs.
- Tokens are documented, not wired into implementation.

Next recommended slice:

- Plan or implement a narrow Experience System token bridge before broad UI refactors.

## Layer 2. Source Product Foundation

Purpose: define Source as a sourcing and vendor-selection workbench with canonical docs, routes, source types, seeded contexts, lifecycle model, dashboard shell, and product guardrails.

Current status: strong foundation; runtime product is not complete.

Percent complete estimate: 70%.

Evidence / PRs / Files:

- PR #188: Source foundation docs and context contracts.
- PR #201: Build Pack inventory reconciliation.
- `docs/abarva-source/ABARVA_SOURCE_BUILD_PACK.md`
- `docs/abarva-source/build-pack/**`
- `src/app/(maestro)/source/**`
- `src/components/source/**`
- `src/lib/source/types.ts`
- `src/lib/source/context-builder.ts`
- `src/lib/source/mock-seed.ts`

Completed items:

- Source Build Pack and multi-file build-pack anchor.
- Source route family and first-class nav placement.
- Deterministic Source context types and seeded events.
- Source dashboard front-door refinement.
- Auth redirect fix path for `/source` was diagnosed and merged in a later auth slice.
- Source production readiness tracker.

Remaining items:

- Source-specific runtime/API route.
- Real persistence.
- Tenant and role model for Source data.
- Authenticated dashboard screenshot review after auth fix.
- Full Source event workbench.
- Production UI coverage beyond dashboard.

Blockers:

- Current behavior remains seeded/deterministic.
- Product routes exist, but production runtime behavior is not ready.

Next recommended slice:

- Plan the Source-specific Nexus API stub with no model calls.

## Layer 3. Pattern / Workflow IP

Purpose: turn AbarVa thought leadership into authored, structured, auditable sourcing intelligence that agents can later retrieve, cite, apply, and convert into validation or product logic.

Current status: strong docs/IP foundation; runtime ingestion not started.

Percent complete estimate: 75%.

Evidence / PRs / Files:

- PR #202: workflow richness and document collaboration model.
- PR #222: AbarVa Pattern Operating Model.
- PR #223: AMS Managed Services Sourcing pattern pack.
- PR #224: AMS pattern sectioning plan.
- PR #225: AMS pattern sections.
- `docs/platform-design/pattern-operating-model/**`
- `docs/abarva-source/pattern-packs/**`
- `docs/abarva-source/build-pack/25_WORKFLOW_RICHNESS_AND_DOCUMENT_COLLABORATION.md`
- `docs/abarva-source/build-pack/26_ARTIFACT_REVIEW_AND_APPROVAL_MODEL.md`
- `docs/abarva-source/build-pack/27_WORKFLOW_VALIDATION_HARNESS.md`

Completed items:

- Pattern taxonomy and authoring standard.
- Storage, manifest, retrieval, agent usage, artifact, validation, product-logic, and learning-loop model.
- Full AMS Managed Services Sourcing pattern pack.
- AMS pattern sectioning plan.
- AMS structured section companion with 28 stable section IDs.
- Workflow/document collaboration model.

Remaining items:

- IMS and Data Platform Managed Services pattern packs.
- Runtime pattern manifest plan.
- Pattern section schema in code.
- Pattern-to-context integration.
- Pattern-grounded validation fixtures.
- Learning/observation capture.

Blockers:

- Pattern docs can remain conceptual unless converted into runtime sections and context assembly.
- Outsourcing complexity needs more authored packs before runtime behavior feels deep.

Next recommended slice:

- Plan Data Platform Managed Services pattern pack or plan runtime pattern manifest after current API stub planning.

## Layer 4. Context Validation Harness

Purpose: prove Source agent responses are grounded in Source context before chat UI, API runtime, or model calls are built.

Current status: deterministic foundation complete.

Percent complete estimate: 85%.

Evidence / PRs / Files:

- PR #190: context validation fixtures.
- PR #192: context validation runner.
- PR #197: context validation report formatter.
- `src/lib/source/agent-validation-fixtures.ts`
- `src/lib/source/agent-validation-runner.ts`
- `src/lib/source/agent-validation-report.ts`

Completed items:

- Golden prompts for anti-vanilla response testing.
- Deterministic fixture outcomes.
- Runner and readable report.
- Current context outcome: 10 fixtures, 8 pass, 2 defer, 0 reject.

Remaining items:

- Tie pattern section IDs into validation expectations.
- Use context validation as preflight for Source Nexus route.
- Add validation coverage for real uploaded evidence later.

Blockers:

- Remaining defers depend on real evidence/upload/runtime capabilities.

Next recommended slice:

- Use context validation report as an input to the Source Nexus API stub plan.

## Layer 5. Workflow Validation Harness

Purpose: prove Source will block unsafe workflow moves before workflow engine or workflow UI is implemented.

Current status: deterministic foundation complete.

Percent complete estimate: 85%.

Evidence / PRs / Files:

- PR #204: workflow validation fixtures.
- PR #207: workflow validation runner.
- PR #210: workflow validation report formatter.
- `src/lib/source/workflow-validation-fixtures.ts`
- `src/lib/source/workflow-validation-runner.ts`
- `src/lib/source/workflow-validation-report.ts`

Completed items:

- Twelve deterministic workflow fixtures.
- BLOCK, DEFER, WAIVER_REQUIRED, FAIL, and PASS vocabulary.
- Readable report with blockers, defers, remediations, and suite verdict.
- Current workflow outcome: 12 total, 11 BLOCK, 1 DEFER, 0 mismatches.

Remaining items:

- Use workflow validation report in runtime route planning.
- Add pattern-derived workflow rules later.
- Preserve the uploaded-document citation DEFER until upload parsing exists.

Blockers:

- Runtime workflow engine is not built and should not be built until explicitly approved.

Next recommended slice:

- Keep workflow validation read-only and feed its report into deterministic API-stub planning.

## Layer 6. Multi-Agent Intelligence

Purpose: make Nexus, Sentinel, Atlas, and Steward produce distinct context-aware behavior from the same SourceAgentContextBundle without model calls or chat UI.

Current status: deterministic briefing layer, platform mission model, Source mission read model, mission report formatter, tiny dashboard mission preview, review packet, and route/component smoke are merged. No runtime queue, scheduler, persistence, full mission UI, or model runtime exists.

Percent complete estimate: 57%.

Evidence / PRs / Files:

- PR #227: deterministic Source multi-agent briefing layer.
- PR #248: platform Agent Mission Model.
- PR #254: deterministic Source agent mission read model.
- PR #255: deterministic Source agent mission report formatter.
- PR #256: agent mission activity UI plan.
- PR #257: Source dashboard mission preview plan.
- PR #259: tiny deterministic Source dashboard mission preview.
- PR #262: Source dashboard mission preview visual review packet.
- PR #264: Source dashboard route/component smoke coverage.
- `src/lib/source/multi-agent-types.ts`
- `src/lib/source/multi-agent-briefing.ts`
- `src/lib/source/agent-mission-types.ts`
- `src/lib/source/agent-missions.ts`
- `src/lib/source/agent-mission-report.ts`
- `docs/platform-architecture/runtime/13_AGENT_MISSION_MODEL.md`
- `docs/platform-architecture/runtime/14_AGENT_WORK_QUEUE_AND_TRIGGERS.md`
- `docs/platform-design/experience-system/16_AGENT_ACTIVITY_UI_PATTERN.md`
- `docs/abarva-source/build-pack/implementation-reviews/18_SOURCE_MULTI_AGENT_BRIEFING_REVIEW.md`

Completed items:

- Nexus briefing for sourcing progress, missing inputs, risks, and next action.
- Sentinel briefing for evidence and validation gaps.
- Atlas briefing for executive value/risk synthesis.
- Steward briefing for gate integrity, blockers, and cannot-proceed reasons.
- Deterministic markdown formatter and suggested actions.
- Platform-level mission types, triggers, states, priorities, handoffs, and calm activity UI model.
- Source-specific mission queue plan.
- Deterministic Source agent mission read model.
- Deterministic mission report formatter with top missions, counts, blockers, defers, handoffs, and remediations.
- Tiny Source dashboard mission preview for the most exposed seeded event.
- Baseline review decision for the dashboard mission preview.
- Deterministic route/component smoke for `/source` route rendering and the mission preview path.

Remaining items:

- Authenticated screenshot/manual review of the mission preview remains needed because Codex lacked a signed-in browser session.
- Runtime integration beyond seeded/current Source context.
- Full agent mission activity UI binding.
- Mission queue persistence, scheduler, and background triggers later.
- Model-assisted response layer later.
- Pattern-grounded agent behavior later.

Blockers:

- No runtime mission queue, scheduler, persistence, or proactive background trigger exists yet.
- No model calls are approved.
- No chat UI is approved.
- No full mission activity UI is approved beyond the tiny dashboard preview.

Next recommended slice:

- Feed the mission report and top missions into the Source event canvas shell.

## Layer 7. Source API / Runtime

Purpose: expose Source-specific deterministic behavior through a route that uses Source context, validation reports, and multi-agent briefing before any model integration.

Current status: deterministic no-model API stub exists; production runtime not ready.

Percent complete estimate: 25%.

Evidence / PRs / Files:

- `src/lib/source/context-builder.ts`
- `src/lib/source/agent-validation-report.ts`
- `src/lib/source/workflow-validation-report.ts`
- `src/lib/source/multi-agent-briefing.ts`
- PR #230: deterministic Source Nexus API stub.
- PR #245: Source Nexus API stub contract tests.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`
- `src/lib/source/nexus-api.ts`

Completed items:

- Context builder exists.
- Validation reports exist.
- Deterministic multi-agent briefing exists.
- Deterministic no-model Source Nexus API stub exists.
- Contract tests cover no-model response shape and multi-agent briefing presence.

Remaining items:

- Auth, tenant, and role checks.
- Route smoke in authenticated/tenant context.
- Error/failure response shape.
- Mission read-model integration.
- Later model routing, only after context preflight is enforced.

Blockers:

- Route is deterministic and seeded; it is not production runtime readiness.
- No model calls, persistence, upload/parsing, scheduler, or workflow engine is approved.

Next recommended slice:

- Keep route deterministic and add mission read-model integration only after the Source mission queue plan is merged.

## Layer 8. Source UI / User Experience

Purpose: make Source feel like a premium, decisive, table-forward sourcing command surface aligned with the AbarVa Experience System.

Current status: dashboard exists with a tiny deterministic mission preview, review baseline, deterministic route/component smoke, and event canvas shell plan; broader UI is early and not production-ready.

Percent complete estimate: 43%.

Evidence / PRs / Files:

- PR #212: Source dashboard front-door refinement.
- PR #213: authenticated dashboard review packet, blocked by Clerk redirect at the time.
- PR #218: Source auth redirect fix.
- PR #259: tiny deterministic Source dashboard mission preview.
- PR #262: dashboard mission preview visual review, approved as baseline with authenticated screenshot unavailable.
- PR #264: dashboard route/component smoke coverage.
- PR #265: Source event canvas shell plan.
- `src/components/source/AbarVaSourceDashboard.tsx`
- `src/components/source/SourcingEventTable.tsx`
- `src/components/source/SourceAlertPanel.tsx`
- `docs/platform-design/experience-system/**`

Completed items:

- Source dashboard first viewport refined.
- KPI language improved.
- Executive pressure signals introduced.
- Event table salience improved.
- Auth redirect blocker was diagnosed and addressed in a later fix.
- Compact deterministic top-mission preview added for the most exposed seeded event without API calls, model calls, chat input, persistence, upload/parsing, or new routes.
- Dashboard mission preview approved as baseline; no tiny polish was implemented because screenshot evidence was unavailable.
- Deterministic route/component smoke coverage added for the `/source` dashboard path.
- Event canvas shell plan created for the existing `/source/events/[eventId]` and `NexusEngagementCanvas` boundary.

Remaining items:

- Authenticated dashboard screenshot/manual review after auth fix and mission preview merge.
- Implement event canvas shell only, then review visually.
- Full event workbench, final journey map behavior, scorecard, artifact, value, vendor, and agent panels.
- Screenshot-based visual QA.

Blockers:

- Do not expand UI until the next surface has an approved page spec, wireframe, and acceptance criteria.

Next recommended slice:

- Final authenticated Source dashboard review with mission preview visible, if auth is confirmed working.

## Layer 9. Data / Evidence / Upload Pipeline

Purpose: make Source capable of accepting, parsing, validating, citing, and governing evidence and artifacts.

Current status: not started beyond contracts and deterministic placeholders.

Percent complete estimate: 10%.

Evidence / PRs / Files:

- `src/lib/source/attachments.ts`
- `src/lib/source/context-builder.ts`
- `docs/abarva-source/build-pack/23_CHAT_EXPERIENCE_AND_INPUT_MODEL.md`
- `docs/abarva-source/build-pack/26_ARTIFACT_REVIEW_AND_APPROVAL_MODEL.md`
- Workflow validation defer: uploaded document cannot be cited before parsing/validation.

Completed items:

- Attachment and evidence concepts are documented.
- Placeholder evidence states exist in deterministic context.
- Workflow validation correctly defers uploaded-document citation until parsing/validation exists.

Remaining items:

- Upload storage.
- Parsing.
- Evidence registry.
- Citation extraction.
- Evidence usability review.
- Artifact versioning.
- Document export/import.
- Retention/audit policy.

Blockers:

- Upload/parsing implementation is explicitly not approved.
- Evidence and artifact storage model must be planned first.

Next recommended slice:

- Upload/evidence pipeline plan, later and separately from API/model/UI work.

## Layer 10. Production Readiness

Purpose: prepare Source for enterprise-grade deployment, security, observability, tenant safety, auditability, rollback, and live user trust.

Current status: not started beyond documentation and deterministic validation foundations.

Percent complete estimate: 10%.

Evidence / PRs / Files:

- `docs/abarva-source/SOURCE_PRODUCTION_READINESS_TRACKER.md`
- Context validation fixtures, runner, and report.
- Workflow validation fixtures, runner, and report.
- Multi-agent briefing review packet.

Completed items:

- Production readiness tracker exists.
- Deterministic context and workflow validation foundations exist.
- No-model/no-runtime guardrails are clear.

Remaining items:

- Source runtime smoke tests.
- Auth/tenant/role validation.
- Persistence and migration model.
- Audit trail.
- Observability.
- Error and empty states.
- Performance checks.
- Security review.
- Release/rollback plan.
- Live persona/crawler validation.

Blockers:

- Production readiness cannot advance meaningfully until Source runtime, persistence, evidence pipeline, and UI coverage exist.

Next recommended slice:

- Keep production readiness honest; do not mark production-ready until runtime/data/UI/security gates pass.

## What Is Done

- Source Build Pack and reconciled multi-file documentation.
- Source route family and first-class nav placement.
- Deterministic Source context builder and type contracts.
- Context validation fixtures, runner, and readable report.
- Workflow validation fixtures, runner, and readable report.
- Source production readiness tracker.
- Source dashboard front-door refinement.
- AbarVa Experience System and adoption bridge.
- Pattern Operating Model.
- AMS Managed Services Sourcing pattern pack.
- AMS pattern sectioning plan and 28 stable section IDs.
- Deterministic multi-agent briefing layer for Nexus, Sentinel, Atlas, and Steward.
- Platform Agent Mission Model for Nexus, Sentinel, Atlas, and Steward.
- Deterministic Source Nexus API route stub and contract tests.
- Deterministic Source agent mission read model.
- Deterministic Source agent mission report formatter.
- Agent mission activity UI plan.
- Source dashboard mission preview plan.
- Tiny deterministic Source dashboard mission preview.

## What Is Not Done

- Model-assisted Nexus responses.
- Chat UI.
- Runtime mission queue, scheduler, persistence, and background triggers.
- Full agent mission activity UI.
- Upload/parsing/evidence registry.
- Persistent Source data model.
- Workflow engine.
- Approval engine.
- Artifact versioning implementation.
- Document export/import.
- Event canvas expansion.
- Scorecard UI.
- Artifact drawer.
- Value ledger UI.
- Vendor response workflow.
- Production readiness gates.

## Next 5 Recommended Slices

1. Implement the Source event canvas shell only, using existing event route, journey, deterministic mission report, and data readiness placeholder guidance.
2. Capture authenticated screenshot/manual review for dashboard and event canvas when a signed-in session is available.
3. Define the Admin/Setup data readiness contract consumed by Source, no upload/parsing implementation.
4. Plan upload/evidence pipeline, no implementation.
5. Plan the next pattern/runtime grounding step, such as pattern manifest planning or Data Platform Managed Services authoring.

## What Not To Build Yet

- Chat UI.
- Model calls.
- Upload/parsing implementation.
- Event canvas expansion.
- Scorecard UI.
- Artifact drawer UI.
- Value ledger UI.
- Vendor flow.
- AI/RFP generation.
- Workflow engine.
- Approval engine.
- Artifact versioning implementation.
- Document export/import implementation.
- `/programs` integration.
- `/preview` or `/demo` surfaces.
- `ProgramSurface`.
- `src/lib/programs/mock.ts`.

## Honest MVP Readiness Assessment

Estimated MVP readiness: 54%.

Source is beyond a concept prototype because it has a route, dashboard, seeded domain context, validation harnesses, pattern IP, deterministic multi-agent behavior, a deterministic no-model Nexus API stub, deterministic mission reports, a tiny dashboard mission preview, and deterministic dashboard route/component smoke. It is not yet a usable MVP for real sourcing work because persistence, evidence pipeline, authenticated UI review, real tenant data, and practical user-facing workflow depth remain incomplete.

The fastest safe MVP path is deterministic-first:

1. Implement the Source event canvas shell only.
2. Review dashboard and event canvas with an authenticated screenshot/manual pass.
3. Define data readiness contract consumption before any upload/parsing implementation.
4. Add evidence/upload planning before any citation or artifact generation.
5. Add model calls only after context validation and runtime preflight are enforced.

## Honest Production Readiness Assessment

Estimated production readiness: 21%.

Production readiness remains low by design. The foundation is strong, but production Source needs persistent data, tenant safety, auth/role checks, evidence and citation pipeline, auditability, observability, error states, visual QA, and release validation. The current deterministic layers reduce product risk, but they do not substitute for runtime, data, security, and operational readiness.

Production readiness should not be claimed until Source passes these gates:

- Source runtime route works with authenticated tenant-scoped context.
- Source data persistence is implemented and tested.
- Upload/evidence pipeline supports safe citation.
- Agent/model responses are grounded by context validation.
- Workflow and approval behavior are enforced or explicitly blocked.
- UI surfaces are visually reviewed against the Experience System.
- Security, audit, observability, and rollback plans are complete.
