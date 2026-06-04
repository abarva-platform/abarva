# AI Liability Live Evidence Matrix

Status: execution-control matrix

Owner: AbarVa founder/operator

Backlog rows: T206, T207, T209, T210, T216, T217, T218, T219, T220, T221, T222, T227, T238, T240, T242, T243, T244, T245, T247, T248, T250, T251, T336, T337, T339

## Purpose

This matrix separates the remaining AI Liability Defense backlog into evidence types so AbarVa does not confuse repo implementation with live liability closure. Many rows already have meaningful product controls, runbooks, or counsel-ready drafts. They remain In progress because they need authenticated live E2E proof, durable persistence/export proof, counsel approval, insurance confirmation, or scheduled review evidence.

## Closure Rule

Do not mark a row Done from this matrix alone. A row closes only when:

- the implementation, policy, or counsel-ready artifact is merged to main,
- the row-specific live, legal, insurance, or external evidence below exists,
- private evidence is stored outside the public repository when it includes user identities, customer data, contract drafts, policy quotes, or privileged counsel comments,
- and `/Users/anand/Downloads/ABARVA_PILOT_READINESS_PLAN.xlsx` names the PR, command, evidence path, and remaining risk.

## Evidence Classes

| Evidence class | Rows | Meaning |
| --- | --- | --- |
| Live product E2E proof | T206, T207, T210, T217, T238, T240, T242, T243, T244, T245, T247, T248, T336, T337 | Authenticated browser/API proof must show the control works on the real surface and persists audit evidence. |
| Durable evidence/export proof | T216, T217, T218, T250, T251 | Evidence packets, exports, catalog gates, and review reports must be durable, tenant-scoped, and regression-covered. |
| Counsel or insurance proof | T219, T220, T221, T222, T227, T339 | Counsel, broker, carrier, or approved policy evidence is required; Codex can prepare materials but cannot close these alone. |
| Broader source-binding proof | T209, T248 | Substantive agent or AI claims need source citations, gap banners, or explicit general-knowledge labeling across audited surfaces. |

## Product-Control Evidence Rows

| Row | Current blocker | Existing anchor | Done evidence required |
| --- | --- | --- | --- |
| T206 | Approval gate exists in code paths but needs live Source E2E proof across consequential surfaces. | `docs/legal/AI_DECISION_SUPPORT_CONTROLS.md` | Authenticated E2E showing review checkbox, responsibility acknowledgement, persisted reviewer id, timestamp, justification, and export/log trail. |
| T207 | Free-text reason validation exists but live audit visibility/export proof is missing. | `src/lib/auth/gate-approval-strict-mode.ts` | Browser/API proof that reason length is enforced, stored verbatim, visible in Log tab or equivalent, and exportable. |
| T210 | Edit-before-commit exists for Source artifacts but needs broader live proof. | `docs/releases/records/2026-06-01-edit-before-commit-approval.md` | E2E showing user can edit AI output before commit and that edited content, editor, and timestamp are retained. |
| T216 | Evidence packet controls exist but not every consequential action auto-generates durable packet proof. | `src/lib/agent/evidence-ledger/composer.ts` | Per-module sample packets covering AI suggestion, sources, human timestamp, reviewer, justification, execution timestamp, and tenant exportability. |
| T217 | Export foundation exists but live tenant-scoped self-serve export proof is still needed. | `src/app/api/admin/programs/approvals/export/route.ts` | Authenticated JSON/CSV export for a tenant, formula-safe CSV proof, date filter proof, and negative cross-tenant proof. |
| T218 | Review engine exists but scheduled/admin workflow proof is missing. | `docs/runbooks/approval-pattern-review.md` | Real or rehearsal quarterly report from approval events, critical summaries to tenant admin and AbarVa, remediation owner, and retained packet. |
| T238 | Source award-tab vendor recommendation control exists, but broader recommendation/export proof is open. | `docs/legal/AI_LIABILITY_RETROFIT_COMPLETION_CHECKPOINT.md` | All vendor recommendation surfaces show AI label, citations, confidence, caveats, and human approval boundary with CI coverage. |
| T240 | Savings/cost estimates still need CFO-auditable assumption proof. | `docs/legal/AI_LIABILITY_RETROFIT_COMPLETION_CHECKPOINT.md` | Vendor bid bridge, normalized TCO, BAFO delta, realized savings math, assumptions visibility, and explicit acceptance evidence. |
| T242 | Tower prediction controls need full confidence/assumption coverage. | `docs/legal/AI_LIABILITY_RETROFIT_COMPLETION_CHECKPOINT.md` | Prediction surfaces show AI label, confidence interval or tier, assumptions, missing inputs, and human-review boundary. |
| T243 | Tower alert acknowledgement is visible but persistence is incomplete. | `docs/legal/AI_LIABILITY_RETROFIT_COMPLETION_CHECKPOINT.md` | Alert acknowledge/dismiss reason persists before action, is tenant-scoped, and appears in audit/export evidence. |
| T244 | Setup config approval foundation exists but live persistence proof is missing. | `scripts/admin/verify-setup-ai-governance.mjs` | Live setup/admin action cannot apply AI-suggested config until admin approval, named user, reason, evidence ids, and audit ledger write exist. |
| T245 | Setup anomaly triage foundation exists but live persistence proof is missing. | `scripts/admin/verify-setup-ai-governance.mjs` | Live anomaly remediation cannot occur until triage acknowledgement, named user, reason, timestamp, evidence ids, and audit ledger write exist. |
| T247 | Chat approval boundary exists visually but route/tool enforcement proof is open. | `docs/releases/records/2026-06-01-agent-chat-action-approval.md` | Agent-suggested actions require explicit in-chat approval before any external action/tool execution, with bypass-negative tests and audit proof. |
| T336 | Default client policy settings exist, but admin UI/persistence is not complete. | `src/lib/ai-liability/human-decision-controls.ts` | Tenant admin can require CFO/legal/procurement/security/executive gates by module/action, and policy choice is captured in evidence. |
| T337 | Evidence packet dispositions exist, but live capture/persistence is incomplete. | `src/lib/agent/evidence-ledger/types.ts` | Accept, modify, reject, and request-more-evidence dispositions persist with rationale and improve later QA or review packets. |

## Source-Binding Evidence Rows

| Row | Current blocker | Existing anchor | Done evidence required |
| --- | --- | --- | --- |
| T209 | Citation-gap banners exist, but every AI claim is not yet source-bound. | `src/lib/agent/citation-gap.ts` | Surface-by-surface proof that substantive claims have citations/source chunks or explicit unsupported/general-knowledge treatment. |
| T248 | Agent citation-gap controls exist, but deeper RAG claim coverage is open. | `src/lib/agent/citation-gap.ts` | Agent responses bind factual claims to source links across AgentDock, AtlasDrawer, AgentResponse, and audited chat surfaces, with regression tests. |

## Durable Review And Regression Rows

| Row | Current blocker | Existing anchor | Done evidence required |
| --- | --- | --- | --- |
| T250 | CI catalog gate exists, but deferred catalog claims remain. | `docs/legal/AI_LIABILITY_RETROFIT_COMPLETION_CHECKPOINT.md` | All audited surfaces have machine coverage for label, citation/evidence, and human gate; no deferred catalog claims remain. |
| T251 | Strict retrofit completion is 11/20, not 100%. | `docs/legal/AI_LIABILITY_RETROFIT_COMPLETION_CHECKPOINT.md` | T231-T250 are all Done with implementation or accepted external evidence; checkpoint strict completion reaches 100%. |

## Counsel, Insurance, And External Rows

| Row | Current blocker | Existing anchor | Done evidence required |
| --- | --- | --- | --- |
| T219 | SOW clauses are counsel-ready but not lawyer-approved. | `docs/legal/ai-sow-clause-playbook.md` | Counsel-approved AI advisory, validation duty, hallucination disclosure, warranty disclaimer, and high-risk-use language. |
| T220 | Client-reliance indemnity is a counsel review point, not final language. | `docs/legal/ai-sow-clause-playbook.md` | Counsel-approved reliance/client-directed-use indemnity language or explicit decision not to use it. |
| T221 | AI-output liability cap treatment is unresolved. | `docs/legal/ai-sow-clause-playbook.md` | Counsel-approved separate cap, sub-cap, exclusion, or negotiated treatment for AI-output reliance claims. |
| T222 | Training warranty concept is drafted but not approved. | `docs/legal/ai-sow-clause-playbook.md` | Counsel-approved warranty requiring client users to complete training before access, or approved alternate control. |
| T227 | E&O AI coverage scan exists, but carrier/broker response is missing. | Private insurance readiness workbook in Downloads | Broker/carrier/policy evidence confirming AI/ML claims, hallucination, bias, IP, privacy/security, contractual liability, exclusions, sublimits, and endorsements. |
| T339 | Counsel checklist exists, but external legal signoff is missing. | `docs/legal/ai-sow-clause-playbook.md` | Counsel review and signoff for decision-support responsibility allocation, prohibited uses, indemnity, warranty, and cap language. |

## Execution Sequence

1. Close live product E2E proof for approval, edit, export, setup, Tower, Source, and chat controls.
2. Close durable review/export proof for evidence packets, approval-pattern review, and catalog CI gates.
3. Close counsel/insurance rows only after counsel, broker, or carrier evidence exists.
4. Close T251 last, only when the retrofit checkpoint strict completion reaches 100%.

## QA Commands

Run relevant existing checks before claiming row movement:

```bash
node scripts/ai-liability/verify-retrofit-completion-checkpoint.mjs
node scripts/ai-liability/verify-approval-pattern-review.mjs
node scripts/admin/verify-setup-ai-governance.mjs
node scripts/audit/ai-surface-control-catalog.mjs
```

For this matrix itself:

```bash
node scripts/ai-liability/verify-live-evidence-matrix.mjs
node --check scripts/ai-liability/verify-live-evidence-matrix.mjs
git diff --check origin/main...HEAD
npm run release:check -- --base origin/main --head HEAD
```

## Current Truth

AI Liability Defense is not one blocker. It is three different kinds of work: live product proof, durable audit/export coverage, and counsel/insurance evidence. Codex can keep advancing the first two through PRs and verifiers. Anand, counsel, broker, carrier, or client-side reviewers are required to close the external legal and insurance rows.
