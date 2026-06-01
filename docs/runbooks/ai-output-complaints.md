# AI Output Complaint Runbook

## Purpose

Use this runbook when a client, user, reviewer, or AbarVa operator reports that
an AI-assisted output was wrong, misleading, unsupported, unsafe, overconfident,
or missing required decision-support controls.

The goal is to preserve evidence, protect the client, respond within a defined
cadence, and feed the result back into product controls. AbarVa remains a
decision-support system: the runbook investigates output quality and control
performance without implying that the AI made the business decision.

Backlog rows: T226, T229.

## Complaint Types

| Type | Examples | Default severity |
| --- | --- | --- |
| Factual error | Wrong vendor, number, renewal date, program status, source quote, or client fact | AI-2 |
| Unsupported claim | Output lacks citation, source basis, confidence, or missing-data warning | AI-2 |
| Unsafe recommendation | Output suggests employment, healthcare, credit, insurance, legal, safety, or individual-rights action | AI-1 |
| Autonomous-decision wording | Output says AbarVa approved, decided, awarded, terminated, diagnosed, or authorized | AI-1 |
| Cross-client concern | Output appears to include another client's facts, names, records, or context | AI-1 |
| Export/control defect | Board pack, Source export, financial model, or artifact lacks disclaimer or human-approval language | AI-2 |

Escalate to the incident-response runbook immediately for confirmed or probable
cross-client data exposure, credential exposure, regulated-data exposure, or
client-impacting security risk.

## Response Targets

| Severity | Trigger | First response target | Resolution target |
| --- | --- | --- | --- |
| AI-1 | Cross-client concern, high-risk use, unsafe external action, autonomous-decision wording in consequential flow | 30 minutes | Same business day containment or owner-approved extension |
| AI-2 | Material factual error, unsupported claim, missing control in export, or client-visible hallucination | 1 business hour | 2 business days |
| AI-3 | Internal-only concern, copy issue, low-impact confidence/citation defect, or near miss | 1 business day | Next planned release or documented backlog item |

## Intake

1. Open an AI-output complaint record or thread with reporter, client, surface,
   timestamp, severity, and owner.
2. Capture the exact output before regeneration or cleanup:
   - screenshot or exported artifact;
   - prompt or user action;
   - response text;
   - model/provider if known;
   - citations, source chunks, confidence, assumptions, and missing-data banner;
   - client key and `client_id`;
   - thread id, event id, move id, artifact id, or route if present.
3. Ask whether the output was used in a business decision, external message,
   approval, export, or board artifact.
4. Check whether human decision evidence exists: owner, attestation, rationale,
   approval timestamp, and override disposition.
5. Freeze or label the affected artifact if continued use could mislead users.
6. Assign investigation owner, client communicator, and reviewer.

## Triage

Classify the failure before fixing text:

- Evidence failure: source missing, stale, wrong, or uncited.
- Reasoning failure: evidence present but conclusion unsupported.
- Boundary failure: output used prohibited or autonomous-decision wording.
- Scope failure: wrong client, wrong user, wrong module, or wrong artifact.
- Control failure: missing AI Draft label, disclaimer, confidence, citation,
  attestation, or approval gate.
- UX failure: user could not see or understand the warning/control.

For AI-1 issues, contain first. Disable the affected route, export, agent tool,
or workflow if needed. Use the rollback runbook when the defect shipped in a
recent release.

## Investigation Checklist

- [ ] Exact output captured and attached.
- [ ] Client and `client_id` confirmed.
- [ ] Surface, route, PR, commit, deployment id, and release record identified.
- [ ] Source documents, retrieval chunks, structured rows, and prompt context
  captured where available.
- [ ] Human-decision controls checked against
  `docs/legal/AI_DECISION_SUPPORT_CONTROLS.md`.
- [ ] Consequential-action catalog row identified or new gap filed in
  `docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md`.
- [ ] Generated-UI catalog row identified or new gap filed in
  `docs/legal/AI_GENERATED_UI_CATALOG.md`.
- [ ] Reproduction attempted with the same prompt/context.
- [ ] Root-cause category assigned.
- [ ] Client-impact statement approved before external communication.

## Client Communication

Use plain language and do not speculate. Minimum response:

- We received the report.
- The affected surface and timestamp.
- Whether the issue is contained, under investigation, or corrected.
- Whether the output should be disregarded, re-reviewed, or replaced.
- Whether any client data exposure is suspected.
- Next update time.

Do not say "no impact" until evidence supports that statement. Do not blame the
client reviewer; focus on the evidence and control posture.

## RCA Template

Use this structure for AI-1 and AI-2 complaints:

```text
Summary:
Reporter:
Client / client_id:
Surface / route / artifact:
Timeline:
What the AI output said:
What was wrong or unsafe:
Evidence available at generation time:
Evidence missing or stale:
Human-decision controls present:
Human-decision controls missing:
Containment action:
Corrective action:
Regression test or catalog update:
Client communication:
Owner and due date:
```

## Corrective Actions

Choose the smallest effective fix:

- Correct the source record or stale seed data.
- Add or repair citation/confidence/missing-data rendering.
- Add the required AI Draft, disclaimer, or human-decision attestation.
- Tighten prompt rules or autonomous-decision language sanitization.
- Add a regression test for the exact failure mode.
- Update the consequential-action or generated-UI catalog.
- Add a release record gap when the fix is intentionally deferred.

## Evidence To Attach

- Original complaint and reporter.
- Exact output, prompt, source basis, citations, confidence, assumptions, and
  missing-data state.
- Client and `client_id`.
- Human-decision evidence packet if one exists.
- Root-cause analysis.
- Containment and corrective action.
- Validation command or manual verification.
- Client communication and approval.
- Follow-up owner and due date.

## Out Of Scope

This runbook does not provide legal advice, admit liability, or determine client
business outcomes. Counsel owns legal notices and claims handling. The product
owner owns control fixes and backlog updates.
