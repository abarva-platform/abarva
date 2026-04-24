# 24 CONTEXT VALIDATION HARNESS

## Purpose

The context validation harness verifies that Source agents are context-aware. It exists to detect plain vanilla GPT/Claude behavior before it reaches users.

Agent responses must be tested for event grounding, stage awareness, pattern use, evidence coverage, actionability, and anti-hallucination behavior.

This is a specification only. Do not implement the harness until a future approved slice.

## Validation Layers

| Layer | Purpose | Failure Detected |
|---|---|---|
| 1. Static prompt contract review | Confirm system prompts require Context Bundle and deterministic boundaries | prompt-first agent behavior |
| 2. Context Bundle completeness test | Confirm required context fields are present before response | missing event, stage, pattern, evidence, or role |
| 3. Golden prompt test | Compare known prompts against expected grounded behavior | generic answers and missing gates |
| 4. Persona crawler test | Verify responses work for CIO, CFO, procurement, CTO, PMO, legal, sponsor, sourcing lead | persona mismatch |
| 5. Attachment grounding test | Confirm file-specific responses reference parsed file summaries and citations | invented file facts |
| 6. Pattern grounding test | Confirm responses use selected pattern pack sections | generic sourcing advice |
| 7. Scorecard grounding test | Confirm scorecard responses use defaults, overrides, rationale, and lock state | invalid scorecard guidance |
| 8. Value ledger grounding test | Confirm value responses use assumptions, owner, confidence, and realization status | unsupported savings claims |
| 9. Failure-mode detection test | Confirm known sourcing failures are detected and mapped to mitigations | missed sourcing risks |
| 10. Human review checklist | Confirm tone, judgment, and executive usefulness | robotic or consultant-generic output |

## SourceAgentValidationResult

Future conceptual type:

```ts
type SourceAgentValidationResult = {
  responseId: string;
  promptId?: string;
  eventId?: string;
  persona?: SourcePersona;
  contextGrounding: 0 | 1 | 2 | 3 | 4 | 5;
  actionability: 0 | 1 | 2 | 3 | 4 | 5;
  evidence: 0 | 1 | 2 | 3 | 4 | 5;
  vanillaResponseRisk: 0 | 1 | 2 | 3 | 4 | 5;
  hallucinationFlags: string[];
  missingContextFlags: string[];
  gateCheckPassed: boolean;
  suggestedActionsPresent: boolean;
  verdict: 'pass' | 'defer' | 'fail';
  reviewerNotes?: string;
};
```

## Golden Prompts: Source Dashboard

### Prompt: "What needs my attention?"

Expected behavior:

- mentions specific events
- identifies waiting or at-risk items
- names owner and next action
- references value at stake
- offers suggested actions
- does not give generic prioritization advice

Fail if:

- response does not name events when event data exists
- response omits owner or next action
- response ignores value at stake
- response sounds like a generic dashboard assistant

### Prompt: "Which sourcing event is most at risk?"

Expected behavior:

- uses lifecycle status, aging, blocker, and due date
- identifies event-specific reason
- explains impact
- offers next action and escalation path
- does not give generic risk advice

Fail if:

- response lists generic risk categories
- response ignores lifecycle status or aging
- response does not identify the event-specific blocker

## Golden Prompts: Scope Stage

### Prompt: "Can we move to RFP?"

Expected behavior:

- checks stage gate
- checks missing inputs
- checks readiness score
- identifies blockers
- recommends next action
- does not answer generically

Fail if:

- response says "yes" or "no" without gate status
- response ignores missing inputs
- response does not name artifact/readiness impact

### Prompt: "What data do we still need?"

Expected behavior:

- lists event-specific missing inputs
- ties inputs to artifacts and gates
- identifies owner when known
- optionally recommends generating a minimum data request

Fail if:

- response gives a generic sourcing checklist
- response does not tie data to current stage or artifact

## Golden Prompts: Scorecard Governance

### Prompt: "Can I change commercial weight to 25%?"

Expected behavior:

- references pattern default
- explains tradeoff
- checks material-change threshold
- requires rationale if material
- explains approval and lock impact
- does not blindly agree

Fail if:

- response ignores the default scorecard
- response does not mention approval or lock state
- response treats the change as a simple preference

## Golden Prompts: Artifact/RFP

### Prompt: "Generate the RFP."

Expected behavior:

- checks required inputs
- checks artifact readiness
- explains which sections can be drafted
- flags missing sections
- labels draft as Rich, Outline, or Stub
- does not hallucinate missing content

Fail if:

- response generates final RFP language without readiness check
- response invents scope, vendor, pricing, or client facts
- response does not disclose missing inputs

## Golden Prompts: File Attachments

### Prompt After Uploading Vendor Response: "Summarize this vendor response."

Expected behavior:

- references uploaded file
- identifies what was extracted
- shows confidence
- lists missing sections
- cites evidence or section references when available
- does not invent facts

Fail if:

- response does not name the uploaded file
- response summarizes content not present in parsed summary
- response omits extraction confidence

## Additional Golden Prompts

### CFO Prompt: "What is the value at stake and can we trust it?"

Expected behavior:

- uses projected value ledger
- names assumptions and confidence
- identifies measurement owner
- distinguishes projected from realized value
- avoids unsupported savings certainty

### CIO Prompt: "Where should I intervene this week?"

Expected behavior:

- ranks events by risk, value, blocker, and due date
- names decision or escalation needed
- connects recommendation to portfolio context

### Procurement Prompt: "Is this process defensible?"

Expected behavior:

- checks stage gates, scorecard lock, required inputs, artifact readiness, and audit trail
- names missing process evidence
- does not overstate compliance readiness

## Vanilla-Response Detection Heuristics

A response fails if:

- it does not mention the current event when event context is available
- it does not mention the current stage when stage context is relevant
- it gives generic sourcing advice without pattern or event grounding
- it recommends an action without checking missing inputs or gates
- it discusses value without value ledger context
- it discusses scorecard without default or override context
- it references uploaded files without evidence or citation
- it fails to offer next actions
- it sounds like a general-purpose consultant rather than Nexus inside Source

## Scoring Rubric

### Context Grounding

| Score | Definition |
|---:|---|
| 0 | generic |
| 1 | mentions product |
| 2 | mentions event |
| 3 | mentions event + stage + status |
| 4 | mentions event + stage + status + artifacts/scorecard/value |
| 5 | fully grounded with citations/evidence and next action |

### Actionability

| Score | Definition |
|---:|---|
| 0 | no action |
| 1 | generic action |
| 2 | event action |
| 3 | event action with owner |
| 4 | event action with owner, due date, blocker |
| 5 | event action with owner, due date, blocker, gate impact |

### Evidence

| Score | Definition |
|---:|---|
| 0 | unsupported |
| 1 | generic |
| 2 | pattern guidance |
| 3 | event data |
| 4 | event data + artifact/file reference |
| 5 | cited evidence and confidence |

## Pass Criteria

Agent response passes only when:

- context grounding is at least 4
- actionability is at least 4
- evidence is at least 3 for event-specific answers
- no hallucinated facts are present
- next action is included
- suggested actions are included where appropriate
- missing context is disclosed when present

## Human Review Checklist

Reviewer should ask:

- Does this sound like Nexus inside Source, or a generic assistant?
- Did the response use the current event and stage?
- Did it check gates before recommending progress?
- Did it distinguish stored state from generated narrative?
- Did it use pattern guidance correctly?
- Did it cite evidence or label uncertainty?
- Did it provide a clear next action?
- Did it offer useful suggested actions?
- Did it avoid unsupported vendor, value, or readiness claims?

## Acceptance Standard

The context validation harness is acceptable only when:

- golden prompts cover dashboard, scope, scorecard, artifact/RFP, file attachment, CFO, CIO, and procurement scenarios
- vanilla-response detection is explicit
- scoring produces pass/defer/fail results
- context grounding, actionability, and evidence thresholds are defined
- validation can block agent/chat implementation from being considered complete
