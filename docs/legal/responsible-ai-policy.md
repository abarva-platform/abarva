# Responsible AI Policy

Status: candidate
Owner: AbarVa operations
Audience: client sponsor, legal, security, product, engineering
Backlog task: T118

## Policy Statement

AbarVa uses AI as decision support, not as the decision-maker. AI may reason,
summarize, draft, challenge assumptions, surface evidence gaps, and recommend
next steps. A named human remains accountable for consequential decisions and
external actions.

This policy should be read with:

- `docs/legal/AI_DECISION_SUPPORT_CONTROLS.md`
- `docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md`
- `docs/legal/AI_GENERATED_UI_CATALOG.md`
- `docs/architecture/adr/ADR-0006-ai-as-advisor.md`
- `docs/runbooks/ai-output-complaints.md`

## Principles

| Principle | Requirement |
| --- | --- |
| Human accountability | Consequential actions require human review, approval, and rationale. |
| Grounded answers | Claims should cite approved client evidence or curated corpus basis where available. |
| Scope control | AI should stay inside the enterprise decision context and refuse or redirect off-scope prompts. |
| Data minimization | The system should use only the data needed for the approved task. |
| Client isolation | Client-private data must not be used for another client's answer or uncontrolled training. |
| Sensitive-data protection | PHI, PII, secrets, payment data, and restricted content must follow quarantine and approval paths. |
| Transparency | AI-assisted drafts, estimates, predictions, and recommendations should be labeled. |
| Challenge and escalation | Weak evidence, contradictions, missing data, and high-risk outputs should be surfaced. |

## Human-in-the-Loop Controls

The following actions require human approval before commitment:

- phase or gate advancement in a strategic Move,
- external vendor communication or sourcing event action,
- contract, SOW, RFP, or board-pack commitment,
- data-use approval for new or sensitive client content,
- configuration change that affects users, roles, data access, or policy,
- override of an AI recommendation,
- any action that materially affects cost, compliance, customer obligation, or
  client-facing decision.

Approval records should preserve:

- approver identity,
- timestamp,
- decision,
- rationale,
- evidence bundle,
- AI suggestion or draft,
- known missing inputs or caveats.

## Bias and Hallucination Controls

| Risk | Control |
| --- | --- |
| Unsupported claims | Require citations, assumptions, and missing-data notes where possible. |
| Off-scope general knowledge | Refuse or redirect unrelated world history, current affairs, trivia, or unsupported prompts unless tied to the client's enterprise work. |
| Overconfidence | Separate fact, pattern, inference, assumption, recommendation, and decision gate. |
| Pattern mismatch | Let users challenge applicability and record why a pattern does or does not fit. |
| Stale or conflicting corpus | Version, review, deprecate, or retire patterns; surface contradictions. |
| Automation bias | Label AI outputs and require human rationale for consequential approvals. |
| Cross-client leakage | Enforce client scope in retrieval, storage, audit, and agent context assembly. |

## Data Use

Client-private data may ground that client's answers only under the approved
data-use policy. It must not be used as uncontrolled training material for
other clients. Reusable product improvements should come from generalized
patterns, evaluation results, reviewer feedback, and de-identified operating
lessons, not from copying client-private content across boundaries.

## Sensitive Data

Sensitive data must be handled through a governed intake path:

1. detect or flag sensitive content,
2. quarantine before agent use,
3. require data steward or privacy/security review,
4. redact, restrict, approve, or reject,
5. preserve evidence of the decision.

No quarantined item should become agent-retrievable until it is approved and
scoped.

## Model and Provider Governance

AI providers are implementation dependencies, not systems of record. AbarVa
should preserve:

- model/provider route decisions,
- allowed-use constraints,
- fallback and degraded-mode behavior,
- cost and rate-limit controls,
- output-quality evaluations,
- provider incident response path.

## Complaints and Corrections

When a user challenges an AI output:

1. preserve the original prompt/response/evidence if policy allows,
2. classify the issue as factual, citation, scope, tone, bias, unsafe action,
   or missing context,
3. correct the answer or mark it unusable,
4. decide whether the corpus, prompt, guardrail, or workflow needs a change,
5. attach follow-up to the appropriate release or quality record.

## What This Policy Does Not Claim

- It does not claim AI outputs are legal, financial, clinical, or procurement
  advice.
- It does not eliminate the client's responsibility to validate decisions.
- It does not authorize autonomous external action.
- It does not certify that every future integration is approved for sensitive
  data.
- It does not replace legal review of customer contracts or regulated use
  cases.
