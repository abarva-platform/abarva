# Programs / Strategic Moves E2E Functional Test Report

Date: 2026-05-02  
Environment: `https://app.abarva.ai` production  
Module label observed: `Strategic Moves` user-facing; internal code/routes remain `programs`  
Crawler mode: live UI + DB verification + post-fix reruns  
Scope: Program origination through P6 Tower handoff across Meridian, Apex, and First Capital

## Executive Verdict

Final verdict: PASS WITH RESIDUAL GAPS.

The Programs lifecycle is now proven end-to-end across three clients after fixes: P0 origination, admin approval, P1 discovery, evidence upload/parse, deliverable generation, phase gates, P4 execution roadmap, P5 approval/mobilization package, P6 Tower handoff, lifecycle completion, and Tower visibility.

The most important outcome: a brand-new move can now progress from idea to completed P6 handoff with signed artifacts and audit rows. This was not true at the start of the crawl.

## Production Fixes Applied During Crawl

| PR | Merge SHA | Fix | Production verified |
| --- | --- | --- | --- |
| #1419 | `fc41bf8ce22184dac3fc9a38ca142a7178869cf4` | Block Discovery gates when hard gaps remain | Yes, Apex rerun blocked until baseline/owner evidence was added |
| #1421 | `6762e87bc30a808284129e67d6968f5d0d4ded8b` | Render completed lifecycle state correctly | Yes, completed programs show completed/final state |
| #1422 | `9755c803aa5292a92e7538504f10f1554ed1fc55` | Parse sectioned evidence notes | Yes, later uploads parsed decisions/actions/risks |
| #1424 | `22be97aa71d15e76a3aa7c5976d81d5856c9537d` | Parse natural evidence headings | Yes, First Capital P1/P3/P5 notes parsed into structured evidence |
| #1425 | `7f1eb13b3bb261781f63ee5be363506031d4e037` | Add canonical P2 deliverable keys | Yes for future runs; current Apex/First Capital rows retain historical mismatch |
| #1428 | `1d8bc0fe78789bea37242cbdde643a4e25b3b2ac` | Preserve uploaded/signed baseline evidence in generated deliverables | Yes, First Capital P3/P6 artifacts regenerated and DB-verified |

## Client Results

| Client | Program | Program ID | Final DB state | Result |
| --- | --- | --- | --- | --- |
| Meridian Health | Healthcare Data Analytics Modernization for Agentic Care | `51180b6b-e0b1-41e7-a83f-ed23af87e1dd` | `current_phase=6`, `lifecycle_state=completed`, `status=completed` | PASS |
| Apex Retail | AMS Consolidation 2026 — Second Attempt | `8a65a9a8-d1f6-45ff-accc-d23797f410bd` | `current_phase=6`, `lifecycle_state=completed`, `status=completed` | PASS |
| First Capital | Core Banking AI Operating Model & Analytics Modernization | `6f2f57c8-f608-4aec-ac2b-0d3991d357d2` | `current_phase=6`, `lifecycle_state=completed`, `status=completed` | PASS |

## First Capital Final Evidence

This was the final post-fix verification path.

### P1 Discovery

What was tested:

- Uploaded/pasted P1 baseline attestation notes through the UI.
- Evidence persisted to `program_evidence_items`.
- Attachment persisted to `program_attachments`.
- Parser extracted attendees, decisions, action items, risks, and baseline candidates.

Key parsed baselines:

| Metric | Value | Source |
| --- | --- | --- |
| Analytics request-to-insight cycle time | 21 business days | `FC-ANALYTICS-Q1FY26` |
| Data lineage completeness | 62% | `FC-LINEAGE-2026-05` |
| Payments/fraud signal latency | 47 minutes | `FC-FRAUD-LATENCY-Q1FY26` |
| Analytics rework rate | 14% | `FC-REWORK-Q1FY26` |

Result: PASS.

Residual issue: `program_attachments.scan_status` remains `pending` even when synchronous text parsing succeeds.

### P2 Synthesis

What was tested:

- Options analysis requested.
- Charter requested.
- Workshop facilitator guide requested.
- Phase advanced to P3.

Result: PASS WITH HISTORICAL MISMATCH.

Known mismatch from before PR #1425:

- Options memo was saved under `design_spec`.
- Workshop facilitator guide was saved under `requirements_traceability`.

PR #1425 fixed the allowed canonical keys for future runs, but the current historical rows were not rewritten.

### P3 Solution Design

What was tested:

- Uploaded/pasted P3 design review notes.
- Parser extracted decisions, actions, risks, attendees.
- Nexus generated and saved design spec and traceability matrix.
- A baseline hallucination was discovered and fixed.

Original defect:

- Nexus replaced uploaded baseline `21 business days` with unsupported `4.2 days` and target `2.5 days`.
- Nexus also introduced unsupported stack/tool assumptions.

Fix and rerun:

- PR #1428 added baseline fidelity doctrine.
- Live production rerun generated clean signed versions.
- DB latest versions now contain `21 business days`, `62%`, `47 minutes`, `14%`.
- DB latest versions no longer contain the unsupported `4.2`, `2.5`, or unsupported stack/tool names.

Result: PASS AFTER FIX.

### P4 Execution Roadmap

What was tested:

- Nexus generated signed `execution_roadmap`.
- Nexus created seven structured milestone rows.
- Nexus explicitly stated execution happens outside AbarVa and Tower observes after handoff.
- P4 gate advanced to P5.

DB verification:

- `execution_roadmap` signed.
- Seven milestone rows created: M1-M7.
- No exact financial values found in roadmap content.
- All four P1 baselines carried forward.
- Audit row: `program_phase_advanced`, `P4` to `P5`.

Result: PASS.

### P5 Approval & Mobilization

What was tested:

- Uploaded/pasted P5 approval and mobilization notes through UI.
- Evidence persisted at phase 5.
- Parser extracted attendees, decisions, action items, risks.
- Nexus generated and signed five required P5 deliverables.
- P5 gate advanced to P6 only after deliverables were signed.

Signed P5 deliverables:

| Type key | Status | Financial values |
| --- | --- | --- |
| `business_case` | signed_off | Redacted/qualitative only |
| `funding_approval` | signed_off | Redacted/qualitative only |
| `sponsor_alignment` | signed_off | No exact financial values |
| `readiness_and_change_plan` | signed_off | No exact financial values |
| `tower_handoff_plan` | signed_off | No exact financial values |

Result: PASS.

### P6 Tower Handoff

What was tested:

- Nexus generated final Tower execution tracking contract.
- Nexus completed lifecycle.
- DB state changed to `lifecycle_state=completed`, `status=completed`.
- Audit row `program_completed` written.
- Tower page showed completed P6 handoff and linked back to the move.

Final DB verification:

```text
current_phase=6
lifecycle_state=completed
status=completed
```

Final Tower contract verification:

| Check | Result |
| --- | --- |
| Contains `21 business days` | PASS |
| Contains `62%` | PASS |
| Contains `47 minutes` | PASS |
| Contains `14%` | PASS |
| Contains shorthand `bd` / `min` | PASS, none in latest DB artifact |
| Exact financial values | PASS, none detected |

Tower surface verification:

- `/tower` showed `Tower handoffs · P6 active`.
- It listed `Core Banking AI Operating Model & Analytics Modernization`.
- It showed `P6 Tower Handoff · completed`.
- Link returned to `/programs/6f2f57c8-f608-4aec-ac2b-0d3991d357d2`.

Result: PASS.

## Deliverable Generation Coverage

| Phase | Deliverables tested | Result |
| --- | --- | --- |
| P0 | Seed/origination package | PASS; semantic key mismatch noted in earlier run where P0 seed reused `discovery_report` |
| P1 | Discovery synthesis report | PASS |
| P2 | Charter, options/workshop artifacts | PASS with historical type-key mismatch fixed for future by PR #1425 |
| P3 | Design spec, traceability matrix | PASS after PR #1428 and live regeneration |
| P4 | Execution roadmap, milestones | PASS |
| P5 | Business case, funding approval, sponsor alignment, readiness/change plan, Tower handoff plan | PASS |
| P6 | Tower execution tracking contract and completion package | PASS after retrieval-hygiene cleanup |

## Document / Meeting Notes Ingestion Coverage

| Phase | Upload tested | Parse result | DB result |
| --- | --- | --- | --- |
| P1 | Baseline attestation notes | Attendees, decisions, actions, risks, baseline candidates | PASS |
| P3 | Solution design review notes | Attendees, decisions, actions, risks | PASS |
| P5 | Approval/mobilization notes | Attendees, decisions, actions, risks | PASS |

Residual limitation:

- Text/pasted-note parsing is proven.
- PDF, Office, image, audio/video upload parsing is not proven in this crawl. The UI says those files are captured with metadata for follow-up parsing.
- `scan_status=pending` persists for text uploads even when text evidence is parsed immediately.

## Financial Firewall Coverage

The final First Capital path did not expose exact financial values in generated deliverables. The tested P4/P5/P6 artifacts used qualitative funding language and preserved operational metrics only.

Result: PASS for tested path.

Residual risk:

- Adversarial chat prompts were tested earlier in the crawl, but full cross-surface prompt-receipt redaction was not exhaustively re-tested after every PR.

## Tenant Isolation Coverage

The tested live paths stayed within the active tenant. First Capital uses `tenant_key=arcturus` internally while the UI says First Capital, which is a legacy alias/naming divergence.

Result: PASS for no observed cross-tenant data leak in final First Capital run.

Residual issue:

- `arcturus` vs First Capital naming is confusing and should be cleaned up or documented as a canonical alias.

## Canonical Vision Package Handling

The package `abarva-canonical-vision-package-v4-2026-05-02.zip` was inspected after the functional run was underway.

Relevant instruction from `PROGRAM_CODEX_DESIGN_UPDATE_AND_COSMETIC_BRIEF.md`:

- Finish current QA workload first.
- Do not start cosmetic/Atrium work until QA is complete.
- Rename is display-only: Programs becomes Strategic Moves externally; internal identifiers stay unchanged.
- Atrium chrome migration is deferred.

Action taken:

- No cosmetic or Atrium code changes were started during this functional QA loop.
- The reports note future-state implications for Tower/Strategic Moves redesign.

## Final Functional Verdict

PASS WITH RESIDUAL GAPS.

The lifecycle can now be demonstrated from origination through P6 Tower handoff across all three clients, with DB verification and live UI confirmation. Remaining gaps are mostly polish, naming consistency, attachment status semantics, historical artifact-key cleanup, and deeper non-text document parsing.
