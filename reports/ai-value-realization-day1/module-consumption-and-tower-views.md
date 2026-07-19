# AI Value Realization Day 1 - Module Consumption and Tower View Plan

## What This Layer Adds

The Day 1 adapter family gives Home, Intelligence, Moves, and Tower a shared fact chain for AI spend and value realization:

```text
SA08 AI Benefits Realization Ledger
  -> what was funded, promised, partially validated, blocked, or not claimable

SA09 AI Tool Usage Feed
  -> who is enabled, who is active, how often the AI tool is used, and adoption gaps

SA10 AI Value Interview Evidence
  -> what executives and IT owners say is working, not working, missing, or under pressure

SA11 AI KPI / Operational Outcome Feed
  -> baseline metric, target, actual movement, measurement owner, and finance-validation boundary
```

The important control is unchanged: promised value, usage, and partial finance validation are not realized value. Tower and aVa may recommend action, but cannot claim realized value unless the full chain is present.

## Module Consumption Model

| Module | How It Should Use SA08-SA11 | Output Standard |
|---|---|---|
| Home / Knowledge | Show whether the tenant has enough loaded context to explain AI spend, usage, KPI movement, finance validation, and gaps. | Context browser, source coverage, answerability, missing evidence requests. |
| Intelligence | Use the chain as decision context for every AI-related answer: what to scale, fix, freeze, stop, or investigate. | Senior-advisor answer with tenant facts, industry context, decision frame, evidence caveats, and follow-up choices. |
| Moves | Convert an AI candidate or weak program into a governed move with phase gates: baseline, usage, KPI, finance, controls, owner. | Move readiness, phase blockers, required artifacts, next-best action. |
| Tower | Render the executive command center: portfolio posture, value proof funnel, usage vs promise, decision lanes, and evidence blockers. | Deterministic metrics and charts. Claude may narrate, but numbers come from the governed data layer. |
| Source | Use AI/tool usage and outcome telemetry to inform sourcing events for managed services, SaaS renewals, AI tools, and platform contracts. | Scope, requirements, SLA/value clauses, vendor-response asks, and renewal leverage. |

## Tower Views To Build From This Layer

### 1. AI Value Control Room

Purpose: tell the CIO/CFO what AI spend exists, what is actually being used, and what is value-claimable.

Required fields:
- `funded_spend_usd`
- `promised_value_usd`
- `finance_validated_value_usd`
- `value_claim_status`
- `tower_claim_allowed`
- `decision_action`
- `evidence_id`

Primary message:
```text
Here is the AI spend lens. It is non-additive inside the budget. Some tools show usage and partial value, but realized value remains gated unless usage, KPI movement, and finance validation all reconcile.
```

### 2. Value Proof Funnel

Purpose: separate funded change spend from promised value, measured usage, KPI movement, finance-validated value, and realized-value eligibility.

Best visual:
- Horizontal funnel or ladder, not a generic table.
- Use one row per proof stage.
- Show blocked stages in amber/red with business caveats.

Required joins:
- SA08 value rows
- SA09 usage rows
- SA11 KPI rows

### 3. Usage vs Promise

Purpose: answer why tools like Copilot, ServiceNow agents, Workday AI, GitHub Copilot/Codex, ERP AI, or Contact Center AI are not delivering expected value.

Best visual:
- Program cards with active usage, target usage, adoption gap, promised value, finance-validated value.
- Sort by largest promise-to-proof gap.

Executive questions this unlocks:
- Which AI tools are licensed but not used?
- Which tools have usage but no KPI movement?
- Which tools have KPI movement but no finance validation?
- Which vendors or owners need intervention this month?

### 4. Portfolio Decision Lanes

Purpose: move from reporting to action.

Decision actions:
- `scale`
- `fix`
- `freeze`
- `stop`
- `continue_monitoring`
- `needs_evidence`
- `needs_finance_validation`

Best visual:
- Four lanes: Scale, Fix, Freeze, Stop.
- Cards show spend, promised value, usage rate, finance validation, and blocker.

### 5. AI Tool Evidence Diagnostics

Purpose: show exactly what data is needed for each source system.

Examples:
- Microsoft 365 Copilot: licensed users, enabled users, active users, prompts/actions, meeting/email/document activity, weekly active rate, adoption by persona.
- ServiceNow Now Assist: virtual-agent sessions, deflection, escalation rate, MTTR movement, CSAT, ticket backlog movement.
- Workday AI: transactions touched, HR case cycle time, employee-service deflection, finance workflow cycle time.
- GitHub Copilot / Codex: active developers, acceptance rate, PR cycle time, DORA lead time, deployment frequency, escaped defects.
- ERP AI: invoice exceptions, close cycle days, forecast accuracy, touchless processing, procurement cycle time.
- Contact Center AI: agent-assist usage, AHT, FCR, transfer rate, QA score, NPS/member satisfaction.

## Intelligence / aVa Behavior Standard

For every AI-value question, aVa should:

1. Start with the decision point, not the data dump.
2. Use the tenant's SA08-SA11 chain when available.
3. Distinguish four boundaries:
   - spend exists
   - usage exists
   - KPI movement exists
   - finance has validated value
4. Recommend one of: scale, fix, freeze, stop, continue monitoring, request evidence.
5. Ask an adaptive next question tied to the answer path.

Example:

```text
My read: Copilot is not a failed investment yet; it is a proof-gap investment. Usage exists, and partial finance validation exists, but realized value is still blocked until KPI movement is tied to a finance-approved baseline.

Next decision: protect the funded rollout only if the owner can show active usage by persona, KPI movement, and value-office attestation by the next steering committee.
```

## What Still Requires Runtime/Data-Plane Work

This PR creates source adapter files, templates, evidence rows, and validation. It does not by itself guarantee live aVa retrieval or Tower Azure/Postgres mart consumption.

Required next runtime work:

1. Load SA08-SA11 into the governed Azure/Postgres data plane through the approved ACA data-build job.
2. Extend the runtime context bundle so Intelligence can retrieve these rows by tenant, tool, program, vendor, function, and metric.
3. Extend Tower mart/projection so Tower dashboards read the same reconciled chain.
4. Add browser proof showing Tower and Intelligence use the new facts in answers and charts.

## Acceptance Bar For Runtime

Runtime is not proven until:

- Tower can answer which AI programs/tools have funded spend, usage, KPI movement, and finance validation.
- Intelligence can cite these rows in advisor answers without hallucinating realized value.
- aVa can explain why a tool is failing or succeeding using tenant-specific usage and outcome metrics.
- The rendered UI avoids stale fallback rows and avoids generic "not loaded" language when SA08-SA11 facts exist.
- Every visible number traces back to a source adapter row and evidence ID.
