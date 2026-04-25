# AbarVa Source Production Readiness Tracker

Date: 2026-04-25

Purpose: answer "Where are we in relation to getting AbarVa Source to production?"

## 1. Executive Summary

AbarVa Source is not production-ready yet.

The foundation and agent-context architecture are strong. The Source Build Pack, route family, domain scaffold, context-aware agent contracts, deterministic context builder, context validation foundation, and workflow validation foundation are now in place.

The current work is still in the foundation and validation phase. Source now has deterministic guardrails for both agent context grounding and workflow integrity, but it does not yet have production UI completeness, persistence, upload/evidence processing, Source-specific agent routes, model-assisted responses, workflow engine enforcement, approval engine behavior, artifact versioning, or document export/import.

The next major product milestone remains a validated context-aware Nexus foundation before chat/model/UI expansion. The workflow validation foundation now adds a second guardrail: Source should not permit unsafe sourcing workflow moves once workflow behavior is implemented.

## 2. Current Milestone Status

| Workstream | Status | Evidence / PR / File | Notes | Next Action |
|---|---|---|---|---|
| Product Vision / Build Pack | Merged | PR #188, `docs/abarva-source/ABARVA_SOURCE_BUILD_PACK.md` | Product direction is established. | Keep Build Pack as source of truth. |
| Multi-file Build Pack | Merged | PR #188, PR #201, `docs/abarva-source/build-pack/**` | Inventory is reconciled with the anchor. | Keep updated as implementation decisions harden. |
| Source route family | Built | `src/app/(maestro)/source/**` | Route family exists, but production behavior is incomplete. | Continue visual and workflow review before expansion. |
| Source top-nav placement | Built | `src/components/AbarvaNav.tsx`, `src/components/chrome/PrimaryNav.tsx` | Source is first-class operator nav. | Preserve unless product review changes nav model. |
| Source dashboard prototype | Built / Early | `src/components/source/AbarVaSourceDashboard.tsx` | Dashboard exists; approved with small refinements. | Refine only in a bounded dashboard slice. |
| Dashboard component refactor | Reviewed | `docs/abarva-source/build-pack/implementation-reviews/01_DASHBOARD_REFACTOR_REVIEW.md` | Component boundaries documented. | Apply visual review findings only after approval. |
| Agent context-awareness docs | Merged | PR #188, `22_AGENT_CONTEXT_AWARENESS.md` | Establishes context-first, not prompt-first, agent behavior. | Keep as binding agent design rule. |
| Agent type contracts | Merged | PR #188, `src/lib/source/agent-context.ts`, `chat-types.ts`, `attachments.ts`, `agent-validation.ts` | SourceAgentContextBundle and response contracts exist. | Refine only when implementation proves naming gaps. |
| Deterministic context builder | Merged | PR #188, `src/lib/source/context-builder.ts` | Builds seeded portfolio, event, stage, and failure contexts. | Use as input to future Source API/model work. |
| Context validation fixtures | Merged / Complete | PR #190, `src/lib/source/agent-validation-fixtures.ts` | Golden prompts validate anti-vanilla behavior without LLMs. | Keep fixtures as pre-model guardrail. |
| Context validation runner | Merged / Complete | PR #192, `src/lib/source/agent-validation-runner.ts` | Produces deterministic pass/defer/reject report. | Run before chat/model wiring. |
| Context validation report formatter | Merged / Complete | PR #197, `src/lib/source/agent-validation-report.ts` | Current context report outcome: 10 fixtures, 8 pass, 2 defer, 0 reject. | Preserve intentional defers until real evidence exists. |
| Context validation foundation | Complete | PR #190, PR #192, PR #197 | Deterministic context fixtures, runner, and readable report exist. | Treat as required preflight for Source Nexus work. |
| Context depth for fixture defers | Merged | PR #195, `07_CONTEXT_DEPTH_FOR_DEFERS_REVIEW.md` | Fixture outcomes improved from 4 pass / 6 defer / 0 reject to 8 pass / 2 defer / 0 reject. | Keep remaining defers intentional. |
| Workflow richness/document model | Merged | PR #202, files 25-27 plus artifact/lifecycle updates | Defines sourcing workflow, artifact lifecycle, review/approval, document collaboration, and workflow validation. | Keep as source of truth for workflow behavior. |
| Workflow validation fixtures | Merged / Complete | PR #204, `src/lib/source/workflow-validation-fixtures.ts` | 12 deterministic fixtures cover gates, approvals, versioning, waiver behavior, upload citation readiness, vendor response completeness, and value realization. | Use before workflow engine/UI work. |
| Workflow validation runner | Merged / Complete | PR #207, `src/lib/source/workflow-validation-runner.ts` | Executes all deterministic workflow fixtures. | Keep as workflow integrity preflight. |
| Workflow validation report formatter | Merged / Complete | PR #210, `src/lib/source/workflow-validation-report.ts` | Current outcome: 12 total, 11 BLOCK, 1 DEFER, 0 mismatches; suite verdict: defer. | Preserve remaining intentional defer until upload parsing/evidence exists. |
| Workflow validation foundation | Complete | PR #204, PR #207, PR #210 | Deterministic fixtures, runner, and readable report exist. | Do not build workflow engine until these semantics are reviewed. |
| Remaining workflow defer | Intentional | `source-workflow-uploaded-document-parse-before-citation` | Uploaded documents cannot be cited before parsing/validation. | Build upload/evidence pipeline later, not in current slice. |
| Nexus Engagement Canvas | Designed | Build Pack wireframes and component specs | Not implemented beyond allowed foundation. | Review spec before any build. |
| Source Journey Tracker final behavior | Partial | `src/components/source/SourceJourneyTracker.tsx`, Build Pack docs | Component exists, final behavior not production validated. | Review lifecycle/state expectations. |
| Persistent Nexus Panel | Designed | Build Pack docs, context-awareness docs | Chat/panel behavior is specified, not implemented. | Wait for SourceAgentContextBundle enforcement. |
| Chat input model | Designed | `23_CHAT_EXPERIENCE_AND_INPUT_MODEL.md` | 3 choices plus custom model is specified. | Do not build until context validation is used by runtime. |
| File attachment model | Designed | `src/lib/source/attachments.ts`, `23_CHAT_EXPERIENCE_AND_INPUT_MODEL.md` | Type contracts exist; upload/parsing does not. | Review attachment pipeline before implementation. |
| Upload/evidence pipeline | Not Started | Attachment/context docs only | No upload, parsing, citation extraction, evidence registry, or client evidence usability exists. | Design implementation after attachment model review. |
| Source-specific Nexus API route | Not Started | Planned future route, likely `/api/v1/source/[eventId]/nexus/ask` | Existing program-scoped Nexus routes should not be reused directly. | Build stub only when approved. |
| Model-assisted Nexus response | Not Started | `16_AGENT_PER_TURN_CONTRACT.md`, `22_AGENT_CONTEXT_AWARENESS.md` | Model behavior is designed, not wired. | Do not start until context bundle enforcement is present. |
| Scorecard governance UI | Not Started / Deferred | Build Pack scorecard docs | Scorecard governance is specified, UI not expanded. | Keep blocked until governance model is reviewed. |
| Artifact drawer | Not Started / Deferred | Build Pack artifact docs | Artifact structure exists in plan, not production-ready. | Stabilize artifact model before generation. |
| Artifact versioning | Designed / Not Implemented | `25_WORKFLOW_RICHNESS_AND_DOCUMENT_COLLABORATION.md`, `10_ARTIFACT_AND_RFP_GENERATION_MODEL.md` | Versioning is a requirement; no runtime/data model implementation exists. | Create type/data contract before UI/export work. |
| External document editing | Designed / Not Implemented | `25_WORKFLOW_RICHNESS_AND_DOCUMENT_COLLABORATION.md`, `10_ARTIFACT_AND_RFP_GENERATION_MODEL.md` | Export/edit/re-upload is required; Office/Google Docs may remain editing surfaces. | Do not implement until artifact version model is reviewed. |
| Approval routing | Designed / Not Implemented | `26_ARTIFACT_REVIEW_AND_APPROVAL_MODEL.md` | Sequential/parallel, waiver, escalation, and role-based approval model is specified. | Create deterministic approval route types before UI. |
| Workflow engine | Not Started | Workflow validation docs and fixtures only | Runtime enforcement does not exist. | Do not build until explicitly approved. |
| Approval engine | Not Started | Approval docs only | No approval execution, routing, escalation, or waiver engine exists. | Do not build until workflow model is reviewed. |
| Document export/import | Not Started | Document collaboration docs only | No DOCX/XLSX/PPTX/PDF export or re-upload processing exists. | Keep blocked until artifact versioning and storage are designed. |
| RFP/RFI artifact generation | Not Started / Deferred | Build Pack artifact generation model | Blocked until artifact structure, gates, evidence, and review lifecycle are stable. | Keep blocked. |
| Value ledger UI | Not Started / Deferred | Build Pack value ledger docs, Source value types | Value concepts exist; production UI not built. | Add persistence/data model before UI expansion. |
| Vendor response workflow | Not Started / Deferred | Build Pack workflow docs | No vendor response flow should be built before scorecard and attachment foundations. | Keep blocked. |
| Supabase persistence | Not Started | Seeded Source context only | Current Source behavior relies on deterministic seed data. | Design persistence model after contracts settle. |
| Data persistence | Not Production-Ready | Seed data and docs only | No production Source data model, storage, migrations, or evidence persistence exists. | Plan persistence separately. |
| Auth/permissions/tenant safety | Not Started for Source-specific depth | Existing app auth exists; Source-specific tenant rules not production validated. | Define Source auth and role matrix. |
| Persona crawler validation | Designed | `17_CRAWLER_PERSONA_VERIFICATION.md`, `24_CONTEXT_VALIDATION_HARNESS.md` | Persona crawler model exists; executable crawler not built. | Build after deterministic validation stabilizes. |
| UI completion | Early / Not Production-Ready | Dashboard exists; event canvas/panel/scorecard/artifact/value surfaces incomplete | Source does not yet have production UX coverage. | Continue bounded visual/refinement slices only. |
| Agent/model integration | Not Started | No Source-specific Nexus route/model call | Intentional block remains active. | Wait until context bundle is enforced. |
| Production deployment readiness | Not Started | No production readiness checklist passed for Source | Source is not production-ready. | Start only after UX, agent, data, and enterprise gates pass. |

## 3. Status Legend

- Not Started: no implementation or approved plan exists yet.
- Designed: product or technical design exists, but implementation has not started.
- Planned: next-slice plan exists, but implementation has not started.
- In Progress: implementation is actively underway.
- Built: implementation exists, but has not completed validation.
- Validated: implementation has passed defined acceptance checks.
- PR Open: work is proposed in a pull request and awaiting review or merge.
- Merged: work has landed in main.
- Complete: deterministic foundation for the named layer exists and is merged.
- Blocked: work cannot proceed until a dependency or decision is resolved.
- Deferred: intentionally postponed to avoid premature scope or architecture risk.

## 4. Production Readiness Gates

### Gate 1: Foundation Ready

Required:

- Source route exists.
- Source nav exists.
- Build Pack exists.
- Source domain types exist.

Current assessment: mostly satisfied. The foundation exists, but production readiness still depends on visual approval, persistence, enterprise controls, and runtime integration.

### Gate 2: Context Ready

Required:

- Context bundle defined.
- Context builder works.
- Context validation fixtures exist.
- Runner produces pass/defer/reject report.
- Readable report makes remaining gaps visible.

Current assessment: satisfied for deterministic foundation. Context validation fixtures, runner, and readable report formatter are merged. This does not mean Source Nexus runtime is ready; it means the pre-model validation layer exists.

### Gate 3: Workflow Integrity Ready

Required:

- Workflow validation fixtures exist.
- Workflow validation runner executes fixtures deterministically.
- Workflow validation report shows BLOCK/DEFER/WAIVER_REQUIRED/FAIL behavior.
- Remaining defers are explicit and justified.

Current assessment: satisfied for deterministic foundation. PR #204, PR #207, and PR #210 provide 12 fixtures, a runner, and readable reporting. Current outcome is 12 total, 11 BLOCK, 1 DEFER, 0 mismatches. Runtime workflow enforcement is not implemented.

### Gate 4: UX Ready

Required:

- Dashboard visually approved.
- Event canvas approved.
- Nexus panel approved.
- Journey tracker approved.
- Scorecard, artifact, and value surfaces approved.

Current assessment: not satisfied. Dashboard exists and was approved with small refinements, but broader Source UX is early and not production-ready.

### Gate 5: Agent Ready

Required:

- Source-specific Nexus route exists.
- Nexus uses SourceAgentContextBundle.
- Responses pass validation harness.
- No vanilla GPT responses.

Current assessment: not satisfied. The architecture is strong, but no Source-specific Nexus API route or model-assisted response runtime exists yet.

### Gate 6: Data Ready

Required:

- Supabase persistence exists.
- Seeded data replaced with real data where needed.
- Attachments stored and parsed.
- Citations/evidence connected.
- Artifact versions persisted.
- Export/upload records persisted.
- Review comments and approvals persisted.

Current assessment: not satisfied. Current Source context and validation behavior are deterministic and seeded only.

### Gate 7: Enterprise Ready

Required:

- Auth, permissions, and tenant boundaries.
- Audit trail.
- Error states.
- Loading states.
- Logging.
- Validation.
- Crawler persona checks.
- Workflow validation harness.
- Approval audit trail.
- Waiver audit trail.

Current assessment: not satisfied for Source production. Deterministic validation foundations are complete, but runtime enforcement, audit, permissions, and crawler checks are not production validated.

### Gate 8: Production Ready

Required:

- Deployment checks.
- Performance checks.
- Visual QA.
- Security review.
- Smoke tests.
- Rollback plan.

Current assessment: not started for Source.

## 5. Current Readiness Assessment

- Foundation: strong. Build Pack, route family, domain scaffolding, and agent-context foundations exist.
- Agent architecture: strong and improving. Context-first design is documented, typed, and backed by deterministic context validation.
- Context validation foundation: complete. Fixtures, runner, and readable report formatter are merged.
- Workflow validation foundation: complete. Fixtures, runner, and readable report formatter are merged.
- UI completeness: early / not production-ready. Dashboard exists, but broader Source UX is incomplete.
- Data persistence: not production-ready. Current behavior is seeded and deterministic.
- Upload/evidence pipeline: not started. The remaining workflow defer correctly blocks uploaded document citation before parsing/validation.
- Agent/model integration: not started. This is intentional and remains blocked.
- Production readiness: not started. Source has not passed enterprise, deployment, security, persistence, runtime, or live persona validation gates.

## 6. Near-Term Roadmap

1. Review this production readiness tracker update after the workflow validation milestone.
2. Decide the next approved Source slice without weakening the do-not-build list.
3. If continuing validation depth, plan upload/evidence pipeline contracts before implementing upload/parsing.
4. If returning to UX, run only bounded dashboard/front-door refinement, not event canvas expansion.
5. If preparing runtime work, plan a Source-specific Nexus API route stub with no model call.

## 7. Explicit Do-Not-Build List

Keep active:

- No chat UI until context validation is enforced by runtime.
- No model calls until SourceAgentContextBundle is enforced.
- No API routes until the route stub is explicitly approved.
- No file upload/parsing until attachment and evidence pipeline contracts are reviewed.
- No workflow engine until workflow validation semantics are reviewed.
- No approval engine until approval route/state contracts are reviewed.
- No artifact versioning implementation until the data model is reviewed.
- No document export/import until artifact versioning and storage are designed.
- No RFP generation until artifact structure is stable.
- No vendor workflow until scorecard governance and attachment foundations are stable.
- No `/programs` coupling.
- No `/preview` or `/demo` surfaces.

## 8. PR / Commit History

- PR #188: Source foundation docs and context contracts.
- PR #190: Context validation fixtures.
- PR #191: Context validation runner plan.
- PR #192: Deterministic context validation runner.
- PR #193: Context depth improvements plan.
- PR #194: Source production readiness tracker.
- PR #195: Seeded context depth for validation fixtures.
- PR #196: Context runner report hardening plan.
- PR #197: Context validation report formatter.
- PR #198: Dashboard visual review plan.
- PR #199: Source dashboard visual review.
- PR #200: Dashboard front-door refinement plan.
- PR #201: Build Pack inventory reconciliation.
- PR #202: Workflow richness and document collaboration model.
- PR #203: Workflow validation fixtures plan.
- PR #204: Workflow validation fixtures.
- PR #205: CI lint repair for `D04TensionSection`.
- PR #206: Workflow validation runner plan.
- PR #207: Deterministic workflow validation runner.
- PR #209: Workflow validation report hardening plan.
- PR #210: Workflow validation report formatter.

Post-merge planning notes:

- `docs/abarva-source/NEXT_SLICE_PLAN_CONTEXT_VALIDATION_FIXTURES.md` planned fixture work after PR #188.
- `docs/abarva-source/NEXT_SLICE_PLAN_CONTEXT_VALIDATION_RUNNER.md` planned runner work after PR #190.
- `docs/abarva-source/NEXT_SLICE_PLAN_CONTEXT_DEPTH_FOR_DEFERS.md` planned deterministic context depth improvements after PR #192.
- `docs/abarva-source/NEXT_SLICE_PLAN_RUNNER_REPORT_HARDENING.md` planned readable context report output.
- `docs/abarva-source/NEXT_SLICE_PLAN_SOURCE_DASHBOARD_VISUAL_REVIEW.md` planned visual dashboard review.
- `docs/abarva-source/NEXT_SLICE_PLAN_SOURCE_DASHBOARD_REFINEMENT.md` planned dashboard front-door refinement.
- `docs/abarva-source/NEXT_SLICE_PLAN_WORKFLOW_VALIDATION_FIXTURES.md` planned deterministic workflow validation fixtures.
- `docs/abarva-source/NEXT_SLICE_PLAN_WORKFLOW_VALIDATION_RUNNER.md` planned deterministic workflow validation runner.
- `docs/abarva-source/NEXT_SLICE_PLAN_WORKFLOW_VALIDATION_REPORT_HARDENING.md` planned readable workflow validation report hardening.

## 9. Open Risks

- Dashboard may still feel prototype-like.
- Seeded data may hide persistence gaps.
- Context quality still depends on richer client, pattern, scorecard, evidence, and attachment data.
- File upload/evidence pipeline is not built.
- Uploaded document citation remains intentionally deferred until parsing/validation exists.
- No Source-specific Nexus API route exists yet.
- No model validation exists yet.
- Workflow validation foundation exists, but no runtime workflow engine enforcement exists.
- Artifact versioning, export/re-upload, review comments, approvals, and waivers are not implemented.
- Persona crawler validation is designed but not executable.
- Auth, permission, and tenant-boundary behavior is not Source-production validated.
- Unrelated workspace files must not leak into Source commits.

## 10. Acceptance Criteria For Tracker

This tracker is complete when it gives a clear, honest view of:

- What is done.
- What is planned.
- What is blocked.
- What is not started.
- What must be true before production.

Current tracker assessment: updated for the completed deterministic workflow validation milestone. It should be updated after every Source PR merge or material readiness decision.
