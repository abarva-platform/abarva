# ADR-0006 - AI as Advisor, Never Decision-Maker

## Status

Accepted

## Date

2026-06-01

## Context

AbarVa surfaces AI-generated insights, drafts, recommendations, estimates, and suggested next actions across product surfaces such as Intelligence, Moves, Source, Tower, and Setup. Those outputs can influence high-stakes enterprise decisions, especially in regulated or audit-heavy environments.

Without a durable architectural boundary, future product work could gradually move from "AI drafts and recommends" into "AI decides and acts." That drift would create legal, compliance, procurement, and trust risk:

- Users could mistake generated output for a final decision instead of a draft requiring review.
- Client-facing workflows could mutate AbarVa state, trigger external communications, or prepare operational decisions without a clear human commit point.
- Audit trails could fail to show who reviewed an AI suggestion, what evidence they saw, and why they accepted or changed it.
- Regulated buyers could reject the platform if AbarVa cannot demonstrate human-in-the-loop controls.

The planning tracker identifies this decision as `T203` in the AI Liability Defense category. Existing product and design documentation already uses human accountability language in several places, including the strategic Moves gate documentation around `GATE_APPROVAL_STRICT_MODE`, but the invariant has not been recorded as a top-level ADR.

Recent AI-liability examples reinforce the risk. In `Moffatt v. Air Canada, 2024 BCCRT 149`, a tribunal treated chatbot misinformation as the company's responsibility. In `Mata v. Avianca, Inc., 678 F. Supp. 3d 443 (S.D.N.Y. 2023)`, lawyers were sanctioned after filing AI-generated legal authorities that were not verified. These are not AbarVa facts, but they are useful external signals: operators and professional users remain responsible for AI-assisted output.

## Decision

The AbarVa system never makes a consequential decision. It surfaces information, suggests options, drafts artifacts, estimates outcomes, and prepares evidence. A human commits.

For AbarVa engineering and product work, this is an architectural invariant:

1. Every consequential action must cross an explicit human approval gate before commit.
2. AI-generated content must be visually marked as draft, suggestion, pending review, generated, estimated, or otherwise non-final at the point of display.
3. Consequential approvals must capture reviewer identity, timestamp, justification, and the evidence visible to the reviewer.
4. No AI agent may directly execute an external mutation without a human approval boundary. External mutation includes client-system API calls, email sends, file commits, production configuration changes, or data-plane writes that represent a user decision rather than internal telemetry or draft storage.
5. Exceptions must be narrow, documented, and auditable. Examples include read-only retrieval, internal observability writes, and draft persistence that is clearly not a committed user decision.

## Consequences

- Human accountability becomes a product and architecture requirement, not a per-feature preference.
- Procurement and compliance reviews can ask for one invariant: show where the human reviewed the AI output and accepted responsibility.
- Future UI components, API handlers, data models, and tests must preserve the distinction between AI-generated draft work and human-committed decisions.
- Workflows may carry more friction because users must approve consequential actions explicitly.
- Engineering work must add shared controls before broad module retrofits, including reusable AI-liability UI components, import or dependency rules where appropriate, and evidence-bundle storage for consequential actions.
- Existing surfaces that already have approval concepts should be audited against this ADR before pilots treat those controls as production-ready.

## Alternatives

- Allow AI auto-action with only a post-fact audit log. Rejected because after-the-fact logging does not prove the human reviewed and accepted responsibility before the action occurred.
- Allow auto-action for "low-risk" cases. Rejected for now because the boundary is hard to maintain consistently across modules, tenants, and regulated use cases.
- Treat human review as copywriting or training guidance only. Rejected because procurement and liability posture require enforceable product, architecture, and audit controls.
- Defer the invariant until after module retrofits. Rejected because later retrofit work needs a stable rule to build toward.

## References

- `docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx`
- `docs/planning/CODEX_AUTONOMOUS_EXECUTION.md`
- `docs/design/strategic-moves/agent-training/00-global-behavioral-rules.md`
- `docs/design/strategic-moves/specs/workspace/04-data-writes-gate.md`
- `docs/design/strategic-moves/specs/workspace/04-data-gaps.md`
- `docs/architecture/adr/ADR-0002-agent-context-broker-boundary.md`
- `docs/architecture/adr/ADR-0004-per-user-rls.md`
- `https://www.canlii.org/en/bc/bccrt/doc/2024/2024bccrt149/2024bccrt149.html`
- `https://www.nhd.uscourts.gov/sites/default/files/pdf/Mata-v-Avianca-sanctions-order.PDF`
