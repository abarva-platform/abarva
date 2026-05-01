# Programs Module End-to-End Audit Report

Audit date: 2026-05-01
Codebase audited: `/private/tmp/nexus-entitlement-nav`
Branch: `codex/programs-e2e-audit-fixes` from `main` at `fdd24590 feat(auth): add entitlement-aware navigation guards (#1364)`
Audit method: static code inspection with file and line citations. No deployed browser smoke was executed in this audit. Any path that lacks deployed proof is marked `NOT DEPLOYED-SMOKED`.

## Fix Ledger Added During Audit

This report started as an audit. The first remediation batch was applied on branch `codex/programs-e2e-audit-fixes` so the report now distinguishes uncovered gaps from gaps already closed in code.

Fixed in this branch:

- P4/P5/P6 Nexus doctrine corrected:
  - `src/lib/programs/phase-packs/P4_build.ts` now labels and trains P4 as `P4 Execution Roadmap`, not Build.
  - `src/lib/programs/phase-packs/P5_activate.ts` now labels and trains P5 as `P5 Approval & Mobilization`, not Activate.
  - `src/lib/programs/phase-packs/P6_operate.ts` now labels and trains P6 as `P6 Tower Handoff`, not Operate.
  - `src/lib/programs/phase-packs/P3_design.ts` handoff language was updated so P3 produces roadmap-ready design inputs, not pilot/build instructions.
- Create permission enforcement added:
  - `src/lib/agent/tools/program/commitProgram.ts` now refuses `commit_program` when `canCreatePrograms` is false.
  - `src/app/api/v1/programs/route.ts` now returns 403 unless the user has `can_create_programs`.
- Access-policy overgrant fixed:
  - `src/lib/auth/program-access-policy.ts` no longer defaults an unknown user with no membership/participants to `client_admin`; it returns `no_program_access`.
- Financial sanitizer bypass reduced:
  - `src/app/api/v1/programs/[programId]/deliverables/complete/route.ts` now checks `canGenerateDeliverables` and sanitizes saved deliverable content with the same restricted-output policy used by the agent tool path.
- Visible upload route corrected:
  - `src/components/programs/ProgramDetailPage.tsx` now posts the Program detail upload control to `/api/programs/[id]/attachments/upload` instead of the ephemeral `/api/v1/nexus/upload` route.
- Upload-to-evidence control-plane spine added:
  - `supabase/migrations/20260501120000_program_evidence_items.sql` adds append-only `program_evidence_items`.
  - `src/lib/programs/evidence-ingestion.ts` extracts structured signals from text/markdown/json/csv-style uploads and records metadata-only evidence for unsupported binary uploads.
  - `src/app/api/programs/[id]/attachments/upload/route.ts` now enforces `canUploadArtifacts` and records a linked evidence row after attachment upload.
- Immutable audit-log writes added:
  - `src/lib/programs/audit-log.ts` writes to `program_audit_log`.
  - Program origination, program approval submit/decision/withdraw, phase approval request/decision, phase advance, deliverable sign-off, module status change, and evidence capture now emit audit events.
- Client-pinned Programs provisioning API added:
  - `src/app/api/admin/users/provision/route.ts` lets a client admin provision a Programs user, set access level, financial visibility, create/approve/upload/generate/publish flags, and assign program IDs.
  - The API verifies every assigned program belongs to the active client before inserting or updating `engagement_participants`; cross-client assignment attempts are returned as failed assignment results, not written.
- Server-side Programs route guard added:
  - `src/app/programs/page.tsx` now requires the signed-in user to have the `programs` product module before rendering.
- Phase approval/advance route guards tightened:
  - `src/app/api/v1/programs/[programId]/approvals/route.ts` now checks program visibility before listing or creating phase approval requests.
  - `src/app/api/v1/programs/[programId]/approvals/[approvalId]/decide/route.ts` now requires `canApproveGates` before a non-founder can decide a gate approval.
  - `src/app/api/v1/programs/[programId]/advance/route.ts` now checks program visibility and requires gate-approval permission before bypassing a gate.
- Private data-plane local proof captured:
  - `/api/context/demo` and `/api/chat/agent` context-bundle tests pass locally.
  - The private data-plane registry and ContextBroker wiring existed before this fix batch; this branch preserves it and records local test proof only. Deployed smoke is still absent.

Validation run after fixes:

- `npx jest src/lib/programs/phase-packs/__tests__ --runInBand` → 11 suites / 210 tests passed.
- `npx jest src/app/api/context/demo/__tests__/route.test.ts src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts --runInBand` → 2 suites / 40 tests passed.
- `npx jest src/lib/knowledge/context-broker/__tests__/broker.test.ts src/app/api/context/demo/__tests__/route.test.ts src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts --runInBand` → 3 suites / 62 tests passed.
- `npx jest src/lib/agent/tools/__tests__/commitProgram.test.ts src/lib/agent/tools/__tests__/completeDeliverable.test.ts --runInBand` → 2 suites / 15 tests passed.
- `npx jest --runTestsByPath src/app/api/v1/programs/[programId]/deliverables/complete/__tests__/route.test.ts --runInBand` → 1 suite / 3 tests passed.
- `npx jest src/lib/programs/__tests__/evidence-ingestion.test.ts src/app/api/programs/__tests__/attachments-upload.smoke.test.ts src/lib/programs/__tests__/approval.test.ts src/lib/programs/__tests__/governance-gates.test.ts src/lib/agent/tools/__tests__/commitProgram.test.ts src/lib/agent/tools/__tests__/completeDeliverable.test.ts --runInBand` → 6 suites / 61 tests passed.
- `npx jest --runTestsByPath src/app/api/admin/users/provision/__tests__/route.test.ts --runInBand` → 1 suite / 3 tests passed.
- `npx jest src/lib/programs/phase-packs/__tests__ src/app/api/context/demo/__tests__/route.test.ts src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts src/lib/auth/__tests__/program-access-policy.test.ts src/app/api/programs/__tests__/attachments-upload.smoke.test.ts --runInBand` → 15 suites / 263 tests passed.
- Final focused regression command over phase packs, broker/demo/chat context, access policy, upload smoke, evidence ingestion, approval/governance, program tools, program API contracts, deliverable-complete route, and admin provisioning route → 25 suites / 376 tests passed after the cross-client assignment and approval-route hardening.
- Follow-up TypeScript pass caught the JSON upload contract mismatch; `src/lib/programs/attachments/mime.ts` now includes `application/json`, and the upload/evidence focused suite passes 2 suites / 11 tests.

Validation caveat:

- `npx tsc --noEmit --pretty false` is blocked in this worktree by missing package/type dependencies unrelated to this change set: `react-markdown`, `remark-gfm`, `rehype-sanitize`, `resend`, and `docx`. The branch-local JSON MIME type error from this fix batch was corrected.
- No authenticated deployed browser/API smoke was run in this branch. Anything requiring production proof remains marked `NOT DEPLOYED-SMOKED`.

## Executive Verdict

The Programs module is not pilot-grade end-to-end today.

The strongest implemented areas are tenant-aware module navigation, program demo user seeding, client-scoped program reads, P0 submission to an approval queue, ContextBroker private-plane retrieval receipts, and chat-stream financial redaction.

The critical failures are:

- The corrected lifecycle was split across the codebase at audit start. This branch corrected the active P4/P5/P6 phase packs so Nexus now receives Execution Roadmap / Approval & Mobilization / Tower Handoff doctrine. Remaining lifecycle gaps are template, approval, tracking, and deployed-smoke gaps.
- Program transactional state still writes to shared/public Supabase tables such as `engagements`, `program_modules`, `deliverables_v2`, and `program_approval_requests`; it does not write program state into private tenant schemas such as `client_meridian_health_private`.
- Access provisioning now has a server API for client-pinned Programs users, including module-level capability flags and program assignment. The remaining gap is UI wiring from Setup/Admin plus Clerk invite handoff.
- Document upload on the visible program detail page now calls the program attachment route and records a linked evidence row. Text/markdown/json/csv-style files produce structured signals; unsupported binary files produce metadata-only evidence. The remaining gap is rich PDF/XLSX/PPTX parsing into decisions, actions, tables, and baseline metrics.
- Approval flow exists for P0 submission, but per-phase approval/gate workflow is fragmented: governance rules exist, a demo phase override route exists, founder/legacy approval paths exist, and no single evidence-based phase-approval workflow is proven from P1 through P6.
- `program_audit_log` now has runtime writes for major program actions. Remaining gap: deployed verification plus fuller audit coverage for every minor field edit and export.
- P4-P6 doctrine is now corrected in this branch, but the surrounding workflows are still incomplete: P4 needs artifacts/templates and approval wiring, P5 needs business case / board pack / multi-approver workflow, and P6 needs Tower handoff + external status ingestion.
- The financial firewall is implemented in chat/context, the agent `complete_deliverable` tool path, and now the direct deliverable-complete API path. Remaining firewall work is deployed adversarial smoke and broader export/prompt-receipt coverage.
- No evidence was found for an end-to-end deployed smoke where a new Meridian program user creates a program, receives admin approval, completes P0/P1/P2/P3/P4/P5, hands to P6/Tower, and resumes correctly across sessions.

Bottom line: Sarah can use parts of Programs with significant handholding. She cannot walk independently from provisioning through P6 Tower Handoff without manual intervention and platform gaps.

---

# 1. Pre-audit Status

## 1.1 Corrected Lifecycle Implementation

Status: PARTIAL / GAP.

Evidence that the corrected labels exist in one view-model:

- `src/lib/programs/programs-page-view.ts:11-13` documents the seven-phase model as Originate, Discovery, Synthesis, Design, Execution Roadmap, Approval & Mobilization, Tower Handoff.
- `src/lib/programs/programs-page-view.ts:43-50` defines `CANONICAL_SEVEN_PHASES` with P4 `Execution Roadmap`, P5 `Approval & Mobilization`, and P6 `Tower Handoff`.

Evidence that the active phase packs are corrected in this branch:

- `src/lib/programs/phase-packs/P4_build.ts:1-14` defines P4 as Execution Roadmap and explicitly says P4 is not where Nexus executes the build.
- `src/lib/programs/phase-packs/P4_build.ts:16-45` defines P4 roadmap DoD items such as execution roadmap, milestones, success criteria, and estimate assumptions.
- `src/lib/programs/phase-packs/P5_activate.ts:1-12` defines P5 as Approval & Mobilization and frames it as a funding-and-authority package.
- `src/lib/programs/phase-packs/P5_activate.ts:14-21` defines P5 DoD items such as business case, sponsor alignment, readiness/change plan, and Tower handoff plan.
- `src/lib/programs/phase-packs/P6_operate.ts:1-12` defines P6 as Tower Handoff and frames it as an execution tracking contract.
- `src/lib/programs/phase-packs/P6_operate.ts:14-21` defines P6 DoD items such as execution tracking contract, external status feed, Tower alerts, benefits cadence, and owner handoff.
- `src/lib/programs/programs-canonical-view.ts:17-27` still declares `CANONICAL_SIX_PHASES` and a six-item sequence.
- `src/lib/programs/program-deliverables-evidence-view.ts:36-42` still uses phase ids `build`, `activate`, and `operate`, although `src/lib/programs/program-deliverables-evidence-view.ts:90-97` remaps their display labels to the corrected labels.

Verdict: Active P4/P5/P6 agent doctrine is corrected in this branch. Some legacy view-model names and phase ids remain for compatibility and still need cleanup.

## 1.2 `commit_program` Wiring and Reachability

Status: PARTIAL / NOT DEPLOYED-SMOKED / PRIVATE-SCHEMA GAP.

Implemented code:

- `src/app/api/chat/agent/route.ts:135-160` imports and registers program tools including `commit_program`.
- `src/lib/agent/tools/program/commitProgram.ts:252-277` declares `commit_program`, its submission semantics, and supported surfaces.
- `src/lib/agent/tools/program/commitProgram.ts:322-347` validates sponsor and lead UUID inputs.
- `src/lib/agent/tools/program/commitProgram.ts:349-384` resolves tenancy and active client before writing.
- `src/lib/agent/tools/program/commitProgram.ts:477-504` inserts into `engagements` with `lifecycle_state: 'submitted_for_approval'` and `current_phase: 0`.
- `src/lib/agent/tools/program/commitProgram.ts:564-570` calls `submitForApproval`.
- `src/lib/agent/tools/program/commitProgram.ts:625-636` writes a `module_state_log` side-effect.
- `src/lib/agent/tools/program/commitProgram.ts:663-678` returns `engagement_id`, `approval_request_id`, and `phase_access: phase_0_pending_tenant_admin_approval`.

Direct API create path:

- `src/app/api/v1/programs/route.ts:67-105` POST creates a program through `originateProgram`.
- `src/lib/programs/mutations.ts:74-99` `originateProgram` inserts directly into `engagements` with `status: 'active'` and `current_phase: 0`.

Private-schema finding:

- `src/lib/agent/tools/program/commitProgram.ts:477-504` writes to `.from('engagements')`, not to `client_meridian_health_private.programs` or any private tenant schema.
- `src/lib/programs/queries.ts:1-3` explicitly says the Programs read layer stays on `engagements`.
- `src/lib/programs/queries.ts:85-95` reads `engagements` filtered by `client_id`.

Verdict: `commit_program` is wired at the agent level and can write a pending approval row in shared tables. It is not proven against deployed `/api/chat/agent`, and it does not write Programs transactional state to private tenant schemas.

## 1.3 Program Access Policy API Enforcement

Status: PARTIAL / GAP.

Implemented policy:

- `src/lib/auth/program-access-policy.ts:20-40` defines access policy fields: scope, create, approve, upload, generate, publish, financial visibility, and output policy.
- `src/lib/auth/program-access-policy.ts:88-97` denies `restricted_financial` by default when financial visibility is false.
- `src/lib/auth/program-access-policy.ts:149-158` loads participant-scoped programs joined to `engagements` by active client.
- `src/lib/auth/program-access-policy.ts:221-228` exposes `allowedProgramIdsForUser` and `canReadProgram`.
- `src/lib/programs/queries.ts:83-95` applies `allowedProgramIdsForUser` to the portfolio query.
- `src/lib/programs/queries.ts:100-111` applies `canReadProgram` and client filtering for `getProgramById`.
- `src/lib/programs/db-phase-queries.ts:72-99` applies `canReadProgram` and client filtering on program detail reads.
- `src/app/programs/layout.tsx:9-11` calls `requireProductModule('programs')` before rendering Programs routes.

Gaps:

- `src/lib/auth/program-access-policy.ts:161-170` returns `client_admin` if no membership and no participants are found. That fallback can over-grant instead of defaulting to no program access.
- `src/app/api/v1/programs/route.ts:67-105` does not cite or call `loadUserProgramAccessPolicy` or `canCreatePrograms` before program creation.
- `src/lib/agent/tools/program/commitProgram.ts:349-384` resolves tenancy but does not enforce `canCreatePrograms` from `programAccessPolicy` in the handler.
- The audit did not find evidence that every Programs endpoint rejects cross-client requests with 403. Several reads return `null` / not found semantics rather than an explicit 403.

Verdict: Read scoping is meaningfully implemented. Create/action enforcement is incomplete.

## 1.4 ContextBroker and Private Data Plane Retrieval

Status: PARTIAL / NOT DEPLOYED-SMOKED.

Private registry:

- `src/lib/knowledge/private-data-plane/registry.ts:1-13` states app routes must call ContextBroker and not private schemas/Pinecone directly.
- `src/lib/knowledge/private-data-plane/registry.ts:44-52` maps `meridian-health` to schema `client_meridian_health_private`, Pinecone index `abarva-client-meridian-health-prod`, vector status `ready`, and vector count `715`.
- `src/lib/knowledge/private-data-plane/registry.ts:69-82` normalizes `meridian` to `meridian-health`.

Broker:

- `src/lib/knowledge/context-broker/broker.ts:3-9` states the broker is the only retrieval module that calls the persisted tenant-data adapter.
- `src/lib/knowledge/context-broker/broker.ts:251-277` builds retrieval trace with tenant key, data plane id, schema, Pinecone index, retrieved private IDs, shared corpus IDs, and graph roots.
- `src/lib/knowledge/context-broker/broker.ts:379-385` requires tenant key for tenant/full retrieval and resolves the private resource.
- `src/lib/knowledge/context-broker/broker.ts:392-402` adds private data-plane info tags and vector warnings.
- `src/lib/knowledge/context-broker/broker.ts:507-536` returns provenance and retrieval trace.

Smoke surfaces:

- `src/app/api/context/demo/route.ts:1-16` defines `/api/context/demo` as deterministic retrieval inspection surface.
- `src/app/api/context/demo/route.ts:300-311` enforces active-tenant match for tenant/full modes.
- `src/app/api/context/demo/route.ts:509-537` assembles and returns the bundle or 403 on forbidden tenant.
- `src/app/api/chat/agent/route.ts:1137-1175` formats ContextBroker receipt into the prompt, including tenant key, data plane id, private schema, private Pinecone index, private records/chunks, and shared corpus IDs.

Gap:

- No deployed `/api/context/demo` or `/api/chat/agent` smoke was executed in this audit. The code path is present; production retrieval is not proven here.
- Programs transactional state still uses shared tables, even though retrieval can use private data planes.

Verdict: Private retrieval wiring is strong in code. End-to-end app proof is still missing for this audit.

## 1.5 Financial Output Firewall

Status: PARTIAL.

Implemented:

- `src/lib/agent/restricted-output-policy.ts:8-17` defines sensitive financial patterns.
- `src/lib/agent/restricted-output-policy.ts:46-55` defines prompt policy forbidding exact budgets, spend, revenue, margins, ROI, NPV, payback, business-case dollars, and sensitive KPI values when restricted.
- `src/app/api/chat/agent/route.ts:321-322` builds the restricted output policy block.
- `src/app/api/chat/agent/route.ts:676-683` injects the policy into the system prompt.
- `src/app/api/chat/agent/route.ts:848-853` sanitizes streamed text before writing to the client.
- `src/app/api/chat/agent/route.ts:1056-1107` sanitizes context bundle output.
- `src/app/api/chat/agent/route.ts:1147-1154` sanitizes facts and chunks in prompt receipts.
- `src/lib/agent/tools/program/completeDeliverable.ts:125-135` sanitizes content before calling `completeDeliverable` through the agent tool.

Gaps:

- `src/app/api/v1/programs/[programId]/deliverables/complete/route.ts:32-42` calls `completeDeliverable` with raw `body.content` and no financial sanitizer.
- `src/lib/programs/mutations.ts:301-318` persists deliverable version content; direct API callers can bypass the agent sanitizer.
- No deployed adversarial test was run for non-admin Sarah asking for budget / realized value / cost breakdown.

Verdict: Chat redaction is implemented. Deliverable persistence is not uniformly protected.

## 1.6 Submit for Approval Behavior

Status: PARTIAL.

P0 submit implemented:

- `src/lib/programs/approval.ts:141-172` inserts a `program_approval_requests` row with tenant key, program id, requester, and brief snapshot.
- `src/lib/programs/approval.ts:182-187` updates `engagements.lifecycle_state` to `submitted_for_approval`.
- `src/lib/programs/approval.ts:199-207` calls `notifyApprovalSubmitted` fire-and-forget.
- `supabase/migrations/20260430120100_program_approval_workflow.sql:78-95` creates `program_approval_requests` with request status and brief snapshot.
- `supabase/migrations/20260430120100_program_approval_workflow.sql:129-152` creates a trigger to sync engagement lifecycle on approval decision.
- `src/lib/programs/approval.ts:221-310` handles approve/reject and updates `engagements` to approved/active/current_phase 0 or rejected/draft.

Notifications:

- `src/lib/programs/approval-notifications.ts:8-10` declares submitted/approved/rejected events.
- `src/lib/programs/approval-notifications.ts:90-107` resolves submitted recipients to a platform admin allowlist, ignoring tenant key.
- `src/lib/programs/approval-notifications.ts:150-157` builds approval email text.

Gaps:

- Recipient lookup is not tenant-admin based; it returns `anand.sundaram@thesundaram.com` for every tenant.
- Phase approvals after P0 are fragmented across governance, phase override, and legacy/founder routes.
- `program_audit_log` now receives best-effort rows for program approval submission, decision, and withdrawal. Remaining approval gap is deployed verification and richer evidence packet review.

Verdict: P0 approval queue exists. Full phase approval workflow is not end-to-end.

## 1.7 Tenant Admin Approval Queue

Status: PARTIAL.

Implemented UI:

- `src/app/(maestro)/admin/programs/approvals/page.tsx:58-117` renders the tenant-scoped approval queue with summary strip and `ApprovalQueueTable`.
- `src/app/(maestro)/admin/programs/approvals/[requestId]/page.tsx:39-62` loads a request and blocks cross-tenant detail by `notFound()` if tenant mismatch.
- `src/app/(maestro)/admin/programs/approvals/[requestId]/page.tsx:95-99` renders `ApprovalBriefSnapshotCard` and `ApprovalDecisionPanel`.
- `src/app/(maestro)/admin/programs/approvals/[requestId]/page.tsx:158-243` renders a local audit trail from the approval row.
- `src/app/api/admin/programs/approvals/[requestId]/route.ts:89-171` handles approve/reject decisions.

Gaps:

- The queue shows approval request data, but no cited evidence shows overlap detection, anti-pattern flags, or sponsor commitment scoring rendered in the admin review.
- The admin detail audit trail is still derived from `program_approval_requests`; runtime writes now also populate `program_audit_log`, but the UI does not yet render that table.
- Queue read auth is looser than decision auth. `src/app/api/admin/programs/approvals/_auth.ts:65-97` allows read for authenticated users in the admin tree and does not require tenant admin for read.

Verdict: Basic queue exists. Senior review intelligence is not proven.

## 1.8 File Upload State

Status: PARTIAL / RICH-PARSING GAP.

Program attachment route exists:

- `src/app/api/programs/[id]/attachments/upload/route.ts:1-18` documents auth, tenant gate, MIME/size checks, storage, and metadata persistence.
- `src/app/api/programs/[id]/attachments/upload/route.ts:53` uses bucket `program-attachments`.
- `src/app/api/programs/[id]/attachments/upload/route.ts:80-107` requires tenancy and verifies the program is visible to the active client.
- `src/app/api/programs/[id]/attachments/upload/route.ts:168-205` uploads to storage.
- `src/app/api/programs/[id]/attachments/upload/route.ts:207-234` records attachment metadata.
- `supabase/migrations/20260430120000_program_attachments.sql:29-50` creates `program_attachments`.
- `supabase/migrations/20260430120000_program_attachments.sql:200-207` creates the private storage bucket.

Visible detail upload now uses the structured Programs attachment route in this branch:

- `src/components/programs/ProgramDetailPage.tsx:4139-4154` renders `Upload document`.
- `src/components/programs/ProgramDetailPage.tsx:2314-2320` posts files to `/api/programs/[id]/attachments/upload`.
- `src/app/api/programs/[id]/attachments/upload/route.ts:117-120` enforces `canUploadArtifacts`.
- `src/app/api/programs/[id]/attachments/upload/route.ts:244-281` records linked `program_evidence_items` rows after attachment metadata persistence.
- `src/lib/programs/evidence-ingestion.ts:67-110` extracts decisions, action items, risks, baseline candidates, and attendees from text-like uploads.
- `src/lib/programs/evidence-ingestion.ts:112-130` records metadata-only evidence for unsupported binary attachments.

Parsing limits:

- The synchronous upload path now extracts structured signals only from text/plain, text/markdown, text/csv, and application/json. PDF/XLSX/PPTX/images/audio/video are captured as metadata-only evidence until a richer parser is added.

Verdict: The visible upload path now persists attachment metadata and a linked evidence row. Text-like meeting/workshop artifacts produce structured signals. Uploaded PDFs/XLSX/PPTX still do not become structured decisions, action items, stakeholder updates, or phase evidence links.

## 1.9 Deliverable Templates

Status: PARTIAL / TEMPLATE GAP.

Export taxonomy:

- `src/lib/programs/exports/types.ts:16-36` defines deliverable kinds including program charter, discovery report, OKR baseline, stakeholder map, synthesis options table, architecture sketch, execution plan, meeting notes, decision log, roadmap, financial baseline, archetype primer, and workshop facilitator guide.
- `src/lib/programs/exports/format-router.ts:17-35` maps default formats by deliverable kind.
- `src/app/api/programs/[id]/deliverables/[kind]/export/route.ts:52-70` lists supported export kinds.
- `src/app/api/programs/[id]/deliverables/[kind]/export/route.ts:148-170` supports XLSX/DOCX and explicitly errors for generic HTML/PDF.
- `src/app/api/programs/[id]/deliverables/[kind]/export/route.ts:285-323` audits export attempts and returns the binary.

Persisted sign-off:

- `src/lib/agent/tools/program/completeDeliverable.ts:24-34` allows only `approval_packet`, `charter`, `design`, `design_brief`, `design_spec`, `discovery_report`, `execution_plan`, `outcome_report`, and `vendor_selection`.
- `src/lib/agent/tools/program/completeDeliverable.ts:125-143` persists accepted content and signs off through `completeDeliverable`.

Gaps:

- No direct deliverable kind for P5 business case, board pack, mobilization package, Tower handoff contract, structured promise contract, technology gap manifest, or execution funding request.
- Export route supports DOCX/XLSX but generic HTML/PDF are not implemented through that route.
- No proof that Nexus surfaces the right template at each step.

Verdict: There is a useful export foundation, but the phase-complete artifact set is incomplete.

## 1.10 Eval Harness Coverage

Status: PARTIAL / EVAL GAP.

Relevant tests exist:

- `src/lib/programs/phase-packs/__tests__/P0_originate.test.ts` through `P6_operate.test.ts` cover phase pack shapes.
- `src/lib/programs/__tests__/governance-gates.test.ts` covers gate rules.
- `src/lib/programs/__tests__/approval.test.ts` and `src/lib/programs/__tests__/approval-notifications.test.ts` cover approval helpers.
- `src/app/api/admin/programs/approvals/__tests__/route.test.ts` covers admin approval routes.
- `src/app/api/context/demo/__tests__/route.test.ts` covers context demo behavior.
- `src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts` covers agent context bundle behavior.
- `src/app/api/programs/__tests__/attachments-upload.smoke.test.ts` covers attachment upload route behavior.
- `src/__tests__/integration/programs/full-lifecycle-crawl.test.ts` exists for lifecycle crawl coverage.

Gaps:

- `src/__tests__/integration/programs/full-lifecycle-crawl.test.ts` uses service-role DB setup and direct function calls, not a browser/user journey through Nexus and approvals.
- The old Playwright tests under `tests/e2e/programs-phase-*.spec.ts` target `/engagements` routes and older phase names such as Diagnose/Design rather than the current `/programs` surface.
- No phase-by-phase golden conversation suite was found that covers P0 through P6 with Nexus prompts, uploads, artifacts, approvals, tenant refusal, financial refusal, and resume.

Verdict: Component/unit coverage exists. User-journey eval coverage is not sufficient.

## 1.11 Per-phase Doctrine

Status: PARTIAL / P4-P6 GAP.

Implemented:

- `src/app/api/chat/agent/route.ts:300-303` establishes a phase pack block for active program current phase.
- `src/app/api/chat/agent/route.ts:739-742` injects the phase pack into the prompt on program-detail surfaces.
- `src/lib/programs/phase-packs/P0_originate.ts:31-42` defines P0 outcome.
- `src/lib/programs/phase-packs/P1_discovery.ts:28-38` defines P1 outcome.
- `src/lib/programs/phase-packs/P2_synthesis.ts:40-52` defines P2 outcome.
- `src/lib/programs/phase-packs/P3_design.ts:37-48` defines P3 outcome.

Gaps:

- `src/lib/programs/phase-packs/P4_build.ts:36-46` injects Build doctrine instead of Execution Roadmap doctrine.
- `src/lib/programs/phase-packs/P5_activate.ts:33-37` injects Activate doctrine instead of Approval/Mobilization doctrine.
- `src/lib/programs/phase-packs/P6_operate.ts:32-36` injects Operate doctrine instead of Tower Handoff doctrine.
- The phase packs are phase-level. They do not define every step in the founder's requested walkthrough.

Verdict: Per-phase prompt blocks exist, but corrected P4-P6 intelligence is not implemented.

## 1.12 Prior End-to-End Walkthrough Evidence

Status: NOT FOUND.

No code evidence was found for a pilot customer or internal team walking a new user through provisioning, P0 creation, tenant-admin approval, P1/P2/P3/P4/P5, P6 Tower Handoff, weekly status ingestion, and closeout.

Closest code artifact:

- `src/__tests__/integration/programs/full-lifecycle-crawl.test.ts` exists, but it is not a deployed or browser/user smoke. It manipulates DB state and function calls directly.

Verdict: This audit should be treated as pre-pilot gap discovery, not certification.

---

# 2. Phase -1: Access Provisioning

## Step -1.1 Client admin signs in

1. What user sees: sign-in and post-login shell are outside the inspected lines, but module access is governed by `src/lib/auth/module-access.ts:55-93` and nav by `src/components/shell/AppRail.tsx:46-56`.
2. Good: client admin lands in `/home` with tenant-pinned modules and Setup access.
3. Entry: Clerk auth plus active client. Enforced partly by server module access.
4. Exit: admin reaches Setup/Admin. No evidence of a provisioning-specific journey state.
5. Nexus: not involved.
6. DB: none at sign-in.
7. Upload: not applicable.
8. Templates: not applicable.
9. Meeting support: not applicable.
10. Gates: not applicable.
11. Tracking: no provisioning step state found.

Verdict: PARTIAL.

## Step -1.2 Client admin opens Setup/Admin user management

1. UI: `src/app/(maestro)/admin/users/page.tsx:1-7` renders `SetupUsersPage`; `src/app/(maestro)/admin/users-access/page.tsx:72-84` renders user list tab and `src/app/(maestro)/admin/users-access/page.tsx:248` renders invites tab.
2. Good: admin can create user, assign module rights, assign programs, set financial visibility and rights.
3. Entry: Setup module access. `src/lib/auth/module-access.ts:60-65` grants setup to admin/maestro/allowlist.
4. Exit: user-management UI can submit a full access record. Not proven.
5. Nexus: no provisioning doctrine found.
6. DB: no complete user-management write path found for all required fields.
7. Upload: not applicable.
8. Templates: not applicable.
9. Meeting support: not applicable.
10. Gates: not applicable.
11. Tracking: not found.

Verdict: GAP for full admin provisioning.

## Step -1.3 Client admin creates Sarah's user record

1. UI: invite API exists; full UI fields for role, module access, assignment, financial visibility, upload, generation, approval were not found in code inspected.
2. Good: Sarah is created as client-pinned Meridian program user with explicit module and program entitlements.
3. Entry: client admin authority.
4. Exit: Clerk user plus `persons`, `person_client_memberships`, and program assignment rows created.
5. Nexus: not involved.
6. DB/API: `src/app/api/admin/invite/route.ts:16-23` accepts email, role, clientId/clientName, firstName/lastName only; `src/app/api/admin/invite/route.ts:25` allows roles `admin`, `maestro`, `client_viewer`, `observer`; `src/app/api/admin/invite/route.ts:53-57` writes only basic public metadata.
7. Upload: not applicable.
8. Templates: not applicable.
9. Meeting support: not applicable.
10. Gates: not applicable.
11. Tracking: pending invitations list via `src/app/api/admin/invite/route.ts:77-105`; no program-access lifecycle tracking.

Verdict: GAP. The create-user API cannot set the required Programs entitlements.

## Step -1.4 Client admin assigns Sarah to program or grants create permission

1. UI: no complete assignment UI found.
2. Good: admin chooses existing programs or `can_create_programs=true`.
3. Entry: Sarah user exists and active client is Meridian.
4. Exit: `person_client_memberships` and/or `engagement_participants` rows updated.
5. Nexus: not involved.
6. DB: schema supports it. `supabase/migrations/052_program_access_control.sql:9-19` adds client-level fields; `supabase/migrations/052_program_access_control.sql:33-42` adds program-level flags. Seed migration demonstrates fields in `supabase/migrations/054_program_demo_users.sql:66-84` and `:123-149`. Runtime admin write path not found.
7. Upload: not applicable.
8. Templates: not applicable.
9. Meeting support: not applicable.
10. Gates: not applicable.
11. Tracking: not found.

Verdict: SUBSTRATE EXISTS, ADMIN WRITE GAP.

## Step -1.5 Sarah receives invitation

1. UI/email: Clerk invitation API exists.
2. Good: invite has correct client, module access, and redirect.
3. Entry: admin submits invite.
4. Exit: email sent and Sarah can complete sign-in.
5. Nexus: not involved.
6. API: `src/app/api/admin/invite/route.ts:59-64` calls `clerk.invitations.createInvitation` with redirect `/auth-redirect`.
7. Upload: not applicable.
8. Templates: not applicable.
9. Meeting support: not applicable.
10. Gates: not applicable.
11. Tracking: `src/app/api/admin/invite/route.ts:90-100` lists pending invites.

Verdict: PARTIAL. Invite can be sent, but required entitlement metadata is not captured.

## Step -1.6 Sarah signs in first time and lands on `/home`

1. UI: `/home` exists. `src/app/(maestro)/home/page.tsx:15-58` loads active client, module access, reasoning summary, and live programs.
2. Good: Sarah lands on personalized `/home`, not Setup or directly Programs.
3. Entry: Clerk session and active client.
4. Exit: home renders permitted modules.
5. Nexus: not directly.
6. DB: home calls `getProgramPortfolio` if programs allowed via `src/app/(maestro)/home/page.tsx:22-30`.
7. Upload: not applicable.
8. Templates: not applicable.
9. Meeting support: not applicable.
10. Gates: not applicable.
11. Tracking: no first-login provisioning tracking found.

Verdict: PARTIAL.

## Step -1.7 Sarah's `/home` shows programs, modules, next action

1. UI: `src/app/(maestro)/home/page.tsx:50-57` passes module access and live programs into `HomeIndexPage`.
2. Good: Sarah sees assigned programs, create-program CTA if allowed, pending approvals, blockers, and recommended action.
3. Entry: `moduleAccess.access.modules` includes `programs`.
4. Exit: Sarah clicks into create/new or assigned program.
5. Nexus: not direct.
6. DB: `src/app/(maestro)/home/page.tsx:25-30` calls `getProgramPortfolio`; it filters to approved/active programs in `src/app/(maestro)/home/page.tsx:29-31`.
7. Upload: not applicable.
8. Templates: not applicable.
9. Meeting support: not applicable.
10. Gates: pending programs are filtered out, so approval-pending creations may not appear.
11. Tracking: phase label comes from `PHASE_LABEL_MAP` at `src/app/(maestro)/home/page.tsx:38-40`; no current-step tracking.

Verdict: PARTIAL. Approved/active programs show; pending/program-create workflow not fully proven.

---

# 3. Phase P0: Origination

## Step P0.1 Sarah clicks create new program

1. UI: `/programs` is module-guarded by `src/app/programs/layout.tsx:9-11`; `/programs/page.tsx` renders portfolio. Create CTA exact component not confirmed in inspected snippets.
2. Good: creation remains in same canvas, not a disconnected page.
3. Entry: `canCreatePrograms=true`.
4. Exit: Nexus canvas opens with origination checklist.
5. Agent: `src/app/api/chat/agent/route.ts:760` instructs the agent not to navigate to `/programs/new` and to continue in canvas.
6. DB: no write yet.
7. Upload: not expected.
8. Templates: brief-progress artifact expected by prompt at `src/app/api/chat/agent/route.ts:767`.
9. Meeting: not expected.
10. Gate: none.
11. Tracking: draft association exists through `markDraftCommitted` in commit path, but open-draft persistence not fully audited.

Verdict: PARTIAL.

## Step P0.2 Nexus opens with P0 system prompt

1. UI: `AgentCanvas` renders chat and right rail in `src/components/programs/AgentCanvas.tsx:86-135`.
2. Good: P0 doctrine asks for one high-value question, classifies, sponsor/value/scope.
3. Entry: program detail with current phase 0 or origination surface.
4. Exit: P0 brief fields collected.
5. Agent: P0 phase pack exists at `src/lib/programs/phase-packs/P0_originate.ts:31-42`; prompt composition includes phase pack on detail surfaces in `src/app/api/chat/agent/route.ts:739-742`; origination style guidance appears in `src/app/api/chat/agent/route.ts:761-770`.
6. DB: no write until commit.
7. Upload: not expected.
8. Templates: no explicit structured P0 brief template registry entry found.
9. Meeting: not expected.
10. Gate: P0 approval later.
11. Tracking: brief-progress artifacts, not durable state proven.

Verdict: PARTIAL.

## Step P0.3 Sarah describes trigger

1. UI: chat input in AgentCanvas / AtlasDrawer.
2. Good: free-text intent becomes structured trigger, problem, value, sponsor, scope.
3. Entry: Sarah can create programs.
4. Exit: problem statement captured in brief-progress artifact.
5. Agent: `src/app/api/chat/agent/route.ts:763-769` requires one question, brief-progress artifacts, and honest commit failure handling.
6. DB: no durable write until commit.
7. Upload: not expected.
8. Templates: brief-progress artifact.
9. Meeting: none.
10. Gate: none.
11. Tracking: right rail artifact is session-level unless draft persistence is separately proven.

Verdict: PARTIAL.

## Step P0.4 Nexus classifies archetype

1. UI: chat/right rail should show classification.
2. Good: classification uses private Meridian context and shared pattern corpus.
3. Entry: trigger text captured.
4. Exit: function/objective/topic codes and pattern id selected.
5. Agent: `commit_program` calls `classifyCommitProgram(input)` and stores `function_code`, `objective_code`, `topic_code` in `src/lib/agent/tools/program/commitProgram.ts:396-404` and `:477-504`.
6. DB: classification fields written to `engagements` in `src/lib/agent/tools/program/commitProgram.ts:480-484`.
7. Upload: no.
8. Templates: no classification worksheet found.
9. Meeting: no.
10. Gate: P0 DoD includes classification in `src/lib/programs/phase-packs/P0_originate.ts:44-54`.
11. Tracking: classification persists on engagement fields, not private schema.

Verdict: PARTIAL.

## Step P0.5 Nexus drafts value hypothesis

1. UI: chat plus brief-progress card.
2. Good: value hypothesis names target cohort, current pain, expected value direction, causal mechanism, and measurement path.
3. Entry: trigger and baseline hints.
4. Exit: target outcome in brief snapshot.
5. Agent: P0 DoD says value hypothesis with mechanism in `src/lib/programs/phase-packs/P0_originate.ts:57-65`.
6. DB: `target_outcome` is stored in brief snapshot if present in `src/lib/agent/tools/program/commitProgram.ts:547-549`; not stored as typed promise contract.
7. Upload: no.
8. Templates: no dedicated value hypothesis schema found.
9. Meeting: no.
10. Gate: P0 hard check exists in doctrine; governance uses program seed/value checks in `src/lib/programs/governance.ts:179-260`.
11. Tracking: brief snapshot only.

Verdict: PARTIAL.

## Step P0.6 Nexus identifies sponsor candidate

1. UI: chat asks/resolves sponsor.
2. Good: sponsor is real person with decision rights.
3. Entry: tenant persons available.
4. Exit: sponsor UUID resolved.
5. Agent: `commit_program` requires `sponsor_person_id` at `src/lib/agent/tools/program/commitProgram.ts:320` and rejects non-UUID values at `:322-338`.
6. DB: sponsor written to `engagements.sponsor_person_id` in `src/lib/agent/tools/program/commitProgram.ts:485-486`; participant inserted later in `:594-600`.
7. Upload: no.
8. Templates: no.
9. Meeting: sponsor 1:1 support not wired here.
10. Gate: P0 DoD sponsor candidate in `src/lib/programs/phase-packs/P0_originate.ts:69-76`.
11. Tracking: sponsor persists in engagement and participants.

Verdict: PARTIAL.

## Step P0.7 Scope boundary

1. UI: chat prompt.
2. Good: scope identifies in/out boundaries and detects “everything charter” anti-pattern.
3. Entry: problem and sponsor known.
4. Exit: scope boundary in brief.
5. Agent: failure mode block injected at `src/app/api/chat/agent/route.ts:684-693`; exact scope-boundary step not found.
6. DB: no typed scope boundary field in `engagements` insert; brief snapshot can hold problem/target/timeline but not a dedicated scope schema.
7. Upload: no.
8. Templates: no explicit scope template found.
9. Meeting: no.
10. Gate: P0/P1 doctrine references scope in phase packs.
11. Tracking: chat/brief snapshot only.

Verdict: GAP for structured scope boundary.

## Step P0.8 Program seed brief assembled

1. UI: chat/right rail brief-progress.
2. Good: structured artifact, not just prose.
3. Entry: sponsor, problem, target, timeline, classification.
4. Exit: brief snapshot created.
5. Agent: brief-progress artifact emitted before approval in `src/lib/agent/tools/program/commitProgram.ts:557-563`.
6. DB: `briefSnapshot` object assembled in `src/lib/agent/tools/program/commitProgram.ts:530-552`; approval row insert in `src/lib/programs/approval.ts:163-170`.
7. Upload: no.
8. Templates: no standalone downloadable P0 seed brief export found.
9. Meeting: no.
10. Gate: P0 tenant-admin approval.
11. Tracking: snapshot is durable in `program_approval_requests.brief_snapshot`.

Verdict: PARTIAL.

## Step P0.9 Sarah reviews/refines brief

1. UI: chat/right rail can show brief progress.
2. Good: edit-in-place or agent-assisted revision before submit.
3. Entry: draft brief exists.
4. Exit: approved-for-submission brief state.
5. Agent: prompt tells agent to ask for confirmation before calling `commit_program` in `src/lib/agent/tools/program/commitProgram.ts:264-265`.
6. DB: no durable draft edit table proven.
7. Upload: no.
8. Templates: no editable brief artifact found.
9. Meeting: no.
10. Gate: submit confirmation.
11. Tracking: no durable per-field draft audit proven.

Verdict: PARTIAL / DRAFT-PERSISTENCE GAP.

## Step P0.10 Sarah submits brief for approval

1. UI: chat confirmation and tool call.
2. Good: pending approval row, admin notification, no false active state.
3. Entry: user explicitly says yes; sponsor UUID valid.
4. Exit: approval request pending and program not active.
5. Agent: `commit_program` description forbids speculative call and says queued not active in `src/lib/agent/tools/program/commitProgram.ts:252-276`.
6. DB: engagement insert at `src/lib/agent/tools/program/commitProgram.ts:477-504`; approval insert at `src/lib/programs/approval.ts:163-170`; lifecycle update at `src/lib/programs/approval.ts:182-187`; module state log at `src/lib/agent/tools/program/commitProgram.ts:625-636`.
7. Upload: no.
8. Templates: brief snapshot.
9. Meeting: no.
10. Gate: P0 approval queued.
11. Tracking: `lifecycle_state='submitted_for_approval'` and approval request pending.

Verdict: CODE-PARTIAL / NOT DEPLOYED-SMOKED / PRIVATE-SCHEMA GAP.

## Step P0.11 Client admin review

1. UI: approval queue and detail pages cited in section 1.7.
2. Good: admin sees brief, overlap, anti-patterns, sponsor evidence.
3. Entry: pending approval request.
4. Exit: approve/reject decision.
5. Agent: Steward admin rail present, but no Nexus anti-pattern review in cited UI.
6. DB: reads `program_approval_requests` through `getApprovalQueueForTenant`; detail page blocks tenant mismatch in `src/app/(maestro)/admin/programs/approvals/[requestId]/page.tsx:59-62`.
7. Upload: no.
8. Templates: approval brief card only.
9. Meeting: no.
10. Gate: admin decision panel.
11. Tracking: approval row status.

Verdict: PARTIAL. Overlap/anti-pattern review not proven.

## Step P0.12 Client admin approves

1. UI: `ApprovalDecisionPanel` on detail page.
2. Good: approval flips program to P0 active, writes audit, notifies Sarah.
3. Entry: request pending.
4. Exit: `engagements.lifecycle_state='approved'`, `status='active'`, `current_phase=0`.
5. Agent: not needed.
6. DB: `src/lib/programs/approval.ts:253-266` updates request; `src/lib/programs/approval.ts:278-285` updates engagement; trigger also exists in `supabase/migrations/20260430120100_program_approval_workflow.sql:129-152`.
7. Upload: no.
8. Templates: no.
9. Meeting: no.
10. Gate: P0 tenant-admin approval.
11. Tracking: approval row plus engagement lifecycle. This branch also writes a `program_audit_log` event best-effort.

Verdict: PARTIAL / DEPLOYED-SMOKE GAP.

## Step P0.13 Client admin rejects

1. UI: `ApprovalDecisionPanel`.
2. Good: rationale required, Sarah notified, brief reopens.
3. Entry: request pending.
4. Exit: request rejected and engagement draft/rejected.
5. Agent: not involved.
6. DB: `src/lib/programs/approval.ts:241-248` requires rationale for rejection; `src/lib/programs/approval.ts:278-285` patches engagement to rejected/draft.
7. Upload: no.
8. Templates: no.
9. Meeting: no.
10. Gate: rejection captured.
11. Tracking: approval row rationale; no full resubmit workflow proven.

Verdict: PARTIAL.

## Step P0.14 Sarah returns after approval

1. UI: home filters approved/active programs in `src/app/(maestro)/home/page.tsx:29-31`; program page shows lifecycle guidance in `src/app/programs/[id]/page.tsx:179-197`.
2. Good: program appears as P0 active with next P0 entry/exit tasks.
3. Entry: approval complete.
4. Exit: Sarah enters P0 coaching.
5. Agent: P0 pack available on detail.
6. DB: `engagements.current_phase=0`.
7. Upload: not yet.
8. Templates: P0 brief and Discovery plan should surface; not proven.
9. Meeting: not yet.
10. Gate: P0 exit to P1 must be next.
11. Tracking: current phase only; no current step field found.

Verdict: PARTIAL.

---

# 4. Phase P1: Discovery

## P1 Overall Finding

P1 doctrine exists, but the end-to-end Discovery journey is not complete.

Evidence:

- `src/lib/programs/phase-packs/P1_discovery.ts:28-38` defines P1 outcome: validated problem statement, OKR baseline, stakeholder map.
- `src/lib/programs/phase-packs/P1_discovery.ts:40-85` defines DoD items including P0 seed, validated problem statement, OKR baseline, stakeholder map.
- `src/lib/programs/governance.ts:41-100` defines phase gate rules, including P1 to P2 checks.

Gaps:

- Upload pipeline does not parse meeting notes/PDF/XLSX into evidence ledger.
- No typed P1 step state was found for handoff-ingest, data-discovery, baseline-capture, stakeholder-mapping, root-cause-synthesis, pattern-evidence, contradictions-log, P2-readiness call.
- No sponsor approval workflow for P1 to P2 was proven through UI/API.

## Step P1.1 Sarah enters P1

1. UI: Program detail page renders phase content; phase pack can be injected.
2. Good: P1 primer explains Discovery is about proving problem and baseline.
3. Entry: P0 approved and phase advanced. Enforced only if phase state/gate update is done correctly.
4. Exit: Sarah sees P1 steps and required evidence.
5. Agent: P1 pack in `src/lib/programs/phase-packs/P1_discovery.ts:28-38`.
6. DB: `engagements.current_phase=1` after advance; `advancePhase` writes `phase_snapshots` and updates engagements in `src/lib/programs/mutations.ts:144-188`.
7. Upload: visible upload now points to the structured program attachment route in this branch; text-like uploads write linked evidence rows, while rich PDF/XLSX/PPTX parsing is still missing.
8. Templates: discovery report and OKR baseline export kinds exist in `src/lib/programs/exports/types.ts:16-36`.
9. Meeting: workshop templates exist, but DB loop not proven.
10. Gate: P1 to P2 soft/hard rule definitions exist.
11. Tracking: phase number only; step tracking not found.

Verdict: PARTIAL.

## Step P1.2 P1 step decomposition

1. UI: no cited component renders the exact requested P1 step list.
2. Good: steps are visible and each has entry/exit criteria.
3. Entry: P1 active.
4. Exit: step list accepted.
5. Agent: P1 pack is phase-level, not step-level.
6. DB: no current step table found.
7. Upload: step-scoped upload route can accept `phase` and `stepId` in `src/app/api/programs/[id]/attachments/upload/route.ts:164-176`; visible UI does not yet populate those fields automatically.
8. Templates: no P1 step registry found.
9. Meeting: templates exist but not bound to these steps.
10. Gate: phase-level only.
11. Tracking: no step state.

Verdict: GAP.

## Step P1.3 Discovery plan generation

1. UI: no cited Discovery plan generation component.
2. Good: Nexus produces a plan with interviews, workshops, source systems, evidence needs.
3. Entry: P1 active and P0 seed available.
4. Exit: signed/accepted discovery plan deliverable.
5. Agent: no step-specific discovery-plan generation flow found.
6. DB: no dedicated discovery_plan deliverable type in `completeDeliverable` allowed set.
7. Upload: no.
8. Templates: discovery report exists; discovery plan not found as deliverable kind.
9. Meeting: no.
10. Gate: not directly.
11. Tracking: no.

Verdict: GAP.

## Step P1.4 Stakeholder interview guide

1. UI: no cited interview-guide component.
2. Good: guide selects CMIO, CMO, data leadership, finance, clinical ops from Meridian context.
3. Entry: P1 active.
4. Exit: interview guide generated and optionally exported.
5. Agent: P1 pack requires stakeholder map, but exact stakeholder guide logic not found.
6. DB: no write.
7. Upload: no.
8. Templates: workshop facilitator guide exists, interview guide not explicit.
9. Meeting: partial via workshop template library.
10. Gate: stakeholder map hard criterion.
11. Tracking: no interview completion state found.

Verdict: GAP.

## Step P1.5 Workshop coaching loop

1. UI: chat can generate guidance; upload affordance exists.
2. Good: intent capture, facilitator guide, post-workshop upload, structured extraction, validation against expected outcomes.
3. Entry: workshop purpose and attendees.
4. Exit: evidence, decisions, actions, baseline candidates, and stakeholder commitments persisted.
5. Agent: no full workshop loop flow found.
6. DB: text-like uploads now write `program_evidence_items` with extracted decisions/actions/risks/baseline candidates/attendees. No pipeline yet writes those signals into a dedicated action register, stakeholder map, decision log, or `phase_evidence_links`.
7. Upload: visible upload posts to `/api/programs/[id]/attachments/upload` and returns an `evidence` receipt when capture succeeds. See `src/components/programs/ProgramDetailPage.tsx:2314-2320` and `src/app/api/programs/[id]/attachments/upload/route.ts:244-281`.
8. Templates: workshop facilitator guide export exists in `src/lib/programs/exports/types.ts:16-36`.
9. Meeting: `src/lib/programs/workshop-template-library.ts` and `meeting-notes-capture.ts` provide deterministic content, and text-like notes can now be captured as evidence. Validation against the intended workshop outcomes is still missing.
10. Gate: P1 evidence criteria may remain unmet.
11. Tracking: no workshop completion state found.

Verdict: PARTIAL / MAJOR RICH-DOCUMENT AND VALIDATION GAP.

## Step P1.6 Baseline metric capture

1. UI: not proven as structured form.
2. Good: baseline metric has value, source, grain, method, owner, caveats.
3. Entry: source evidence available.
4. Exit: baseline linked to P2 promise contract.
5. Agent: P1 DoD baseline is explicit in `src/lib/programs/phase-packs/P1_discovery.ts:63-73`.
6. DB: can be represented as `program_modules` or deliverable content, but no typed baseline table proven.
7. Upload: source files not parsed structurally.
8. Templates: OKR baseline deliverable kind exists.
9. Meeting: no validation loop found.
10. Gate: baseline gate in governance.
11. Tracking: no typed baseline state.

Verdict: PARTIAL / STRUCTURED-DATA GAP.

## Step P1.7 Evidence ledger updates

1. UI: evidence tab exists; read model fetches evidence.
2. Good: every upload, interview, workshop, generated artifact, and decision gets provenance, confidence, source, and phase link.
3. Entry: evidence captured.
4. Exit: evidence row linked to phase criterion.
5. Agent: ContextBroker can retrieve evidence; upload route can now write `program_evidence_items`, but Nexus does not yet use those evidence rows as step-completion proof.
6. DB: `src/lib/programs/evidence-ingestion.ts:132-172` inserts `program_evidence_items`; `src/lib/programs/db-phase-queries.ts:103-110` still reads the older `evidence` table, so UI/read-model convergence is incomplete.
7. Upload: visible upload now has an evidence write pipeline for text-like uploads and metadata-only binary capture.
8. Templates: evidence template not proven in app registry.
9. Meeting: no structured parser.
10. Gate: governance reads deliverables/modules/participants/milestones, not a full `phase_evidence_links` table.
11. Tracking: evidence rows visible if created by other means.

Verdict: PARTIAL / READ-MODEL GAP.

## Step P1.8 Pattern evidence retrieval

1. UI: right rail context panel can show bundle.
2. Good: private Meridian facts plus shared patterns retrieve with trace.
3. Entry: query and tenant key.
4. Exit: retrieved IDs shown and agent separates private/shared.
5. Agent: `src/app/api/chat/agent/route.ts:757-759` instructs context source discipline.
6. DB/retrieval: ContextBroker trace lines cited in section 1.4.
7. Upload: not relevant.
8. Templates: not relevant.
9. Meeting: not relevant.
10. Gate: pattern evidence can support synthesis, but not proven as gate input.
11. Tracking: context receipts are emitted per response, not persisted as phase evidence.

Verdict: PARTIAL / NOT DEPLOYED-SMOKED.

## Step P1.9 Contradictions log

1. UI: no durable contradictions log UI cited.
2. Good: contradiction is captured, owner assigned, resolution tracked.
3. Entry: contradiction surfaced.
4. Exit: contradiction resolved or accepted.
5. Agent: failure mode and cross-program signals are injected, but no typed contradiction write found.
6. DB: no contradiction log write path found for Programs journey.
7. Upload: no.
8. Templates: no.
9. Meeting: no.
10. Gate: not enforced.
11. Tracking: not found.

Verdict: GAP.

## Step P1.10 P1 deliverable assembly

1. UI: deliverables tab and export route exist.
2. Good: discovery synthesis with baseline is generated, reviewed, signed.
3. Entry: P1 evidence complete.
4. Exit: discovery report signed off.
5. Agent: `complete_deliverable` supports `discovery_report` in `src/lib/agent/tools/program/completeDeliverable.ts:24-34`.
6. DB: tool writes through `completeDeliverable`; direct API exists at `src/app/api/v1/programs/[programId]/deliverables/complete/route.ts:12-44`.
7. Upload: can attach supporting files, but structured parsing gap remains.
8. Templates: `discovery-report` export kind exists.
9. Meeting: no structured linkage.
10. Gate: governance can read deliverables.
11. Tracking: deliverables persist in `deliverables_v2`; no end-to-end smoke.

Verdict: PARTIAL.

## Step P1.11 P1 to P2 gate

1. UI: gate ribbon and approval modal area exists in `src/components/programs/ProgramDetailPage.tsx:4493-4537`.
2. Good: evidence-based sponsor approval moves Sarah to P2.
3. Entry: P1 exit criteria met.
4. Exit: P2 active and audit log row.
5. Agent: P1 doctrine names exit expectations.
6. DB: `advancePhase` can update phase in `src/lib/programs/mutations.ts:144-188`; demo route can override phase in `src/app/api/v1/programs/[programId]/phase/route.ts:20-45` without DB.
7. Upload: no direct link.
8. Templates: discovery report and baseline.
9. Meeting: sponsor review not implemented as full workflow.
10. Gate: governance exists, but evidence-based approval path not proven.
11. Tracking: `current_phase` can update; current step not tracked.

Verdict: GAP for real approval gate; partial for gate display.

## Step P1.12 Sponsor rejects

Status: GAP. No end-to-end P1 sponsor rejection flow found with rationale, reopen step, and notification.

## Step P1.13 Sponsor approves

Status: GAP. No end-to-end P1 sponsor approval flow found with notification, audit log, and session-resume to P2.

---

# 5. Phase P2: Synthesis

## P2 Overall Finding

P2 has stronger doctrine than P1, but the structured promise contract and approval workflow are not complete.

Evidence:

- `src/lib/programs/phase-packs/P2_synthesis.ts:40-52` defines synthesis recommendation plus signed charter.
- `src/lib/programs/phase-packs/P2_synthesis.ts:54-73` defines hard gates for charter and sponsor assignment.
- `src/lib/agent/tools/program/completeDeliverable.ts:24-34` supports `charter`.

Gaps:

- No typed promise contract schema found.
- No architecture-review-attestation workflow proven.
- No dissenter engagement state found.
- No full P2 to P3 approval queue/notification/audit path proven.

## Step P2.1 Sarah enters P2

1. UI: program detail and phase pack.
2. Good: P2 primer shifts from fact-finding to options and recommendation.
3. Entry: P1 exit approved.
4. Exit: P2 plan visible.
5. Agent: P2 pack at `src/lib/programs/phase-packs/P2_synthesis.ts:40-52`.
6. DB: `current_phase=2`.
7. Upload: visible upload gap.
8. Templates: synthesis options table and architecture sketch exist as export kinds.
9. Meeting: tradeoff workshop not end-to-end.
10. Gate: P2 to P3 gate in governance.
11. Tracking: phase only.

Verdict: PARTIAL.

## Step P2.2 Options analysis

Status: PARTIAL. Export kind `synthesis-options-table` exists in `src/lib/programs/exports/types.ts:16-36`, but no code-proven Nexus flow drafts options from P1 evidence plus corpus and persists the options as a structured object.

## Step P2.3 Tradeoff workshop

Status: GAP. Workshop templates exist; capture/upload/parse/validate/write loop is not proven.

## Step P2.4 Architecture review

Status: GAP. P2 pack references architecture review attestation at `src/lib/programs/phase-packs/P2_synthesis.ts:84-85`, but no end-to-end ARB attestation workflow was found.

## Step P2.5 Charter with structured promise contract

1. UI: deliverable creation through agent possible.
2. Good: charter contains target metric, baseline, target value/date, attribution method, kill criterion, decomposition, accountable stakeholders.
3. Entry: P1 baseline complete.
4. Exit: charter signed off and promise contract typed.
5. Agent: P2 pack requires charter with baseline, mechanism, kill criterion, named dissenter, succession owner in `src/lib/programs/phase-packs/P2_synthesis.ts:44-52`.
6. DB: `complete_deliverable` can persist `charter`; no typed promise contract table/schema found.
7. Upload: not relevant.
8. Templates: `program-charter` export kind exists.
9. Meeting: sponsor defense not complete.
10. Gate: governance checks `charter_signed_off`.
11. Tracking: deliverable status, not typed promise contract.

Verdict: PARTIAL / PROMISE-CONTRACT GAP.

## Step P2.6 Sponsor defense 1:1

Status: GAP. No full intent -> agenda -> capture -> parse -> validate loop found.

## Step P2.7 Charter sign-off workflow

Status: PARTIAL. `complete_deliverable` can sign off `charter`; no sponsor co-approval workflow with notifications/audit was proven.

## Step P2.8 Dissenter engagement

Status: GAP. P2 doctrine requires a named dissenter, but no durable dissenter engagement step or workflow was found.

## Step P2.9 P2 to P3 gate

Status: PARTIAL / GAP. Governance can evaluate P2 to P3; end-to-end approval, audit log, notification, and session resume are not proven.

---

# 6. Phase P3: Solution / Program Design

## P3 Overall Finding

P3 can persist some design deliverables and gate checks. This branch removed the most direct P3-to-Build handoff language and now points P3 outputs toward P4 Execution Roadmap, but complete cross-module handoff to Source remains unproven.

Evidence:

- `src/lib/programs/phase-packs/P3_design.ts:37-48` defines P3 outcome as Build gate package.
- `src/lib/agent/tools/program/completeDeliverable.ts:24-34` supports `design`, `design_brief`, and `design_spec`.
- `src/lib/programs/governance.ts:179-260` includes P3 to P4 checks for design and requirements-design-outcome trace.

Gaps:

- P3 dependency language now points to roadmap-ready architecture and P4 Execution Roadmap inputs in `src/lib/programs/phase-packs/P3_design.ts:407-424`.
- Operating model, capability model, measurement model, governance model, and Source handoff are not proven end-to-end.

## Step P3.1 Sarah enters P3

Status: PARTIAL. P3 pack exists; doctrine language is stale around Build.

## Step P3.2 Target-state design

Status: PARTIAL. Design deliverables can be persisted, but no evidence showed healthcare-specific solution patterns surfaced and persisted as target-state design.

## Step P3.3 Operating model / capability model / data implications

Status: GAP. No specific template registry and step-level persistence were proven for all these artifacts.

## Step P3.4 Vendor / partner approach and Source handoff

Status: GAP. The audited code did not prove a Programs-to-Source handoff that creates a sourcing event with scope, success criteria, and evidence.

## Step P3.5 Governance and measurement model

Status: PARTIAL. Governance rules exist, but measurement-model artifact and persistence are not proven.

## Step P3.6 P3 to P4 gate

Status: PARTIAL / GAP. Gate UI and governance exist; full evidence-based approval workflow and audit log are not proven.

---

# 7. Phase P4: Execution Roadmap

## P4 Overall Finding

P4 was the largest doctrine gap at audit start; this branch fixes the active doctrine.

The founder-corrected phase is Execution Roadmap. The active phase pack now says Execution Roadmap and blocks accidental build mode.

Evidence of mismatch:

- Corrected view label exists at `src/lib/programs/programs-page-view.ts:48`.
- Active P4 pack says Build in `src/lib/programs/phase-packs/P4_build.ts:1-11` and `:36-46`.
- P4 pack says the phase stands up pilot environment and executes the named pilot in `src/lib/programs/phase-packs/P4_build.ts:6-11`.

Governance has moved closer to corrected doctrine:

- `src/lib/programs/governance.ts:41-100` includes P4 to P5 hard checks for execution roadmap drafted, execution milestones defined, and execution success criteria defined.

Verdict: P4 doctrine is fixed in code. P4 cannot be treated as Tier A until templates, gates, artifacts, deployed smoke, and surrounding workflow are aligned to Execution Roadmap.

## Step P4.1 Sarah enters P4

1. UI: page may show corrected label in some view models.
2. Good: primer says AbarVa plans execution; delivery happens externally.
3. Entry: P3 design signed off.
4. Exit: Execution Roadmap workspace begins.
5. Agent: current P4 pack says Build, not roadmap.
6. DB: current phase only.
7. Upload: visible upload gap.
8. Templates: execution plan exists, but execution roadmap/funding-ready roadmap not complete.
9. Meeting: roadmap workshop not proven.
10. Gate: governance corrected partly.
11. Tracking: no step state.

Verdict: GAP.

## Step P4.2 Execution roadmap drafting

Status: PARTIAL. `execution_plan` is allowed in `complete_deliverable` and `execution-plan` export kind exists, but current phase doctrine is Build and no roadmap-specific step flow is proven.

## Step P4.3 Timeline, milestones, estimates, technology gap manifest

Status: GAP. Milestone table exists through `program_milestones`; no technology gap manifest, estimate assumptions/ranges, or financial-firewalled estimate artifact was proven.

## Step P4.4 Dependencies, risks, success criteria, benefits realization plan

Status: PARTIAL. Risks and milestones exist in read models; no complete execution-phase success criteria artifact was proven.

## Step P4.5 Responsibility matrix

Status: GAP. No RACI/responsibility matrix artifact flow proven.

## Step P4.6 Implementation governance cadence

Status: GAP. No structured cadence artifact and approval flow proven.

## Step P4.7 P4 to P5 gate

Status: PARTIAL / GAP. Governance rules exist; phase doctrine and artifacts are incomplete; approval workflow is not proven.

---

# 8. Phase P5: Approval / Mobilization

## P5 Overall Finding

P5 doctrine is now aligned to the corrected approval/mobilization package. The remaining gaps are business case, board pack, funding package templates, multi-approver workflow, and deployed smoke.

Evidence:

- Corrected view label exists at `src/lib/programs/programs-page-view.ts:49`.
- Active P5 pack says Activate in `src/lib/programs/phase-packs/P5_activate.ts:1-8` and `:33-37`.
- P5 pack focuses on rollout waves, adoption telemetry, support readiness, and benefits evidence in `src/lib/programs/phase-packs/P5_activate.ts:17-24`.

Verdict: P5 is Tier C for founder-corrected scope.

## Step P5.1 Sarah enters P5

Status: PARTIAL. Current doctrine now says Approval & Mobilization; funding/authority package workflow remains incomplete.

## Step P5.2 Business case and funding request

Status: GAP. No `business_case` deliverable kind found in export route known kinds. Financial firewall is partial; direct deliverable API bypasses sanitizer.

## Step P5.3 Stakeholder alignment map

Status: PARTIAL. `stakeholder-map` export kind exists, but no P5 alignment workflow proven.

## Step P5.4 Readiness assessment, change plan, communications plan

Status: GAP. No complete templates/artifact flow proven.

## Step P5.5 Governance structure and risk acceptance package

Status: GAP. No structured risk acceptance package flow proven.

## Step P5.6 Decision / approval memo

Status: GAP. No dedicated launch recommendation / approval memo artifact flow proven.

## Step P5.7 Board pack

Status: GAP. No board pack deliverable kind, renderer, or workflow proven.

## Step P5.8 Multi-approver workflow

Status: GAP. P0 tenant-admin approval exists; multi-approver sponsor/CFO/CIO/board workflow with role-specific redaction and parallel/serial routing was not found.

## Step P5.9 Approval rejected

Status: GAP. No P5 rejection workflow proven.

## Step P5.10 Approval approved

Status: GAP. No ceremonious funding/authority transition to P6 proven.

---

# 9. Phase P6: Tower Handoff

## P6 Overall Finding

P6 doctrine is now implemented as Tower Handoff. The remaining gaps are execution tracking contract persistence, external status ingestion, Tower handoff event, and realized-value tracking.

Evidence:

- Corrected view label exists at `src/lib/programs/programs-page-view.ts:50`.
- Active P6 pack says Operate in `src/lib/programs/phase-packs/P6_operate.ts:1-15` and `:32-36`.
- P6 pack focuses on steady-state value measurement, quarterly operating review, adoption drift, support quality, vendor renewal, and expansion/retirement decisions in `src/lib/programs/phase-packs/P6_operate.ts:17-24`.

Verdict: P6 is Tier C for Tower Handoff.

## Step P6.1 Sarah enters P6

Status: GAP. Primer should say execution begins outside AbarVa and Tower monitors; current doctrine says Operate.

## Step P6.2 Execution tracking contract

Status: GAP. No complete tracking contract artifact found with milestones, cadence, data feeds, alerts, thresholds, benefits cadence, owner handoff, closeout criteria.

## Step P6.3 Integration setup

Status: GAP. No Jira/Smartsheet/ServiceNow/vendor PMO integration proof found in inspected Programs code.

## Step P6.4 Tower handoff completion

Status: GAP. No complete handoff event to Tower/Atlas and audit log write proven.

## Step P6.5 First weekly status update

Status: GAP. No external status ingestion pipeline proven.

## Step P6.6 Milestone passes and realized value updates

Status: GAP. No realized-vs-promised tracking against typed P2 promise contract proven.

## Step P6.7 Risk fires

Status: GAP. Risk rows exist, but P6 escalation workflow from Tower rules not proven.

## Step P6.8 Decision needed

Status: GAP. No Tower decision-card-to-audit-log flow proven.

## Step P6.9 Closeout

Status: GAP. No complete closeout with realized value, pattern harvest, final outcome report, and audit trail proven.

---

# 10. Cross-cutting Concerns

## CC-1 Tenant Isolation Under Load

Status: PARTIAL / NOT DEPLOYED-SMOKED.

Code evidence:

- `src/app/api/context/demo/route.ts:300-311` rejects mismatched tenant retrieval with 403.
- `src/app/api/chat/agent/route.ts:445-460` deterministically detects and refuses cross-tenant write intent before LLM streaming.
- `src/lib/programs/queries.ts:85-95` filters portfolio by `client_id` and allowed program ids.
- `src/lib/programs/queries.ts:100-111` filters program detail by `id` and `client_id`.

Gaps:

- No deployed forced tenant replacement tests were run in this audit.
- Some reads use null/notFound rather than explicit 403.
- Create paths need stronger `canCreatePrograms` enforcement.

## CC-2 Financial Firewall Under Adversarial Query

Status: PARTIAL / GAP.

Code evidence:

- Chat stream redaction: `src/app/api/chat/agent/route.ts:848-853`.
- Context redaction: `src/app/api/chat/agent/route.ts:1056-1107` and `:1147-1154`.
- Agent deliverable save redaction: `src/lib/agent/tools/program/completeDeliverable.ts:125-135`.

Gap:

- Direct deliverable API lacks sanitizer in `src/app/api/v1/programs/[programId]/deliverables/complete/route.ts:32-42`.
- No deployed adversarial test was run for non-finance Sarah and finance/admin user.

## CC-3 Agent Retrieval Trace

Status: CODE-PARTIAL / NOT DEPLOYED-SMOKED.

Evidence:

- ContextBroker builds trace in `src/lib/knowledge/context-broker/broker.ts:251-277`.
- Trace is returned with bundles in `src/lib/knowledge/context-broker/broker.ts:515-536`.
- Prompt receipt includes tenant key, data plane id, private schema, Pinecone index, private IDs, and shared IDs in `src/app/api/chat/agent/route.ts:1137-1175`.

Gap:

- No deployed UI trace capture was run in this audit.

## CC-4 Phase Doctrine in System Prompt

Status: PARTIAL / GAP.

Evidence:

- Phase pack injection exists in `src/app/api/chat/agent/route.ts:739-742`.
- P0-P3 packs have useful doctrine.

Gap:

- P4-P6 packs now have corrected doctrine in this branch; step-level persistence and workflow state are still incomplete.
- No current step inside phase is injected as a first-class field.

## CC-5 Audit Log Completeness

Status: PARTIAL.

Evidence:

- `supabase/migrations/20260430140000_program_audit_log.sql:5-18` creates table fields.
- `supabase/migrations/20260430140000_program_audit_log.sql:60-73` enforces no update/delete.

Runtime writes added in this branch:

- `src/lib/programs/audit-log.ts` writes append-only `program_audit_log` rows.
- `src/lib/programs/approval.ts` writes approval submit/decision/withdraw events.
- `src/lib/programs/governance.ts` writes phase approval request/decision events.
- `src/lib/programs/mutations.ts` writes origination, phase advance, deliverable sign-off, and module-status events.
- `src/lib/programs/evidence-ingestion.ts` writes evidence-captured events.

Remaining gap: deployed verification and UI rendering of `program_audit_log` in the admin review trail.

## CC-6 Session Resume

Status: PARTIAL / GAP.

Evidence:

- `/home` exists and loads programs in `src/app/(maestro)/home/page.tsx:15-58`.
- Program phase is derived from `current_phase` in `src/app/(maestro)/home/page.tsx:32-40`.

Gap:

- Home filters only approved/active programs in `src/app/(maestro)/home/page.tsx:29-31`.
- No current-step-within-phase state was found.
- No deployed sign-out/sign-in resume test was run.

## CC-7 Eval Harness Coverage

Status: PARTIAL / GAP.

Evidence:

- Phase-pack, governance, approval, context, attachment, and export tests exist.

Gap:

- No proven golden conversation suite by phase.
- Existing lifecycle integration test is not a browser/user journey.
- Older Playwright tests target stale `/engagements` routes.

---

# 11. Synthesis 1 — Honest Gap Inventory

## Substrate Gaps

1. Program state private-schema gap
Affected: all phases.
Impact: private data-plane doctrine is retrieval-only; transactional program state remains shared-table.
Evidence: `src/lib/programs/queries.ts:1-3`, `src/lib/agent/tools/program/commitProgram.ts:477-504`.
Effort: large.
Dependency: private transactional schema design.
Pilot impact: pilot can run only if shared-table control plane is accepted; not acceptable for strict private-plane claim.

2. Current-step state missing
Affected: P1-P6.
Impact: session resume returns to phase, not exact step.
Effort: medium.
Dependency: phase-step schema.
Pilot impact: limited pilot only with handholding.

3. Typed promise contract missing
Affected: P2, P4, P5, P6.
Impact: benefits tracking and realized-vs-promised cannot be reliable.
Effort: medium.
Dependency: baseline schema and deliverable links.
Pilot impact: no value-governance pilot without this.

## Wiring Gaps

1. Admin provisioning UI / Clerk invite handoff incomplete
Affected: Phase -1.
Evidence: server API exists in `src/app/api/admin/users/provision/route.ts`, including client-scoped program assignment checks; Setup/Admin UI and Clerk invitation handoff remain incomplete.
Effort: medium.
Pilot impact: no clean pilot onboarding.

2. Primary create/upload/deliverable/approval-bypass guards are improved; remaining publish/export enforcement audit needed
Affected: P0.
Evidence: `src/app/api/v1/programs/route.ts` and `src/lib/agent/tools/program/commitProgram.ts` now require `canCreatePrograms`; phase approval/advance routes now check program visibility and gate-approval permission for decisions/bypasses; remaining audit should cover every export and publish path.
Effort: small.
Pilot impact: reduced security risk; still not full end-to-end proof.

3. Rich document parsing and phase evidence-linking incomplete
Affected: P1-P6.
Evidence: visible upload now calls `src/app/api/programs/[id]/attachments/upload/route.ts` and records `program_evidence_items`; PDF/XLSX/PPTX parsing, action-register writes, stakeholder-map updates, and `phase_evidence_links` remain missing.
Effort: large.
Pilot impact: blocks realistic document-grounded workflow beyond text-like artifacts.

## Agent Gaps

1. P4/P5/P6 doctrine was corrected in active phase packs during this branch.
2. Step-level doctrine is still missing across phases.

Effort: medium.
Pilot impact: P4-P6 still cannot pilot end-to-end until templates, gates, state, and step-specific doctrine are finished.

## Template Gaps

Missing or incomplete: business case, board pack, Tower handoff contract, technology gap manifest, execution funding request, readiness assessment, change plan, approval memo, promise contract.

Effort: medium-large.
Pilot impact: P5/P6 blocked.

## Eval Gaps

Missing: phase-by-phase golden conversations, adversarial financial tests across chat/deliverable/prompt receipt, deployed tenant isolation tests, deployed resume tests, P0-P6 browser smoke.

Effort: medium.
Pilot impact: no confidence without these.

## Document Handling Gaps

Major: text-like uploads now write `program_evidence_items`; PDFs/XLSX/PPTX meeting outputs are not parsed into decisions, action items, stakeholder map, or phase evidence links.

Effort: large.
Pilot impact: P1/P2 blocked for real-world use.

## Approval/Gate Gaps

P0 approval exists. P1-P6 phase approval is fragmented and not proven as an evidence-based multi-approver workflow.

Effort: large.
Pilot impact: no end-to-end lifecycle pilot without this.

## Tracking Gaps

No step state, partial audit-log coverage for major actions, no journey-resume proof.

Effort: medium.
Pilot impact: high.

## Cross-module Gaps

Programs-to-Source handoff not proven. Programs-to-Tower handoff not proven.

Effort: large.
Pilot impact: P3/P6 blocked.

## Access Control Gaps

No-super-admin doctrine and unknown-user fallback are improved in code; primary create/upload/deliverable and approval-bypass paths now enforce permissions; remaining gaps are Setup/Admin UI, Clerk invite handoff, and full endpoint-by-endpoint publish/export enforcement.

Effort: small-medium.
Pilot impact: high.

## Financial Firewall Gaps

Direct deliverable-complete API now sanitizes restricted financial text and requires deliverable-generation permission. Deployed adversarial tests remain missing.

Effort: small-medium.
Pilot impact: high.

---

# 12. Synthesis 2 — Currently Usable Tier Assignment

| Phase | Tier | Reason |
| --- | --- | --- |
| Access provisioning | Tier B | Server API now provisions client-pinned Programs users with module/program/financial rights; Setup UI and Clerk invite handoff still need wiring. |
| P0 Origination | Tier B | Agent submission and approval queue exist, create permission is enforced, and audit writes exist; private-schema posture and deployed smoke remain. |
| P1 Discovery | Tier B/C | Doctrine exists and uploads now create evidence rows for parseable text artifacts; rich PDF/XLSX parsing, workshop validation, baseline schema, and gate approval remain incomplete. |
| P2 Synthesis | Tier C | Charter deliverable can be saved, but promise contract, ARB attestation, sponsor defense, dissenter workflow, and gate approval are incomplete. |
| P3 Design | Tier B/C | Design deliverables can be saved, but Source handoff, operating model, capability model, and corrected transition to roadmap are incomplete. |
| P4 Execution Roadmap | Tier B/C | Doctrine is now corrected, but roadmap templates, gate workflow, artifacts, and deployed smoke are incomplete. |
| P5 Approval/Mobilization | Tier C | Doctrine is now corrected, but business case, board pack, multi-approver workflow, and mobilization package are incomplete. |
| P6 Tower Handoff | Tier C | Doctrine is now corrected, but Tower handoff event, external status ingestion, execution tracking contract persistence, and realized value tracking are incomplete. |

---

# 13. Synthesis 3 — Forced-Priority Remediation Plan

## Critical Path

1. Control-plane substrate

- `inferAccessLevel` fallback is fixed to default to no program access unless explicit role/membership/participant grants access.
- `canCreatePrograms`, `canUploadArtifacts`, and `canGenerateDeliverables` are enforced on the primary create/upload/deliverable paths. Phase approval/advance routes now enforce program visibility and gate-approval permission for decisions/bypasses. Remaining work: full `canPublishDeliverables` and export enforcement across every path.
- Decide and implement the transactional private-plane posture: either move program state into private schemas or explicitly document program state as client-scoped control-plane tables separate from private retrieval data.
- Major state transitions now write to `program_audit_log`; remaining work is full coverage for minor edits/exports plus admin UI rendering.

2. Provisioning

- Server provisioning API now creates client-pinned Programs users with program assignments, financial visibility, upload/generate/publish/approve flags. Remaining work: Setup/Admin UI and Clerk invitation handoff.
- Add tests for Programs-only, Source-only, dual, admin, unassigned.

3. Lifecycle doctrine

- Complete the remaining P4 Execution Roadmap workflow beyond the corrected phase pack: templates, save paths, gate, and smoke.
- Complete the remaining P5 Approval/Mobilization workflow beyond the corrected phase pack: business case, board pack, multi-approver routing, and smoke.
- Complete the remaining P6 Tower Handoff workflow beyond the corrected phase pack: tracking contract, status ingestion, Tower handoff event, and smoke.
- Add step-level doctrine per phase.

4. Document handling

- Rewire visible program detail upload to the program attachment route.
- Add parse workers for PDF, DOCX, XLSX, PPTX meeting/workshop artifacts.
- Persist extracted decisions, action items, attendees, metrics, evidence rows, and phase evidence links.
- Add validation responses when uploaded content misses intended workshop outputs.

5. Deliverables/templates

- Add registry entries and renderers for business case, board pack, approval/mobilization package, Tower handoff contract, technology gap manifest, structured promise contract, readiness assessment, change plan, approval memo.
- Ensure direct API save paths run the same financial sanitizer as agent tool paths.

6. Approval/gates

- Build one phase approval state machine for P0 through P6.
- Add sponsor/client_admin/multi-approver queues.
- Support approve/reject with rationale, notification, audit log, state transition, and resume.
- Make gate evaluation evidence-based through explicit evidence links rather than only deliverable/module heuristics.

7. P6/Tower

- Define execution tracking contract.
- Implement initial manual status upload and structured parsing before external API integrations.
- Add Tower handoff event, Tower portfolio card, pressure card, decision capture, and realized-vs-promised tracking.

8. Evals and smoke

- Add golden conversation suite per phase.
- Add deployed smoke for Sarah Meridian journey.
- Add tenant isolation adversarial tests.
- Add financial firewall tests across chat, context receipt, saved deliverable, export.

## No-Pilot Blockers

- Setup UI provisioning incomplete.
- Rich upload parsing/evidence pipeline incomplete for PDF/XLSX/PPTX.
- Phase approval workflow incomplete.
- No deployed end-to-end smoke.

## Pilot-Limited Gaps

- Private transactional state not in tenant private schema if accepted as control-plane/shared-table model.
- PDF export not implemented if DOCX/XLSX/HTML are acceptable initially.
- External Jira/Smartsheet integration can be deferred if manual Tower status upload is implemented.

---

# 14. Synthesis 4 — End-to-End Smoke Test Definition

## Required Smoke

1. Provision Sarah as new Meridian program user.

Today: partially passes in code.
Needed: Setup UI and Clerk invitation handoff; the server API now writes `persons`, `person_client_memberships`, and optional `engagement_participants` with required Programs flags.

2. Sarah signs in and lands on `/home`.

Today: partially supported.
Needed: deployed verification and pending/new program cards.

3. Sarah originates new program through P0 with Nexus coaching and submits for approval.

Today: code partial.
Needed: deployed `/api/chat/agent` smoke; enforce create permission; no cross-client leakage; no bad navigation.

4. Client admin approves.

Today: code partial.
Needed: tenant-admin recipient lookup and deployed queue smoke; audit-log write now exists.

5. Sarah walks P1 with workshops, uploads, and baseline capture.

Today: partially passes in code.
Needed: rich document parsing, baseline schema, workshop validation, P1 step state; upload-to-evidence now exists for text/markdown/json/csv-style artifacts and metadata-only binary capture.

6. Sponsor approves P1 to P2.

Today: does not pass.
Needed: phase approval workflow, notifications, audit, resume.

7. Sarah walks P2 with charter and structured promise contract.

Today: does not pass.
Needed: promise contract schema and workflow.

8. Sarah walks P3 design.

Today: partial.
Needed: design templates, operating/capability/model artifacts, Source handoff if vendor needed.

9. Sarah walks P4 execution roadmap.

Today: partially passes in code.
Needed: P4 artifacts/templates, gate workflow, and deployed smoke.

10. Sarah walks P5 approval/mobilization.

Today: does not pass.
Needed: business case/board pack/multi-approver workflow, mobilization package persistence, and deployed smoke.

11. Multi-approver workflow approves P5.

Today: does not pass.
Needed: serial/parallel approvals with role-specific visibility and audit.

12. Sarah completes P6 Tower handoff.

Today: does not pass.
Needed: tracking contract persistence, Tower handoff event, external status ingestion, and deployed smoke.

13. First weekly status flows in and Tower surfaces it.

Today: does not pass.
Needed: manual/API status ingestion, parser, Tower pressure cards.

14. Audit log captures every transition; financial firewall and tenant isolation hold.

Today: partially passes in code.
Needed: deployed adversarial tests and full audit coverage; runtime audit writes and direct API financial sanitizer now exist.

## Passing Criteria

The smoke test passes only when a browser-authenticated Meridian Programs user completes the full sequence without database hand edits, hidden fixture overrides, stale phase labels, raw artifact markers, cross-tenant data, exact financial leakage, or manual state repair.

Until that smoke passes, Programs is not pilot-grade end-to-end.
