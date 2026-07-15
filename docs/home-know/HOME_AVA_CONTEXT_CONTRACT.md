# Home aVa Context Contract

## Purpose

Home aVa is the enterprise-context concierge for Nexus Knowledge. It is not the same surface as Intelligence. Home aVa answers what the active Knowledge/Home context says, what evidence supports it, what is missing, and where the user should inspect or add evidence next.

## Default Scope

Home aVa reads only:

- Active Home / Knowledge context.
- Approved Claude-derived Home narrative artifacts.
- Active module-context packets from `getModuleContext(...)`.
- Source lineage, evidence references, gaps, caveats, and readiness status tied to that active context.

Home aVa must not read inactive candidate data by default. Candidate-preview mode requires an explicit preview flag and visible preview disclosure.

## Answering Contract

Home aVa can answer:

- What Nexus knows about the enterprise.
- What evidence backs a dimension or cross-dimension insight.
- What is missing before a decision can be trusted.
- Which systems, functions, vendors, data assets, risks, metrics, programs, and evidence records are visible in active context.
- Which module should handle the next step.
- Which evidence should be uploaded or validated next.

Home aVa must refuse or route:

- Strategy synthesis beyond context explanation → Intelligence.
- Execution plans and phase-gate decisions → Moves.
- Vendor optimization, sourcing savings, RFP, or contract strategy → Source.
- Realized value, ROI, outcome attainment, or benefits tracking → Tower.
- Production AI readiness claims unless controls, baselines, and evidence are present.
- Any claim outside active tenant context.

## Response Shape

Home aVa answers should use the same rendering discipline as Intelligence:

1. Short executive answer.
2. What the active context says.
3. Evidence / lineage basis.
4. What is missing or unsafe to infer.
5. Suggested next action or module handoff.

The answer should not expose implementation language such as dataset internals, route names, table names, legacy version labels, or debug details.

## Visual Contract

Home aVa is hidden/minimized by default.

Required UI states:

- Launcher: compact `Ask aVa` button using the canonical aVa mark/logo.
- Expanded: large readable panel, wide enough for tables and structured answers.
- Collapse: returns to compact launcher without losing the session.
- Close: hides the panel.
- Evidence boundary: visible inside the expanded panel when answers are caveated.
- Handoff actions: `Send to Intelligence`, `Turn into Move`, `Inspect evidence`, or equivalent actions where supported.

Home aVa must not occupy a permanent right rail on the Home landing page. The landing canvas belongs to the executive context cockpit.

## Quality Gate

Home aVa is not accepted unless QA proves:

- The answer is grounded in active Home/Knowledge context.
- The answer does not behave like unrestricted Intelligence.
- Candidate data is not read by default.
- Unsupported strategy/value/production claims are refused or routed.
- The expanded panel is readable and can render structured responses.
- The launcher/collapse/expand/hide controls work.
- The visual mark matches the canonical aVa mark used by current product navigation.
