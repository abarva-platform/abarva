# AbarVa Source Production Readiness Tracker

Date: 2026-04-25

Purpose: answer "Where are we in relation to getting AbarVa Source to production?"

## 1. Executive Summary

AbarVa Source is not production-ready yet.

Foundation and agent-context architecture are progressing well. The Source Build Pack, route family, domain scaffolding, context-awareness documentation, type contracts, deterministic context builder, validation fixtures, and validation runner now create a serious foundation for a context-aware enterprise sourcing workbench.

The current work is still in the foundation and validation phase. Source should not move into chat UI, model calls, file upload, RFP generation, vendor workflow, or broader workflow expansion until deterministic context grounding and deterministic workflow validation are stronger.

The next major product milestone is a validated context-aware Nexus foundation before chat, model, and UI expansion. In practice, this means enriching deterministic seeded context, proving fixture behavior through the validation runner, and only then exposing Nexus interactions in product surfaces.

## 2. Current Milestone Status

| Workstream | Status | Evidence / PR / File | Notes | Next Action |
|---|---|---|---|---|
| Product Vision / Build Pack | Merged | PR #188, `docs/abarva-source/ABARVA_SOURCE_BUILD_PACK.md` | Product direction is established. | Keep Build Pack as source of truth. |
| Multi-file Build Pack | Merged | PR #188, `docs/abarva-source/build-pack/**` | Multi-file architecture exists, including agent, workflow, scorecard, commercial, and acceptance docs. | Keep updated as implementation decisions harden. |
| Source route family | Built | `src/app/(maestro)/source/**` | Route family exists, but production behavior is not complete. | Visual and route behavior review. |
| Source top-nav placement | Built | `src/components/AbarvaNav.tsx`, `src/components/chrome/PrimaryNav.tsx` | Source is intended as first-class operator nav between Programs and Intelligence. | Confirm in visual review. |
| Source dashboard prototype | Built | `src/components/source/AbarVaSourceDashboard.tsx` | Dashboard exists, but may still feel prototype-like. | Visual review and refinement after context gates. |
| Dashboard component refactor | Reviewed | `docs/abarva-source/build-pack/implementation-reviews/01_DASHBOARD_REFACTOR_REVIEW.md` | Component boundaries documented. | Apply visual review findings only after approval. |
| Agent context-awareness docs | Merged | PR #188, `docs/abarva-source/build-pack/22_AGENT_CONTEXT_AWARENESS.md` | Establishes context-first, not prompt-first, agent behavior. | Keep as binding agent design rule. |
| Agent type contracts | Merged | PR #188, `src/lib/source/agent-context.ts`, `chat-types.ts`, `attachments.ts`, `agent-validation.ts` | SourceAgentContextBundle and related contracts exist. | Refine only when implementation proves naming gaps. |
| Deterministic context builder | Merged | PR #188, `src/lib/source/context-builder.ts` | Builds seeded portfolio, event, stage, and failure contexts. | Enrich deterministic context depth. |
| Context validation fixtures | Merged | PR #190, `src/lib/source/agent-validation-fixtures.ts` | Golden prompts validate anti-vanilla behavior without LLMs. | Improve seeded context for current defers. |
| Context validation runner | Merged | PR #192, `src/lib/source/agent-validation-runner.ts` | Produces structured pass/defer/reject report. | Harden report after context depth improves. |
| Context depth for fixture defers | Merged | PR #195, `docs/abarva-source/build-pack/implementation-reviews/07_CONTEXT_DEPTH_FOR_DEFERS_REVIEW.md` | Fixture outcomes improved from 4 pass / 6 defer / 0 reject to 8 pass / 2 defer / 0 reject. | Preserve intentional defers until real attachment/client evidence exists. |
| Runner report hardening | Merged | PR #197, `src/lib/source/agent-validation-report.ts` | Readable report formatter exists for 10 fixtures, 8 pass, 2 defer, 0 reject. | Use report before chat/model work. |
| Nexus Engagement Canvas | Designed | Build Pack wireframes and component specs | Not implemented beyond allowed foundation. | Review spec before any build. |
| Source Journey Tracker final behavior | Partial | `src/components/source/SourceJourneyTracker.tsx`, Build Pack docs | Component exists, final behavior not production validated. | Review lifecycle/state expectations. |
| Persistent Nexus Panel | Designed | Build Pack docs, context-awareness docs | Chat/panel behavior is specified, not implemented. | Wait for stronger context validation. |
| Chat input model | Designed | `docs/abarva-source/build-pack/23_CHAT_EXPERIENCE_AND_INPUT_MODEL.md` | 3 choices plus custom model is specified. | Do not build until context validation is stronger. |
| File attachment model | Designed | `src/lib/source/attachments.ts`, `23_CHAT_EXPERIENCE_AND_INPUT_MODEL.md` | Type contracts exist, upload/parsing does not. | Review attachment pipeline before implementation. |
| Source-specific Nexus API route | Not Started | Planned future route, likely `/api/v1/source/[eventId]/nexus/ask` | Existing program-scoped Nexus routes should not be reused directly. | Build stub only after context depth and runner gates. |
| Model-assisted Nexus response | Not Started | `16_AGENT_PER_TURN_CONTRACT.md`, `22_AGENT_CONTEXT_AWARENESS.md` | Model behavior is designed, not wired. | Do not start until SourceAgentContextBundle is enforced. |
| Scorecard governance UI | Not Started / Deferred | Build Pack scorecard docs | Scorecard governance is specified, UI not expanded. | Seed defaults first, then review UI scope. |
| Artifact drawer | Not Started / Deferred | Build Pack artifact docs | Artifact structure exists in plan, not production-ready. | Stabilize artifact model before generation. |
| Artifact versioning | Designed | `docs/abarva-source/build-pack/25_WORKFLOW_RICHNESS_AND_DOCUMENT_COLLABORATION.md`, `docs/abarva-source/build-pack/10_ARTIFACT_AND_RFP_GENERATION_MODEL.md` | Versioning is now a product requirement; no implementation exists. | Create type contract before UI/export work. |
| External document editing | Designed | `docs/abarva-source/build-pack/25_WORKFLOW_RICHNESS_AND_DOCUMENT_COLLABORATION.md`, `docs/abarva-source/build-pack/10_ARTIFACT_AND_RFP_GENERATION_MODEL.md` | Export/edit/re-upload is required; Office/Google Docs may remain editing surfaces. | Do not implement until artifact version model is reviewed. |
| Approval routing | Designed | `docs/abarva-source/build-pack/26_ARTIFACT_REVIEW_AND_APPROVAL_MODEL.md` | Sequential/parallel, waiver, escalation, and role-based approval model is specified. | Create deterministic approval route types before UI. |
| Workflow validation harness | Designed | `docs/abarva-source/build-pack/27_WORKFLOW_VALIDATION_HARNESS.md` | Harness scenarios define allow/block/defer/waiver behavior. | Implement deterministic fixtures before workflow UI. |
| Document review wait states | Designed | `docs/abarva-source/build-pack/13_EVENT_LIFECYCLE_AND_ALERTS.md` | Document review wait states are specified; not implemented. | Model wait states before artifact workflow UI. |
| Approval wait states | Designed | `docs/abarva-source/build-pack/13_EVENT_LIFECYCLE_AND_ALERTS.md`, `docs/abarva-source/build-pack/26_ARTIFACT_REVIEW_AND_APPROVAL_MODEL.md` | Approval wait, escalation, waiver, and expiry states are specified. | Model deterministic approval state before UI. |
| Artifact evidence/citation requirements | Designed | `docs/abarva-source/build-pack/10_ARTIFACT_AND_RFP_GENERATION_MODEL.md`, `27_WORKFLOW_VALIDATION_HARNESS.md` | Artifact trust requires Sentinel/evidence/citation validation; no runtime exists. | Create artifact evidence contract before generation. |
| RFP/RFI artifact generation | Not Started / Deferred | Build Pack artifact generation model | Explicitly blocked until artifact structure, gates, and evidence are stable. | Keep blocked. |
| Value ledger UI | Not Started / Deferred | Build Pack value ledger docs, source value types | Value concepts exist, production UI not built. | Add deterministic value context first. |
| Vendor response workflow | Not Started / Deferred | Build Pack workflow docs | No vendor response flow should be built before scorecard and attachment foundations. | Keep blocked. |
| Supabase persistence | Not Started | Seeded Source context only | Current Source behavior relies on deterministic seed data. | Design persistence model after context contracts settle. |
| Auth/permissions/tenant safety | Not Started for Source-specific depth | Existing app auth exists; Source-specific tenant rules not production validated | Need Source-specific permission and tenant-boundary review. | Define Source auth and role matrix. |
| Persona crawler validation | Designed | `17_CRAWLER_PERSONA_VERIFICATION.md`, `24_CONTEXT_VALIDATION_HARNESS.md` | Persona crawler model exists, executable crawler not built. | Build after deterministic validation stabilizes. |
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
- Blocked: work cannot proceed until a dependency or decision is resolved.
- Deferred: intentionally postponed to avoid premature scope or architecture risk.

## 4. Production Readiness Gates

### Gate 1: Foundation Ready

Required:

- Source route exists.
- Source nav exists.
- Build Pack exists.
- Source domain types exist.

Current assessment: mostly satisfied, but still needs visual/product review before treating the foundation as complete.

### Gate 2: Context Ready

Required:

- Context bundle defined.
- Context builder works.
- Context validation fixtures exist.
- Runner produces pass/defer/reject report.

Current assessment: partially satisfied and improving. The next context-depth slice should reduce avoidable defers and keep intentional defers visible.

### Gate 3: UX Ready

Required:

- Dashboard visually approved.
- Event canvas approved.
- Nexus panel approved.
- Journey tracker approved.
- Scorecard, artifact, and value surfaces approved.

Current assessment: not satisfied. Dashboard exists, but UX completeness is early and review is pending.

Workflow/document collaboration note: UX is not ready until artifact lifecycle, version history, review queues, approval state, and gate-blocking behavior have approved designs. Do not build document collaboration UI before the workflow validation harness exists.

### Gate 4: Agent Ready

Required:

- Source-specific Nexus route exists.
- Nexus uses SourceAgentContextBundle.
- Responses pass validation harness.
- No vanilla GPT responses.

Current assessment: not satisfied. The architecture is strong, but no Source-specific Nexus API route or model-assisted response runtime exists yet.

### Gate 5: Data Ready

Required:

- Supabase persistence exists.
- Seeded data replaced with real data where needed.
- Attachments stored and parsed.
- Citations/evidence connected.
- Artifact versions persisted.
- Export/upload records persisted.
- Review comments and approvals persisted.

Current assessment: not satisfied. Current Source context is seeded and deterministic only.

### Gate 6: Enterprise Ready

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

Current assessment: not satisfied for Source production. Shared app capabilities may exist, but Source-specific enterprise readiness is not validated.

### Gate 7: Production Ready

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
- Agent architecture: strong and improving. Context-first design is well documented and type-backed.
- Context validation: emerging. Fixtures and runner exist, and current defers expose useful gaps.
- UI completeness: early. Dashboard exists, but broader Source UX is not production complete.
- Data persistence: not yet production. Current behavior is seeded and deterministic.
- Agent/model integration: not yet started. This is intentional and should remain blocked until context validation is stronger.
- Production readiness: not yet started. Source has not passed enterprise, deployment, security, persistence, or live persona validation gates.

## 6. Near-Term Roadmap

1. Context depth improvements for fixture defers.
2. Context validation runner report hardening.
3. Visual review/refine Source dashboard.
4. Workflow richness and document collaboration review.
5. Deterministic workflow validation harness fixtures.

## 7. Explicit Do-Not-Build List

Keep active:

- No chat UI until context validation is stronger.
- No model calls until SourceAgentContextBundle is enforced.
- No file upload until attachment model is reviewed.
- No document export/import until artifact versioning and review model are reviewed.
- No approval routing UI until approval model and workflow validation fixtures exist.
- No RFP generation until artifact structure is stable.
- No vendor workflow until scorecard governance is stable.
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
- PR #196: Runner report hardening plan.
- PR #197: Context validation report formatter.
- PR #198: Dashboard visual review plan.
- PR #199: Source dashboard visual review.
- PR #200: Dashboard front-door refinement plan.
- PR #201: Build Pack inventory reconciliation.

Post-merge planning notes:

- `docs/abarva-source/NEXT_SLICE_PLAN_CONTEXT_VALIDATION_FIXTURES.md` planned fixture work after PR #188.
- `docs/abarva-source/NEXT_SLICE_PLAN_CONTEXT_VALIDATION_RUNNER.md` planned runner work after PR #190.
- `docs/abarva-source/NEXT_SLICE_PLAN_CONTEXT_DEPTH_FOR_DEFERS.md` plans deterministic context depth improvements after PR #192.
- `docs/abarva-source/NEXT_SLICE_PLAN_RUNNER_REPORT_HARDENING.md` planned readable report output.
- `docs/abarva-source/NEXT_SLICE_PLAN_SOURCE_DASHBOARD_VISUAL_REVIEW.md` planned visual dashboard review.
- `docs/abarva-source/NEXT_SLICE_PLAN_SOURCE_DASHBOARD_REFINEMENT.md` planned the dashboard front-door refinement.

## 9. Open Risks

- Dashboard may still feel prototype-like.
- Seeded data may hide persistence gaps.
- Context quality still depends on richer pattern, scorecard, evidence, and attachment data.
- File upload/evidence pipeline is not built.
- No Source-specific Nexus API route exists yet.
- No model validation exists yet.
- Workflow richness is designed but not implemented.
- Artifact versioning, export/re-upload, review comments, approvals, and waivers are not implemented.
- Workflow validation harness is specified but not executable.
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

Current tracker assessment: complete for current planning state. It should be updated after every Source PR merge or material readiness decision.
