# Source/Vendor 360 Demo-Readiness Execution Map

**Status:** active execution contract  
**Scope:** Source, Vendor 360, Contract 360, Optimize Contract, New Event, and Source aVa  
**Primary demo tenant:** primary synthetic healthcare tenant readiness, with the secondary synthetic
airline canary used only where a richer comparison is explicitly needed
**Operating rule:** prove from the owning layer before claiming demo readiness
**Upstream gate:** downstream of the ECL commercial-family load/readback lane; this tracker does not
authorize work ahead of the approved load, independent readback, and proof review.

This execution map exists so the Source push does not become another pile of good local fixes
without a single proof spine. Each lane below can ship independently, but none is complete until its
proof is captured from the correct layer.

## Proof Boundary

| State | What it means | What does not count |
| --- | --- | --- |
| Designed | Requirements, data contract, and acceptance tests are written. | A mockup or prompt alone. |
| Implemented | Code or artifact exists in a branch. | Local screenshots without tests. |
| Locally validated | Focused tests, lint/typecheck where relevant, and deterministic fixtures pass. | A passing test that does not exercise the stated risk. |
| Merged | PR is squash-merged to main. | Open PR or local commit. |
| Deployed | Repo-owned ACA main workflow deploys the merged SHA. | Vercel, local dev, branch preview, or ad hoc ACA update. |
| Live-proven | Signed-in browser, app-route fetch, or data readback proves the behavior in the runtime. | HTTP 200, CI, or deploy log alone. |

Missing evidence must remain missing. A blank or absent value must never be rendered as zero, and a
model may explain but must not calculate money, spend, value, ROI, or risk.

## Lane 1 — Primary Synthetic Healthcare Tenant Demo-Readiness Audit

**Goal:** decide whether the primary synthetic healthcare tenant can support the demo story across
Source, Vendor 360, Contract 360, Optimize Contract, New Event, and aVa after the upstream ECL
load/readback proof gate clears.

| Requirement | Acceptance evidence |
| --- | --- |
| Page-by-page audit of the demo path | Report with route/surface, what the CXO sees, what is supported, what is missing. |
| Data depth audit | Counts and coverage for vendors, contracts, line-level evidence, source files, opportunities, and value proof. |
| Workflow audit | New Event and Optimize Contract gate behavior, forward path, approval states, and artifact generation. |
| Intelligence audit | aVa answers grounded in the approved tenant data, with tables/charts/refusals where appropriate. |
| Recommendation | Demo-safe, demo-with-caveats, or not-demo-safe, with exact fixes required. |

**Done when:** a report is merged or attached with evidence-backed go/no-go and a prioritized fix
list. This lane is read-only unless a separate fix PR is opened.

## Lane 2 — Controlled Upload, Parse, Persist, Readback

**Goal:** prove that rich source files can become governed facts, not just uploaded attachments.

| Evidence family | Expected source | Target result |
| --- | --- | --- |
| Contract PDF / CLM pack | Executed agreement, SOW, order form, rate card | Clause/right/commercial facts with document lineage. |
| Vendor response package | 50-75 page proposal, pricing workbook, exhibits | Solution claims, coverage, differentiators, assumptions, pricing, risks, and exceptions. |
| Finance / AP detail | Invoice, PO, payment, GL extract | Reproducible spend, exception, and value-proof inputs. |
| Operations / SLA detail | ITSM, service review, incident/SLA export | Service performance and recoverable leakage inputs. |

**Done when:** a controlled upload path is proven through parse -> persist -> readback in a safe
environment. If production mutation is needed, the lane must provide an ACA job contract, tenant
scope, rollback plan, proof bundle, and human-readable apply command before any write.

## Lane 3 — aVa Hard-Question QA

**Goal:** prove Source aVa is not just fluent, but useful, grounded, and capable of charts/tables.

| Question class | Acceptance evidence |
| --- | --- |
| Grounded contract questions | Answers cite the selected contract/evidence state and do not name unrelated vendors. |
| Missing evidence | Answers explain the gap and next evidence request instead of inventing value. |
| Value proof | Realized value is finance-confirmed only; pending approval stays pending. |
| Tables and charts | Markdown tables and `abarva-chart` payloads render only when requested and are valid. |
| Refusals | aVa refuses unsupported or unknowable asks without filler. |

**Done when:** a 50-question pack has run with captured responses, scored defects, fixed P0/P1
issues, and a residual backlog for lower-priority misses.

## Lane 4 — Source-Substrate Number Proof

**Goal:** make Source figures quotable with the same discipline as Tower lineage.

| Figure | Owning substrate | Required proof |
| --- | --- | --- |
| Contract count | Source canonical/read model | Counting basis and tenant scope. |
| Vendor count | Source canonical/read model | Vendor identity basis and dedupe rule. |
| Annual contract value | Contract 360 / Source cube | Sum basis, currency, period, included/excluded rows. |
| Opportunity value | Calculation runs | Included, excluded, and pending inputs. |
| Evidence readiness | Evidence family registry | Required vs optional families and missing states. |
| Cube metric | Cube/read model | Query/view name and reconciliation to source/read model. |

**Done when:** a script or testable report emits `AGREE`, `CONFLICT`, `ONE_SOURCE`, or `ABSENT`
for Source figures. A `CONFLICT` figure is not quotable.

## Lane 5 — UX Simplification And Executive Flow

**Goal:** make Source surfaces easier to use without weakening evidence semantics.

| Surface | Priority problem | Target behavior |
| --- | --- | --- |
| New Event | User cannot tell which evidence rows to upload or how to advance. | Compact task table with required/optional state, upload action, status, and clear next gate. |
| Optimize Contract | Approval/workflow language is too dense and headers can dominate. | Compact executive header, next decision, and evidence trace above the fold. |
| Contract 360 | Tabs can read like data dumps. | Each tab answers one CXO question with source, evidence, and next action. |
| Source workspace | Explorer/group-by views can feel unclear. | Show what is selected, why it matters, and the contract rows behind the slice. |
| aVa dock | Must help, not cover the work. | Context-aware prompts and chart/table output without hiding primary actions. |

**Done when:** focused UI patches have tests or browser proof at common demo viewports, and each
changed surface retains missing-evidence and approval-gate honesty.

## Current Priority Order

0. Upstream ECL commercial-family load/readback lane: approved load, independent row-for-row
   readback, and proof review. This tracker waits behind that gate.
1. Primary synthetic healthcare tenant demo-readiness audit.
2. Source-substrate number proof.
3. aVa hard-question QA.
4. Controlled ingest readback proof for any additional upload path not covered by the ECL lane.
5. UX simplification patches driven by the audit and QA findings.

This order is intentional: first clear the ECL load/readback proof gate, then prove whether the demo
story is supported, then make numbers quotable, then test the assistant, then prove any additional
ingest path, then polish the surfaces around the truth.

## Deployment Rule

Code changes move through PRs and the repo-owned ACA main deploy workflow. No branch preview,
Vercel URL, local dev screenshot, or ad hoc Container App update proves the shared product runtime.
